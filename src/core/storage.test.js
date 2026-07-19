import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storageKey, createToolStorage, toolStorageKeys, clearTool } from './storage.js';

/**
 * Frozen contract #3. The rule these tests exist to defend is the one that is
 * easy to "tidy up" later: a read migrates data forward and **never deletes
 * the legacy key**. Saved networks have no server copy.
 */

/** An in-memory Storage, since the Vitest env is `node`. */
function fakeStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    get length() {
      return map.size;
    },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
    _dump: () => Object.fromEntries(map),
  };
}

describe('storageKey', () => {
  it('uses the one rt:<id>:<slot> convention', () => {
    expect(storageKey('dns-lookup', 'history')).toBe('rt:dns-lookup:history');
  });
});

describe('createToolStorage', () => {
  let backend;
  let store;

  beforeEach(() => {
    backend = fakeStorage();
    store = createToolStorage('dns-lookup', { backend });
  });

  it('round-trips a value under the namespaced key', () => {
    store.set('history', [{ domain: 'example.com' }]);
    expect(backend.getItem('rt:dns-lookup:history')).toBe('[{"domain":"example.com"}]');
    expect(store.get('history')).toEqual([{ domain: 'example.com' }]);
  });

  it('returns the fallback when nothing is stored', () => {
    expect(store.get('history', { fallback: [] })).toEqual([]);
    expect(store.get('history')).toBeNull();
  });

  it('distinguishes a stored null from an absence', () => {
    expect(store.has('history')).toBe(false);
    store.set('history', null);
    expect(store.has('history')).toBe(true);
    expect(store.get('history')).toBeNull();
  });

  describe('the migration shim', () => {
    beforeEach(() => {
      backend = fakeStorage({ 'dns-lookup-history': '["example.com"]' });
      store = createToolStorage('dns-lookup', { backend });
    });

    it('reads the legacy key when the new one is missing', () => {
      expect(store.get('history', { legacy: 'dns-lookup-history' })).toEqual(['example.com']);
    });

    it('writes the value forward into the new key', () => {
      store.get('history', { legacy: 'dns-lookup-history' });
      expect(backend.getItem('rt:dns-lookup:history')).toBe('["example.com"]');
    });

    it('NEVER deletes the legacy key — frozen contract #3', () => {
      store.get('history', { legacy: 'dns-lookup-history' });
      store.set('history', ['changed.com']);
      store.remove('history');

      expect(backend.getItem('dns-lookup-history')).toBe('["example.com"]');
    });

    it('prefers the new key once it exists, ignoring the legacy value', () => {
      store.set('history', ['new.com']);
      expect(store.get('history', { legacy: 'dns-lookup-history' })).toEqual(['new.com']);
    });

    it('tries several legacy names in order and takes the first present', () => {
      backend = fakeStorage({ 'ssl-checker-domain-history': '["b.com"]' });
      const ssl = createToolStorage('ssl-checker', { backend });

      expect(
        ssl.get('history', { legacy: ['ssl-checker-history', 'ssl-checker-domain-history'] })
      ).toEqual(['b.com']);
    });

    it('still returns the legacy value when the forward write fails', () => {
      const readOnly = {
        ...fakeStorage({ 'dns-lookup-history': '["example.com"]' }),
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
      };
      const locked = createToolStorage('dns-lookup', { backend: readOnly });

      expect(locked.get('history', { legacy: 'dns-lookup-history' })).toEqual(['example.com']);
    });
  });

  describe('corrupt values', () => {
    it('takes the fallback and leaves the bytes alone', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      backend = fakeStorage({ 'rt:dns-lookup:history': '{not json' });
      store = createToolStorage('dns-lookup', { backend });

      expect(store.get('history', { fallback: [] })).toEqual([]);
      expect(backend.getItem('rt:dns-lookup:history')).toBe('{not json');
      warn.mockRestore();
    });
  });

  it('is a no-op rather than a crash when storage is unavailable', () => {
    const dead = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const s = createToolStorage('dns-lookup', { backend: dead });

    expect(s.get('history', { fallback: [] })).toEqual([]);
    expect(s.set('history', [1])).toBe(false);
    expect(() => s.remove('history')).not.toThrow();
    warn.mockRestore();
  });
});

describe('clearTool — the only place data is deleted', () => {
  const manifest = {
    id: 'dns-lookup',
    storageKeys: ['history', 'cache'],
    legacyKeys: ['dns-lookup-history', 'dns-lookup-cache'],
  };

  it('enumerates namespaced and legacy keys together', () => {
    expect(toolStorageKeys(manifest)).toEqual([
      'rt:dns-lookup:history',
      'rt:dns-lookup:cache',
      'dns-lookup-history',
      'dns-lookup-cache',
    ]);
  });

  it('removes both generations and reports only what existed', () => {
    const backend = fakeStorage({
      'rt:dns-lookup:history': '[]',
      'dns-lookup-cache': '{}',
      'unrelated-key': '1',
    });

    expect(clearTool(manifest, { backend })).toEqual([
      'rt:dns-lookup:history',
      'dns-lookup-cache',
    ]);
    expect(backend._dump()).toEqual({ 'unrelated-key': '1' });
  });
});
