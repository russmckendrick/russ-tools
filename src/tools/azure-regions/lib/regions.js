/**
 * Search over the Azure public-cloud region list.
 *
 * Pure functions over the dataset `scripts/refresh-azure-regions.mjs` writes,
 * so everything is testable against a fixture. `loadRegions()` is the one
 * impure entry point.
 *
 * @typedef {{ name: string, displayName: string, geography: string,
 *             area: string | null, location: string | null,
 *             zones: number | null, zonesPreview: boolean,
 *             pairedDisplayName: string | null, paired: string | null,
 *             restricted: boolean, preview: boolean }} Region
 * @typedef {{ source: string, generatedAt: string, coverage: string, regions: Region[] }} RegionData
 */

/** @type {Promise<RegionData> | null} */
let pending = null;

/** @returns {Promise<RegionData>} */
export function loadRegions() {
  if (!pending) {
    pending = import('../../../data/azure/regions.json').then((m) => m.default ?? m);
  }
  return pending;
}

/** `UK South`, `uksouth` and `uk-south` are one region to whoever typed it. */
export const fold = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * The region a value names exactly, by programmatic or display name.
 *
 * @param {Region[]} regions
 * @param {string} value
 * @returns {Region | null}
 */
export function findRegion(regions, value) {
  const key = fold(value);
  if (!key) return null;
  return regions.find((region) => region.name === key || fold(region.displayName) === key) ?? null;
}

/** @param {Region[]} regions @param {'area' | 'geography'} field */
export function distinct(regions, field) {
  return [...new Set(regions.map((region) => region[field]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

/**
 * Regions matching every word of the query, within the chosen filters.
 *
 * A word matches the names, the geography, the area or the physical location,
 * so `london`, `uk` and `europe` all find UK South. Exact name matches sort
 * first; the rest keep the dataset's alphabetical order.
 *
 * @param {Region[]} regions
 * @param {{ query?: string, area?: string, geography?: string, zonesOnly?: boolean }} [filters]
 * @returns {Region[]}
 */
export function searchRegions(regions, { query = '', area = '', geography = '', zonesOnly = false } = {}) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const exact = fold(query);

  const matches = regions.filter((region) => {
    if (area && region.area !== area) return false;
    if (geography && region.geography !== geography) return false;
    if (zonesOnly && !region.zones) return false;
    if (words.length === 0) return true;
    const haystack = [region.name, region.displayName, region.geography, region.area, region.location]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return words.every((word) => haystack.includes(word)) || fold(region.displayName).includes(exact);
  });

  if (!exact) return matches;
  const rank = (region) => (region.name === exact || fold(region.displayName) === exact ? 0 : 1);
  return matches.sort((a, b) => rank(a) - rank(b));
}

/**
 * A region's pair, as far as the list can say.
 *
 * Three outcomes, and the third is why this is not a one-line lookup: some
 * pairs are named in the article but are not rows in it (Sweden South is
 * Sweden Central's pair and is not a region customers can list), so the name
 * is known and the record is not.
 *
 * @param {Region[]} regions
 * @param {Region} region
 * @returns {{ kind: 'none' } | { kind: 'listed', region: Region } | { kind: 'unlisted', displayName: string }}
 */
export function pairOf(regions, region) {
  if (!region.pairedDisplayName) return { kind: 'none' };
  const paired = region.paired ? regions.find((candidate) => candidate.name === region.paired) : null;
  return paired ? { kind: 'listed', region: paired } : { kind: 'unlisted', displayName: region.pairedDisplayName };
}

/** How the list states zone support, in words. @param {Region} region */
export function zoneLabel(region) {
  if (!region.zones) return 'No availability zones';
  return `${region.zones} zones${region.zonesPreview ? ' (some in preview)' : ''}`;
}
