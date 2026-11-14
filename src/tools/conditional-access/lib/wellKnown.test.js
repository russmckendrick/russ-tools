import { describe, expect, it } from 'vitest';
import wellKnown from '../../../data/microsoft/entra-well-known-ids.json';
import lookup from '../../../data/microsoft/entra-ids.json';

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const RESERVED = ['All', 'MicrosoftAdminPortals', 'Office365'];

describe('the application ids the explainer names', () => {
  const { applications, applicationSources } = wellKnown;

  it('are GUIDs, or one of the reserved words Graph documents', () => {
    const others = Object.keys(applications).filter((id) => !GUID.test(id));
    expect(others.sort()).toEqual(RESERVED);
  });

  it('cite Microsoft pages and nothing else', () => {
    expect(applicationSources.length).toBeGreaterThan(0);
    for (const url of applicationSources) {
      expect(url).toMatch(/^https:\/\/(learn\.microsoft\.com|github\.com\/(MicrosoftDocs|microsoftgraph))\//);
    }
  });

  it('name Azure management by the id Microsoft publishes', () => {
    expect(applications['797f4846-ba00-4fd7-ba43-dac1f8f63013']).toMatch(/Windows Azure Service Management API/);
    expect(Object.keys(applications).filter((id) => id.startsWith('797f4846'))).toHaveLength(1);
  });

  it('keep the ids that once carried another application\'s name on the right one', () => {
    expect(applications['9cdead84-a844-4324-93f2-b2e6bb768d07']).toBe('Azure Virtual Desktop');
    expect(applications['d4ebce55-015a-49b5-a083-c84d1797ae8c']).toBe('Microsoft Intune Enrollment');
    expect(applications['cf36b471-5b44-428c-9ce7-313bf84528de']).toBe('Microsoft Bing Search');
    expect(applications['d176f6e7-38e5-40c9-8a78-3998aab820e7']).toBe('Microsoft Online Syndication Partner Portal');
    expect(applications['66a88757-258c-4c72-893c-3e8bed4d6899']).toBe('Office 365 Search Service');
    expect(applications['c9a559d2-7aab-4f13-a6ed-e7e9c52aec87']).toBe('Microsoft Forms');
  });

  it('never give one name to two ids', () => {
    const names = Object.values(applications);
    expect(new Set(names).size).toBe(names.length);
  });

  it('agree with the lookup dataset about which application an id belongs to', () => {
    const fetched = new Map(lookup.applications.map((app) => [app.id, [app.name, ...app.aliases]]));
    const relabelled = {
      '00000007-0000-0000-c000-000000000000': 'Dataverse',
      '00000009-0000-0000-c000-000000000000': 'Power BI',
      '4765445b-32c6-49b0-83e6-1d93765276ca': 'Microsoft 365 web',
      '66a88757-258c-4c72-893c-3e8bed4d6899': 'QueryFormulationService',
    };
    for (const [id, label] of Object.entries(applications)) {
      const names = fetched.get(id);
      if (!names) continue;
      const expected = relabelled[id] ?? names.find((name) => label.toLowerCase().startsWith(name.toLowerCase()));
      expect(names, `${id} is "${label}" here`).toContain(expected);
    }
  });
});
