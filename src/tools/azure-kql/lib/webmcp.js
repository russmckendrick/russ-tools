import { textResult } from '@/lib/useWebMCPTool';
import { buildQuery } from './build.js';
import { SERVICES, findScenario, findService } from './catalog.js';
import { OPERATORS, OPERATORS_BY_TYPE } from './operators.js';
import { commonColumns, tableColumns } from './schema.js';
import { shareUrl } from './share.js';
import { EMPTY_STATE, nextId, scenarioState } from './state.js';

const listing = () =>
  SERVICES.map((service) => ({
    service: service.id,
    name: service.name,
    scenarios: service.scenarios.map((scenario) => ({
      scenario: scenario.id,
      name: scenario.name,
      table: scenario.table,
      description: scenario.description,
    })),
  }));

const describeColumns = (table) =>
  commonColumns(table).map((column) => ({
    column: column.name,
    type: column.type,
    operators: OPERATORS_BY_TYPE[column.type],
    ...(column.values ? { values: column.values } : {}),
  }));

export function runBuild({ service, scenario, timeRange, filters, limit, groupBy, overTime } = {}) {
  const found = findService(service);
  if (!found) {
    return { error: service ? `Unknown service "${service}".` : 'Give a service and a scenario.', services: listing() };
  }
  const chosen = scenario ? findScenario(service, scenario) : found.scenarios[0];
  if (!chosen) {
    return { error: `Unknown scenario "${scenario}" for ${found.name}.`, services: listing().filter((entry) => entry.service === service) };
  }

  const state = scenarioState(found.id, chosen.id, EMPTY_STATE);
  if (typeof timeRange === 'string' && timeRange.trim()) state.time = { kind: 'relative', span: timeRange.trim() };
  if (limit !== undefined && limit !== null) state.limit = String(limit);

  const known = new Set(tableColumns(chosen.table).map((column) => column.name));
  const rejected = [];
  for (const filter of Array.isArray(filters) ? filters.slice(0, 40) : []) {
    const column = String(filter?.column ?? '');
    if (!known.has(column)) {
      rejected.push({ column, reason: `${chosen.table} has no filterable column with that name.` });
      continue;
    }
    const values = Array.isArray(filter.value) ? filter.value.map(String) : null;
    const between = filter.operator === 'between' && values?.length === 2;
    state.filters.push({
      id: nextId(),
      column,
      op: String(filter.operator ?? 'eq'),
      value: between ? values[0] : values ? values.join(', ') : String(filter.value ?? ''),
      value2: between ? values[1] : '',
    });
  }

  state.group = {
    by: (Array.isArray(groupBy) ? groupBy : groupBy ? [groupBy] : []).map(String).slice(0, 4),
    overTime: Boolean(overTime),
  };

  const built = buildQuery(state);
  const page = typeof window === 'undefined' ? null : window.location.origin;
  return {
    kql: built.kql,
    reading: built.reading,
    table: chosen.table,
    notApplied: [...rejected, ...built.problems.map((problem) => ({ reason: problem.message }))],
    columns: describeColumns(chosen.table),
    url: page ? shareUrl(state, page) : null,
  };
}

export const BUILD_KQL_QUERY_TOOL = {
  name: 'build_kql_query',
  description:
    'Build a Kusto (KQL) query for Azure Monitor Logs from a scenario, across Azure networking, Entra ID, ' +
    'Sentinel and Defender, Microsoft 365, Intune, the activity log, Key Vault, Storage, SQL, Cosmos DB, App ' +
    'Service, Functions, AKS, virtual machines and Application Insights. Any scenario can be counted by ' +
    'columns or over time. Column names come from the Azure Monitor table reference, values are ' +
    'escaped, and a filter that is not valid is left out and reported. Call it with no arguments to list the ' +
    'services and scenarios. The query is built locally and is not run.',
  inputSchema: {
    type: 'object',
    properties: {
      service: { type: 'string', description: 'Service id, e.g. azure-firewall or entra-sign-ins' },
      scenario: { type: 'string', description: 'Scenario id within the service; defaults to its first' },
      timeRange: { type: 'string', description: 'Relative range such as 30m, 24h or 7d. Default 24h' },
      filters: {
        type: 'array',
        description: 'Extra filters, applied with the scenario\'s own',
        items: {
          type: 'object',
          properties: {
            column: { type: 'string', description: 'A column of the scenario\'s table' },
            operator: { type: 'string', enum: Object.keys(OPERATORS), description: 'Defaults to eq' },
            value: {
              description: 'A string or number; an array for in, nin and between',
              anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'array', items: { type: ['string', 'number'] } }],
            },
          },
          required: ['column'],
        },
      },
      limit: { type: 'integer', minimum: 1, maximum: 30000, description: 'Rows or groups to return' },
      groupBy: { type: 'array', items: { type: 'string' }, description: 'Count rows by these columns instead of the scenario\'s own output' },
      overTime: { type: 'boolean', description: 'Count per time bucket and render a time chart' },
    },
  },
  annotations: { readOnlyHint: true },
  execute: async (input) => {
    try {
      return textResult(runBuild(input ?? {}));
    } catch (error) {
      return textResult({ error: error.message });
    }
  },
};
