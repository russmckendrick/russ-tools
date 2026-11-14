import { describe, expect, it } from 'vitest';
import data from '../../../data/azure/vm-sizes.json';
import {
  decodeSizeName,
  familyOf,
  findSize,
  looksLikeVmSize,
  searchSizes,
  seriesOf,
  sizeFamilies,
  tempStorageLabel,
} from './vmSizes.js';

const REFERENCE = {
  naming: {
    features: [
      { letter: 'a', meaning: 'AMD-based processor' },
      { letter: 'd', meaning: 'includes local temporary disks' },
      { letter: 'm', meaning: 'memory intensive' },
      { letter: 's', meaning: 'compatible with any Premium SSD type' },
    ],
    subfamilies: [
      { letter: 'C', meaning: 'confidential (for DC, EC, NCC series)' },
      { letter: 'C', meaning: 'compute intensive (for HC, NC, NCC series)' },
    ],
  },
  families: [
    { family: 'D', workloads: ['Enterprise-grade applications'] },
    { family: 'NC', workloads: ['Compute-intensive'] },
    { family: 'M', workloads: ['Extremely large databases'] },
  ],
};

const part = (decoded, name) => decoded.parts.filter((entry) => entry.part === name);

describe('decodeSizeName', () => {
  it('takes apart the size people look up most', () => {
    const decoded = decodeSizeName('Standard_D4s_v5', REFERENCE);
    expect(decoded).toMatchObject({
      tier: 'Standard',
      family: 'D',
      subfamily: '',
      vcpus: 4,
      constrainedVcpus: null,
      features: ['s'],
      accelerator: null,
      version: 'v5',
    });
    expect(part(decoded, 'Feature')[0]).toMatchObject({
      value: 's',
      meaning: 'compatible with any Premium SSD type',
      listed: true,
    });
    expect(part(decoded, 'Family')[0].meaning).toBe('D-family: Enterprise-grade applications');
  });

  it("reads Microsoft's own worked examples the way the article does", () => {
    // M48ds_1_v3: family M, 48 vCPUs, d and s, memory capacity 1, version v3.
    expect(decodeSizeName('M48ds_1_v3', REFERENCE)).toMatchObject({
      tier: null,
      family: 'M',
      vcpus: 48,
      features: ['d', 's'],
      memoryCapacity: 1,
      version: 'v3',
    });
    // NC4as_T4_v3: family N, subfamily C, accelerator T4.
    expect(decodeSizeName('NC4as_T4_v3', REFERENCE)).toMatchObject({
      family: 'N',
      subfamily: 'C',
      vcpus: 4,
      features: ['a', 's'],
      accelerator: 'T4',
      version: 'v3',
    });
    // M8-2ms_v2: 8 vCPUs constrained to 2.
    expect(decodeSizeName('M8-2ms_v2', REFERENCE)).toMatchObject({
      family: 'M',
      vcpus: 8,
      constrainedVcpus: 2,
      features: ['m', 's'],
      version: 'v2',
    });
  });

  it('gives both published meanings of a subfamily letter that has two', () => {
    const decoded = decodeSizeName('Standard_NC4as_T4_v3', REFERENCE);
    expect(part(decoded, 'Subfamily')[0].meaning).toBe(
      'confidential (for DC, EC, NCC series); or compute intensive (for HC, NC, NCC series)'
    );
    expect(part(decoded, 'Family')[0].meaning).toBe('NC-family: Compute-intensive');
  });

  it('marks a letter or segment the convention does not list, rather than inventing a meaning', () => {
    const decoded = decodeSizeName('Standard_DC2as_cc_v5', REFERENCE);
    expect(decoded.other).toEqual(['cc']);
    expect(part(decoded, 'Other')[0]).toEqual({ part: 'Other', value: 'cc', meaning: null, listed: false });

    const unknown = decodeSizeName('Standard_D2z_v9', REFERENCE);
    expect(part(unknown, 'Feature')[0]).toMatchObject({ value: 'z', meaning: null, listed: false });
  });

  it('does not call a size number a vCPU count when the published figure disagrees', () => {
    // Dv2 numbers its sizes: D3_v2 is the third size and has four vCPUs.
    const decoded = decodeSizeName('Standard_D3_v2', REFERENCE, { name: 'Standard_D3_v2', series: 'x', vcpus: 4 });
    expect(decoded.numberIsVcpus).toBe(false);
    expect(decoded.vcpus).toBe(4);
    expect(part(decoded, 'vCPUs')).toEqual([]);
    expect(part(decoded, 'Size number')[0]).toMatchObject({ value: '3' });
    expect(part(decoded, 'Size number')[0].meaning).toContain('Published with 4 vCPUs');

    const modern = decodeSizeName('Standard_D4s_v5', REFERENCE, { name: 'Standard_D4s_v5', series: 'x', vcpus: 4 });
    expect(modern.numberIsVcpus).toBe(true);
    expect(part(modern, 'vCPUs')[0].value).toBe('4');
  });

  it('reads a size with no version and no features', () => {
    expect(decodeSizeName('Basic_A1')).toMatchObject({
      tier: 'Basic',
      family: 'A',
      vcpus: 1,
      features: [],
      version: null,
    });
  });

  it('still decodes without the reference data, with no meanings', () => {
    const decoded = decodeSizeName('Standard_D4s_v5');
    expect(decoded.vcpus).toBe(4);
    expect(part(decoded, 'Feature')[0]).toMatchObject({ value: 's', meaning: null, listed: false });
  });

  it('returns null for something that is not a size name', () => {
    expect(decodeSizeName('uksouth')).toBeNull();
    expect(decodeSizeName('')).toBeNull();
    expect(decodeSizeName('Standard_')).toBeNull();
  });
});

