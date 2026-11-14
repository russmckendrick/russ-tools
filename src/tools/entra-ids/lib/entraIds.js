/**
 * Search over the Entra identifiers Microsoft publishes.
 *
 * Four kinds of record, one search: first-party application ids, Microsoft
 * Graph permission ids, directory role template ids and AADSTS error codes.
 * Every match says which kind it is and, for a GUID, which identifier of the
 * record matched, because a Graph permission has up to three ids and "it is
 * User.Read" is only half an answer without "the delegated one".
 *
 * Pure functions over the dataset `scripts/refresh-entra-ids.mjs` writes.
 */

import { normaliseGuid } from './idIndex.js';

/** @type {Promise<object> | null} */
let pending = null;

export function loadEntraIds() {
  if (!pending) {
    pending = import('../../../data/microsoft/entra-ids.json').then((m) => m.default ?? m);
  }
  return pending;
}

export const KINDS = /** @type {const} */ (['application', 'permission', 'role', 'error']);

export const KIND_LABEL = {
  application: 'First-party application',
  permission: 'Microsoft Graph permission',
  role: 'Directory role',
  error: 'Sign-in error code',
};

/** The three ways a Graph permission is granted, each with its own id. */
export const PERMISSION_SIDES = /** @type {const} */ (['delegated', 'application', 'resourceSpecific']);

export const SIDE_LABEL = {
  delegated: 'Delegated scope',
  application: 'Application role',
  resourceSpecific: 'Resource-specific consent',
};

/**
 * The dataset as one flat list of searchable entries, built once per dataset.
 *
 * @param {object} data
 * @returns {Array<{ kind: string, key: string, title: string, ids: Array<{ id: string, side?: string }>, text: string, record: object }>}
 */
export function buildEntries(data) {
  const entries = [];

  for (const app of data.applications ?? []) {
    entries.push({
      kind: 'application',
      key: `application:${app.id}`,
      title: app.name,
      ids: [{ id: app.id }],
      text: [app.name, ...(app.aliases ?? [])].join(' ').toLowerCase(),
      record: app,
    });
  }

  for (const permission of data.permissions ?? []) {
    const sides = PERMISSION_SIDES.filter((side) => permission[side]);
    entries.push({
      kind: 'permission',
      key: `permission:${permission.name}`,
      title: permission.name,
      ids: sides.map((side) => ({ id: permission[side].id, side })),
      text: [permission.name, ...sides.flatMap((side) => [permission[side].displayText, permission[side].description])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
      record: permission,
    });
  }

  for (const role of data.roles ?? []) {
    entries.push({
      kind: 'role',
      key: `role:${role.id}`,
      title: role.name,
      ids: [{ id: role.id }],
      text: `${role.name} ${role.description ?? ''}`.toLowerCase(),
      record: role,
    });
  }

  for (const error of data.errors ?? []) {
    entries.push({
      kind: 'error',
      key: `error:${error.code}`,
      title: error.code,
      ids: [],
      text: `${error.code} ${error.name ?? ''} ${error.description ?? ''}`.toLowerCase(),
      record: error,
    });
  }

  return entries;
}

/**
 * What the query is, which decides how it is matched.
 *
 * @param {string} query
 * @returns {{ type: 'empty' } | { type: 'guid', guid: string } | { type: 'guidPrefix', prefix: string }
 *   | { type: 'errorCode', digits: string } | { type: 'text', words: string[] }}
 */
export function classifyQuery(query) {
  const text = String(query ?? '').trim();
  if (!text) return { type: 'empty' };

  const guid = normaliseGuid(text);
  if (guid) return { type: 'guid', guid };

  const code = /^(?:aadsts)?\s*(\d{4,7})$/i.exec(text);
  if (code && (/^aadsts/i.test(text) || code[1].length >= 5)) return { type: 'errorCode', digits: code[1] };

  // The start of a GUID, as when the end was cut off in a log line. Needs a
  // dash or eight hex digits, so that `add` and `face` stay words.
  if (/^[0-9a-f]{8}(-[0-9a-f-]*)?$/i.test(text) && text.length < 36) {
    return { type: 'guidPrefix', prefix: text.toLowerCase() };
  }

  return { type: 'text', words: text.toLowerCase().split(/\s+/).filter(Boolean) };
}

const KIND_ORDER = Object.fromEntries(KINDS.map((kind, index) => [kind, index]));

/**
 * Search the entries.
 *
 * - a whole GUID matches ids exactly, in every kind
 * - the start of a GUID matches ids by prefix
 * - `AADSTS50076` or `50076` matches that code, then codes starting with it
 * - anything else must have every word somewhere in the entry, with names
 *   ranked ahead of descriptions
 * - nothing typed returns everything, which is the tool's browse view
 *
 * @param {ReturnType<typeof buildEntries>} entries
 * @param {string} query
 * @param {{ kind?: string }} [options]
 * @returns {Array<{ entry: ReturnType<typeof buildEntries>[number], matched: 'id' | 'code' | 'name' | 'text' | 'browse', side?: string, id?: string }>}
 */
export function searchEntries(entries, query, { kind = '' } = {}) {
  const pool = kind ? entries.filter((entry) => entry.kind === kind) : entries;
  const parsed = classifyQuery(query);

  if (parsed.type === 'empty') return pool.map((entry) => ({ entry, matched: 'browse' }));

  if (parsed.type === 'guid' || parsed.type === 'guidPrefix') {
    const test =
      parsed.type === 'guid' ? (id) => id === parsed.guid : (id) => id.startsWith(parsed.prefix);
    return pool.flatMap((entry) =>
      entry.ids.filter(({ id }) => test(id)).map(({ id, side }) => ({ entry, matched: 'id', side, id }))
    );
  }

  if (parsed.type === 'errorCode') {
    const errors = pool.filter((entry) => entry.kind === 'error');
    const digitsOf = (entry) => entry.record.code.slice(6);
    const exact = errors.filter((entry) => digitsOf(entry) === parsed.digits);
    const prefixed = errors.filter((entry) => digitsOf(entry) !== parsed.digits && digitsOf(entry).startsWith(parsed.digits));
    return [...exact, ...prefixed].map((entry) => ({ entry, matched: 'code' }));
  }

  const phrase = parsed.words.join(' ');
  const ranked = [];
  for (const entry of pool) {
    if (!parsed.words.every((word) => entry.text.includes(word))) continue;
    const title = entry.title.toLowerCase();
    const names = entry.kind === 'application' ? [title, ...(entry.record.aliases ?? []).map((a) => a.toLowerCase())] : [title];
    if (entry.kind === 'error' && entry.record.name) names.push(entry.record.name.toLowerCase());
    let rank = 3;
    if (names.includes(phrase)) rank = 0;
    else if (names.some((name) => name.startsWith(phrase))) rank = 1;
    else if (names.some((name) => parsed.words.every((word) => name.includes(word)))) rank = 2;
    ranked.push({ entry, matched: rank === 3 ? 'text' : 'name', rank });
  }

  // Within a rank the shorter name is the closer match: `mail read` should
  // reach Mail.Read before Mail-Advanced.ReadWrite.Shared.
  const closeness = (match) => (match.rank < 3 ? match.entry.title.length : 0);
  return ranked
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        KIND_ORDER[a.entry.kind] - KIND_ORDER[b.entry.kind] ||
        closeness(a) - closeness(b) ||
        a.entry.title.localeCompare(b.entry.title)
    )
    .map(({ entry, matched }) => ({ entry, matched }));
}

