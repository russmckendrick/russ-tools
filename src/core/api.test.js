import { describe, it, expect, vi } from 'vitest';
import { apiFetch, apiJson, buildUrl, ApiError } from './api.js';

/**
 * These tests pin the three behaviours that separate this client from the
 * `apiUtils.js` it replaces: a 4xx is never retried, a 5xx is, and the
 * decision is made on the status code rather than on browser-specific error
 * message text.
 */

const ok = (body = { ok: true }) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

const status = (code) => new Response('nope', { status: code, statusText: 'x' });

describe('buildUrl', () => {
  it('appends parameters and skips empty ones', () => {
    expect(
      buildUrl('https://api.example.com/dns', { domain: 'a.com', type: null, extra: undefined, q: '' })
    ).toBe('https://api.example.com/dns?domain=a.com');
  });

  it('returns the base URL untouched when there is nothing to add', () => {
    expect(buildUrl('https://api.example.com/dns')).toBe('https://api.example.com/dns');
  });
});

describe('apiFetch', () => {
  it('returns a 2xx response without retrying', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok());
    const response = await apiFetch('https://x.test/a', { fetchImpl });

    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('does NOT retry a 404 — it is an answer, not a failure', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(status(404));

    await expect(apiFetch('https://x.test/a', { fetchImpl, retries: 3 })).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('retries a 503 and succeeds on a later attempt', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(status(503))
      .mockResolvedValueOnce(ok({ recovered: true }));

    const response = await apiFetch('https://x.test/a', { fetchImpl, retries: 2, retryDelay: 0 });

    expect(await response.json()).toEqual({ recovered: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('retries 429 and 500 but gives up after the configured attempts', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(status(429));

    await expect(
      apiFetch('https://x.test/a', { fetchImpl, retries: 2, retryDelay: 0 })
    ).rejects.toMatchObject({ status: 429 });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('retries a transport failure regardless of the message text', async () => {
    // Firefox and Safari do not say "Failed to fetch"; the old client keyed
    // off exactly that string and so never retried on either.
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('NetworkError when attempting to fetch resource.'))
      .mockResolvedValueOnce(ok());

    await expect(
      apiFetch('https://x.test/a', { fetchImpl, retries: 1, retryDelay: 0 })
    ).resolves.toBeInstanceOf(Response);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('reports a transport failure as a status-less ApiError', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('Load failed'));

    const error = await apiFetch('https://x.test/a', {
      fetchImpl,
      retries: 0,
    }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.isTransport).toBe(true);
    expect(error.status).toBe(0);
  });

  it('gives up immediately when the caller has aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchImpl = vi.fn().mockResolvedValue(ok());

    await expect(
      apiFetch('https://x.test/a', { fetchImpl, signal: controller.signal })
    ).rejects.toThrow('Request cancelled');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('applies a real deadline', async () => {
    // The default client is the one under test here: no fetchImpl, so the
    // AbortController path runs for real.
    const slowFetch = (url, init) =>
      new Promise((_, reject) => {
        init.signal.addEventListener('abort', () => reject(new Error('aborted')));
      });
    const original = globalThis.fetch;
    globalThis.fetch = slowFetch;

    try {
      await expect(
        apiFetch('https://x.test/a', { timeout: 10, retries: 0 })
      ).rejects.toMatchObject({ name: 'ApiError', status: 0 });
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe('apiJson', () => {
  it('parses a JSON body', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(ok({ tenant: 'contoso' }));
    expect(await apiJson('https://x.test/a', { fetchImpl })).toEqual({ tenant: 'contoso' });
  });

  it('raises a clear error when the worker returns HTML', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response('<!doctype html><h1>502</h1>', { status: 200 }));

    await expect(apiJson('https://x.test/a', { fetchImpl })).rejects.toThrow(
      'Response was not valid JSON'
    );
  });
});
