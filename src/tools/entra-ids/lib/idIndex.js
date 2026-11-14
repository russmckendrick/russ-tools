/**
 * The GUIDs the Entra ID lookup knows, and nothing else about them.
 *
 * The index's paste panel has to decide where a pasted GUID belongs before
 * anyone has opened a tool, and the full dataset is ten times the size of the
 * answer. `scripts/refresh-entra-ids.mjs` therefore writes the ids on their
 * own, as 32 hex digits each with no separators, one string per kind. This
 * module is dependency-free so `src/lib/paste.js` can import it, and the
 * strings sit behind a dynamic import so a visitor who never pastes a GUID
 * never downloads them.
 */

export const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Kinds in the order a match is reported when one GUID is two things. */
export const INDEXED_KINDS = /** @type {const} */ (['application', 'permission', 'role']);

/** @type {Promise<Record<string, string>> | null} */
let pending = null;

/** @returns {Promise<Record<string, string>>} */
export function loadIdIndex() {
  if (!pending) {
    pending = import('../../../data/microsoft/entra-id-index.json').then((m) => m.default ?? m);
  }
  return pending;
}

/**
 * A GUID as people paste it (braces, `urn:uuid:`, upper case) reduced to the
 * canonical lower-case form, or null when it is not one.
 *
 * @param {string} value
 * @returns {string | null}
 */
export function normaliseGuid(value) {
  const text = String(value ?? '')
    .trim()
    .replace(/^urn:uuid:/i, '')
    .replace(/^[{(]|[})]$/g, '');
  return GUID.test(text) ? text.toLowerCase() : null;
}

/** @param {string} packed @param {string} hex */
function contains(packed, hex) {
  if (!packed) return false;
  for (let at = packed.indexOf(hex); at !== -1; at = packed.indexOf(hex, at + 1)) {
    if (at % 32 === 0) return true;
  }
  return false;
}

/**
 * Which kinds of Entra identifier a GUID is, from the packed index.
 *
 * @param {Record<string, string>} index
 * @param {string} value
 * @returns {Array<'application' | 'permission' | 'role'>}
 */
export function kindsOf(index, value) {
  const guid = normaliseGuid(value);
  if (!guid || !index) return [];
  const hex = guid.replace(/-/g, '');
  return INDEXED_KINDS.filter((kind) => contains(index[kind], hex));
}
