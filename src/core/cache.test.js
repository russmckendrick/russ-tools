import { describe, it, expect, beforeEach } from 'vitest';
import { createCache } from './cache.js';

function fakeStorage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _dump: () => Object.fromEntries(map),
  };
}

describe('createCache', () => {
  let clock;
  let backend;
  let cache;

  beforeEach(() => {
    clock = 1_000_000;
    backend = fakeStorage();
    cache = createCache('dns-lookup', {
      backend,
      ttl: 1000,
      now: () => clock,
    });
  });

  it('returns a fresh entry', () => {
    cache.set('example.com', { a: ['1.2.3.4'] });
    expect(cache.get('example.com')).toEqual({ a: ['1.2.3.4'] });
    expect(cache.has('example.com')).toBe(true);
  });

  it('expires an entry once the TTL has passed', () => {
    cache.set('example.com', 'x');
    clock += 999;
    expect(cache.get('example.com')).toBe('x');

    clock += 2;
    expect(cache.get('example.com')).toBeNull();
    expect(cache.has('example.com')).toBe(false);
  });

  it('returns null rather than undefined for a miss', () => {
    expect(cache.get('nothing')).toBeNull();
  });

  it('stores everything under one namespaced slot', () => {
    cache.set('a', 1);
    expect(Object.keys(backend._dump())).toEqual(['rt:dns-lookup:cache']);
  });

  it('evicts stale entries on write', () => {
    cache.set('old', 1);
    clock += 5000;
    cache.set('new', 2);

    expect(JSON.parse(backend.getItem('rt:dns-lookup:cache'))).toEqual({
      new: { at: clock, value: 2 },
    });
  });

  it('caps the entry count, dropping the oldest first', () => {
    const capped = createCache('dns-lookup', {
      backend,
      ttl: 1_000_000,
      maxEntries: 3,
      now: () => clock,
    });

    for (const key of ['a', 'b', 'c', 'd']) {
      capped.set(key, key);
      clock += 1;
    }

    expect(Object.keys(JSON.parse(backend.getItem('rt:dns-lookup:cache'))).sort()).toEqual([
      'b',
      'c',
      'd',
    ]);
  });

  it('counts only fresh entries', () => {
    const counted = createCache('dns-lookup', { backend, ttl: 1000, now: () => clock });
    counted.set('a', 1);
    expect(counted.size()).toBe(1);
    clock += 2000;
    expect(counted.size()).toBe(0);
  });

  it('removes and clears', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.remove('a');
    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBe(2);

    cache.clear();
    expect(backend.getItem('rt:dns-lookup:cache')).toBeNull();
  });

  describe('resolve (read-through)', () => {
    it('runs the fetcher once and caches the result', async () => {
      let calls = 0;
      const fetcher = async () => {
        calls += 1;
        return { ok: true };
      };

      expect(await cache.resolve('k', fetcher)).toEqual({ ok: true });
      expect(await cache.resolve('k', fetcher)).toEqual({ ok: true });
      expect(calls).toBe(1);
    });

    it('caches nothing when the fetcher rejects', async () => {
      await expect(
        cache.resolve('k', async () => {
          throw new Error('worker down');
        })
      ).rejects.toThrow('worker down');

      expect(cache.get('k')).toBeNull();
    });
  });

  describe('migration', () => {
    it('adopts a legacy cache and leaves the old key in place', () => {
      backend = fakeStorage({
        'dns-lookup-cache': JSON.stringify({ 'a.com': { at: 1_000_000, value: 'hit' } }),
      });
      const migrating = createCache('dns-lookup', {
        backend,
        ttl: 1000,
        legacy: 'dns-lookup-cache',
        now: () => clock,
      });

      expect(migrating.get('a.com')).toBe('hit');
      expect(backend.getItem('dns-lookup-cache')).not.toBeNull();
    });

    it('treats a legacy value of the wrong shape as a cold cache', () => {
      backend = fakeStorage({ 'dns-lookup-cache': '["not","an","entry","map"]' });
      const migrating = createCache('dns-lookup', {
        backend,
        legacy: 'dns-lookup-cache',
        now: () => clock,
      });

      expect(migrating.get('anything')).toBeNull();
      expect(() => migrating.set('a', 1)).not.toThrow();
    });
  });
});
