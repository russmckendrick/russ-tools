import { describe, it, expect, afterEach, vi } from 'vitest';
import { onRequest as whois } from '../../../functions/api/whois.js';
import { onRequest as ssl } from '../../../functions/api/ssl.js';
import { onRequest as tenant } from '../../../functions/api/tenant.js';
import { guard, isLocalRuntime } from '../../../functions-lib/http.js';
import { SITE, call, stubUpstream } from './harness.js';

afterEach(() => vi.unstubAllGlobals());

const ENDPOINTS = [
  ['whois', whois, '/api/whois', '?query=example.com'],
  ['ssl', ssl, '/api/ssl', '?domain=example.com'],
  ['tenant', tenant, '/api/tenant', '?domain=example.com'],
];

const request = (url, { method = 'GET', headers = {} } = {}) => new Request(url, { method, headers });

const expectNoCors = (response) => {
  for (const [name] of response.headers) {
    expect(name.toLowerCase().startsWith('access-control-')).toBe(false);
  }
};

describe.each(ENDPOINTS)('/api/%s refuses anything that is not the site calling itself', (_name, handler, path, query) => {
  const refusals = [
    ['an Origin that is another site', { Origin: 'https://evil.example' }],
    ['an Origin that is a sibling subdomain', { Origin: 'https://other.russ.tools' }],
    ['a null Origin', { Origin: 'null' }],
    ['Sec-Fetch-Site: cross-site', { 'Sec-Fetch-Site': 'cross-site' }],
    ['Sec-Fetch-Site: same-site', { 'Sec-Fetch-Site': 'same-site' }],
    ['Sec-Fetch-Site: none (typed into the address bar)', { 'Sec-Fetch-Site': 'none' }],
    ['a matching Origin with a cross-site fetch', { Origin: SITE, 'Sec-Fetch-Site': 'cross-site' }],
    ['a localhost Origin against the production host', { Origin: 'http://localhost:4321' }],
  ];

  it.each(refusals)('403s %s without touching an upstream', async (_label, headers) => {
    const { fetchMock } = stubUpstream();
    const { response, status, body } = await call(handler, request(`${SITE}${path}${query}`, { headers }));

    expect(status).toBe(403);
    expect(body).toEqual({ error: expect.stringMatching(/same-origin/) });
    expect(response.headers.get('content-type')).toBe('application/json');
    expectNoCors(response);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('403s a cross-origin preflight, so the browser never sends the real request', async () => {
    stubUpstream();
    const { response, status } = await call(
      handler,
      request(`${SITE}${path}${query}`, {
        method: 'OPTIONS',
        headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'GET' },
      })
    );

    expect(status).toBe(403);
    expectNoCors(response);
  });

  const accepted = [
    ['Sec-Fetch-Site: same-origin and no Origin (a browser GET from the site)', { 'Sec-Fetch-Site': 'same-origin' }],
    ['a matching Origin', { Origin: SITE, 'Sec-Fetch-Site': 'same-origin' }],
    ['no fetch metadata at all (an old browser, or any non-browser client)', {}],
  ];

  it.each(accepted)('lets through %s', async (_label, headers) => {
    stubUpstream();
    const { response, status, body } = await call(handler, request(`${SITE}${path}`, { headers }));

    expect(status).toBe(400);
    expect(body.error).toMatch(/parameter is required/);
    expectNoCors(response);
  });

  it('treats a preview deployment as its own origin', async () => {
    stubUpstream();
    const preview = 'https://feat-branch.russ-tools.pages.dev';

    const own = await call(handler, request(`${preview}${path}`, { headers: { Origin: preview } }));
    expect(own.status).toBe(400);

    const production = await call(handler, request(`${preview}${path}`, { headers: { Origin: SITE } }));
    expect(production.status).toBe(403);
  });

  it.each(['POST', 'PUT', 'DELETE', 'OPTIONS'])('405s a same-origin %s', async (method) => {
    const { fetchMock } = stubUpstream();
    const { response, status, body } = await call(
      handler,
      request(`${SITE}${path}${query}`, { method, headers: { 'Sec-Fetch-Site': 'same-origin' } })
    );

    expect(status).toBe(405);
    expect(body).toEqual({ error: 'Method not allowed' });
    expect(response.headers.get('allow')).toBe('GET');
    expectNoCors(response);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('local development', () => {
  const local = 'http://127.0.0.1:8788/api/whois';

  it.each(['http://127.0.0.1:8788/x', 'http://localhost:4321/x', 'http://[::1]:8788/x'])(
    'recognises %s as the local runtime',
    (url) => {
      expect(isLocalRuntime(request(url))).toBe(true);
    }
  );

  it.each([`${SITE}/x`, 'https://feat.russ-tools.pages.dev/x', 'https://localhost.evil.example/x'])(
    'does not mistake %s for the local runtime',
    (url) => {
      expect(isLocalRuntime(request(url))).toBe(false);
    }
  );

  it.each(['http://localhost:4321', 'http://127.0.0.1:4321', 'http://localhost:8788'])(
    'accepts the loopback Origin %s when the function itself is on loopback',
    (origin) => {
      expect(guard(request(local, { headers: { Origin: origin, 'Sec-Fetch-Site': 'same-origin' } }))).toBe(null);
    }
  );

  it('still refuses a non-loopback Origin locally', () => {
    expect(guard(request(local, { headers: { Origin: 'https://evil.example' } })).status).toBe(403);
  });

  it('still refuses a cross-site fetch locally, even from another loopback port', () => {
    const refused = guard(
      request(local, { headers: { Origin: 'http://localhost:9000', 'Sec-Fetch-Site': 'cross-site' } })
    );
    expect(refused.status).toBe(403);
  });

  it('never applies the loopback allowance to a deployed host', () => {
    for (const host of [SITE, 'https://feat.russ-tools.pages.dev']) {
      const refused = guard(request(`${host}/api/whois`, { headers: { Origin: 'http://localhost:4321' } }));
      expect(refused.status).toBe(403);
    }
  });
});
