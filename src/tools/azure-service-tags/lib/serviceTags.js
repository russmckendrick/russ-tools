import { parseIPv4, parseIPv4Cidr } from '../../subnet-calculator/lib/ipv4.js';
import { maskFromPrefix6, parseIPv6, parseIPv6Cidr } from '../../subnet-calculator/lib/ipv6.js';

let loaded;

export async function loadServiceTags() {
  if (!loaded) loaded = import('../../../data/azure/service-tags-public.json').then((module) => module.default);
  return loaded;
}

function contains(prefix, input) {
  const v4Prefix = parseIPv4Cidr(prefix);
  const v4 = parseIPv4(input);
  if (v4Prefix && v4 !== null) {
    const base = parseIPv4(v4Prefix.address);
    const bits = v4Prefix.prefix ?? 32;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return ((v4 & mask) >>> 0) === ((base & mask) >>> 0);
  }

  const v6Prefix = parseIPv6Cidr(prefix);
  const v6 = parseIPv6(input);
  if (v6Prefix && v6 !== null) {
    const mask = maskFromPrefix6(v6Prefix.prefix ?? 128);
    return (v6 & mask) === (parseIPv6(v6Prefix.address) & mask);
  }
  return false;
}

export function isIpAddress(value) {
  return parseIPv4(value) !== null || parseIPv6(value) !== null;
}

export function searchServiceTags(data, query, limit = 100) {
  const value = String(query ?? '').trim();
  if (!value) return [];
  if (isIpAddress(value)) {
    return data.tags.filter((tag) => tag.prefixes.some((prefix) => contains(prefix, value))).slice(0, limit);
  }
  const needle = value.toLowerCase();
  return data.tags
    .filter((tag) => `${tag.name} ${tag.region} ${tag.systemService}`.toLowerCase().includes(needle))
    .sort((a, b) => (a.name.toLowerCase().startsWith(needle) ? -1 : 1) - (b.name.toLowerCase().startsWith(needle) ? -1 : 1) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function normalizeImported(data) {
  if (Array.isArray(data?.tags)) return data;
  return {
    changeNumber: data?.changeNumber ?? 0,
    tags: (data?.values ?? []).map((value) => ({
      name: value.name,
      changeNumber: value.properties?.changeNumber ?? 0,
      prefixes: value.properties?.addressPrefixes ?? [],
    })),
  };
}

export function diffServiceTags(currentInput, previousInput) {
  const current = normalizeImported(currentInput);
  const previous = normalizeImported(previousInput);
  const before = new Map(previous.tags.map((tag) => [tag.name, new Set(tag.prefixes)]));
  const after = new Map(current.tags.map((tag) => [tag.name, new Set(tag.prefixes)]));
  const names = [...new Set([...before.keys(), ...after.keys()])].sort();
  const changes = [];
  for (const name of names) {
    const oldSet = before.get(name) ?? new Set();
    const newSet = after.get(name) ?? new Set();
    const added = [...newSet].filter((prefix) => !oldSet.has(prefix));
    const removed = [...oldSet].filter((prefix) => !newSet.has(prefix));
    if (added.length || removed.length) changes.push({ name, added, removed });
  }
  return { before: previous.changeNumber, after: current.changeNumber, changes };
}
