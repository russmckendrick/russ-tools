import { DEFAULT_LIMIT, findScenario, findService } from './catalog.js';
import { renderFilter } from './operators.js';
import { findColumn } from './schema.js';
import { DEFAULT_TIME, binFor, resolveTime } from './time.js';
import { parseInteger } from './values.js';

export const MAX_ROWS = 30000;

const BIN_LABELS = { '1m': 'one-minute', '5m': 'five-minute', '1h': 'hourly', '6h': 'six-hour', '1d': 'daily' };

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
    const column = findColumn(table, filter.column);
    if (!column) {
      problems.push({ scope: 'filter', id: filter.id, message: `${table} has no filterable column called ${filter.column}.` });
      continue;
    }
    const rendered = renderFilter(column, filter);
    if (rendered.ok) applied.push(rendered);
    else if (!rendered.empty) problems.push({ scope: 'filter', id: filter.id, message: rendered.message });
  }
  return applied;
}

function outputLines(output, limit, seconds) {
  const aggregates = (output.aggregates ?? []).map(([name, expression]) => `${name} = ${expression}`).join(', ');
  if (output.kind === 'rows') {
    return [...(output.project ? [`| project ${output.project.join(', ')}`] : []), `| top ${limit} by ${output.by} desc`];
  }
  if (output.kind === 'top') {
    return [`| summarize ${aggregates} by ${output.by.join(', ')}`, `| top ${limit} by ${output.metric} ${output.order}`];
  }
  const by = [...output.by, `bin(TimeGenerated, ${binFor(seconds)})`].join(', ');
  return [`| summarize ${aggregates} by ${by}`, '| sort by TimeGenerated asc', '| render timechart'];
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

export function buildQuery(state) {
  const service = findService(state?.service);
  const scenario = findScenario(state?.service, state?.scenario);
  if (!service || !scenario) {
    return { ok: false, kql: '', reading: '', problems: [{ scope: 'scenario', message: 'Choose a service and a scenario.' }] };
  }

  const problems = [];
  let time = resolveTime(state.time ?? DEFAULT_TIME);
  if (!time.ok) {
    problems.push({ scope: 'time', message: `${time.message} Using the last 24 hours.` });
    time = resolveTime(DEFAULT_TIME);
  }

  const applied = resolveFilters(scenario.table, state.filters, problems);
  const limit = resolveLimit(state.limit, scenario.output.kind, problems);

  const lines = [
    scenario.table,
    ...(time.where ? [`| where ${time.where}`] : []),
    ...applied.map((filter) => `| where ${filter.kql}`),
    ...(scenario.extend ?? []).map((expression) => `| extend ${expression}`),
    ...outputLines(scenario.output, limit, time.seconds),
  ];

  const where = applied.length ? ` where ${joinAnd(applied.map((filter) => filter.phrase))}` : '';
  const reading = `${scenario.reads} ${time.phrase}${where}${outputPhrase(scenario.output, limit, time.seconds)}.`;

  return { ok: true, kql: lines.join('\n'), reading, problems, table: scenario.table, service: service.id, scenario: scenario.id };
}
