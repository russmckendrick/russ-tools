#!/usr/bin/env node

/**
 * The Azure built-in role definitions, scraped from Microsoft's own docs.
 *
 * There is no public, unauthenticated API for this: listing role definitions
 * through ARM needs a token and a subscription. What Microsoft does publish is
 * the reference article, which carries a complete fenced `json` block per role
 * — the real ARM definition, not a prose summary. So that is the source.
 *
 * The category list is read out of `built-in-roles.md`'s own links rather than
 * hardcoded. Microsoft split this article into per-category files and has
 * added categories since; a hardcoded list silently missed `hybrid-multicloud`
 * and `migration` when this script was first written, which is exactly the
 * failure mode that makes a "complete" reference quietly incomplete.
 *
 *   pnpm refresh:azure-rbac
 *
 * Source: MicrosoftDocs/azure-docs (CC-BY-4.0). Roles are sorted by id before
 * writing so an unchanged upstream produces a byte-identical file.
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '../src/data/azure/rbac-built-in-roles.json');

const RAW = 'https://raw.githubusercontent.com/MicrosoftDocs/azure-docs/main/articles/role-based-access-control';
const INDEX = `${RAW}/built-in-roles.md`;
const HUMAN = 'https://learn.microsoft.com/azure/role-based-access-control/built-in-roles';

const LICENCE = `CC-BY-4.0, (c) Microsoft. See ${HUMAN}`;

/** @param {string} url */
async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

console.log(`Fetching ${INDEX}`);
const index = await fetchText(INDEX);

// './built-in-roles/compute.md#virtual-machine-contributor' -> 'compute'
const categories = [...new Set([...index.matchAll(/\.\/built-in-roles\/([a-z0-9-]+)\.md/g)].map((m) => m[1]))].sort();

if (categories.length === 0) {
  console.error('Found no category links in built-in-roles.md — the article has been restructured.');
  process.exit(1);
}
console.log(`${categories.length} categories: ${categories.join(', ')}`);

/** @type {Map<string, object>} */
const roles = new Map();
let blocks = 0;
let skipped = 0;

for (const category of categories) {
  const md = await fetchText(`${RAW}/built-in-roles/${category}.md`);

  for (const match of md.matchAll(/```json\n([\s\S]*?)\n```/g)) {
    blocks += 1;
    let def;
    try {
      def = JSON.parse(match[1]);
    } catch {
      skipped += 1;
      continue;
    }

    // Custom-role examples appear in some articles; only built-ins belong here.
    if (def.roleType !== 'BuiltInRole' || !def.name || !def.roleName) {
      skipped += 1;
      continue;
    }

    // One permission block is the norm; a few roles carry several, so flatten
    // rather than taking [0] and silently losing half a role's grants.
    const permissions = Array.isArray(def.permissions) ? def.permissions : [];
    const bucket = (key) => [...new Set(permissions.flatMap((p) => p[key] ?? []))].sort();

    roles.set(def.name, {
      id: def.name,
      name: def.roleName,
      description: def.description ?? '',
      category,
      actions: bucket('actions'),
      notActions: bucket('notActions'),
      dataActions: bucket('dataActions'),
      notDataActions: bucket('notDataActions'),
    });
  }
}

const sorted = [...roles.values()].sort((a, b) => a.id.localeCompare(b.id));

console.log(`Parsed ${blocks} json blocks -> ${sorted.length} built-in roles (${skipped} skipped)`);

// How many concrete operations each role grants, precomputed so the browser
// never has to. Doing it live costs ~2.3s of blocked main thread for a broad
// query. The matcher is imported from the tool's own lib rather than
// reimplemented here: a second copy of the wildcard and notActions semantics
// would be free to drift, and the number it produced would be wrong in a way
// nothing would catch.
const { grants, actionCatalogue } = await import('../src/tools/azure-rbac/lib/rbac.js');

const catalogue = actionCatalogue(sorted);
console.log(`Scoring breadth against ${catalogue.length} concrete operations...`);

for (const role of sorted) {
  let count = 0;
  for (const action of catalogue) {
    if (grants(role, action).matched) count += 1;
  }
  role.breadth = count;
}

const widest = [...sorted].sort((a, b) => b.breadth - a.breadth)[0];
const narrowest = [...sorted].filter((r) => r.breadth > 0).sort((a, b) => a.breadth - b.breadth)[0];
console.log(`  widest: ${widest.name} (${widest.breadth}), narrowest: ${narrowest.name} (${narrowest.breadth})`);

const data = {
  source: HUMAN,
  licence: LICENCE,
  generatedAt: new Date().toISOString().slice(0, 10),
  catalogueSize: catalogue.length,
  roles: sorted,
};

if (existsSync(OUT)) {
  try {
    const prev = JSON.parse(readFileSync(OUT, 'utf8'));
    const before = prev.roles?.length ?? 0;
    if (data.roles.length < before * 0.8) {
      console.error(
        `Refusing to write: role count fell from ${before} to ${data.roles.length}. ` +
          'That is a docs restructure, not Azure removing roles — check the article by hand.'
      );
      process.exit(1);
    }
    console.log(`Previous: ${before} roles`);
  } catch {
    /* an unreadable previous file is not a reason to refuse a good new one */
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(data, null, 0)}\n`);

const bytes = Buffer.byteLength(JSON.stringify(data));
const actions = new Set(data.roles.flatMap((r) => [...r.actions, ...r.dataActions]));
console.log(
  `Wrote ${data.roles.length} roles, ${actions.size} distinct actions ` +
    `(${(bytes / 1024).toFixed(0)} KB) to src/data/azure/rbac-built-in-roles.json`
);
