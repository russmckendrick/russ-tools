#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '../src/data/azure/service-tags-public.json');
const DETAILS = 'https://www.microsoft.com/en-us/download/details.aspx?id=56519';

const page = await fetch(DETAILS).then((response) => {
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${DETAILS}`);
  return response.text();
});
const match = page.match(/https:\/\/download\.microsoft\.com\/[^"']+\/ServiceTags_Public_\d+\.json/i);
if (!match) throw new Error('The Microsoft download page no longer exposes a ServiceTags_Public JSON URL.');

const source = match[0].replace(/&amp;/g, '&');
console.log(`Fetching ${source}`);
const raw = await fetch(source).then((response) => {
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${source}`);
  return response.json();
});

const tags = (raw.values ?? []).map((value) => ({
  name: value.name,
  id: value.id,
  changeNumber: value.properties?.changeNumber ?? 0,
  region: value.properties?.region ?? '',
  regionId: value.properties?.regionId ?? 0,
  platform: value.properties?.platform ?? '',
  systemService: value.properties?.systemService ?? '',
  prefixes: value.properties?.addressPrefixes ?? [],
  networkFeatures: value.properties?.networkFeatures ?? [],
})).sort((a, b) => a.name.localeCompare(b.name));

const data = {
  source: DETAILS,
  download: source,
  licence: 'Microsoft published reference data; see source terms.',
  generatedAt: new Date().toISOString().slice(0, 10),
  changeNumber: raw.changeNumber ?? 0,
  cloud: raw.cloud ?? 'Public',
  tags,
};

if (existsSync(OUT)) {
  const previous = JSON.parse(readFileSync(OUT, 'utf8'));
  if (tags.length < (previous.tags?.length ?? 0) * 0.8) throw new Error(`Refusing to write: tag count fell from ${previous.tags.length} to ${tags.length}.`);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(data)}\n`);
console.log(`Wrote ${tags.length} tags and ${tags.reduce((sum, tag) => sum + tag.prefixes.length, 0)} prefixes to ${OUT}`);
