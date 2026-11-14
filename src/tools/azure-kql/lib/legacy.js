import { findScenario } from './catalog.js';
import { isIdentifier, isTimespan } from './kql.js';
import { findColumn } from './schema.js';
import { EMPTY_STATE, nextId, scenarioState } from './state.js';
import { parseInteger } from './values.js';

const CONTROL = new Set(['timeRange', 'limit', 'sortField', 'sortOrder']);
const RENAMED = { ClientIPAddress: 'ClientSideIPAddress' };
const SERVICE_NAMES = {
  'azure-firewall': 'Azure Firewall',
  'azure-virtual-desktop': 'Azure Virtual Desktop',
  'azure-application-gateway': 'Application Gateway',
};

export function fromLegacyConfig(config) {
  if (!config || typeof config !== 'object') return null;
  const scenario = findScenario(config.service, config.template);
  if (!scenario) return null;

  const parameters = config.parameters && typeof config.parameters === 'object' ? config.parameters : {};
  const state = scenarioState(config.service, config.template, EMPTY_STATE);

  if (isTimespan(parameters.timeRange)) state.time = { kind: 'relative', span: parameters.timeRange };
  const limit = parseInteger(parameters.limit ?? '', { min: 1, max: 30000 });
  if (limit.ok && scenario.output.kind !== 'series') state.limit = String(limit.parsed);

  for (const [key, raw] of Object.entries(parameters)) {
    if (CONTROL.has(key) || raw === '' || raw === null || raw === undefined || raw === 'any') continue;
    const column = findColumn(scenario.table, RENAMED[key] ?? key);
    if (!column) continue;
    const value = Array.isArray(raw) ? raw.join(', ') : String(raw);
    const op = Array.isArray(raw) ? 'in' : 'eq';
    const existing = state.filters.find((filter) => filter.column === column.name);
    if (existing) Object.assign(existing, { op, value });
    else state.filters.push({ id: nextId(), column: column.name, op, value, value2: '' });
  }
  return state;
}

export function legacyTemplateKql(template) {
  const table = isIdentifier(template?.table) ? template.table : 'AzureDiagnostics';
  const limit = parseInteger(template?.defaultLimit ?? '', { min: 1, max: 30000 });
  const projection = Array.isArray(template?.projection) ? template.projection.filter(isIdentifier) : [];
  const aggregation = typeof template?.aggregation === 'string' ? template.aggregation.trim() : '';
  return [
    table,
    '| where TimeGenerated >= ago(24h)',
    ...(aggregation ? [aggregation.startsWith('|') ? aggregation : `| ${aggregation}`] : []),
    '| order by TimeGenerated desc',
    `| limit ${limit.ok ? limit.parsed : 100}`,
    ...(projection.length ? [`| project ${projection.join(', ')}`] : []),
  ].join('\n');
}

const stamp = (value) => (typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? value : new Date(0).toISOString());
const label = (value, max = 120) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

function entryFrom(item, fallbackId) {
  if (!item || typeof item !== 'object' || typeof item.query !== 'string') return null;
  const state = fromLegacyConfig(item);
  const scenario = findScenario(item.service, item.template);
  const generic = `${item.service} - ${item.template}`;
  const named = label(item.name);
  return {
    id: label(String(item.id ?? ''), 60) || fallbackId,
    name: named && named !== generic ? named : scenario ? `${SERVICE_NAMES[item.service] ?? item.service}: ${scenario.name}` : named || 'Saved query',
    description: label(item.description, 400),
    tags: Array.isArray(item.tags) ? item.tags.map((tag) => label(tag, 40)).filter(Boolean).slice(0, 12) : [],
    kind: state ? 'build' : 'kql',
    state: state ?? undefined,
    kql: item.query,
    at: stamp(item.timestamp),
  };
}

function templateEntry(template) {
  if (!template || typeof template !== 'object' || !label(template.name)) return null;
  return {
    id: label(String(template.id ?? ''), 60) || `template-${nextId()}`,
    name: label(template.name),
    description: label(template.description, 400),
    tags: ['custom template'],
    kind: 'kql',
    kql: legacyTemplateKql(template),
    service: label(template.service, 60),
    at: stamp(template.timestamp),
  };
}

export function migrateLegacy({ store, templates }) {
  const old = store?.state && typeof store.state === 'object' ? store.state : {};
  const favourites = Array.isArray(old.favorites) ? old.favorites : [];
  const history = Array.isArray(old.queryHistory) ? old.queryHistory : [];
  const custom = Array.isArray(templates) ? templates : [];

  return {
    saved: [
      ...favourites.map((item, index) => entryFrom(item, `favourite-${index}`)),
      ...custom.map(templateEntry),
    ].filter(Boolean),
    recent: history.map((item, index) => entryFrom(item, `history-${index}`)).filter(Boolean),
  };
}
