import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { createCache, createToolStorage } from '@/core';

/**
 * The one lookup-tool state machine.
 *
 * dns-lookup, whois, ssl-checker, tenant-lookup and microsoft-portals each
 * hand-rolled the same subsystem — loading/error state, a TTL cache in
 * localStorage, a deduplicated history, deep-link-on-mount, toasts — five
 * times, with five key shapes and no eviction anywhere. This hook is that
 * subsystem once, on top of `core/`'s cache (TTL + eviction, namespaced
 * storage) and whatever fetcher the tool brings.
 *
 * The fetcher owns the *what* (URL, worker, response handling — frozen
 * contract #5 lives there); the hook owns the *when* (cache consult, abort,
 * history, state transitions).
 *
 * Caches migrate cold: legacy per-tool cache objects had ad-hoc entry shapes,
 * and re-fetching once beats carrying three formats forever. History is user
 * data and *does* read the legacy key forward (never deleting it — contract
 * #3). List both legacy keys in the manifest so /delete can clear them.
 *
 * @template T
 * @param {object} config
 * @param {string} config.toolId manifest id — namespaces the storage slots
 * @param {(query: string, extras: { signal: AbortSignal, context: object }) => Promise<T>} config.fetcher
 * @param {number} [config.cacheTTL] ms an entry stays fresh (default 30 min)
 * @param {number} [config.maxHistory] history cap (default 50); 0 disables
 *   recording entirely, for tools whose list is explicit user saves instead
 * @param {string} [config.urlParam] useParams key that triggers a lookup on mount
 * @param {(raw: string) => string} [config.normalize] query cleaner (default trim+lowercase)
 * @param {(query: string, context: object) => string} [config.cacheKey] compound cache key (dns needs provider+type)
 * @param {(query: string, context: object) => string} [config.historyKey] history dedupe key (defaults to the query alone)
 * @param {(query: string, data: T, context: object) => object} [config.historyEntry] extra fields for a history item
 * @param {{ history?: string | string[] }} [config.legacy] legacy localStorage key(s) for history
 * @param {(query: string, data: T, fromCache: boolean) => void} [config.onSuccess] override the success toast
 * @param {(query: string, error: Error) => void} [config.onError] override the error toast
 */
export function useLookupTool({
  toolId,
  fetcher,
  cacheTTL = 30 * 60 * 1000,
  maxHistory = 50,
  urlParam,
  normalize = (raw) => raw.trim().toLowerCase(),
  cacheKey = (query) => query,
  historyKey = (query) => query,
  historyEntry,
  legacy = {},
  onSuccess,
  onError,
}) {
  const storage = useMemo(() => createToolStorage(toolId), [toolId]);
  const cache = useMemo(() => createCache(toolId, { ttl: cacheTTL }), [toolId, cacheTTL]);

  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState(() =>
    storage.get('history', { fallback: [], legacy: legacy.history })
  );

  // One in-flight lookup at a time: a new submit aborts the old request, and
  // unmount aborts whatever is left.
  const abortRef = useRef(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  // Written through to storage on every change, exactly like the tools did.
  const recordHistory = useCallback(
    (cleanQuery, data, context) => {
      setHistory((prev) => {
        const key = historyKey(cleanQuery, context);
        const entry = {
          query: cleanQuery,
          timestamp: Date.now(),
          ...(historyEntry ? historyEntry(cleanQuery, data, context) : {}),
        };
        const next = [
          entry,
          ...prev.filter((item) => historyKey(item.query, item) !== key),
        ].slice(0, maxHistory);
        storage.set('history', next);
        return next;
      });
    },
    [historyEntry, historyKey, maxHistory, storage]
  );

  const lookup = useCallback(
    async (raw, context = {}) => {
      const cleanQuery = normalize(raw ?? '');
      if (!cleanQuery) return null;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      setResult(null);
      setFromCache(false);

      const key = cacheKey(cleanQuery, context);

      try {
        const hit = /** @type {T|null} */ (cache.get(key));
        const data = hit !== null ? hit : await fetcher(cleanQuery, { signal: controller.signal, context });
        if (controller.signal.aborted) return null;

        if (hit === null) cache.set(key, data);

        setResult(data);
        setFromCache(hit !== null);
        if (maxHistory > 0) recordHistory(cleanQuery, data, context);

        if (onSuccess) onSuccess(cleanQuery, data, hit !== null);
        else toast.success(`Lookup complete${hit !== null ? ' (cached)' : ''}`, { description: cleanQuery });

        return data;
      } catch (err) {
        if (controller.signal.aborted) return null;

        const failure = err instanceof Error ? err : new Error(String(err));
        setError(failure.message);

        if (onError) onError(cleanQuery, failure);
        else toast.error('Lookup failed', { description: failure.message });

        return null;
      } finally {
        if (abortRef.current === controller) setLoading(false);
      }
    },
    [cache, cacheKey, fetcher, maxHistory, normalize, onError, onSuccess, recordHistory]
  );

  // Deep link: /tool/:param runs the lookup on mount with the param applied,
  // exactly once per param value.
  const params = useParams();
  const paramValue = urlParam ? params[urlParam] : undefined;
  const lookupRef = useRef(lookup);
  lookupRef.current = lookup;

  useEffect(() => {
    if (paramValue && paramValue.trim()) {
      const decoded = decodeURIComponent(paramValue);
      setQuery(decoded);
      lookupRef.current(decoded);
    }
  }, [paramValue]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    storage.set('history', []);
  }, [storage]);

  const removeFromHistory = useCallback(
    /**
     * Remove entries by query string, or by predicate — the predicate form
     * exists because migrated legacy entries may predate the `query` field.
     *
     * @param {string | ((item: object) => boolean)} target
     */
    (target) => {
      const matches =
        typeof target === 'function' ? target : (item) => item.query === target;
      setHistory((prev) => {
        const next = prev.filter((item) => !matches(item));
        storage.set('history', next);
        return next;
      });
    },
    [storage]
  );

  return {
    query,
    setQuery,
    result,
    setResult,
    fromCache,
    loading,
    error,
    lookup,
    history,
    clearHistory,
    removeFromHistory,
  };
}