describe('looksLikeVmSize', () => {
  it('accepts a size with a tier or a version', () => {
    expect(looksLikeVmSize('Standard_D4s_v5')).toBe(true);
    expect(looksLikeVmSize('standard_b2ms')).toBe(true);
    expect(looksLikeVmSize('D4s_v5')).toBe(true);
    expect(looksLikeVmSize('NC4as_T4_v3')).toBe(true);
  });

  it('rejects regions, words and anything with a space', () => {
    expect(looksLikeVmSize('uksouth')).toBe(false);
    expect(looksLikeVmSize('eastus2')).toBe(false);
    expect(looksLikeVmSize('D4')).toBe(false);
    expect(looksLikeVmSize('UK South')).toBe(false);
    expect(looksLikeVmSize('')).toBe(false);
  });
});

describe('familyOf', () => {
  it('returns the upper-case run the name opens with', () => {
    expect(familyOf('Standard_D4s_v5')).toBe('D');
    expect(familyOf('Standard_DC2as_v5')).toBe('DC');
    expect(familyOf('Standard_HB120rs_v3')).toBe('HB');
    expect(familyOf('D4s_v5')).toBe('D');
  });
});

const DATA = {
  series: [
    { id: 'dsv5-series', title: 'Dsv5 sizes series', category: 'general-purpose', url: 'u', features: {}, count: 2 },
    { id: 'esv5-series', title: 'Esv5 sizes series', category: 'memory-optimized', url: 'u', features: {}, count: 1 },
  ],
  sizes: [
    { name: 'Standard_E4s_v5', series: 'esv5-series', vcpus: 4, memoryGiB: 32 },
    { name: 'Standard_D16s_v5', series: 'dsv5-series', vcpus: 16, memoryGiB: 64 },
    { name: 'Standard_D4s_v5', series: 'dsv5-series', vcpus: 4, memoryGiB: 16 },
    { name: 'Standard_D2x_v5', series: 'dsv5-series' },
  ],
};

