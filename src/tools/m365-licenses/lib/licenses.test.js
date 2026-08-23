import { describe, it, expect } from 'vitest';
import {
  detectQueryKind,
  findSku,
  searchSkus,
  searchServicePlans,
  expandSku,
  planDetail,
} from './licenses.js';

/**
 * A hand-built stand-in for the real dataset. Small enough to reason about,
 * shaped exactly like the generated file — which is what lets these tests run
 * without loading 416 KB of Microsoft's reference data.
 */
const data = {
  source: 'https://example.invalid/licensing.csv',
  licence: 'CC-BY-4.0',
  generatedAt: '2026-08-23',
  skus: [
    {
      guid: '05e9a617-0261-4cee-bb44-138d3ef5d965',
      partNumber: 'SPE_E3',
      name: 'Microsoft 365 E3',
      plans: ['c1ec4a95-1f05-45b3-a911-aa3fa01094f5', '43de0ff5-c92c-492b-9116-175376d08c38'],
    },
    {
      guid: '06ebc4ee-1bb5-47dd-8120-11324bc54e06',
      partNumber: 'SPE_E5',
      name: 'Microsoft 365 E5',
      plans: ['c1ec4a95-1f05-45b3-a911-aa3fa01094f5'],
    },
    {
      guid: '6fd2c87f-b296-42f0-b197-1e91e994b900',
      partNumber: 'ENTERPRISEPACK',
      name: 'Office 365 E3',
      plans: ['43de0ff5-c92c-492b-9116-175376d08c38'],
    },
  ],
  servicePlans: [
    {
      id: 'c1ec4a95-1f05-45b3-a911-aa3fa01094f5',
      name: 'INTUNE_A',
      friendly: 'Microsoft Intune',
    },
    {
      id: '43de0ff5-c92c-492b-9116-175376d08c38',
      name: 'OFFICESUBSCRIPTION',
      friendly: 'Microsoft 365 Apps for enterprise',
    },
  ],
};

describe('detectQueryKind', () => {
  it('recognises a GUID regardless of case', () => {
    expect(detectQueryKind('05e9a617-0261-4cee-bb44-138d3ef5d965')).toBe('guid');
    expect(detectQueryKind('05E9A617-0261-4CEE-BB44-138D3EF5D965')).toBe('guid');
  });

  it('recognises underscore-separated part numbers', () => {
    expect(detectQueryKind('SPE_E3')).toBe('partNumber');
    expect(detectQueryKind('POWER_BI_PRO')).toBe('partNumber');
  });

  it('recognises single-word upper-case part numbers', () => {
    expect(detectQueryKind('ENTERPRISEPACK')).toBe('partNumber');
  });

  it('treats anything else as a name', () => {
    expect(detectQueryKind('Microsoft 365 E3')).toBe('name');
    expect(detectQueryKind('intune')).toBe('name');
  });

  it('reports empty input rather than guessing', () => {
    expect(detectQueryKind('')).toBe('empty');
    expect(detectQueryKind('   ')).toBe('empty');
    expect(detectQueryKind(undefined)).toBe('empty');
  });
});

describe('findSku', () => {
  it('finds by GUID, case-insensitively', () => {
    expect(findSku(data, '05E9A617-0261-4CEE-BB44-138D3EF5D965').partNumber).toBe('SPE_E3');
  });

  it('finds by part number', () => {
    expect(findSku(data, 'spe_e5').name).toBe('Microsoft 365 E5');
  });

  it('finds by exact display name', () => {
    expect(findSku(data, 'Office 365 E3').partNumber).toBe('ENTERPRISEPACK');
  });

  it('returns null rather than a near miss', () => {
    expect(findSku(data, 'Microsoft 365')).toBeNull();
    expect(findSku(data, '')).toBeNull();
  });
});

