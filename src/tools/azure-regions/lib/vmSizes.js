/**
 * Search over the published Azure VM sizes, and the size-name decoder.
 *
 * The dataset is what the series articles tabulate (see
 * `scripts/refresh-azure-regions.mjs`). A field that an article does not
 * publish is absent rather than zero, and every function here keeps that
 * distinction: a missing vCPU count never passes a minimum filter.
 *
 * @typedef {{ name: string, series: string, vcpus?: number, memoryGiB?: number,
 *             tempDisks?: number, tempDiskGiB?: number, dataDisks?: number,
 *             nics?: number, bandwidthMbps?: number }} VmSize
 * @typedef {{ id: string, title: string, category: string, url: string,
 *             features: Record<string, string>, count: number }} VmSeries
 * @typedef {{ letter: string, meaning: string }} Letter
 * @typedef {{ generatedAt: string, coverage: string, sizes: VmSize[], series: VmSeries[],
 *             families: Array<{ family: string, workloads: string[] }>,
 *             naming: { source: string, features: Letter[], subfamilies: Letter[] } }} VmData
 */

/** @type {Promise<VmData> | null} */
let pending = null;

/** @returns {Promise<VmData>} */
export function loadVmSizes() {
  if (!pending) {
    pending = import('../../../data/azure/vm-sizes.json').then((m) => m.default ?? m);
  }
  return pending;
}

const HEAD = /^([A-Z]+)(\d+)(?:-(\d+))?([a-z]*)$/;
const TIER = /^(standard|basic)_/i;

/**
 * Does this read as a VM size rather than a region or a word?
 *
 * Used to route a deep link and the search box: `Standard_D4s_v5` and
 * `D4s_v5` are sizes, `uksouth` is not. A bare `D4` is accepted only with a
 * tier or a version beside it, because two characters are not evidence.
 *
 * @param {string} value
 */
export function looksLikeVmSize(value) {
  const text = String(value ?? '').trim();
  if (!text || /\s/.test(text)) return false;
  if (TIER.test(text)) return true;
  const [head, ...rest] = text.split('_');
  return HEAD.test(head) && rest.some((part) => /^v\d+$/i.test(part));
}

/** The upper-case run a size name opens with: `D`, `DC`, `NC`, `HB`. @param {string} name */
export function familyOf(name) {
  return /^([A-Z]+)/.exec(String(name ?? '').replace(TIER, ''))?.[1] ?? '';
}

/**
 * A size name taken apart, following Microsoft's naming convention:
 * family, subfamily, vCPUs, constrained vCPUs, additive features, accelerator
 * type, memory capacity, version.
 *
 * The meanings come from the dataset, which takes them from the published
 * convention. A letter that article does not list is reported as unlisted
 * instead of being guessed at, and so is any segment the convention has no
 * slot for (`cc`, `Promo`).
 *
 * Series older than the convention (Dv2, DSv2, Av2) number their sizes rather
 * than counting vCPUs: `Standard_D3_v2` has four. Pass the published record
 * as `published` and a number that disagrees with it is reported as a size
 * number, with the published count beside it, instead of as a wrong fact.
 *
 * @param {string} input
 * @param {Pick<VmData, 'naming' | 'families'>} [reference]
 * @param {VmSize | null} [published]
 * @returns {null | { name: string, tier: string | null, family: string, subfamily: string,
 *   vcpus: number, numberIsVcpus: boolean, constrainedVcpus: number | null, features: string[], accelerator: string | null,
 *   memoryCapacity: number | null, version: string | null, other: string[],
 *   parts: Array<{ part: string, value: string, meaning: string | null, listed: boolean }> }}
 */
