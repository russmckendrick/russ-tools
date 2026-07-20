/**
 * Namespaced localStorage with a non-destructive migration shim.
 *
 * This is **frozen contract #3**. Saved networks are the most valuable user
 * data in the app and there is no server copy of any of it, so the rules are
 * absolute:
 *
 *   1. New writes go to `rt:<toolId>:<slot>` — one naming convention, so the
 *      /delete page and the manifests can enumerate everything a tool owns.
 *   2. A read falls back to the tool's legacy key when the new one is absent,
 *      and copies the value forward as it goes (read-old, write-new).
 *   3. **The legacy key is never deleted by a read.** The shim stays for
 *      >= 12 months, so a user who opens an old bookmark, or rolls back, or
 *      lands on a cached build still finds their data where that build looks
 *      for it. Only an explicit "clear my data" action removes anything.
 *
 * Storage is injected rather than reached for, so the whole module is
 * testable under Vitest's `node` environment (which has no `localStorage`)
 * and degrades to a no-op in SSR — every Astro page renders this file's
 * importers during the build.
 *
 * On mapping legacy keys: a slot names *which* old key feeds it at the call
 * site, not in the manifest, because the relationship is not always a rename.
 * network-designer's four slots are fed by nine legacy keys, and ssl-checker
 * keeps a result history and a domain-string history under names that look
 * like a pair but are not. Those need a real merge written against the real
 * data, which happens in the tool's own port. The manifest's `legacyKeys`
 * list stays the enumeration for clearing; this is the mechanism for reading.
 */

const NAMESPACE = 'rt';

/**
 * The one key format. `rt:dns-lookup:history`.
 *
 * @param {string} toolId
 * @param {string} slot
 * @returns {string}
 */
export function storageKey(toolId, slot) {
  return `${NAMESPACE}:${toolId}:${slot}`;
}

/**
 * A backend that throws nothing and stores nothing. Used when there is no
 * `localStorage` — during the Astro build, and in a browser where the user
 * has disabled storage or is in a partitioned context. A tool that reads its
 * history gets its fallback rather than a crash on first render.
 *
 * @returns {Storage}
 */
function nullBackend() {
  return {
    length: 0,
    key: () => null,
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
  };
}

/**
 * Resolve the real backend once per call rather than at module load: the
 * module is imported during SSR, where `localStorage` never appears, and by
 * an island, where it always does.
 *
 * @returns {Storage}
 */
export function defaultBackend() {
  try {
    if (typeof localStorage === 'undefined') return nullBackend();
    // Safari in private mode has the object but throws on write. Probe it
    // once here rather than letting the first `set` take down a render.
    const probe = `${NAMESPACE}:__probe__`;
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return nullBackend();
  }
}

/**
 * @param {Storage} backend
 * @param {string} key
 * @returns {{ found: boolean, value: unknown }}
 */
function readJSON(backend, key) {
  let raw;
  try {
    raw = backend.getItem(key);
  } catch {
    return { found: false, value: undefined };
  }
  if (raw === null) return { found: false, value: undefined };

  try {
    return { found: true, value: JSON.parse(raw) };
  } catch {
    // A corrupt value is not a missing one, but it is not usable either.
    // Report it and let the caller take its fallback; overwriting the user's
    // bytes with `{}` would destroy whatever could still be recovered by hand.
    console.warn(`storage: ${key} is not valid JSON — ignoring it`);
    return { found: false, value: undefined };
  }
}

/**
 * One tool's slice of storage.
 *
 * @param {string} toolId
 * @param {{ backend?: Storage }} [options]
 */
export function createToolStorage(toolId, { backend } = {}) {
  const store = backend ?? defaultBackend();

  /** @param {string} slot */
  const key = (slot) => storageKey(toolId, slot);

  return {
    key,

    /**
     * Read a slot, falling back to the legacy key(s) and migrating forward.
     *
     * `legacy` may name several keys, tried in order — that is *aliasing*
     * (the same value under old names), not merging. A slot assembled from
     * several distinct legacy values needs its own migration at port time.
     *
     * @template T
     * @param {string} slot
     * @param {{ fallback?: T, legacy?: string | string[] }} [options]
     * @returns {T}
     */
    get(slot, { fallback = null, legacy } = {}) {
      const current = readJSON(store, key(slot));
      if (current.found) return /** @type {T} */ (current.value);

      const legacyKeys = legacy == null ? [] : [].concat(legacy);
      for (const legacyKey of legacyKeys) {
        const old = readJSON(store, legacyKey);
        if (!old.found) continue;

        // Write-new. The legacy key stays exactly where it was.
        try {
          store.setItem(key(slot), JSON.stringify(old.value));
        } catch {
          // Quota or a locked-down context: still return the value, since
          // reading is what was asked for. It will migrate on the next read.
        }
        return /** @type {T} */ (old.value);
      }

      return /** @type {T} */ (fallback);
    },

    /**
     * @param {string} slot
     * @param {unknown} value
     * @returns {boolean} whether the write landed
     */
    set(slot, value) {
      try {
        store.setItem(key(slot), JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn(`storage: could not write ${key(slot)}`, error);
        return false;
      }
    },

    /**
     * Remove the namespaced slot. Legacy keys are untouched — use
     * `clearTool` for the deliberate "delete my data" path.
     *
     * @param {string} slot
     */
    remove(slot) {
      try {
        store.removeItem(key(slot));
      } catch {
        /* nothing to do */
      }
    },

    /**
     * Whether the slot has been written in the new namespace. Distinct from
     * `get() === null`, which cannot tell a stored `null` from an absence.
     *
     * @param {string} slot
     */
    has(slot) {
      return readJSON(store, key(slot)).found;
    },
  };
}

/**
 * Everything one tool owns, namespaced and legacy alike — the enumeration
 * the /delete page clears. Derived from the manifest so a tool cannot leave
 * data behind by forgetting to list it somewhere else.
 *
 * @param {{ id: string, storageKeys?: string[], legacyKeys?: string[] }} manifest
 * @returns {string[]}
 */
export function toolStorageKeys(manifest) {
  return [
    ...(manifest.storageKeys ?? []).map((slot) => storageKey(manifest.id, slot)),
    ...(manifest.legacyKeys ?? []),
  ];
}

/**
 * The one place data is actually deleted, and only because the user asked.
 * Returns the keys that existed and were removed, so the UI can report what
 * it did rather than claiming success unconditionally.
 *
 * @param {{ id: string, storageKeys?: string[], legacyKeys?: string[] }} manifest
 * @param {{ backend?: Storage }} [options]
 * @returns {string[]}
 */
export function clearTool(manifest, { backend } = {}) {
  const store = backend ?? defaultBackend();
  const removed = [];

  for (const key of toolStorageKeys(manifest)) {
    try {
      if (store.getItem(key) === null) continue;
      store.removeItem(key);
      removed.push(key);
    } catch {
      /* skip anything the backend refuses */
    }
  }

  return removed;
}