describe('searchSkus', () => {
  it('ranks an exact part number above a substring match', () => {
    const hits = searchSkus(data, 'spe_e3');
    expect(hits[0].partNumber).toBe('SPE_E3');
  });

  it('ranks a prefix match above a mid-string match', () => {
    const hits = searchSkus(data, 'microsoft 365');
    expect(hits.map((s) => s.name)).toEqual(['Microsoft 365 E3', 'Microsoft 365 E5']);
  });

  it('matches on display name substrings', () => {
    expect(searchSkus(data, 'e3').map((s) => s.name).sort()).toEqual([
      'Microsoft 365 E3',
      'Office 365 E3',
    ]);
  });

  it('never lets a GUID fragment outrank a name', () => {
    // The index's paste panel sends "E3" here on shape alone, and a GUID is
    // hex: `06ebc4ee…` *starts* with "e" and two thirds of the catalogue's
    // ids contain "e3" somewhere. Scoring ids alongside names answered
    // Microsoft 365 E5 for a query that names E3.
    const hits = searchSkus(data, 'e3').map((sku) => sku.name);
    expect(hits).toContain('Microsoft 365 E3');
    expect(hits).toContain('Office 365 E3');
    expect(hits).not.toContain('Microsoft 365 E5');
  });

  it('still finds a SKU by a fragment long enough to be a GUID', () => {
    expect(searchSkus(data, '05e9a617')[0].partNumber).toBe('SPE_E3');
    expect(searchSkus(data, '138d3ef5')[0].partNumber).toBe('SPE_E3');
  });

  it('honours the limit', () => {
    expect(searchSkus(data, 'e', 1)).toHaveLength(1);
  });

  it('returns nothing for an empty query', () => {
    expect(searchSkus(data, '  ')).toEqual([]);
  });
});

describe('searchServicePlans', () => {
  it('matches the friendly name', () => {
    expect(searchServicePlans(data, 'intune')[0].name).toBe('INTUNE_A');
  });

  it('matches the plan name', () => {
    expect(searchServicePlans(data, 'OFFICESUBSCRIPTION')[0].friendly).toBe(
      'Microsoft 365 Apps for enterprise'
    );
  });

  it('holds plan ids to the same fragment length as SKU GUIDs', () => {
    // Plan ids are GUIDs too, and the same accidental-hex problem applies.
    expect(searchServicePlans(data, 'c1ec4a95')[0].name).toBe('INTUNE_A');
    expect(searchServicePlans(data, '43de0ff5')[0].name).toBe('OFFICESUBSCRIPTION');
  });
});

describe('expandSku', () => {
  it('hydrates plan ids into records sorted by friendly name', () => {
    const { plans } = expandSku(data, findSku(data, 'SPE_E3'));
    expect(plans.map((p) => p.friendly)).toEqual([
      'Microsoft 365 Apps for enterprise',
      'Microsoft Intune',
    ]);
  });

  it('keeps an unknown plan id visible rather than dropping it', () => {
    const orphan = { guid: 'x', partNumber: 'X', name: 'X', plans: ['not-a-known-plan'] };
    const { plans } = expandSku(data, orphan);
    expect(plans).toEqual([{ id: 'not-a-known-plan', name: 'not-a-known-plan', friendly: '' }]);
  });
});

describe('planDetail', () => {
  it('lists every SKU that includes a plan, by plan name', () => {
    const detail = planDetail(data, 'INTUNE_A');
    expect(detail.plan.friendly).toBe('Microsoft Intune');
    expect(detail.skus.map((s) => s.partNumber)).toEqual(['SPE_E3', 'SPE_E5']);
  });

  it('accepts a plan id as well as a name', () => {
    const detail = planDetail(data, '43de0ff5-c92c-492b-9116-175376d08c38');
    // Sorted by display name, not part number: "Microsoft 365 E3" sorts
    // before "Office 365 E3" even though SPE_E3 sorts after ENTERPRISEPACK.
    expect(detail.skus.map((s) => s.name)).toEqual(['Microsoft 365 E3', 'Office 365 E3']);
  });

  it('returns null for an unknown plan', () => {
    expect(planDetail(data, 'NOPE')).toBeNull();
  });
});
