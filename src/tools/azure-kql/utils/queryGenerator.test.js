// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { generateKQLQuery } from './queryGenerator.js';
import { loadTemplate, getTemplateList, saveCustomTemplate, deleteCustomTemplate } from './templateLoader.js';

beforeEach(() => localStorage.clear());

describe('generateKQLQuery filter ordering', () => {
  it('orders filters by priority, not insertion order (the case-mismatch fix)', async () => {
    const template = loadTemplate('azure-firewall', 'basic');
    expect(template).not.toBe(null);

    // Parameters deliberately supplied in reverse-priority order. Before the
    // fix, FILTER_PRIORITY held camelCase keys while fields are PascalCase,
    // so every filter got default priority and insertion order won.
    const query = await generateKQLQuery(template, {
      DestinationPort: '443',
      SourceIp: '10.0.0.1',
      Action: 'Deny',
      timeRange: '24h',
    });

    const wheres = query.split('\n').filter((l) => l.startsWith('| where'));
    const position = (needle) => wheres.findIndex((l) => l.includes(needle));

    expect(position('TimeGenerated')).toBe(0);
    expect(position('Action')).toBeLessThan(position('SourceIp'));
    expect(position('SourceIp')).toBeLessThan(position('DestinationPort'));
  });

  it('starts from the template table and ends with order/limit', async () => {
    const template = loadTemplate('azure-firewall', 'basic');
    const query = await generateKQLQuery(template, { timeRange: '1h' });

    expect(query.split('\n')[0]).toBe(template.table || 'AzureDiagnostics');
    expect(query).toMatch(/\| order by TimeGenerated desc/);
    expect(query).toMatch(/\| limit \d+/);
  });
});

describe('custom templates round-trip', () => {
  const custom = {
    id: 'custom-test-1',
    name: 'My Denied Traffic',
    description: 'test template',
    service: 'azure-firewall',
    table: 'AZFWNetworkRule',
    fields: [],
    aggregation: '',
    projection: [],
    defaultLimit: 25,
  };

  it('a saved template appears in the template list and loads into the builder', async () => {
    saveCustomTemplate(custom);

    // The Templates tab used to be write-only: saved templates never showed
    // up here, which is the bug this pins the fix for.
    const list = getTemplateList('azure-firewall');
    const mine = list.find((t) => t.id === 'custom-test-1');
    expect(mine).toMatchObject({ name: 'My Denied Traffic', category: 'Custom' });

    const loaded = loadTemplate('azure-firewall', 'custom-test-1');
    expect(loaded).not.toBe(null);
    expect(loaded.table).toBe('AZFWNetworkRule');

    const query = await generateKQLQuery(loaded, { timeRange: '1h' });
    expect(query).toMatch(/\| limit 25/);

    deleteCustomTemplate('custom-test-1');
    expect(getTemplateList('azure-firewall').find((t) => t.id === 'custom-test-1')).toBeUndefined();
  });

  it('reads the legacy custom-template key forward without deleting it', () => {
    localStorage.setItem('azure-kql-custom-templates', JSON.stringify([custom]));

    const list = getTemplateList('azure-firewall');
    expect(list.some((t) => t.id === 'custom-test-1')).toBe(true);
    expect(localStorage.getItem('azure-kql-custom-templates')).not.toBe(null);
  });
});
