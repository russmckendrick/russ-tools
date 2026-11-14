import { DEFAULT_LIMIT, findScenario, findService } from './catalog.js';
import { renderFilter } from './operators.js';
import { findColumn } from './schema.js';
import { DEFAULT_TIME, binFor, resolveTime } from './time.js';
import { parseInteger } from './values.js';

export const MAX_ROWS = 30000;
export const MAX_GROUP = 4;

const BIN_LABELS = { '1m': 'one-minute', '5m': 'five-minute', '1h': 'hourly', '6h': 'six-hour', '1d': 'daily' };
const COUNT = [['Count', 'count()']];

const joinAnd = (items) => items.join(' and ');

function resolveLimit(raw, kind, problems) {
  const fallback = Number(DEFAULT_LIMIT[kind] || 0);
  if (kind === 'series') return null;
  const parsed = parseInteger(raw ?? '', { min: 1, max: MAX_ROWS, noun: 'row limit' });
  if (parsed.ok) return parsed.parsed;
  if (!parsed.empty) problems.push({ scope: 'limit', message: `${parsed.message} Using ${fallback}.` });
  return fallback;
}

function resolveFilters(table, filters, problems) {
  const applied = [];
  for (const filter of filters ?? []) {
    if (filter.off) continue;
    const column = findColumn(table, filter.column);
    if (!column) {
      problems.push({ scope: 'filter', id: filter.id, message: `${table} has no filterable column called ${filter.column}.` });
      continue;
    }
    const rendered = renderFilter(column, filter);
    if (rendered.ok) applied.push({ ...rendered, id: filter.id });
    else if (!rendered.empty) problems.push({ scope: 'filter', id: filter.id, message: rendered.message });
  }
  return applied;
}

function resolveShape(scenario, group, problems) {
  const by = [];
  for (const name of (group?.by ?? []).slice(0, MAX_GROUP)) {
    if (findColumn(scenario.table, name)) by.push(name);
    else problems.push({ scope: 'group', message: `${scenario.table} has no column called ${name} to count by.` });
  }
  if (group?.overTime) return { kind: 'series', aggregates: COUNT, by, custom: true };
  if (by.length) return { kind: 'top', aggregates: COUNT, by, metric: 'Count', order: 'desc', custom: true };
  return scenario.output;
}

function outputLines(output, limit, seconds) {
  const aggregates = (output.aggregates ?? []).map(([name, expression]) => `${name} = ${expression}`).join(', ');
  const shape = output.custom ? 'group' : 'scenario';
  if (output.kind === 'rows') {
    return [
      ...(output.project ? [{ text: `| project ${output.project.join(', ')}`, source: 'scenario' }] : []),
      { text: `| top ${limit} by ${output.by} desc`, source: 'limit' },
    ];
  }
  if (output.kind === 'top') {
    return [
      { text: `| summarize ${aggregates} by ${output.by.join(', ')}`, source: shape },
      { text: `| top ${limit} by ${output.metric} ${output.order}`, source: 'limit' },
    ];
  }
  const by = [...output.by, `bin(TimeGenerated, ${binFor(seconds)})`].join(', ');
  return [
    { text: `| summarize ${aggregates} by ${by}`, source: shape },
    { text: '| sort by TimeGenerated asc', source: shape },
    { text: '| render timechart', source: shape },
  ];
}

function outputPhrase(output, limit, seconds) {
  if (output.kind === 'rows') {
    const order = output.by === 'TimeGenerated' ? 'newest first' : `highest ${output.by} first`;
    return `, ${order}, ${limit} ${limit === 1 ? 'row' : 'rows'} at most`;
  }
  if (output.kind === 'top') {
    return output.order === 'asc' ? `, lowest ${output.metric} first, ${limit} at most` : `, top ${limit} by ${output.metric}`;
  }
  return `, in ${BIN_LABELS[binFor(seconds)]} buckets, drawn as a time chart`;
}

function subject(scenario, output) {
  if (!output.custom) return scenario.reads;
  const by = output.by.length ? ` by ${joinAnd(output.by)}` : '';
  return `Rows of ${scenario.table} counted${by}${output.kind === 'series' ? ' over time' : ''}`;
}

export function buildQuery(state) {
  const service = findService(state?.service);
  const scenario = findScenario(state?.service, state?.scenario);
  if (!service || !scenario) {
    return { ok: false, kql: '', lines: [], reading: '', problems: [{ scope: 'scenario', message: 'Choose a service and a scenario.' }] };
  }

  const problems = [];
  let time = resolveTime(state.time ?? DEFAULT_TIME);
  if (!time.ok) {
    problems.push({ scope: 'time', message: `${time.message} Using the last 24 hours.` });
    time = resolveTime(DEFAULT_TIME);
  }

  const applied = resolveFilters(scenario.table, state.filters, problems);
  const output = resolveShape(scenario, state.group, problems);
  const limit = resolveLimit(state.limit, output.kind, problems);

  const lines = [
    { text: scenario.table, source: 'scenario' },
    ...(time.where ? [{ text: `| where ${time.where}`, source: 'time' }] : []),
    ...applied.map((filter) => ({ text: `| where ${filter.kql}`, source: `filter:${filter.id}` })),
    ...(output.custom ? [] : (scenario.extend ?? []).map((expression) => ({ text: `| extend ${expression}`, source: 'scenario' }))),
    ...outputLines(output, limit, time.seconds),
  ];

  const where = applied.length ? ` where ${joinAnd(applied.map((filter) => filter.phrase))}` : '';
  const reading = `${subject(scenario, output)} ${time.phrase}${where}${outputPhrase(output, limit, time.seconds)}.`;

  return {
    ok: true,
    kql: lines.map((line) => line.text).join('\n'),
    lines,
    reading,
    problems,
    table: scenario.table,
    service: service.id,
    scenario: scenario.id,
    kind: output.kind,
  };
}
