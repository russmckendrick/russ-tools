import { test, expect } from '@playwright/test';

const lowerCased = (headers) =>
  Object.fromEntries(Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]));

const ENDPOINTS = [
  ['/api/whois', 'query', 'Query parameter is required'],
  ['/api/ssl', 'domain', 'Domain parameter is required'],
  ['/api/tenant', 'domain', 'Domain parameter is required'],
];

for (const [path, param, missing] of ENDPOINTS) {
  test.describe(path, () => {
    test("answers the site's own pages", async ({ page }) => {
      await page.goto('/');

      const result = await page.evaluate(async (url) => {
        const response = await fetch(url);
        return {
          status: response.status,
          type: response.headers.get('content-type'),
          cors: response.headers.get('access-control-allow-origin'),
          body: await response.json(),
        };
      }, path);

      expect(result).toEqual({
        status: 400,
        type: 'application/json',
        cors: null,
        body: { error: missing },
      });
    });

    for (const [label, headers] of [
      ['another Origin', { Origin: 'https://evil.example' }],
      ['a cross-site fetch', { 'Sec-Fetch-Site': 'cross-site' }],
      ['a same-site fetch from a sibling host', { 'Sec-Fetch-Site': 'same-site' }],
      ['a typed-in address', { 'Sec-Fetch-Site': 'none' }],
    ]) {
      test(`refuses ${label}`, async ({ request }) => {
        const response = await request.get(`${path}?${param}=example.com`, { headers });

        expect(response.status()).toBe(403);
        expect(response.headers()['content-type']).toBe('application/json');
        expect(response.headers()['access-control-allow-origin']).toBeUndefined();
        expect((await response.json()).error).toMatch(/same-origin/);
      });
    }

    test('refuses a cross-origin preflight', async ({ request }) => {
      const response = await request.fetch(`${path}?${param}=example.com`, {
        method: 'OPTIONS',
        headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'GET' },
      });

      expect(response.status()).toBe(403);
      expect(response.headers()['access-control-allow-origin']).toBeUndefined();
    });

    test('accepts GET only', async ({ request }) => {
      const response = await request.post(`${path}?${param}=example.com`, {
        headers: { 'Sec-Fetch-Site': 'same-origin' },
      });

      expect(response.status()).toBe(405);
      expect(await response.json()).toEqual({ error: 'Method not allowed' });
    });
  });
}

test('a page on another origin cannot call or read the API', async ({ page, baseURL }) => {
  const api = new URL(baseURL);

  let other;
  if (api.hostname === '127.0.0.1' || api.hostname === 'localhost') {
    other = new URL(baseURL);
    other.hostname = api.hostname === 'localhost' ? '127.0.0.1' : 'localhost';
  } else {
    other = new URL('https://cross-origin.example/');
    await page.route(`${other.origin}/**`, (route) =>
      route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>another site</title>' })
    );
  }

  await page.goto(other.href);
  expect(new URL(page.url()).origin).not.toBe(api.origin);

  const target = `${api.origin}/api/whois`;

  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  const wire = { sent: null, status: null, received: null };
  let requestId;
  cdp.on('Network.requestWillBeSent', (event) => {
    if (event.request.url === target) requestId = event.requestId;
  });
  cdp.on('Network.requestWillBeSentExtraInfo', (event) => {
    if (event.requestId === requestId) wire.sent = lowerCased(event.headers);
  });
  cdp.on('Network.responseReceivedExtraInfo', (event) => {
    if (event.requestId === requestId) {
      wire.status = event.statusCode;
      wire.received = lowerCased(event.headers);
    }
  });

  const outcome = await page.evaluate(async (url) => {
    try {
      const response = await fetch(url);
      return { read: true, status: response.status };
    } catch (error) {
      return { read: false, error: error.name };
    }
  }, target);

  expect(outcome).toEqual({ read: false, error: 'TypeError' });

  await expect.poll(() => wire.status).toBe(403);
  expect(wire.sent.origin).toBe(other.origin);
  expect(wire.sent['sec-fetch-site']).toBe('cross-site');
  expect(wire.received['access-control-allow-origin']).toBeUndefined();
});
