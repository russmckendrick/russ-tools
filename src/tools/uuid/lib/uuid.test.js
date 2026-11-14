import { describe, it, expect } from 'vitest';
import {
  MAX_COUNT,
  MAX_UUID,
  NIL_UUID,
  buildV7,
  clampCount,
  createV7Generator,
  decodeUuid,
  formatUuid,
  generateUuids,
  normalizeUuid,
  uuidV4,
} from './uuid.js';

const CANONICAL = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const zeros = (length) => new Uint8Array(length);

describe('clampCount', () => {
  it.each([
    [1, 1],
    [500, 500],
    [501, MAX_COUNT],
    [0, 1],
    [-3, 1],
    ['12', 12],
    ['12.9', 12],
    ['', 1],
    ['abc', 1],
  ])('%j → %i', (input, expected) => {
    expect(clampCount(input)).toBe(expected);
  });
});

describe('normalizeUuid', () => {
  const canonical = 'b24988ac-6180-42a0-ab88-20f7382dd24c';

  it.each([
    'b24988ac-6180-42a0-ab88-20f7382dd24c',
    'B24988AC-6180-42A0-AB88-20F7382DD24C',
    'b24988ac618042a0ab8820f7382dd24c',
    '{b24988ac-6180-42a0-ab88-20f7382dd24c}',
    '(B24988AC-6180-42A0-AB88-20F7382DD24C)',
    'urn:uuid:b24988ac-6180-42a0-ab88-20f7382dd24c',
    '  {B24988AC618042A0AB8820F7382DD24C}  ',
  ])('reads %j', (input) => {
    expect(normalizeUuid(input)).toBe(canonical);
  });

  it.each([
    '',
    'b24988ac-6180-42a0-ab88-20f7382dd24',
    'b24988ac-6180-42a0-ab88-20f7382dd24cc',
    'g24988ac-6180-42a0-ab88-20f7382dd24c',
    'b24988ac6180-42a0-ab88-20f7382dd24c',
    '{b24988ac-6180-42a0-ab88-20f7382dd24c',
    null,
    42,
  ])('rejects %j', (input) => {
    expect(normalizeUuid(input)).toBeNull();
  });
});

describe('formatUuid', () => {
  const uuid = 'b24988ac-6180-42a0-ab88-20f7382dd24c';

  it('leaves the canonical form alone by default', () => {
    expect(formatUuid(uuid)).toBe(uuid);
  });

  it('applies uppercase, braces and no-hyphens independently and together', () => {
    expect(formatUuid(uuid, { uppercase: true })).toBe('B24988AC-6180-42A0-AB88-20F7382DD24C');
    expect(formatUuid(uuid, { braces: true })).toBe(`{${uuid}}`);
    expect(formatUuid(uuid, { hyphens: false })).toBe('b24988ac618042a0ab8820f7382dd24c');
    expect(formatUuid(uuid, { uppercase: true, braces: true, hyphens: false })).toBe(
      '{B24988AC618042A0AB8820F7382DD24C}'
    );
  });
});

describe('version 4', () => {
  it('comes back canonical with the version and variant bits set', () => {
    for (let i = 0; i < 50; i++) {
      const uuid = uuidV4();
      expect(uuid).toMatch(CANONICAL);
      expect(uuid[14]).toBe('4');
      expect('89ab').toContain(uuid[19]);
    }
  });

  it('sets the same bits when built from supplied randomness', () => {
    expect(uuidV4(() => new Uint8Array(16).fill(0xff))).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
    expect(uuidV4(() => zeros(16))).toBe('00000000-0000-4000-8000-000000000000');
  });
});

describe('version 7', () => {
  it('lays out the timestamp, version, sequence and variant where RFC 9562 puts them', () => {
    expect(buildV7(0x017f22e279b0, 0xcc3, new Uint8Array([0x18, 0xc4, 0xdc, 0x0c, 0x0c, 0x07, 0x39, 0x8f]))).toBe(
      '017f22e2-79b0-7cc3-98c4-dc0c0c07398f'
    );
  });

  it('keeps a 48-bit timestamp intact past the 32-bit boundary', () => {
    const ms = 0xffffffffffff;
    expect(buildV7(ms, 0, zeros(8)).slice(0, 13)).toBe('ffffffff-ffff');
    expect(decodeUuid(buildV7(1794651210123, 0, zeros(8))).timestampMs).toBe(1794651210123);
  });

  it('generates in strictly ascending order inside one millisecond', () => {
    const next = createV7Generator({ now: () => 1794651210123, random: () => zeros(10) });
    const batch = Array.from({ length: 300 }, next);
    expect([...batch].sort()).toEqual(batch);
    expect(new Set(batch).size).toBe(batch.length);
    expect(batch.every((uuid) => decodeUuid(uuid).timestampMs === 1794651210123)).toBe(true);
  });

  it('borrows the next millisecond rather than repeating when the sequence is spent', () => {
    const next = createV7Generator({ now: () => 1000, random: () => zeros(10) });
    const batch = Array.from({ length: 4097 }, next);
    expect([...batch].sort()).toEqual(batch);
    expect(new Set(batch).size).toBe(batch.length);
    expect(decodeUuid(batch.at(-1)).timestampMs).toBe(1001);
  });

  it('never goes backwards when the clock does', () => {
    const times = [5000, 4000, 4500, 6000];
    const next = createV7Generator({ now: () => times.shift(), random: () => zeros(10) });
    const batch = Array.from({ length: 4 }, next);
    expect([...batch].sort()).toEqual(batch);
    expect(batch.map((uuid) => decodeUuid(uuid).timestampMs)).toEqual([5000, 5000, 5000, 6000]);
  });
});

