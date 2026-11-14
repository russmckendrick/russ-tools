#!/usr/bin/env node

/**
 * Azure regions and VM sizes, from what Microsoft publishes without a login.
 *
 *   pnpm refresh:azure-regions
 *
 * Two datasets, four sources, all Microsoft's own:
 *
 *  1. Regions: https://learn.microsoft.com/en-us/azure/reliability/regions-list
 *     requested with `Accept: text/markdown`. The article's repository
 *     (MicrosoftDocs/reliability-docs-pr) is private, but Learn serves any
 *     article as markdown on that header, and the page carries one table of
 *     every public-cloud region plus one per continent, which is where `area`
 *     comes from.
 *
 *  2. VM sizes: the series articles under
 *     https://github.com/MicrosoftDocs/azure-compute-docs/tree/main/articles/virtual-machines/sizes
 *     listed through the GitHub git-trees API (one unauthenticated request)
 *     and read from raw.githubusercontent.com. Each article tabulates its
 *     sizes; the tables are merged by size name.
 *
 *  3. Name parts: articles/virtual-machines/vm-naming-conventions.md in the
 *     same repository, for what each subfamily and feature letter means.
 *
 *  4. Families: articles/virtual-machines/sizes/overview.md, for the
 *     family-to-workload list.
 *
 * What is NOT here, because it cannot be had without credentials: which sizes
 * a given region offers, zone and capacity restrictions, and prices. Those
 * come from the Resource SKUs API (`Microsoft.Compute/skus`), which needs a
 * subscription. Sovereign-cloud regions (US Government, China) are on other
 * pages and are not read either. Nothing in the output is typed by hand.
 *
 * Content is CC-BY-4.0, (c) Microsoft. Output is sorted so an unchanged
 * upstream writes byte-identical files apart from the date.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cellNumber,
  cleanCell,
  fetchText,
  mapLimit,
  parseTables,
  stringifyRows,
  stripFrontMatter,
} from './lib/markdown-tables.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REGIONS_OUT = resolve(HERE, '../src/data/azure/regions.json');
const SIZES_OUT = resolve(HERE, '../src/data/azure/vm-sizes.json');

const REGIONS_URL = 'https://learn.microsoft.com/en-us/azure/reliability/regions-list';
const COMPUTE_REPO = 'MicrosoftDocs/azure-compute-docs';
const COMPUTE_TREE = `https://api.github.com/repos/${COMPUTE_REPO}/git/trees/main?recursive=1`;
const COMPUTE_RAW = `https://raw.githubusercontent.com/${COMPUTE_REPO}/main/articles/virtual-machines`;
const SIZES_HUMAN = 'https://learn.microsoft.com/azure/virtual-machines/sizes';
const NAMING_HUMAN = 'https://learn.microsoft.com/azure/virtual-machines/vm-naming-conventions';
const SIZES_ROOT = 'articles/virtual-machines/sizes/';

const today = new Date().toISOString().slice(0, 10);
const write = (path, data, rowKeys) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, stringifyRows(data, rowKeys));
};

/* ------------------------------------------------------------------ regions */

console.log(`Fetching ${REGIONS_URL} (as markdown)`);
const regionsMd = await fetchText(REGIONS_URL, { Accept: 'text/markdown' });

const REGION_HEADER = ['region', 'availability zones', 'paired region', 'physical location', 'geography', 'programmatic name'];

/** `# [Americas](#tab/americas)` opens a tab; the table under it belongs to it. */
function tabAt(markdown, line) {
  const before = markdown.split(/\r?\n/).slice(0, line);
  for (let i = before.length - 1; i >= 0; i -= 1) {
    const tab = /^#+\s*\[([^\]]+)\]\(#tab\//.exec(before[i]);
    if (tab) return tab[1].trim();
  }
  return '';
}

const regionTables = parseTables(regionsMd)
  .filter((table) => REGION_HEADER.every((name, i) => cleanCell(table.header[i]).toLowerCase() === name))
  .map((table) => ({ ...table, tab: tabAt(regionsMd, table.line) }));

