// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost/" }
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderHook, act, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useLookupTool } from './useLookupTool.js';

afterEach(cleanup);
beforeEach(() => localStorage.clear());

const wrapperAt = (path, routePath) =>
  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={routePath} element={children} />
        </Routes>
      </MemoryRouter>
    );
  };

const plainWrapper = wrapperAt('/tool', '/tool');

describe('useLookupTool', () => {
  it('fetches, stores the result, and records namespaced history', async () => {
    const fetcher = vi.fn().mockResolvedValue({ answer: 42 });
    const { result } = renderHook(
      () => useLookupTool({ toolId: 'test-tool', fetcher, onSuccess: () => {} }),
      { wrapper: plainWrapper }
    );

    await act(() => result.current.lookup('  Example.COM '));

    expect(fetcher).toHaveBeenCalledWith('example.com', expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(result.current.result).toEqual({ answer: 42 });
    expect(result.current.fromCache).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.history[0]).toMatchObject({ query: 'example.com' });
    expect(JSON.parse(localStorage.getItem('rt:test-tool:history'))[0].query).toBe('example.com');
  });

  it('serves the second lookup from cache without touching the fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValue({ answer: 1 });
    const { result } = renderHook(
      () => useLookupTool({ toolId: 'test-tool', fetcher, onSuccess: () => {} }),
      { wrapper: plainWrapper }
    );

    await act(() => result.current.lookup('example.com'));
    await act(() => result.current.lookup('example.com'));

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.current.fromCache).toBe(true);
    expect(result.current.result).toEqual({ answer: 1 });
  });

  it('compound cache keys keep contexts apart', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(
      () =>
        useLookupTool({
          toolId: 'test-tool',
          fetcher,
          cacheKey: (q, ctx) => `${ctx.type}:${q}`,
          onSuccess: () => {},
        }),
      { wrapper: plainWrapper }
    );

    await act(() => result.current.lookup('example.com', { type: 'A' }));
    await act(() => result.current.lookup('example.com', { type: 'MX' }));

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('reports errors and records no history for them', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('worker exploded'));
    const { result } = renderHook(
      () => useLookupTool({ toolId: 'test-tool', fetcher, onError: () => {} }),
      { wrapper: plainWrapper }
    );

    await act(() => result.current.lookup('example.com'));

    expect(result.current.error).toBe('worker exploded');
    expect(result.current.result).toBe(null);
    expect(result.current.history).toEqual([]);
  });

  it('dedupes history by query and caps it at maxHistory', async () => {
    const fetcher = vi.fn().mockResolvedValue({});
    const { result } = renderHook(
      () =>
        useLookupTool({
          toolId: 'test-tool',
          fetcher,
          maxHistory: 3,
          cacheKey: (q) => q,
          onSuccess: () => {},
        }),
      { wrapper: plainWrapper }
    );

    for (const q of ['a.com', 'b.com', 'c.com', 'a.com', 'd.com']) {
      await act(() => result.current.lookup(q));
    }

    expect(result.current.history.map((h) => h.query)).toEqual(['d.com', 'a.com', 'c.com']);
  });

  it('runs the deep-link param through the lookup on mount', async () => {
    const fetcher = vi.fn().mockResolvedValue({ found: true });
    const { result } = renderHook(
      () =>
        useLookupTool({ toolId: 'test-tool', fetcher, urlParam: 'query', onSuccess: () => {} }),
      { wrapper: wrapperAt('/tool/Example.com', '/tool/:query') }
    );

    await waitFor(() => expect(result.current.result).toEqual({ found: true }));
    expect(result.current.query).toBe('Example.com');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith('example.com', expect.anything());
  });

  it('reads legacy history forward without deleting the old key', () => {
    localStorage.setItem(
      'old-tool-history',
      JSON.stringify([{ query: 'legacy.com', timestamp: 1 }])
    );

    const { result } = renderHook(
      () =>
        useLookupTool({
          toolId: 'test-tool',
          fetcher: vi.fn(),
          legacy: { history: 'old-tool-history' },
        }),
      { wrapper: plainWrapper }
    );

    expect(result.current.history).toEqual([{ query: 'legacy.com', timestamp: 1 }]);
    expect(localStorage.getItem('old-tool-history')).not.toBe(null);
    expect(JSON.parse(localStorage.getItem('rt:test-tool:history'))[0].query).toBe('legacy.com');
  });

  it('a new lookup aborts the one in flight', async () => {
    let firstSignal;
    const fetcher = vi
      .fn()
      .mockImplementationOnce(
        (q, { signal }) =>
          new Promise((_, reject) => {
            firstSignal = signal;
            // A real apiFetch rejects when its signal aborts; the fake must
            // too, or the first lookup's promise never settles.
            signal.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError'))
            );
          })
      )
      .mockResolvedValueOnce({ second: true });

    const { result } = renderHook(
      () => useLookupTool({ toolId: 'test-tool', fetcher, onSuccess: () => {} }),
      { wrapper: plainWrapper }
    );

    let first;
    act(() => {
      first = result.current.lookup('slow.com');
    });
    await act(() => result.current.lookup('fast.com'));
    await act(() => first);

    expect(firstSignal.aborted).toBe(true);
    expect(result.current.result).toEqual({ second: true });
    expect(result.current.loading).toBe(false);
  });

  it('clearHistory and removeFromHistory write through to storage', async () => {
    const fetcher = vi.fn().mockResolvedValue({});
    const { result } = renderHook(
      () => useLookupTool({ toolId: 'test-tool', fetcher, onSuccess: () => {} }),
      { wrapper: plainWrapper }
    );

    await act(() => result.current.lookup('a.com'));
    await act(() => result.current.lookup('b.com'));

    act(() => result.current.removeFromHistory('a.com'));
    expect(result.current.history.map((h) => h.query)).toEqual(['b.com']);

    act(() => result.current.clearHistory());
    expect(result.current.history).toEqual([]);
    expect(JSON.parse(localStorage.getItem('rt:test-tool:history'))).toEqual([]);
  });
});
