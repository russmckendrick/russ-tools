#!/usr/bin/env node

/**
 * The Microsoft 365 licensing reference, normalised from Microsoft's published CSV.
 *
 * Microsoft ships one row per SKU x service-plan pair, so the product name and
 * GUID repeat on every line — 6,002 rows describing 620 SKUs and 796 service
 * plans. Normalising to two tables plus a membership array is what turns a
 * 1.1 MB CSV into ~430 KB of JSON that gzips to under 100 KB.
 *
 * The output is checked in. This script is deliberately NOT part of `pnpm
 * build`: the dataset is a dependency with a release cadence, not a build
 * artefact, and a network fetch in the build is a network fetch that can fail
 * at the worst moment.
 *
 *   pnpm refresh:m365-licenses
 *
 * Source: Microsoft Learn, "Product names and service plan identifiers for
 * licensing" (CC-BY-4.0). Records are sorted by a stable key before writing so
 * that re-running on unchanged upstream data produces no diff.
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '../src/data/microsoft/m365-licenses.json');

const SOURCE =
  'https://download.microsoft.com/download/e/3/e/e3e9faf2-f28b-490a-9ada-c6089a1fc5b0/Product%20names%20and%20service%20plan%20identifiers%20for%20licensing.csv';

const LICENCE = 'CC-BY-4.0, (c) Microsoft. See https://learn.microsoft.com/entra/identity/users/licensing-service-plan-reference';

/**
 * A CSV parser that handles the only complication this file actually has:
 * quoted fields containing commas, and "" as an escaped quote. Product display
 * names such as `Microsoft 365 E5 Developer (without Windows and Audio
 * Conferencing)` are unquoted, but several friendly-name columns are not.
 * @param {string} text
 * @returns {string[][]}
 */
function parseCsv(text) {
  /** @type {string[][]} */
  const rows = [];
  /** @type {string[]} */
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c !== ''));
}

/**
 * The previous run's counts, so a source that quietly changes shape is caught
 * here rather than in a reviewer's diff. Returns null on the first run.
 */
function previousCounts() {
  if (!existsSync(OUT)) return null;
  try {
    const prev = JSON.parse(readFileSync(OUT, 'utf8'));
    return { skus: prev.skus?.length ?? 0, servicePlans: prev.servicePlans?.length ?? 0 };
  } catch {
    return null;
  }
}

console.log(`Fetching ${SOURCE}`);
const res = await fetch(SOURCE);
if (!res.ok) {
  console.error(`Source returned ${res.status} ${res.statusText}`);
  process.exit(1);
}

// The file is served with a UTF-8 BOM, which would otherwise become part of the
// first header name and break the column lookup.
const csv = (await res.text()).replace(/^﻿/, '');
const rows = parseCsv(csv);
const header = rows.shift();

const REQUIRED = [
  'Product_Display_Name',
  'String_Id',
  'GUID',
  'Service_Plan_Name',
  'Service_Plan_Id',
  'Service_Plans_Included_Friendly_Names',
];

const missing = REQUIRED.filter((c) => !header.includes(c));
if (missing.length > 0) {
  console.error(`Source columns changed — missing: ${missing.join(', ')}`);
  console.error(`Got: ${header.join(', ')}`);
  process.exit(1);
}

const col = Object.fromEntries(REQUIRED.map((c) => [c, header.indexOf(c)]));

/** @type {Map<string, {guid: string, partNumber: string, name: string, plans: Set<string>}>} */
const skus = new Map();
/** @type {Map<string, {id: string, name: string, friendly: string}>} */
const servicePlans = new Map();

for (const row of rows) {
  const guid = row[col.GUID]?.trim();
  const planId = row[col.Service_Plan_Id]?.trim();
  if (!guid) continue;

  if (!skus.has(guid)) {
    skus.set(guid, {
      guid,
      partNumber: row[col.String_Id]?.trim() ?? '',
      name: row[col.Product_Display_Name]?.trim() ?? '',
      plans: new Set(),
    });
  }
  if (planId) {
    skus.get(guid).plans.add(planId);

    if (!servicePlans.has(planId)) {
      servicePlans.set(planId, {
        id: planId,
        name: row[col.Service_Plan_Name]?.trim() ?? '',
        friendly: row[col.Service_Plans_Included_Friendly_Names]?.trim() ?? '',
      });
    }
  }
}

// Sorted so an unchanged upstream produces a byte-identical file. Without this
// every refresh is an unreviewable diff.
const data = {
  source: SOURCE,
  licence: LICENCE,
  generatedAt: new Date().toISOString().slice(0, 10),
  skus: [...skus.values()]
    .sort((a, b) => a.guid.localeCompare(b.guid))
    .map((s) => ({
      guid: s.guid,
      partNumber: s.partNumber,
      name: s.name,
      plans: [...s.plans].sort(),
    })),
  servicePlans: [...servicePlans.values()].sort((a, b) => a.id.localeCompare(b.id)),
};

const before = previousCounts();
if (before && data.skus.length < before.skus * 0.8) {
  console.error(
    `Refusing to write: SKU count fell from ${before.skus} to ${data.skus.length}. ` +
      'That is a source change, not a licensing change — check the CSV by hand.'
  );
  process.exit(1);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(data, null, 0)}\n`);

const bytes = Buffer.byteLength(JSON.stringify(data));
console.log(
  `Wrote ${data.skus.length} SKUs and ${data.servicePlans.length} service plans ` +
    `(${(bytes / 1024).toFixed(0)} KB) to src/data/microsoft/m365-licenses.json`
);
if (before) {
  console.log(
    `Previous: ${before.skus} SKUs, ${before.servicePlans} service plans`
  );
}
