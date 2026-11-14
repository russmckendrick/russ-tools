import { describe, expect, it } from 'vitest';
import { GROUPS, SERVICES, allScenarios, findScenario } from './catalog.js';
import { TABLE_NOTES } from './columns.js';
import { OPERATORS_BY_TYPE } from './operators.js';
import { REFERENCE, TABLE_NAMES, findColumn, hasColumn, hasTable, tableColumns } from './schema.js';

const aliases = (scenario) => (scenario.extend ?? []).map((expression) => expression.split('=')[0].trim());

describe('the catalogue against the Azure Monitor table reference', () => {
  it('records where the reference came from', () => {
    expect(REFERENCE.source).toBe('https://learn.microsoft.com/en-us/azure/azure-monitor/reference/tables/');
    expect(REFERENCE.fetched).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it.each(allScenarios().map(({ service, scenario }) => [`${service.id}/${scenario.id}`, scenario]))(
    '%s names only real tables and columns',
    (_key, scenario) => {
      expect(hasTable(scenario.table)).toBe(true);
      const known = (name) => hasColumn(scenario.table, name) || aliases(scenario).includes(name);
      const output = scenario.output;
      for (const name of [...(output.project ?? []), ...(output.by && Array.isArray(output.by) ? output.by : [])]) {
        expect(known(name), `${name} in ${scenario.table}`).toBe(true);
      }
      if (output.kind === 'rows') expect(known(output.by), `${output.by} in ${scenario.table}`).toBe(true);
      for (const filter of scenario.filters ?? []) {
        const column = findColumn(scenario.table, filter.column);
        expect(column, `${filter.column} in ${scenario.table}`).not.toBe(null);
        expect(OPERATORS_BY_TYPE[column.type]).toContain(filter.op);
      }
    }
  );

  it('only annotates columns that exist, and only tables that are used', () => {
    for (const [table, notes] of Object.entries(TABLE_NOTES)) {
      expect(TABLE_NAMES).toContain(table);
      for (const name of [...notes.common, ...Object.keys(notes.columns)]) {
        expect(findColumn(table, name), `${table}.${name}`).not.toBe(null);
      }
    }
    const used = new Set(allScenarios().map(({ scenario }) => scenario.table));
    expect([...used].sort()).toEqual([...TABLE_NAMES].sort());
    expect(Object.keys(TABLE_NOTES).sort()).toEqual([...TABLE_NAMES].sort());
  });

  it('offers no dynamic column and no TimeGenerated as a filter', () => {
    expect(findColumn('AuditLogs', 'InitiatedBy')).toBe(null);
    expect(findColumn('AZFWNetworkRule', 'TimeGenerated')).toBe(null);
    expect(tableColumns('AZFWNetworkRule').map((column) => column.name)).toContain('_ResourceId');
  });

  it('uses the column the reference has for the AVD client address', () => {
    expect(hasColumn('WVDConnections', 'ClientIPAddress')).toBe(false);
    expect(findColumn('WVDConnections', 'ClientSideIPAddress')).toMatchObject({ type: 'ip' });
  });
});

describe('the catalogue itself', () => {
  it('has unique ids, a known group and a full description for everything', () => {
    expect(new Set(SERVICES.map((service) => service.id)).size).toBe(SERVICES.length);
    for (const service of SERVICES) {
      expect(GROUPS).toContain(service.group);
      expect(new Set(service.scenarios.map((scenario) => scenario.id)).size).toBe(service.scenarios.length);
      for (const scenario of service.scenarios) {
        expect(scenario).toMatchObject({ name: expect.any(String), reads: expect.any(String), description: expect.stringMatching(/\.$/) });
        expect(scenario.id).toMatch(/^[a-z0-9-]+$/);
      }
    }
  });

  it('keeps every service and template id the old tool had', () => {
    for (const [service, scenario] of [
      ['azure-firewall', 'basic'],
      ['azure-firewall', 'application'],
      ['azure-virtual-desktop', 'basic'],
      ['azure-application-gateway', 'basic'],
    ]) {
      expect(findScenario(service, scenario), `${service}/${scenario}`).not.toBe(null);
    }
    expect(findScenario('azure-firewall', 'basic').table).toBe('AZFWNetworkRule');
    expect(findScenario('azure-firewall', 'application').table).toBe('AZFWApplicationRule');
    expect(findScenario('azure-virtual-desktop', 'basic').table).toBe('WVDConnections');
    expect(findScenario('azure-application-gateway', 'basic').table).toBe('AzureDiagnostics');
  });
});
