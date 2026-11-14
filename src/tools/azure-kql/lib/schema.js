import reference from '@/data/microsoft/azure-monitor-tables.json';
import { TABLE_NOTES } from './columns.js';

const BASE_TYPES = { string: 'string', int: 'int', long: 'int', real: 'real', bool: 'bool', datetime: 'datetime' };
const TIME_COLUMN = 'TimeGenerated';

export const REFERENCE = { source: reference.source, fetched: reference.fetched };
export const TABLE_NAMES = Object.keys(reference.tables);

const cache = new Map();

export function hasTable(table) {
  return Object.hasOwn(reference.tables, table);
}

export function hasColumn(table, name) {
  return hasTable(table) && Object.hasOwn(reference.tables[table], name);
}

export function tableColumns(table) {
  if (!hasTable(table)) return [];
  if (!cache.has(table)) {
    const notes = TABLE_NOTES[table]?.columns ?? {};
    const columns = Object.entries(reference.tables[table])
      .filter(([name, type]) => name !== TIME_COLUMN && BASE_TYPES[type])
      .map(([name, type]) => ({ name, type: BASE_TYPES[type], ...notes[name] }));
    cache.set(table, columns);
  }
  return cache.get(table);
}

export function findColumn(table, name) {
  return tableColumns(table).find((column) => column.name === name) ?? null;
}

export function commonColumns(table) {
  const common = TABLE_NOTES[table]?.common ?? [];
  return common.map((name) => findColumn(table, name)).filter(Boolean);
}