export function decodeSizeName(input, reference, published = null) {
  const text = String(input ?? '').trim();
  const tierMatch = TIER.exec(text);
  const tier = tierMatch ? tierMatch[1][0].toUpperCase() + tierMatch[1].slice(1).toLowerCase() : null;
  const [head, ...rest] = text.replace(TIER, '').split('_');
  const match = HEAD.exec(head ?? '');
  if (!match) return null;

  const [, letters, vcpus, constrained, featureLetters] = match;
  const family = letters[0];
  const subfamily = letters.slice(1);

  let version = null;
  let accelerator = null;
  let memoryCapacity = null;
  const other = [];
  for (const segment of rest) {
    if (/^v\d+$/i.test(segment) && version === null) version = segment.toLowerCase();
    else if (/^\d+$/.test(segment) && memoryCapacity === null) memoryCapacity = Number(segment);
    else if (/^[A-Z][A-Z0-9]*\d[A-Z0-9]*$/.test(segment) && accelerator === null) accelerator = segment;
    else other.push(segment);
  }

  const naming = reference?.naming ?? { features: [], subfamilies: [] };
  const families = reference?.families ?? [];
  const meaningsOf = (list, letter) => list.filter((entry) => entry.letter === letter).map((entry) => entry.meaning);

  const parts = [];
  if (tier) parts.push({ part: 'Tier', value: tier, meaning: null, listed: true });

  const familyEntry = families.find((entry) => entry.family === letters) ?? families.find((entry) => entry.family === family);
  parts.push({
    part: 'Family',
    value: family,
    meaning: familyEntry ? `${familyEntry.family}-family: ${familyEntry.workloads.join(', ')}` : null,
    listed: Boolean(familyEntry),
  });

  for (const letter of subfamily) {
    const meanings = meaningsOf(naming.subfamilies, letter);
    parts.push({
      part: 'Subfamily',
      value: letter,
      meaning: meanings.length ? meanings.join('; or ') : null,
      listed: meanings.length > 0,
    });
  }

  const publishedVcpus = published?.vcpus ?? null;
  const numberIsVcpus = constrained ? true : publishedVcpus === null || publishedVcpus === Number(vcpus);
  if (numberIsVcpus) {
    parts.push({ part: 'vCPUs', value: vcpus, meaning: null, listed: true });
  } else {
    parts.push({
      part: 'Size number',
      value: vcpus,
      meaning: `This series numbers its sizes instead of counting vCPUs. Published with ${publishedVcpus} vCPUs`,
      listed: true,
    });
  }
  if (constrained) {
    parts.push({
      part: 'Constrained vCPUs',
      value: constrained,
      meaning: `${constrained} vCPUs active, on the memory and storage of the ${vcpus}-vCPU size`,
      listed: true,
    });
  }

  for (const letter of featureLetters) {
    const meanings = meaningsOf(naming.features, letter);
    parts.push({
      part: 'Feature',
      value: letter,
      meaning: meanings.length ? meanings.join('; or ') : null,
      listed: meanings.length > 0,
    });
  }

  if (accelerator) parts.push({ part: 'Accelerator', value: accelerator, meaning: null, listed: true });
  if (memoryCapacity !== null) {
    parts.push({
      part: 'Memory capacity',
      value: String(memoryCapacity),
      meaning: 'M-series memory capacity, rounded to the nearest TiB',
      listed: true,
    });
  }
  for (const segment of other) parts.push({ part: 'Other', value: segment, meaning: null, listed: false });
  if (version) parts.push({ part: 'Version', value: version, meaning: null, listed: true });

  return {
    name: text,
    tier,
    family,
    subfamily,
    vcpus: numberIsVcpus ? Number(vcpus) : publishedVcpus,
    numberIsVcpus,
    constrainedVcpus: constrained ? Number(constrained) : null,
    features: [...featureLetters],
    accelerator,
    memoryCapacity,
    version,
    other,
    parts,
  };
}

/** Family prefixes present in the data, with how many sizes each has. @param {VmSize[]} sizes */
export function sizeFamilies(sizes) {
  const counts = new Map();
  for (const size of sizes) {
    const family = familyOf(size.name);
    if (family) counts.set(family, (counts.get(family) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([family, count]) => ({ family, count }))
    .sort((a, b) => a.family.localeCompare(b.family));
}

const collator = new Intl.Collator('en', { numeric: true });

/**
 * Sizes matching the query and filters, smallest first within a family.
 *
 * The query is matched against the size name and the series title with the
 * tier prefix optional, so `d4s_v5`, `Standard_D4s_v5` and `dsv5` all work.
 *
 * @param {Pick<VmData, 'sizes' | 'series'>} data
 * @param {{ query?: string, family?: string, minVcpus?: number, minMemoryGiB?: number }} [filters]
 * @returns {VmSize[]}
 */
export function searchSizes(data, { query = '', family = '', minVcpus = 0, minMemoryGiB = 0 } = {}) {
  const words = query.toLowerCase().replace(TIER, '').split(/\s+/).filter(Boolean);
  const titles = new Map(data.series.map((series) => [series.id, series.title.toLowerCase()]));

  return data.sizes
    .filter((size) => {
      if (family && familyOf(size.name) !== family) return false;
      if (minVcpus > 0 && !(size.vcpus >= minVcpus)) return false;
      if (minMemoryGiB > 0 && !(size.memoryGiB >= minMemoryGiB)) return false;
      if (words.length === 0) return true;
      const haystack = `${size.name.toLowerCase()} ${size.series} ${titles.get(size.series) ?? ''}`;
      return words.every((word) => haystack.includes(word));
    })
    .sort(
      (a, b) =>
        collator.compare(familyOf(a.name), familyOf(b.name)) ||
        (a.vcpus ?? Infinity) - (b.vcpus ?? Infinity) ||
        (a.memoryGiB ?? Infinity) - (b.memoryGiB ?? Infinity) ||
        collator.compare(a.name, b.name)
    );
}

/**
 * One size by name, tier prefix optional, case ignored.
 *
 * @param {VmSize[]} sizes
 * @param {string} name
 */
export function findSize(sizes, name) {
  const key = String(name ?? '').trim().toLowerCase();
  if (!key) return null;
  const withTier = TIER.test(key) ? key : `standard_${key}`;
  return sizes.find((size) => size.name.toLowerCase() === withTier) ?? null;
}

/** @param {VmSeries[]} series @param {VmSize} size */
export function seriesOf(series, size) {
  return series.find((entry) => entry.id === size.series) ?? null;
}

/** Local temporary storage as one phrase, or null when the series has none published. @param {VmSize} size */
export function tempStorageLabel(size) {
  if (size.tempDiskGiB == null) return null;
  const each = `${size.tempDiskGiB.toLocaleString('en')} GiB`;
  return size.tempDisks > 1 ? `${size.tempDisks} × ${each}` : each;
}
