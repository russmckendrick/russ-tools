import { datetimeLiteral, numberLiteral, stringLiteral, verbatimLiteral } from './kql.js';
import {
  parseAddress,
  parseDatetime,
  parseEnum,
  parseInteger,
  parseList,
  parseRange,
  parseReal,
  parseRegex,
  parseText,
} from './values.js';

export const OPERATORS = {
  eq: { label: 'is', phrase: 'is', input: 'single' },
  neq: { label: 'is not', phrase: 'is not', input: 'single' },
  eqi: { label: 'equals (any case)', phrase: 'equals (any case)', input: 'single' },
  contains: { label: 'contains', phrase: 'contains', input: 'single' },
  ncontains: { label: 'does not contain', phrase: 'does not contain', input: 'single' },
  has: { label: 'has the term', phrase: 'has the term', input: 'single' },
  startswith: { label: 'starts with', phrase: 'starts with', input: 'single' },
  endswith: { label: 'ends with', phrase: 'ends with', input: 'single' },
  in: { label: 'is one of', phrase: 'is one of', input: 'list' },
  nin: { label: 'is none of', phrase: 'is none of', input: 'list' },
  regex: { label: 'matches regex', phrase: 'matches the regex', input: 'single' },
  empty: { label: 'is empty', phrase: 'is empty', input: 'none' },
  nempty: { label: 'is not empty', phrase: 'is not empty', input: 'none' },
  gt: { label: 'is greater than', phrase: 'is greater than', input: 'single' },
  gte: { label: 'is at least', phrase: 'is at least', input: 'single' },
  lt: { label: 'is less than', phrase: 'is less than', input: 'single' },
  lte: { label: 'is at most', phrase: 'is at most', input: 'single' },
  between: { label: 'is between', phrase: 'is between', input: 'range' },
  private: { label: 'is a private address', phrase: 'is a private address', input: 'none' },
  public: { label: 'is a public address', phrase: 'is a public address', input: 'none' },
  true: { label: 'is true', phrase: 'is true', input: 'none' },
  false: { label: 'is false', phrase: 'is false', input: 'none' },
  after: { label: 'is after', phrase: 'is after', input: 'single' },
  before: { label: 'is before', phrase: 'is before', input: 'single' },
};

const NUMERIC = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between', 'in'];

export const OPERATORS_BY_TYPE = {
  string: ['eq', 'neq', 'eqi', 'contains', 'ncontains', 'has', 'startswith', 'endswith', 'in', 'nin', 'regex', 'empty', 'nempty'],
  enum: ['eq', 'neq', 'in', 'nin'],
  ip: ['eq', 'neq', 'in', 'private', 'public'],
  port: NUMERIC,
  int: NUMERIC,
  real: ['gt', 'gte', 'lt', 'lte', 'between', 'eq', 'neq'],
  bool: ['true', 'false'],
  datetime: ['after', 'before'],
};

const COMPARE = { eq: '==', neq: '!=', gt: '>', gte: '>=', lt: '<', lte: '<=' };
const TEXT = { eq: '==', neq: '!=', eqi: '=~', contains: 'contains', ncontains: '!contains', has: 'has', startswith: 'startswith', endswith: 'endswith' };

const cidr = ({ address, prefix }) => (prefix === null ? address : `${address}/${prefix}`);

function inRange(name, value) {
  if (value.family === 6) {
    return `ipv6_is_in_range(${name}, ${stringLiteral(`${value.address}/${value.prefix ?? 128}`)})`;
  }
  return `ipv4_is_in_range(${name}, ${stringLiteral(cidr(value))})`;
}

const numberParser = (column) => {
  if (column.type === 'port') return (raw) => parseInteger(raw, { min: 0, max: 65535, noun: 'port' });
  if (column.type === 'real') return parseReal;
  return (raw) => parseInteger(raw);
};

