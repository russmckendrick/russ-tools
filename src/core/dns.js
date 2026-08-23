import { apiFetch, buildUrl } from './api.js';
import apiConfig from '../utils/api/apiConfig.json';

export const DNS_TYPES = Object.freeze({
  A: 1,
  NS: 2,
  CNAME: 5,
  SOA: 6,
  PTR: 12,
  MX: 15,
  TXT: 16,
  AAAA: 28,
  SRV: 33,
  DS: 43,
  SSHFP: 44,
  RRSIG: 46,
  NSEC: 47,
  DNSKEY: 48,
  TLSA: 52,
  SVCB: 64,
  HTTPS: 65,
  CAA: 257,
});

export const DNS_TYPE_NAMES = Object.freeze(
  Object.fromEntries(Object.entries(DNS_TYPES).map(([name, value]) => [value, name]))
);

export const DNS_PROVIDERS = Object.freeze({
  google: {
    id: 'google',
    label: 'Google Public DNS',
    url: apiConfig.endpoints.dns.google,
  },
  cloudflare: {
    id: 'cloudflare',
    label: 'Cloudflare 1.1.1.1',
    url: apiConfig.endpoints.dns.cloudflare,
  },
});

const RCODES = Object.freeze({
  0: 'NOERROR',
  1: 'FORMERR',
  2: 'SERVFAIL',
  3: 'NXDOMAIN',
  4: 'NOTIMP',
  5: 'REFUSED',
  6: 'YXDOMAIN',
  7: 'YXRRSET',
  8: 'NXRRSET',
  9: 'NOTAUTH',
  10: 'NOTZONE',
  16: 'BADVERS',
  23: 'BADCOOKIE',
});

export function dnsTypeName(type) {
  if (typeof type === 'string' && /^\d+$/.test(type)) return DNS_TYPE_NAMES[Number(type)] ?? `TYPE${type}`;
  if (typeof type === 'string') return type.toUpperCase();
  return DNS_TYPE_NAMES[type] ?? `TYPE${type}`;
}

export function dnsRcodeName(code) {
  return RCODES[Number(code)] ?? `RCODE${code}`;
}

