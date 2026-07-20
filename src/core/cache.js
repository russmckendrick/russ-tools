/**
 * A TTL cache backed by the namespaced storage layer.
 *
 * Six of the fifteen tools keep a lookup cache, and all six wrote their own:
 * different key shapes, different expiry checks, and none of them evicts, so
 * a heavy dns-lookup user's `dns-lookup-cache` grows until a write throws
 * `QuotaExceededError` and the tool starts failing to save history too.
 *
 * The whole cache lives under a single storage slot rather than one key per
 * entry, because that is what the existing tools do and what the migration
 * shim can therefore carry forward unchanged.
 *
 * Time is injected so expiry is tested by arithmetic rather than by waiting.
 */
import { createToolStorage } from './storage.js';

/** Entries above this are dropped oldest-first on write. */
const DEFAULT_MAX_ENTRIES = 100;

/**
 * @param {string} toolId
 * @param {object} [options]
 * @param {string} [options.slot] storage slot, default `cache`
 * @param {number} [options.ttl] milliseconds an entry stays fresh
 * @param {number} [options.maxEntries]
 * @param {string|string[]} [options.legacy] legacy key(s) to migrate from
 * @param {() => number} [options.now] injectable clock
 * @param {Storage} [options.backend]
 */
export function createCache(
  toolId,
  {
    slot = 'cache',
    ttl = 60 * 60 * 1000,
    maxEntries = DEFAULT_MAX_ENTRIES,
    legacy,
    now = () => Date.now(),
    backend,
  } = {}
) {
  const store = createToolStorage(toolId, { backend });

  /** @returns {Record<string, {at: number, value: unknown}>} */
  const read = () => {
    const raw = store.get(slot, { fallback: {}, legacy });
    // A legacy cache could be anything, including an array. Anything that is
    // not a plain object of entries is treated as a cold cache rather than
    // crashing the tool that reads it.
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  };

  /** @param {Record<string, {at: number, value: unknown}>} entries */
  const write = (entries) => store.set(slot, entries);

  /** @param {{at?: number}} entry */
  const isFresh = (entry) =>
    !!entry && typeof entry.at === 'number' && now() - entry.at < ttl;

  return {
    /**
     * @template T
     * @param {string} key
     * @returns {T|null} null when absent or stale
     */
    get(key) {
      const entry = read()[key];
      return isFresh(entry) ? /** @type {T} */ (entry.value) : null;
    },

    /** @param {string} key */
    has(key) {
      return isFresh(read()[key]);
    },

    /**
     * @param {string} key
     * @param {unknown} value
     */
    set(key, value) {
      const entries = read();
      entries[key] = { at: now(), value };

      // Drop the stale first — an expired entry is worth nothing and the
      // whole point of evicting is to make room for something that is.
      for (const [k, entry] of Object.entries(entries)) {
        if (k !== key && !isFresh(entry)) delete entries[k];
      }

      const keys = Object.keys(entries);
      if (keys.length > maxEntries) {
        keys
          .sort((a, b) => (entries[a].at ?? 0) - (entries[b].at ?? 0))
          .slice(0, keys.length - maxEntries)
          .forEach((k) => delete entries[k]);
      }

      write(entries);
    },

    /** @param {string} key */
    remove(key) {
      const entries = read();
      if (!(key in entries)) return;
      delete entries[key];
      write(entries);
    },

    clear() {
      store.remove(slot);
    },

    /** Fresh entry count — what a "cached: N" label should show. */
    size() {
      return Object.values(read()).filter(isFresh).length;
    },

    /**
     * Read-through: return the cached value, or run `fetcher` and cache it.
     * A rejected fetcher caches nothing.
     *
     * @template T
     * @param {string} key
     * @param {() => Promise<T>} fetcher
     * @returns {Promise<T>}
     */
    async resolve(key, fetcher) {
      const hit = this.get(key);
      if (hit !== null) return /** @type {T} */ (hit);

      const value = await fetcher();
      this.set(key, value);
      return value;
    },
  };
}
