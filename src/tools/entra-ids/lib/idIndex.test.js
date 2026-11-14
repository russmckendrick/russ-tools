import { describe, expect, it } from 'vitest';
import data from '../../../data/microsoft/entra-ids.json';
import index from '../../../data/microsoft/entra-id-index.json';
import { kindsOf, normaliseGuid } from './idIndex.js';

const hex = (guid) => guid.replace(/-/g, '');

describe('normaliseGuid', () => {
  it('accepts the ways a GUID is pasted', () => {
    const guid = '00000003-0000-0000-c000-000000000000';
    expect(normaliseGuid(guid)).toBe(guid);
    expect(normaliseGuid(` ${guid.toUpperCase()} `)).toBe(guid);
    expect(normaliseGuid(`{${guid}}`)).toBe(guid);
    expect(normaliseGuid(`urn:uuid:${guid}`)).toBe(guid);
  });

  it('rejects anything else', () => {
    expect(normaliseGuid('00000003-0000-0000-c000-00000000000')).toBeNull();
    expect(normaliseGuid('User.Read')).toBeNull();
    expect(normaliseGuid('')).toBeNull();
    expect(normaliseGuid(null)).toBeNull();
  });
});

describe('kindsOf', () => {
  const a = '11111111-2222-3333-4444-555555555555';
  const b = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const packed = { application: hex(a), permission: hex(a) + hex(b), role: '' };

  it('names every kind a GUID belongs to', () => {
    expect(kindsOf(packed, a)).toEqual(['application', 'permission']);
    expect(kindsOf(packed, b.toUpperCase())).toEqual(['permission']);
  });

  it('returns nothing for an unknown GUID, a non-GUID or a missing index', () => {
    expect(kindsOf(packed, '99999999-9999-9999-9999-999999999999')).toEqual([]);
    expect(kindsOf(packed, 'not a guid')).toEqual([]);
    expect(kindsOf(null, a)).toEqual([]);
  });

  it('only matches on a 32-digit boundary', () => {
    // The tail of one id followed by the head of the next is 32 hex digits
    // that are not an id. A plain substring test would call it one.
    const straddle = `${hex(a).slice(16)}${hex(b).slice(0, 16)}`;
    const guid = `${straddle.slice(0, 8)}-${straddle.slice(8, 12)}-${straddle.slice(12, 16)}-${straddle.slice(16, 20)}-${straddle.slice(20)}`;
    expect(packed.permission.includes(straddle)).toBe(true);
    expect(kindsOf(packed, guid)).toEqual([]);
  });
});

describe('the checked-in index', () => {
  it('was written by the same refresh as the dataset', () => {
    expect(index.generatedAt).toBe(data.generatedAt);
  });

  it('holds exactly the GUIDs the dataset holds, kind by kind', () => {
    const expected = {
      application: data.applications.map((app) => app.id),
      permission: data.permissions.flatMap((permission) =>
        [permission.application?.id, permission.delegated?.id, permission.resourceSpecific?.id].filter(Boolean)
      ),
      role: data.roles.map((role) => role.id),
    };
    for (const [kind, ids] of Object.entries(expected)) {
      const unique = [...new Set(ids)];
      expect(index[kind].length, kind).toBe(unique.length * 32);
      for (const id of unique) expect(kindsOf(index, id), id).toContain(kind);
    }
  });

  it('does not recognise a GUID from another tool', () => {
    // Contributor, an Azure RBAC role definition id.
    expect(kindsOf(index, 'b24988ac-6180-42a0-ab88-20f7382dd24c')).toEqual([]);
  });
});