describe('searchSizes', () => {
  it('returns everything, smallest first within a family, with no filters', () => {
    expect(searchSizes(DATA).map((s) => s.name)).toEqual([
      'Standard_D4s_v5',
      'Standard_D16s_v5',
      'Standard_D2x_v5',
      'Standard_E4s_v5',
    ]);
  });

  it('matches a name with or without the tier, in any case', () => {
    expect(searchSizes(DATA, { query: 'Standard_D4s_v5' }).map((s) => s.name)).toEqual(['Standard_D4s_v5']);
    expect(searchSizes(DATA, { query: 'd4s_v5' }).map((s) => s.name)).toEqual(['Standard_D4s_v5']);
  });

  it('matches the series as well as the size', () => {
    expect(searchSizes(DATA, { query: 'esv5' }).map((s) => s.name)).toEqual(['Standard_E4s_v5']);
  });

  it('filters by family and by minimum vCPUs and memory', () => {
    expect(searchSizes(DATA, { family: 'D', minVcpus: 8 }).map((s) => s.name)).toEqual(['Standard_D16s_v5']);
    expect(searchSizes(DATA, { minMemoryGiB: 32 }).map((s) => s.name)).toEqual([
      'Standard_D16s_v5',
      'Standard_E4s_v5',
    ]);
  });

  it('never lets a size with an unpublished figure pass a minimum', () => {
    expect(searchSizes(DATA, { minVcpus: 1 }).map((s) => s.name)).not.toContain('Standard_D2x_v5');
    expect(searchSizes(DATA, { minMemoryGiB: 1 }).map((s) => s.name)).not.toContain('Standard_D2x_v5');
  });
});

describe('findSize, seriesOf, sizeFamilies, tempStorageLabel', () => {
  it('finds a size with the tier optional', () => {
    expect(findSize(DATA.sizes, 'd4s_v5')?.name).toBe('Standard_D4s_v5');
    expect(findSize(DATA.sizes, 'STANDARD_D4S_V5')?.name).toBe('Standard_D4s_v5');
    expect(findSize(DATA.sizes, 'D5s_v5')).toBeNull();
    expect(findSize(DATA.sizes, '')).toBeNull();
  });

  it('returns the series a size belongs to', () => {
    expect(seriesOf(DATA.series, DATA.sizes[0])?.title).toBe('Esv5 sizes series');
  });

  it('counts sizes per family prefix', () => {
    expect(sizeFamilies(DATA.sizes)).toEqual([
      { family: 'D', count: 3 },
      { family: 'E', count: 1 },
    ]);
  });

  it('words temporary storage, and says nothing when none is published', () => {
    expect(tempStorageLabel({ tempDisks: 1, tempDiskGiB: 75 })).toBe('75 GiB');
    expect(tempStorageLabel({ tempDisks: 2, tempDiskGiB: 1920 })).toBe('2 × 1,920 GiB');
    expect(tempStorageLabel({ tempDiskGiB: 50 })).toBe('50 GiB');
    expect(tempStorageLabel({})).toBeNull();
  });
});

describe('the checked-in snapshot', () => {
  it('has the shape the tool reads', () => {
    expect(data.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(data.sizes.length).toBeGreaterThan(500);
    expect(data.naming.features.length).toBeGreaterThan(8);
    expect(data.families.length).toBeGreaterThan(10);
  });

  it('links every size to a series that exists', () => {
    const ids = new Set(data.series.map((series) => series.id));
    for (const size of data.sizes) expect(ids.has(size.series), size.name).toBe(true);
  });

  it('has no duplicate size names', () => {
    const names = data.sizes.map((size) => size.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('publishes vCPUs and memory for nearly every size', () => {
    const complete = data.sizes.filter((size) => size.vcpus > 0 && size.memoryGiB > 0);
    expect(complete.length / data.sizes.length).toBeGreaterThan(0.98);
  });

  it('agrees with its own names: the vCPU count in the name is the published one', () => {
    // The decoder and the tables are independent readings of the same size,
    // so their agreement is a check on both. Constrained sizes are excluded:
    // their name carries the parent size's count. The remainder that disagree
    // are the older numbered series, which is what `published` is for.
    const checked = data.sizes.filter((size) => size.vcpus && decodeSizeName(size.name)?.constrainedVcpus === null);
    const agree = checked.filter((size) => decodeSizeName(size.name).vcpus === size.vcpus);
    expect(agree.length / checked.length).toBeGreaterThan(0.97);
    for (const size of checked) {
      expect(decodeSizeName(size.name, data, size).vcpus, size.name).toBe(size.vcpus);
    }
  });

  it('decodes D4s_v5 against the published letters', () => {
    const decoded = decodeSizeName('Standard_D4s_v5', data);
    expect(decoded.parts.every((entry) => entry.listed)).toBe(true);
    expect(findSize(data.sizes, 'D4s_v5')).toMatchObject({ vcpus: 4, memoryGiB: 16 });
  });
});