const RENDERERS = {
  string(column, op, filter) {
    const name = column.name;
    if (op === 'empty') return { ok: true, kql: `isempty(${name})` };
    if (op === 'nempty') return { ok: true, kql: `isnotempty(${name})` };
    if (op === 'regex') {
      const value = parseRegex(filter.value);
      return value.ok ? { ok: true, kql: `${name} matches regex ${verbatimLiteral(value.parsed)}`, shown: value.parsed } : value;
    }
    if (op === 'in' || op === 'nin') {
      const list = parseList(filter.value, parseText);
      if (!list.ok) return list;
      return {
        ok: true,
        kql: `${name} ${op === 'in' ? 'in' : '!in'} (${list.parsed.map(stringLiteral).join(', ')})`,
        shown: list.parsed.join(', '),
      };
    }
    const value = parseText(filter.value);
    return value.ok ? { ok: true, kql: `${name} ${TEXT[op]} ${stringLiteral(value.parsed)}`, shown: value.parsed } : value;
  },

  enum(column, op, filter) {
    const parse = (raw) => parseEnum(raw, column.values);
    if (op === 'in' || op === 'nin') {
      const list = parseList(filter.value, parse);
      if (!list.ok) return list;
      return {
        ok: true,
        kql: `${column.name} ${op === 'in' ? 'in~' : '!in~'} (${list.parsed.map(stringLiteral).join(', ')})`,
        shown: list.parsed.join(', '),
      };
    }
    const value = parse(filter.value);
    return value.ok
      ? { ok: true, kql: `${column.name} ${op === 'eq' ? '=~' : '!~'} ${stringLiteral(value.parsed)}`, shown: value.parsed }
      : value;
  },

  ip(column, op, filter) {
    const name = column.name;
    if (op === 'private') return { ok: true, kql: `ipv4_is_private(${name})` };
    if (op === 'public') return { ok: true, kql: `not(ipv4_is_private(${name}))` };
    if (op === 'in') {
      const list = parseList(filter.value, parseAddress);
      if (!list.ok) return list;
      if (list.parsed.some((item) => item.family === 6)) {
        return { ok: false, message: 'A list takes IPv4 addresses and ranges only.' };
      }
      return {
        ok: true,
        kql: `ipv4_is_in_any_range(${name}, ${list.parsed.map((item) => stringLiteral(cidr(item))).join(', ')})`,
        shown: list.parsed.map(cidr).join(', '),
      };
    }
    const value = parseAddress(filter.value);
    if (!value.ok) return value;
    const exact = value.parsed.family === 4 && value.parsed.prefix === null;
    const test = exact ? `${name} == ${stringLiteral(value.parsed.address)}` : inRange(name, value.parsed);
    const negated = exact ? `${name} != ${stringLiteral(value.parsed.address)}` : `not(${test})`;
    return { ok: true, kql: op === 'neq' ? negated : test, shown: cidr(value.parsed), ranged: !exact };
  },

  number(column, op, filter) {
    const parse = numberParser(column);
    if (op === 'between') {
      const range = parseRange(filter.value, filter.value2 ?? '', parse);
      if (!range.ok) return range;
      const [low, high] = range.parsed.map(numberLiteral);
      return { ok: true, kql: `${column.name} between (${low} .. ${high})`, shown: `${low} and ${high}` };
    }
    if (op === 'in') {
      const list = parseList(filter.value, parse);
      if (!list.ok) return list;
      const numbers = list.parsed.map(numberLiteral).join(', ');
      return { ok: true, kql: `${column.name} in (${numbers})`, shown: numbers };
    }
    const value = parse(filter.value);
    return value.ok
      ? { ok: true, kql: `${column.name} ${COMPARE[op]} ${numberLiteral(value.parsed)}`, shown: numberLiteral(value.parsed) }
      : value;
  },

  bool(column, op) {
    return { ok: true, kql: `${column.name} == ${op === 'true' ? 'true' : 'false'}` };
  },

  datetime(column, op, filter) {
    const value = parseDatetime(filter.value);
    return value.ok
      ? { ok: true, kql: `${column.name} ${op === 'after' ? '>' : '<'} ${datetimeLiteral(value.parsed)}`, shown: `${value.parsed} UTC` }
      : value;
  },
};

const FAMILY = { port: 'number', int: 'number', real: 'number' };

export function operatorsFor(column) {
  return OPERATORS_BY_TYPE[column.type] ?? [];
}

export function defaultOperator(column) {
  return operatorsFor(column)[0];
}

export function renderFilter(column, filter) {
  const allowed = operatorsFor(column);
  if (!allowed.includes(filter.op)) {
    return { ok: false, message: `${column.name} cannot be filtered with "${OPERATORS[filter.op]?.label ?? filter.op}".` };
  }
  const result = RENDERERS[FAMILY[column.type] ?? column.type](column, filter.op, filter);
  if (!result.ok) return result;
  return { ...result, phrase: describe(column, filter.op, result) };
}

function describe(column, op, result) {
  const phrase = op === 'eq' && result.ranged ? 'is in' : op === 'neq' && result.ranged ? 'is not in' : OPERATORS[op].phrase;
  return [column.name, phrase, result.shown].filter(Boolean).join(' ');
}
