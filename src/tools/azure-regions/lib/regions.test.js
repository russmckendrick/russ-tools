import { describe, expect, it } from 'vitest';
import data from '../../../data/azure/regions.json';
import { distinct, findRegion, fold, pairOf, searchRegions, zoneLabel } from './regions.js';

const REGIONS = [
  {
    name: 'uksouth',
    displayName: 'UK South',
    geography: 'United Kingdom',
    area: 'Europe',
    location: 'London',
    zones: 3,
    zonesPreview: false,
    pairedDisplayName: 'UK West',
    paired: 'ukwest',
    restricted: false,
    preview: false,
  },
  {
    name: 'ukwest',
    displayName: 'UK West',
    geography: 'United Kingdom',
    area: 'Europe',
    location: 'Cardiff',
    zones: null,
    zonesPreview: false,
    pairedDisplayName: 'UK South',
    paired: 'uksouth',
    restricted: false,
    preview: false,
  },
  {
    name: 'swedencentral',
    displayName: 'Sweden Central',
    geography: 'Sweden',
    area: 'Europe',
    location: 'Gävle',
    zones: 3,
    zonesPreview: true,
    pairedDisplayName: 'Sweden South',
    paired: null,
    restricted: false,
    preview: false,
  },
  {
    name: 'austriaeast',
    displayName: 'Austria East',
    geography: 'Austria',
    area: 'Europe',
    location: 'Vienna',
    zones: 3,
    zonesPreview: false,
    pairedDisplayName: null,
    paired: null,
    restricted: false,
    preview: false,
  },
  {
    name: 'eastus2',
    displayName: 'East US 2',
    geography: 'United States',
    area: 'Americas',
    location: 'Virginia',
    zones: 3,
    zonesPreview: false,
    pairedDisplayName: 'Central US',
    paired: null,
    restricted: false,
    preview: false,
  },
];

describe('fold', () => {
  it('reduces the ways a region is written to one key', () => {
    expect(fold('UK South')).toBe('uksouth');
    expect(fold('uk-south')).toBe('uksouth');
    expect(fold(' UKSouth ')).toBe('uksouth');
    expect(fold(null)).toBe('');
  });
});

describe('findRegion', () => {
  it('finds a region by programmatic or display name', () => {
    expect(findRegion(REGIONS, 'uksouth')?.displayName).toBe('UK South');
    expect(findRegion(REGIONS, 'UK South')?.name).toBe('uksouth');
    expect(findRegion(REGIONS, 'East US 2')?.name).toBe('eastus2');
  });

  it('returns null for a partial name or nothing', () => {
    expect(findRegion(REGIONS, 'uk')).toBeNull();
    expect(findRegion(REGIONS, '')).toBeNull();
  });
});

describe('searchRegions', () => {
  it('returns everything with no query, so the view never opens empty', () => {
    expect(searchRegions(REGIONS)).toHaveLength(REGIONS.length);
  });

  it('matches names, geography, area and physical location', () => {
    expect(searchRegions(REGIONS, { query: 'london' }).map((r) => r.name)).toEqual(['uksouth']);
    expect(searchRegions(REGIONS, { query: 'united kingdom' }).map((r) => r.name)).toEqual(['uksouth', 'ukwest']);
    expect(searchRegions(REGIONS, { query: 'americas' }).map((r) => r.name)).toEqual(['eastus2']);
  });

  it('puts an exact name ahead of regions that merely contain it', () => {
    const names = searchRegions(REGIONS, { query: 'UK West' }).map((r) => r.name);
    expect(names[0]).toBe('ukwest');
  });

  it('reads a display name typed without its spaces', () => {
    expect(searchRegions(REGIONS, { query: 'eastus' }).map((r) => r.name)).toEqual(['eastus2']);
  });

  it('applies the filters together with the query', () => {
    expect(searchRegions(REGIONS, { area: 'Europe', zonesOnly: true }).map((r) => r.name)).toEqual([
      'uksouth',
      'swedencentral',
      'austriaeast',
    ]);
    expect(searchRegions(REGIONS, { geography: 'Sweden', query: 'uk' })).toEqual([]);
  });
});

describe('pairOf', () => {
  it('returns the paired record when the pair is in the list', () => {
    expect(pairOf(REGIONS, REGIONS[0])).toEqual({ kind: 'listed', region: REGIONS[1] });
  });

  it('names a pair that is published but is not a row of its own', () => {
    expect(pairOf(REGIONS, REGIONS[2])).toEqual({ kind: 'unlisted', displayName: 'Sweden South' });
  });

  it('says so when a region has no pair', () => {
    expect(pairOf(REGIONS, REGIONS[3])).toEqual({ kind: 'none' });
  });
});

describe('zoneLabel', () => {
  it('words zone support as the list states it', () => {
    expect(zoneLabel(REGIONS[0])).toBe('3 zones');
    expect(zoneLabel(REGIONS[1])).toBe('No availability zones');
    expect(zoneLabel(REGIONS[2])).toBe('3 zones (some in preview)');
  });
});

describe('distinct', () => {
  it('lists the filter values in order', () => {
    expect(distinct(REGIONS, 'area')).toEqual(['Americas', 'Europe']);
    expect(distinct(REGIONS, 'geography')).toEqual(['Austria', 'Sweden', 'United Kingdom', 'United States']);
  });
});

describe('the checked-in snapshot', () => {
  it('has the shape the tool reads', () => {
    expect(data.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.regions.length).toBeGreaterThan(40);
    for (const region of data.regions) {
      expect(region.name).toMatch(/^[a-z0-9]+$/);
      expect(region.displayName).toBeTruthy();
      expect(region.geography).toBeTruthy();
      expect(region.area).toBeTruthy();
    }
  });

  it('has no duplicate programmatic names', () => {
    const names = data.regions.map((region) => region.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('resolves every pair it claims to resolve, in both directions', () => {
    for (const region of data.regions) {
      if (!region.paired) continue;
      const paired = findRegion(data.regions, region.paired);
      expect(paired, `${region.name} pairs with ${region.paired}`).not.toBeNull();
      expect(paired.displayName).toBe(region.pairedDisplayName);
    }
  });

  it('still carries the regions people look up first', () => {
    for (const name of ['uksouth', 'westeurope', 'eastus', 'southeastasia']) {
      expect(findRegion(data.regions, name), name).not.toBeNull();
    }
  });
});
