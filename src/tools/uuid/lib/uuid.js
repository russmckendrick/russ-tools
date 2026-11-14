export const MAX_COUNT = 500;

export const NIL_UUID = '00000000-0000-0000-0000-000000000000';
export const MAX_UUID = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

const CANONICAL = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const BARE = /^[0-9a-f]{32}$/;

const GREGORIAN_OFFSET = 122192928000000000n;
const MAX_DATE_MS = 8.64e15;

const VERSION_NAMES = {
  1: 'Time-based (Gregorian timestamp and node)',
  2: 'DCE Security',
  3: 'Name-based (MD5)',
  4: 'Random',
  5: 'Name-based (SHA-1)',
  6: 'Time-ordered (reordered Gregorian timestamp)',
  7: 'Time-ordered (Unix timestamp)',
  8: 'Custom (vendor-defined)',
};

const hyphenate = (hex) =>
  `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;

const bytesToHex = (bytes) => {
  let out = '';
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0');
  return out;
};

const secureBytes = (length) => globalThis.crypto.getRandomValues(new Uint8Array(length));

export function clampCount(value) {
  const count = Math.floor(Number(value));
  if (!Number.isFinite(count) || count < 1) return 1;
  return Math.min(count, MAX_COUNT);
}

export function normalizeUuid(input) {
  if (typeof input !== 'string') return null;
  let value = input.trim().toLowerCase().replace(/^urn:uuid:/, '');
  const first = value[0];
  const last = value[value.length - 1];
  if ((first === '{' && last === '}') || (first === '(' && last === ')')) value = value.slice(1, -1).trim();
  if (CANONICAL.test(value)) return value;
  if (BARE.test(value)) return hyphenate(value);
  return null;
}

export function formatUuid(uuid, { uppercase = false, braces = false, hyphens = true } = {}) {
  let value = hyphens ? uuid : uuid.replace(/-/g, '');
  if (uppercase) value = value.toUpperCase();
  return braces ? `{${value}}` : value;
}

export function uuidV4(random = secureBytes) {
  if (random === secureBytes && typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  const bytes = random(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return hyphenate(bytesToHex(bytes));
}

export function buildV7(ms, sequence, tail) {
  const bytes = new Uint8Array(16);
  let rest = ms;
  for (let i = 5; i >= 0; i--) {
    bytes[i] = rest % 256;
    rest = Math.floor(rest / 256);
  }
  bytes[6] = 0x70 | ((sequence >>> 8) & 0x0f);
  bytes[7] = sequence & 0xff;
  bytes[8] = 0x80 | (tail[0] & 0x3f);
  bytes.set(tail.subarray(1, 8), 9);
  return hyphenate(bytesToHex(bytes));
}

export function createV7Generator({ now = Date.now, random = secureBytes } = {}) {
  let lastMs = -1;
  let sequence = 0;
  return () => {
    const seed = random(10);
    const clock = Math.max(now(), lastMs);
    if (clock === lastMs) {
      sequence += 1;
      if (sequence > 0xfff) {
        lastMs += 1;
        sequence = ((seed[8] << 8) | seed[9]) & 0x7ff;
      }
    } else {
      lastMs = clock;
      sequence = ((seed[8] << 8) | seed[9]) & 0x7ff;
    }
    return buildV7(lastMs, sequence, seed);
  };
}

export function generateUuids(version, count, deps = {}) {
  const total = clampCount(count);
  const next = version === 7 ? createV7Generator(deps) : () => uuidV4(deps.random);
  return Array.from({ length: total }, next);
}

function variantOf(byte) {
  if ((byte & 0x80) === 0) return { id: 'ncs', label: 'NCS (reserved)', bits: '0xxx' };
  if ((byte & 0xc0) === 0x80) return { id: 'rfc', label: 'RFC 9562', bits: '10xx' };
  if ((byte & 0xe0) === 0xc0) return { id: 'microsoft', label: 'Microsoft (reserved)', bits: '110x' };
  return { id: 'future', label: 'Reserved for future use', bits: '111x' };
}

function timestampOf(version, hex) {
  if (version === 7) return parseInt(hex.slice(0, 12), 16);
  const ticks =
    version === 1
      ? BigInt(`0x${hex.slice(13, 16)}${hex.slice(8, 12)}${hex.slice(0, 8)}`)
      : BigInt(`0x${hex.slice(0, 12)}${hex.slice(13, 16)}`);
  return Number((ticks - GREGORIAN_OFFSET) / 10000n);
}

export function decodeUuid(input) {
  const canonical = normalizeUuid(input);
  if (!canonical) return null;
  const hex = canonical.replace(/-/g, '');
  const formats = {
    canonical,
    uppercase: canonical.toUpperCase(),
    bare: hex,
    braced: `{${canonical}}`,
    urn: `urn:uuid:${canonical}`,
  };

  if (canonical === NIL_UUID || canonical === MAX_UUID) {
    return {
      ...formats,
      special: canonical === NIL_UUID ? 'Nil UUID' : 'Max UUID',
      variant: null,
      version: null,
      versionName: canonical === NIL_UUID ? 'Nil: every bit is zero' : 'Max: every bit is one',
      timestampMs: null,
      timestampIso: null,
      clockSequence: null,
      node: null,
      nodeKind: null,
    };
  }

  const variant = variantOf(parseInt(hex.slice(16, 18), 16));
  const nibble = parseInt(hex[12], 16);
  const version = variant.id === 'rfc' ? nibble : null;
  const timed = version === 1 || version === 6 || version === 7;
  const timestampMs = timed ? timestampOf(version, hex) : null;
  const inRange = timestampMs !== null && Math.abs(timestampMs) <= MAX_DATE_MS;
  const hasNode = version === 1 || version === 6;
  const node = hasNode ? hex.slice(20).match(/../g).join(':') : null;

  return {
    ...formats,
    special: null,
    variant,
    version,
    versionName:
      version === null
        ? 'Not defined for this variant'
        : (VERSION_NAMES[version] ?? 'Not a version RFC 9562 defines'),
    timestampMs: inRange ? timestampMs : null,
    timestampIso: inRange ? new Date(timestampMs).toISOString() : null,
    clockSequence: hasNode ? parseInt(hex.slice(16, 20), 16) & 0x3fff : null,
    node,
    nodeKind: hasNode
      ? parseInt(hex.slice(20, 22), 16) & 1
        ? 'Random or multicast, not a hardware address'
        : 'Hardware (MAC) address'
      : null,
  };
}
