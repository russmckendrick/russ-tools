import Prism from 'prismjs';

const KEYWORDS = [
  'where', 'project', 'project-away', 'project-rename', 'project-reorder', 'extend', 'summarize', 'by', 'top', 'take',
  'limit', 'sort', 'order', 'asc', 'desc', 'nulls', 'first', 'last', 'join', 'kind', 'on', 'union', 'let', 'distinct',
  'count', 'render', 'parse', 'evaluate', 'mv-expand', 'mv-apply', 'search', 'find', 'lookup', 'make-series', 'range',
  'print', 'datatable', 'materialize', 'as', 'to', 'typeof', 'with', 'step', 'from', 'serialize', 'invoke', 'getschema',
];

const WORD_OPERATORS = [
  'and', 'or', 'not', 'in', 'in~', '!in', '!in~', 'has', '!has', 'has_cs', 'has_any', 'has_all', 'hasprefix', 'hassuffix',
  'contains', '!contains', 'contains_cs', 'startswith', '!startswith', 'startswith_cs', 'endswith', '!endswith',
  'endswith_cs', 'matches regex', 'between', '!between',
];

const escape = (word) => word.replace(/[!~-]/g, '\\$&');
const alternation = (words) => [...words].sort((a, b) => b.length - a.length).map(escape).join('|');

export const KQL_GRAMMAR = {
  comment: { pattern: /\/\/.*/, greedy: true },
  string: [
    { pattern: /@"(?:[^"]|"")*"|@'(?:[^']|'')*'/, greedy: true },
    { pattern: /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/, greedy: true },
  ],
  datetime: { pattern: /\b(?:datetime|timespan)\([^)]*\)/, alias: 'number' },
  operator: [
    { pattern: new RegExp(`(^|[\\s(])(?:${alternation(WORD_OPERATORS)})(?=[\\s(]|$)`, 'm'), lookbehind: true, alias: 'word' },
    /==|=~|!=|!~|<=|>=|<|>|=|\.\.|[+\-*/%]/,
  ],
  function: /\b[A-Za-z_][A-Za-z0-9_]*(?=\()/,
  keyword: { pattern: new RegExp(`(^|[\\s|(])(?:${alternation(KEYWORDS)})(?=\\s|$)`, 'm'), lookbehind: true },
  boolean: /\b(?:true|false|null)\b/,
  number: /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?(?:ms|[smhd])?\b/,
  pipe: { pattern: /\|/, alias: 'punctuation' },
  punctuation: /[()[\]{},;.:]/,
};

export function highlightKql(source) {
  return Prism.highlight(String(source ?? ''), KQL_GRAMMAR, 'kql');
}