const allTable = regionTables.find((table) => table.tab.toLowerCase() === 'all');
if (!allTable || allTable.rows.length < 40) {
  console.error('The regions article no longer carries an "All" table of the expected shape.');
  process.exit(1);
}

const areaByName = new Map();
for (const table of regionTables) {
  if (table === allTable) continue;
  for (const row of table.rows) areaByName.set(cleanCell(row[5]).toLowerCase(), table.tab);
}

const notApplicable = (text) => (/^(n\/a|none|-)?$/i.test(text) ? null : text);

const regions = allTable.rows
  .map((row) => {
    const name = cleanCell(row[5]).toLowerCase();
    return {
      name,
      displayName: cleanCell(row[0]),
      geography: cleanCell(row[4]),
      area: areaByName.get(name) ?? null,
      location: notApplicable(cleanCell(row[3])),
      zones: cellNumber(row[1]),
      zonesPreview: /icon-region-coming-soon/.test(row[1]),
      pairedDisplayName: notApplicable(cleanCell(row[2])),
      restricted: /icon-region-restricted/.test(row[0]),
      preview: /icon-region-coming-soon/.test(row[0]),
    };
  })
  .filter((region) => /^[a-z0-9]+$/.test(region.name))
  .sort((a, b) => a.name.localeCompare(b.name));

const nameByDisplay = new Map(regions.map((region) => [region.displayName.toLowerCase(), region.name]));
for (const region of regions) {
  region.paired = region.pairedDisplayName ? nameByDisplay.get(region.pairedDisplayName.toLowerCase()) ?? null : null;
}

if (regions.length !== allTable.rows.length) {
  console.error(`Parsed ${regions.length} regions from ${allTable.rows.length} rows; a programmatic name is malformed.`);
  process.exit(1);
}

write(REGIONS_OUT, {
  source: REGIONS_URL,
  licence: `CC-BY-4.0, (c) Microsoft. See ${REGIONS_URL}`,
  generatedAt: today,
  coverage: 'Azure public cloud regions. Sovereign clouds (US Government, China) are not included.',
  regions,
}, ['regions']);
console.log(`Wrote ${regions.length} regions to src/data/azure/regions.json`);

/* ----------------------------------------------------------------- vm sizes */

console.log(`Listing ${COMPUTE_TREE}`);
const tree = JSON.parse(await fetchText(COMPUTE_TREE, { Accept: 'application/vnd.github+json' }));
if (tree.truncated) {
  console.error('GitHub truncated the repository tree; the series list would be incomplete.');
  process.exit(1);
}

const articles = tree.tree
  .map((entry) => entry.path)
  .filter((path) => path.startsWith(SIZES_ROOT) && path.endsWith('.md'))
  .map((path) => path.slice(SIZES_ROOT.length).split('/'))
  .filter((parts) => parts.length === 2 && !['lifecycle', 'includes', 'retirement', 'media'].includes(parts[0]))
  .map(([category, file]) => ({ category, file }))
  .sort((a, b) => `${a.category}/${a.file}`.localeCompare(`${b.category}/${b.file}`));

console.log(`Reading ${articles.length} articles`);

const UNIT = { gib: 1, gb: 1, tib: 1024, tb: 1024 };

