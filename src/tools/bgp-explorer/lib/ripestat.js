import { apiJson, buildUrl } from '@/core';
import { parseIPv4, parseIPv4Cidr } from '../../subnet-calculator/lib/ipv4.js';
import { parseIPv6, parseIPv6Cidr } from '../../subnet-calculator/lib/ipv6.js';

const BASE = 'https://stat.ripe.net/data';

export function normalizeRoutingResource(value) {
  const input = String(value ?? '').trim();
  const asn = /^(?:AS)?(\d{1,10})$/i.exec(input);
  if (asn && Number(asn[1]) <= 4294967295) return { kind: 'asn', resource: `AS${Number(asn[1])}` };
  const v4 = parseIPv4Cidr(input);
  if (v4) return { kind: v4.prefix === null ? 'ip' : 'prefix', resource: input };
  const v6 = parseIPv6Cidr(input);
  if (v6) return { kind: v6.prefix === null ? 'ip' : 'prefix', resource: input.toLowerCase() };
  if (parseIPv4(input) !== null || parseIPv6(input) !== null) return { kind: 'ip', resource: input };
  return null;
}

async function endpoint(name, params, fetcher) {
  const url = buildUrl(`${BASE}/${name}/data.json`, { ...params, sourceapp: 'russ-tools' });
  const response = await fetcher(url);
  if (response.status !== 'ok') throw new Error(response.message || `${name} lookup failed`);
  return response.data;
}

function defaultFetcher(url) {
  return apiJson(url, { timeout: 10000, retries: 1 });
}

export function summarizeRoutingStatus(data) {
  return {
    firstSeen: data?.first_seen?.time ?? null,
    lastSeen: data?.last_seen?.time ?? null,
    visibility: data?.visibility ?? {},
    origins: data?.origins ?? [],
    lessSpecifics: data?.less_specifics ?? [],
    moreSpecifics: data?.more_specifics ?? [],
    announcedSpace: data?.announced_space ?? null,
    neighbours: data?.observed_neighbours ?? null,
  };
}

export async function lookupRouting(value, options = {}) {
  const normalized = normalizeRoutingResource(value);
  if (!normalized) throw new Error('Enter an IPv4 address, IPv6 address, CIDR prefix or ASN.');
  const fetcher = options.fetcher ?? defaultFetcher;

  if (normalized.kind === 'asn') {
    const [overview, routing, prefixes] = await Promise.all([
      endpoint('as-overview', { resource: normalized.resource }, fetcher),
      endpoint('routing-status', { resource: normalized.resource }, fetcher),
      endpoint('announced-prefixes', { resource: normalized.resource }, fetcher),
    ]);
    return {
      input: value,
      kind: 'asn',
      resource: normalized.resource,
      holder: overview.holder ?? '',
      block: overview.block ?? null,
      routing: summarizeRoutingStatus(routing),
      prefixes: prefixes.prefixes ?? [],
      raw: { overview, routing, prefixes },
    };
  }

  let resource = normalized.resource;
  let network = null;
  if (normalized.kind === 'ip') {
    network = await endpoint('network-info', { resource }, fetcher);
    resource = network.prefix || resource;
  }

  const [overview, routing] = await Promise.all([
    endpoint('prefix-overview', { resource }, fetcher),
    endpoint('routing-status', { resource }, fetcher),
  ]);
  const origins = [...new Set([
    ...(overview.asns ?? []).map((origin) => origin?.asn ?? origin),
    ...(routing.origins ?? []).map((origin) => origin?.origin ?? origin?.asn ?? origin),
  ].filter((origin) => Number.isInteger(Number(origin))).map(Number))];
  const rpki = (await Promise.all(origins.map(async (origin) => {
    const validation = await endpoint('rpki-validation', {
      resource: `AS${origin}`,
      prefix: overview.resource ?? resource,
    }, fetcher).catch(() => null);
    return validation ? { origin, ...validation } : null;
  }))).filter(Boolean);

  return {
    input: value,
    kind: normalized.kind,
    resource: overview.resource ?? resource,
    announced: overview.announced ?? false,
    holder: overview.holder ?? overview.asns?.[0]?.holder ?? '',
    origins: overview.asns?.length ? overview.asns : origins,
    rpki,
    routing: summarizeRoutingStatus(routing),
    raw: { network, overview, routing, rpki },
  };
}