/**
 * One sentence saying what a matched identifier is.
 *
 * @param {ReturnType<typeof searchEntries>[number]} match
 */
export function describeMatch({ entry, matched, side }) {
  if (matched !== 'id' && matched !== 'code') return KIND_LABEL[entry.kind];
  switch (entry.kind) {
    case 'application':
      return `Application (client) ID of ${entry.title}`;
    case 'permission':
      return `${SIDE_LABEL[side]} ID of the Microsoft Graph permission ${entry.title}`;
    case 'role':
      return `Role template ID of the ${entry.title} directory role`;
    default:
      return `Sign-in error ${entry.title}`;
  }
}

/** How many records of each kind the dataset holds. @param {ReturnType<typeof buildEntries>} entries */
export function countByKind(entries) {
  const counts = Object.fromEntries(KINDS.map((kind) => [kind, 0]));
  for (const entry of entries) counts[entry.kind] += 1;
  return counts;
}

/**
 * A plain object for one match, for the WebMCP tool and for export.
 *
 * @param {ReturnType<typeof searchEntries>[number]} match
 * @param {Record<string, { title: string, url: string }>} sources
 */
export function toPlain(match, sources = {}) {
  const { entry } = match;
  const base = { kind: entry.kind, is: describeMatch(match), name: entry.title };
  if (entry.kind === 'application') {
    return {
      ...base,
      appId: entry.record.id,
      alsoListedAs: entry.record.aliases,
      listedIn: entry.record.sources.map((key) => sources[key]?.url).filter(Boolean),
    };
  }
  if (entry.kind === 'permission') {
    return {
      ...base,
      matchedSide: match.side ?? null,
      ...Object.fromEntries(PERMISSION_SIDES.filter((side) => entry.record[side]).map((side) => [side, entry.record[side]])),
    };
  }
  if (entry.kind === 'role') {
    return {
      ...base,
      roleTemplateId: entry.record.id,
      description: entry.record.description,
      privileged: entry.record.privileged,
    };
  }
  return { ...base, code: entry.record.code, errorName: entry.record.name, description: entry.record.description };
}