describe('generateUuids', () => {
  it('produces the count asked for, clamped to 1 to 500', () => {
    expect(generateUuids(4, 1)).toHaveLength(1);
    expect(generateUuids(4, 25)).toHaveLength(25);
    expect(generateUuids(7, 9999)).toHaveLength(MAX_COUNT);
    expect(generateUuids(7, 0)).toHaveLength(1);
  });

  it('produces the version asked for, with no repeats', () => {
    for (const version of [4, 7]) {
      const batch = generateUuids(version, MAX_COUNT);
      expect(new Set(batch).size).toBe(MAX_COUNT);
      expect(batch.every((uuid) => decodeUuid(uuid).version === version)).toBe(true);
    }
  });

  it('stamps a version 7 batch with the current time', () => {
    const before = Date.now();
    const [uuid] = generateUuids(7, 1);
    const after = Date.now();
    const { timestampMs } = decodeUuid(uuid);
    expect(timestampMs).toBeGreaterThanOrEqual(before);
    expect(timestampMs).toBeLessThanOrEqual(after);
  });
});

describe('decodeUuid', () => {
  it('returns nothing for something that is not a UUID', () => {
    expect(decodeUuid('not-a-uuid')).toBeNull();
  });

  it('reads a version 4 UUID and offers it in every common form', () => {
    expect(decodeUuid('{B24988AC-6180-42A0-AB88-20F7382DD24C}')).toMatchObject({
      canonical: 'b24988ac-6180-42a0-ab88-20f7382dd24c',
      uppercase: 'B24988AC-6180-42A0-AB88-20F7382DD24C',
      bare: 'b24988ac618042a0ab8820f7382dd24c',
      braced: '{b24988ac-6180-42a0-ab88-20f7382dd24c}',
      urn: 'urn:uuid:b24988ac-6180-42a0-ab88-20f7382dd24c',
      version: 4,
      versionName: 'Random',
      variant: { id: 'rfc', label: 'RFC 9562' },
      timestampMs: null,
      node: null,
    });
  });

  it('reads the timestamp, clock sequence and node out of the RFC 9562 version 1 example', () => {
    expect(decodeUuid('C232AB00-9414-11EC-B3C8-9F6BDECED846')).toMatchObject({
      version: 1,
      timestampMs: 1645557742000,
      timestampIso: '2022-02-22T19:22:22.000Z',
      clockSequence: 0x33c8,
      node: '9f:6b:de:ce:d8:46',
      nodeKind: 'Random or multicast, not a hardware address',
    });
  });

  it('recognises a hardware node by its cleared multicast bit', () => {
    expect(decodeUuid('c232ab00-9414-11ec-b3c8-00005e005301').nodeKind).toBe('Hardware (MAC) address');
  });

  it('reads the reordered timestamp out of the RFC 9562 version 6 example', () => {
    expect(decodeUuid('1EC9414C-232A-6B00-B3C8-9F6BDECED846')).toMatchObject({
      version: 6,
      timestampIso: '2022-02-22T19:22:22.000Z',
      node: '9f:6b:de:ce:d8:46',
    });
  });

  it('reads the Unix timestamp out of the RFC 9562 version 7 example', () => {
    expect(decodeUuid('017F22E2-79B0-7CC3-98C4-DC0C0C07398F')).toMatchObject({
      version: 7,
      versionName: 'Time-ordered (Unix timestamp)',
      timestampMs: 1645557742000,
      timestampIso: '2022-02-22T19:22:22.000Z',
      clockSequence: null,
      node: null,
    });
  });

  it.each([
    ['5df41881-3aed-3515-88a7-2f4a814cf09e', 3, 'Name-based (MD5)'],
    ['2ed6657d-e927-568b-95e1-2665a8aea6a2', 5, 'Name-based (SHA-1)'],
    ['2489e9ad-2ee2-8e00-8ec9-32d5f69181c0', 8, 'Custom (vendor-defined)'],
  ])('names version %#: %s', (uuid, version, versionName) => {
    expect(decodeUuid(uuid)).toMatchObject({ version, versionName, timestampMs: null });
  });

  it('reports the variant and leaves the version alone when the variant is not RFC 9562', () => {
    expect(decodeUuid('6ba7b810-9dad-11d1-00b4-00c04fd430c8')).toMatchObject({
      variant: { id: 'ncs' },
      version: null,
      timestampMs: null,
    });
    expect(decodeUuid('6ba7b810-9dad-11d1-c0b4-00c04fd430c8').variant.id).toBe('microsoft');
    expect(decodeUuid('6ba7b810-9dad-11d1-e0b4-00c04fd430c8').variant.id).toBe('future');
  });

  it('names the nil and max UUIDs instead of inventing a version for them', () => {
    expect(decodeUuid(NIL_UUID)).toMatchObject({ special: 'Nil UUID', version: null, variant: null });
    expect(decodeUuid(MAX_UUID)).toMatchObject({ special: 'Max UUID', version: null, variant: null });
  });

  it('flags a version number RFC 9562 does not define', () => {
    expect(decodeUuid('00000000-0000-9000-8000-000000000001').versionName).toBe(
      'Not a version RFC 9562 defines'
    );
  });
});
