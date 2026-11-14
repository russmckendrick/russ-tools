import { DEFAULT_LIMIT, findScenario, findService } from './catalog.js';
import { defaultOperator } from './operators.js';
import { findColumn } from './schema.js';
import { DEFAULT_TIME } from './time.js';

let sequence = 0;
export const nextId = () => `f${++sequence}`;

export const EMPTY_STATE = {
  mode: 'build',
  service: '',
  scenario: '',
  time: DEFAULT_TIME,
  limit: DEFAULT_LIMIT.rows,
  filters: [],
  kql: '',
};

const presets = (scenario) =>
  (scenario.filters ?? []).map((filter) => ({ ...filter, id: nextId(), preset: true }));

export function scenarioState(serviceId, scenarioId, previous = EMPTY_STATE) {
  const service = findService(serviceId);
  if (!service) return { ...previous, mode: 'build', service: '', scenario: '', filters: [] };
  const scenario = findScenario(serviceId, scenarioId) ?? service.scenarios[0];
  const taken = new Set((scenario.filters ?? []).map((filter) => filter.column));
  const kept = (previous.filters ?? []).filter(
    (filter) => !filter.preset && !taken.has(filter.column) && findColumn(scenario.table, filter.column)
  );
  return {
    ...previous,
    mode: 'build',
    service: service.id,
    scenario: scenario.id,
    time: scenario.span ? { kind: 'relative', span: scenario.span } : previous.time,
    limit: DEFAULT_LIMIT[scenario.output.kind] || previous.limit || DEFAULT_LIMIT.rows,
    filters: [...presets(scenario), ...kept],
  };
}

export function newFilter(table, columnName) {
  const column = findColumn(table, columnName);
  if (!column) return null;
  return { id: nextId(), column: column.name, op: defaultOperator(column), value: '', value2: '' };
}

export function reducer(state, action) {
  switch (action.type) {
    case 'load':
      return { ...EMPTY_STATE, ...action.state };
    case 'mode':
      return { ...state, mode: action.mode };
    case 'service':
      return scenarioState(action.service, null, state);
    case 'scenario':
      return scenarioState(state.service, action.scenario, state);
    case 'time':
      return { ...state, time: action.time };
    case 'limit':
      return { ...state, limit: action.limit };
    case 'kql':
      return { ...state, kql: action.kql };
    case 'edit-as-kql':
      return { ...state, mode: 'kql', kql: action.kql };
    case 'filter-add': {
      const scenario = findScenario(state.service, state.scenario);
      const filter = scenario && newFilter(scenario.table, action.column);
      return filter ? { ...state, filters: [...state.filters, filter] } : state;
    }
    case 'filter-change':
      return {
        ...state,
        filters: state.filters.map((filter) => (filter.id === action.id ? { ...filter, ...action.patch } : filter)),
      };
    case 'filter-remove':
      return { ...state, filters: state.filters.filter((filter) => filter.id !== action.id) };
    default:
      return state;
  }
}

export function portable(state) {
  if (state.mode === 'kql') return { mode: 'kql', kql: state.kql };
  return {
    mode: 'build',
    service: state.service,
    scenario: state.scenario,
    time: state.time,
    limit: state.limit,
    filters: state.filters.map(({ column, op, value, value2, preset }) => ({
      column,
      op,
      value,
      ...(value2 ? { value2 } : {}),
      ...(preset ? { preset: true } : {}),
    })),
  };
}

const text = (value, max) => (typeof value === 'string' ? value.slice(0, max) : typeof value === 'number' ? String(value) : '');

function restoreTime(time) {
  if (time?.kind === 'portal') return { kind: 'portal' };
  if (time?.kind === 'absolute') return { kind: 'absolute', from: text(time.from, 40), to: text(time.to, 40) };
  return { kind: 'relative', span: text(time?.span, 12) || DEFAULT_TIME.span };
}

export function restore(saved) {
  if (!saved || typeof saved !== 'object') return null;
  if (saved.mode === 'kql') {
    return typeof saved.kql === 'string' ? { ...EMPTY_STATE, mode: 'kql', kql: saved.kql.slice(0, 20000) } : null;
  }
  const scenario = findScenario(saved.service, saved.scenario);
  if (!scenario) return null;
  const filters = (Array.isArray(saved.filters) ? saved.filters : [])
    .slice(0, 40)
    .filter((filter) => filter && typeof filter === 'object')
    .map((filter) => ({
      id: nextId(),
      column: text(filter.column, 80),
      op: text(filter.op, 20),
      value: text(filter.value, 2000),
      value2: text(filter.value2, 2000),
      ...(filter.preset ? { preset: true } : {}),
    }));
  return {
    ...EMPTY_STATE,
    service: saved.service,
    scenario: saved.scenario,
    time: restoreTime(saved.time),
    limit: text(saved.limit, 8) || DEFAULT_LIMIT[scenario.output.kind] || DEFAULT_LIMIT.rows,
    filters,
  };
}