export function normalizeDnsName(value) {
  const input = String(value ?? '').trim().replace(/^\.+|\.+$/g, '');
  if (!input || input.length > 253 || /\s|[/?#:@]/.test(input)) return null;

  const labels = input.split('.');
  if (labels.some((label) => !label || label.length > 63)) return null;

  try {
    const ascii = new URL(`https://${input}`).hostname;
    return ascii && ascii.length <= 253 ? ascii.toLowerCase() : null;
  } catch {
    return /^[a-z0-9_*.-]+$/i.test(input) ? input.toLowerCase() : null;
  }
}

function tokens(value) {
  const out = [];
  let current = '';
  let quoted = false;
  let escaped = false;

  for (const char of String(value ?? '').trim()) {
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === '\\') {
      current += char;
      escaped = true;
    } else if (char === '"') {
      current += char;
      quoted = !quoted;
    } else if (/\s/.test(char) && !quoted) {
      if (current) out.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  if (current) out.push(current);
  return out;
}

function unescapeDnsText(value) {
  return value
    .replace(/^"|"$/g, '')
    .replace(/\\(\d{3})/g, (_, digits) => String.fromCharCode(Number(digits)))
    .replace(/\\(["\\])/g, '$1');
}

export function decodeDnsText(value) {
  const parts = String(value ?? '').match(/"(?:\\.|[^"\\])*"/g);
  if (!parts) return unescapeDnsText(String(value ?? ''));
  return parts.map(unescapeDnsText).join('');
}

export function parseDnsRecord(record) {
  const type = dnsTypeName(record?.type);
  const data = String(record?.data ?? '').trim();
  const fields = tokens(data);
  const base = { ...record, typeName: type, data };

  switch (type) {
    case 'MX':
      return { ...base, preference: Number(fields[0]), exchange: fields[1] ?? '' };
    case 'SOA':
      return {
        ...base,
        primary: fields[0] ?? '',
        responsible: fields[1] ?? '',
        serial: Number(fields[2]),
        refresh: Number(fields[3]),
        retry: Number(fields[4]),
        expire: Number(fields[5]),
        minimum: Number(fields[6]),
      };
    case 'SRV':
      return {
        ...base,
        priority: Number(fields[0]),
        weight: Number(fields[1]),
        port: Number(fields[2]),
        target: fields[3] ?? '',
      };
    case 'CAA':
      return {
        ...base,
        flags: Number(fields[0]),
        tag: unescapeDnsText(fields[1] ?? ''),
        value: unescapeDnsText(fields.slice(2).join(' ')),
      };
    case 'DS':
      return {
        ...base,
        keyTag: Number(fields[0]),
        algorithm: Number(fields[1]),
        digestType: Number(fields[2]),
        digest: (fields[3] ?? '').toUpperCase(),
      };
    case 'DNSKEY':
      return {
        ...base,
        flags: Number(fields[0]),
        protocol: Number(fields[1]),
        algorithm: Number(fields[2]),
        publicKey: fields.slice(3).join(''),
      };
    case 'RRSIG':
      return {
        ...base,
        coveredType: fields[0] ?? '',
        algorithm: Number(fields[1]),
        labels: Number(fields[2]),
        originalTtl: Number(fields[3]),
        expiration: fields[4] ?? '',
        inception: fields[5] ?? '',
        keyTag: Number(fields[6]),
        signer: fields[7] ?? '',
      };
    case 'TLSA':
      return {
        ...base,
        usage: Number(fields[0]),
        selector: Number(fields[1]),
        matchingType: Number(fields[2]),
        certificateData: fields.slice(3).join(''),
      };
    case 'SSHFP':
      return {
        ...base,
        algorithm: Number(fields[0]),
        fingerprintType: Number(fields[1]),
        fingerprint: fields.slice(2).join(''),
      };
    case 'SVCB':
    case 'HTTPS':
      return {
        ...base,
        priority: Number(fields[0]),
        target: fields[1] ?? '',
        parameters: fields.slice(2),
      };
    case 'TXT':
      return { ...base, text: decodeDnsText(data) };
    default:
      return base;
  }
}

export function formatDnsRecord(record) {
  const parsed = parseDnsRecord(record);
  const ttl = Number.isFinite(parsed.TTL) ? ` · ${parsed.TTL}s` : '';

  switch (parsed.typeName) {
    case 'MX':
      return `${parsed.preference} ${parsed.exchange}${ttl}`;
    case 'SOA':
      return `${parsed.primary} ${parsed.responsible} · serial ${parsed.serial}${ttl}`;
    case 'SRV':
      return `${parsed.priority} ${parsed.weight} ${parsed.port} ${parsed.target}${ttl}`;
    case 'TXT':
      return `${parsed.text}${ttl}`;
    default:
      return `${parsed.data}${ttl}`;
  }
}

export function dnsRecords(response, type) {
  const wanted = type === undefined ? null : DNS_TYPES[dnsTypeName(type)] ?? Number(type);
  return (response?.Answer ?? [])
    .filter((record) => wanted === null || record.type === wanted)
    .map(parseDnsRecord);
}

function canonicalDnsRdata(record) {
  const type = dnsTypeName(record.type);
  const fields = tokens(record.data);
  const lower = (index) => {
    if (fields[index]) fields[index] = fields[index].toLowerCase();
  };

  if (['CNAME', 'NS', 'PTR'].includes(type)) lower(0);
  if (type === 'MX') lower(1);
  if (type === 'SOA') { lower(0); lower(1); }
  if (type === 'SRV') lower(3);
  if (['SVCB', 'HTTPS'].includes(type)) lower(1);
  if (type === 'RRSIG') { if (fields[0]) fields[0] = fields[0].toUpperCase(); lower(7); }
  if (type === 'NSEC') {
    lower(0);
    for (let index = 1; index < fields.length; index++) fields[index] = fields[index].toUpperCase();
  }
  if (type === 'CAA' && fields[1]) fields[1] = fields[1].toLowerCase();
  if (['DS', 'SSHFP', 'TLSA'].includes(type) && fields.length) {
    fields[fields.length - 1] = fields.at(-1).toUpperCase();
  }
  return fields.join(' ');
}

export function canonicalDnsAnswers(response) {
  return (response?.Answer ?? [])
    .map((record) => `${String(record.name ?? '').toLowerCase()} ${dnsTypeName(record.type)} ${canonicalDnsRdata(record)}`.trim())
    .sort();
}

export function compareDnsResponses(left, right) {
  const a = canonicalDnsAnswers(left);
  const b = canonicalDnsAnswers(right);
  const aSet = new Set(a);
  const bSet = new Set(b);
  const leftStatus = Number(left?.Status ?? 0);
  const rightStatus = Number(right?.Status ?? 0);
  return {
    equal: leftStatus === rightStatus && a.length === b.length && a.every((value, index) => value === b[index]),
    rcodeEqual: leftStatus === rightStatus,
    leftRcode: dnsRcodeName(leftStatus),
    rightRcode: dnsRcodeName(rightStatus),
    onlyLeft: a.filter((value) => !bSet.has(value)),
    onlyRight: b.filter((value) => !aSet.has(value)),
  };
}

export async function queryDns(name, type = 'A', options = {}) {
  const normalized = normalizeDnsName(name);
  if (!normalized) throw new Error('Enter a valid DNS name.');

  const provider = DNS_PROVIDERS[options.provider] ?? DNS_PROVIDERS.google;
  const url = buildUrl(provider.url, {
    name: normalized,
    type: dnsTypeName(type),
    cd: options.checkingDisabled ? '1' : '0',
    do: options.dnssec === false ? '0' : '1',
  });

  const response = await apiFetch(url, {
    headers: { Accept: 'application/dns-json' },
    timeout: apiConfig.endpoints.dns.timeout,
    retries: apiConfig.endpoints.dns.retries,
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`DNS query failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    ...data,
    provider: provider.id,
    providerLabel: provider.label,
    queryName: normalized,
    queryType: dnsTypeName(type),
    timestamp: Date.now(),
  };
}

export async function queryDnsMany(name, types, options = {}) {
  return Promise.all(types.map((type) => queryDns(name, type, options)));
}