/** Which published column a header names, or null for the many we do not keep. */
function columnFor(header) {
  const text = header.toLowerCase();
  if (/bandwidth/.test(text) && /memory/.test(text)) return null;
  if (/^(v?cpus?|vcore|cores)\b/.test(text)) return { key: 'vcpus' };
  if (/^memory\b/.test(text)) return { key: 'memoryGiB' };
  if (/^(max )?temp storage disks/.test(text)) return { key: 'tempDisks' };
  if (/^(temp disk size|temp storage \(|size per temp disk|temp resource disk size)/.test(text) || /^temp storage \(ssd\)/.test(text)) {
    const unit = /\b(gib|gb|tib|tb)\b/.exec(text)?.[1] ?? 'gib';
    return { key: 'tempDiskGiB', scale: UNIT[unit] };
  }
  if (/^max (remote storage|data disks)/.test(text)) return { key: 'dataDisks' };
  if (/^max (v|front-end )?nics\s*\/.*bandwidth/.test(text)) return { key: 'nicsAndBandwidth' };
  if (/^max (v|front-end )?nics/.test(text)) return { key: 'nics' };
  if (/^(max |expected )?(network |front-end )?bandwidth/.test(text)) return { key: 'bandwidthMbps' };
  return null;
}

const FEATURES = [
  ['premiumStorage', /^premium storage$/i],
  ['premiumStorageCaching', /^premium storage caching$/i],
  ['acceleratedNetworking', /^accelerated networking$/i],
  ['ephemeralOsDisk', /^ephemeral os disks?$/i],
  ['nestedVirtualization', /^nested virtuali[sz]ation$/i],
];

/** Older articles list feature support as `- [Premium Storage](…): Supported` lines. */
function proseFeatures(markdown) {
  const found = {};
  for (const line of markdown.split(/\r?\n/)) {
    const match = /^\s*(?:[-*]\s+)?\[?([A-Za-z0-9 ]+?)\]?(?:\([^)]*\))?\s*:\s*([^<]+?)\s*(?:<br\s*\/?>)?\s*$/.exec(line);
    if (!match) continue;
    for (const [key, pattern] of FEATURES) {
      if (pattern.test(match[1].trim()) && !found[key]) found[key] = cleanCell(match[2]);
    }
  }
  return found;
}

const sizes = new Map();
const series = [];
const unparsed = [];
let duplicates = 0;

const texts = await mapLimit(articles, 12, ({ category, file }) => fetchText(`${COMPUTE_RAW}/sizes/${category}/${file}`));

articles.forEach(({ category, file }, index) => {
  const markdown = texts[index];
  const id = file.replace(/\.md$/, '');
  const tables = parseTables(markdown);
  const found = new Map();

  for (const table of tables) {
    if (!/^size( name)?$/i.test(cleanCell(table.header[0]))) continue;
    const columns = table.header.map((cell) => columnFor(cleanCell(cell)));

    for (const row of table.rows) {
      const name = cleanCell(row[0]).replace(/\s+/g, '');
      if (!/^(Standard|Basic)_[A-Za-z0-9_-]+$/.test(name)) continue;
      const size = found.get(name) ?? { name, series: id };

      columns.forEach((column, i) => {
        if (!column || i === 0) return;
        if (column.key === 'nicsAndBandwidth') {
          const [nics, bandwidth] = cleanCell(row[i]).split('/');
          if (size.nics == null) size.nics = cellNumber(nics);
          if (size.bandwidthMbps == null) size.bandwidthMbps = cellNumber(bandwidth ?? '');
          return;
        }
        const value = cellNumber(row[i]);
        if (value === null || size[column.key] != null) return;
        size[column.key] = column.scale ? value * column.scale : value;
      });

      found.set(name, size);
    }
  }

  if (found.size === 0) {
    if (/-series(-memory)?\.md$/.test(file)) unparsed.push(`${category}/${file}`);
    return;
  }

  const features = {};
  for (const table of tables) {
    if (!/^feature name$/i.test(cleanCell(table.header[0]))) continue;
    for (const row of table.rows) {
      const label = cleanCell(row[0]);
      for (const [key, pattern] of FEATURES) {
        if (pattern.test(label) && !features[key]) features[key] = cleanCell(row[1]);
      }
    }
  }
  Object.entries(proseFeatures(markdown)).forEach(([key, value]) => {
    if (!features[key]) features[key] = value;
  });

  const title = cleanCell(/^#\s+(.+)$/m.exec(stripFrontMatter(markdown))?.[1] ?? id);
  series.push({
    id,
    title,
    category,
    url: `${SIZES_HUMAN}/${category}/${id}`,
    features,
    count: found.size,
  });

  for (const size of found.values()) {
    if (sizes.has(size.name)) {
      duplicates += 1;
      const kept = sizes.get(size.name);
      for (const [key, value] of Object.entries(size)) {
        if (kept[key] == null) kept[key] = value;
      }
    } else {
      sizes.set(size.name, size);
    }
  }
});

if (sizes.size < 500) {
  console.error(`Only ${sizes.size} sizes parsed; the series articles have been restructured.`);
  process.exit(1);
}

/* ------------------------------------------------------------ naming + families */

const namingMd = await fetchText(`${COMPUTE_RAW}/vm-naming-conventions.md`);
const namingTable = parseTables(namingMd).find((table) => /^value$/i.test(cleanCell(table.header[0])));

/** `a = AMD-based processor <br>b = …` as `[['a', 'AMD-based processor'], …]`. */
function letterList(cell) {
  return (cell ?? '')
    .split(/<br\s*\/?>/i)
    .map((part) => /^\s*([A-Za-z])\s*=\s*(.+)$/.exec(cleanCell(part)))
    .filter(Boolean)
    .map((match) => [match[1], match[2].trim()]);
}

const namingRow = (label) => namingTable?.rows.find((row) => cleanCell(row[0]).replace(/^\*/, '').toLowerCase() === label)?.[1];
const features = letterList(namingRow('additive features')).map(([letter, meaning]) => ({ letter, meaning }));
const subfamilies = letterList(namingRow('subfamily')).map(([letter, meaning]) => ({ letter, meaning }));

if (features.length < 8) {
  console.error('The naming-conventions article no longer lists the additive feature letters.');
  process.exit(1);
}

const overviewMd = await fetchText(`${COMPUTE_RAW}/sizes/overview.md`);
const families = [];
for (const table of parseTables(overviewMd)) {
  if (!/^family$/i.test(cleanCell(table.header[0])) || !/^workloads$/i.test(cleanCell(table.header[1]))) continue;
  for (const row of table.rows) {
    const match = /^([A-Za-z]+)-family$/.exec(cleanCell(row[0]));
    if (!match) continue;
    families.push({
      family: match[1],
      workloads: (row[1] ?? '').split(/<br\s*\/?>/i).map(cleanCell).filter(Boolean),
    });
  }
}

// A name that turns up in a storage or network table but never in a table
// with vCPUs and memory is a typing mistake in that one row upstream
// (`Standard_128bds_3_v4` beside `Standard_M128bds_3_v4`), not a size.
const fragments = [...sizes.values()].filter((size) => size.vcpus == null && size.memoryGiB == null);
for (const fragment of fragments) sizes.delete(fragment.name);

const sortedSizes = [...sizes.values()].sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
const sortedSeries = series.sort((a, b) => a.id.localeCompare(b.id));

write(SIZES_OUT, {
  source: SIZES_HUMAN,
  licence: `CC-BY-4.0, (c) Microsoft. See ${SIZES_HUMAN}`,
  generatedAt: today,
  coverage:
    'Sizes tabulated in the published series articles. Regional availability, zone restrictions and prices need the authenticated Resource SKUs API and are not included.',
  sources: [
    `https://github.com/${COMPUTE_REPO}/tree/main/articles/virtual-machines/sizes`,
    NAMING_HUMAN,
    `${SIZES_HUMAN}/overview`,
  ],
  naming: { source: NAMING_HUMAN, features, subfamilies },
  families: families.sort((a, b) => a.family.localeCompare(b.family)),
  series: sortedSeries,
  sizes: sortedSizes,
}, ['families', 'series', 'sizes']);

console.log(
  `Wrote ${sortedSizes.length} sizes in ${sortedSeries.length} series to src/data/azure/vm-sizes.json ` +
    `(${duplicates} sizes listed by more than one article, merged)`
);
if (fragments.length) {
  console.log(
    `Dropped ${fragments.length} names with no vCPUs or memory published (mistyped rows upstream):\n  ` +
      fragments.map((fragment) => fragment.name).join('\n  ')
  );
}
if (unparsed.length) {
  console.log(`No size table found in ${unparsed.length} series articles:\n  ${unparsed.join('\n  ')}`);
}
