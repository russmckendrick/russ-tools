import { describe, it, expect, afterEach, vi } from 'vitest';
import { describeCookie, onRequest } from '../../../functions/api/headers.js';
import { call, sameOriginRequest, stubUpstream } from './harness.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const DOH = 'https://cloudflare-dns.com/dns-query';

const lookup = (target, options) =>
  call(onRequest, sameOriginRequest(`/api/headers?url=${encodeURIComponent(target)}`, options));

const dns = (records) => [
  (url) => url.startsWith(DOH),
  (url) => {
    const query = new URL(url).searchParams;
    const answers = records[query.get('name')]?.[query.get('type')] ?? [];
    const type = query.get('type') === 'A' ? 1 : 28;
    return {
      Status: records[query.get('name')] ? 0 : 3,
      Answer: answers.map((data) => ({ name: query.get('name'), type, data })),
    };
  },
];

const PUBLIC = { A: ['93.184.215.14'], AAAA: ['2606:2800:21f:cb07:6820:80da:af6b:8b2c'] };

const site = (prefix, respond) => [(url) => !url.startsWith(DOH) && url.startsWith(prefix), respond];
const reply = (status, headers = {}) => () => new Response(null, { status, headers });
const targetCalls = (calls) => calls.filter((entry) => !entry.url.startsWith(DOH));

describe('/api/headers reports what a public site sends', () => {
  it('returns the headers, the chain and cookie flags, and never a cookie value', async () => {
    const headers = new Headers({
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'Content-Security-Policy': "default-src 'self'",
      Server: 'nginx/1.25.3',
    });
    headers.append('Set-Cookie', 'sid=TOPSECRETVALUE; Path=/; Secure; HttpOnly; SameSite=Lax');
    headers.append('Set-Cookie', 'prefs=dark; Max-Age=3600; Domain=example.com');

    const { calls } = stubUpstream([
      dns({ 'example.com': PUBLIC }),
      site('https://example.com/', () => new Response(null, { status: 200, headers })),
    ]);

    const { status, body, response } = await lookup('example.com');

    expect(status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body).toEqual({
      success: true,
      requestedUrl: 'https://example.com/',
      finalUrl: 'https://example.com/',
      status: 200,
      method: 'HEAD',
      chain: [{ url: 'https://example.com/', status: 200, method: 'HEAD' }],
      headers: {
        'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
        'content-security-policy': "default-src 'self'",
        server: 'nginx/1.25.3',
      },
      truncatedHeaders: [],
      cookies: [
        {
          name: 'sid',
          secure: true,
          httpOnly: true,
          sameSite: 'Lax',
          path: '/',
          domain: null,
          persistent: false,
          partitioned: false,
        },
        {
          name: 'prefs',
          secure: false,
          httpOnly: false,
          sameSite: null,
          path: null,
          domain: 'example.com',
          persistent: true,
          partitioned: false,
        },
      ],
      timestamp: expect.any(Number),
      apiSource: 'russ.tools /api/headers',
    });
    expect(JSON.stringify(body)).not.toContain('TOPSECRETVALUE');
    expect(JSON.stringify(body)).not.toContain('dark');

    const [request] = targetCalls(calls);
    expect(request.method).toBe('HEAD');
    expect(request.headers['User-Agent']).toMatch(/^russ\.tools-http-headers\//);
    expect(Object.keys(request.headers).map((name) => name.toLowerCase())).not.toContain('cookie');
    expect(Object.keys(request.headers).map((name) => name.toLowerCase())).not.toContain('authorization');
  });

  it('asks for manual redirects and resolves the host before fetching it', async () => {
    const { calls, fetchMock } = stubUpstream([dns({ 'example.com': PUBLIC }), site('https://example.com/', reply(204))]);

    await lookup('https://example.com/');

    expect(calls.slice(0, 2).every((entry) => entry.url.startsWith(DOH))).toBe(true);
    const init = fetchMock.mock.calls.find(([url]) => !String(url).startsWith(DOH))[1];
    expect(init.redirect).toBe('manual');
    expect(init.credentials).toBeUndefined();
    expect(init.body).toBeUndefined();
  });

  it('falls back to GET when HEAD is refused, and never reads the body', async () => {
    const cancel = vi.fn();
    const body = new ReadableStream({ cancel });
    const { calls } = stubUpstream([
      dns({ 'example.com': PUBLIC }),
      site('https://example.com/', (_url, request) =>
        request.method === 'HEAD'
          ? new Response(null, { status: 405 })
          : new Response(body, { status: 200, headers: { 'X-Frame-Options': 'DENY' } })
      ),
    ]);

    const { body: result } = await lookup('example.com');

    expect(targetCalls(calls).map((entry) => entry.method)).toEqual(['HEAD', 'GET']);
    expect(result.method).toBe('GET');
    expect(result.status).toBe(200);
    expect(result.headers).toEqual({ 'x-frame-options': 'DENY' });
    expect(cancel).toHaveBeenCalled();
    expect(Object.keys(result)).not.toContain('body');
  });

  it('keeps the HEAD answer when GET fails outright', async () => {
    stubUpstream([
      dns({ 'example.com': PUBLIC }),
      site('https://example.com/', (_url, request) => {
        if (request.method === 'HEAD') return new Response(null, { status: 403, headers: { Server: 'edge' } });
        throw new TypeError('connection reset');
      }),
    ]);

    const { body } = await lookup('example.com');

    expect(body).toMatchObject({ success: true, status: 403, method: 'HEAD', headers: { server: 'edge' } });
  });

  it('follows redirects by hand and reports every hop', async () => {
    stubUpstream([
      dns({ 'example.com': PUBLIC, 'www.example.com': PUBLIC }),
      site('http://example.com/', reply(301, { Location: 'https://example.com/' })),
      site('https://example.com/', reply(302, { Location: '//www.example.com/home#top' })),
      site('https://www.example.com/home', reply(200, { 'Referrer-Policy': 'no-referrer' })),
    ]);

    const { body } = await lookup('http://example.com');

    expect(body.success).toBe(true);
    expect(body.requestedUrl).toBe('http://example.com/');
    expect(body.finalUrl).toBe('https://www.example.com/home');
    expect(body.chain).toEqual([
      { url: 'http://example.com/', status: 301, method: 'HEAD', location: 'https://example.com/' },
      { url: 'https://example.com/', status: 302, method: 'HEAD', location: 'https://www.example.com/home' },
      { url: 'https://www.example.com/home', status: 200, method: 'HEAD' },
    ]);
    expect(body.headers).toEqual({ 'referrer-policy': 'no-referrer' });
  });

  it('truncates an oversized header and says which', async () => {
    stubUpstream([
      dns({ 'example.com': PUBLIC }),
      site('https://example.com/', reply(200, { 'Content-Security-Policy': `default-src ${'a'.repeat(20000)}` })),
    ]);

    const { body } = await lookup('example.com');

    expect(body.headers['content-security-policy']).toHaveLength(16384);
    expect(body.truncatedHeaders).toEqual(['content-security-policy']);
  });
});

describe('/api/headers refuses targets before any request leaves', () => {
  it('needs a url', async () => {
    const { fetchMock } = stubUpstream();
    const { status, body } = await call(onRequest, sameOriginRequest('/api/headers'));

    expect(status).toBe(400);
    expect(body).toEqual({ error: 'URL parameter is required' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['http://127.0.0.1', 'blocked_address'],
    ['http://127.0.0.1:8788/api/whois?query=example.com', 'blocked_port'],
    ['http://169.254.169.254', 'blocked_address'],
    ['http://169.254.169.254/latest/meta-data/iam/security-credentials/', 'blocked_address'],
    ['http://10.0.0.1', 'blocked_address'],
    ['http://172.16.5.4', 'blocked_address'],
    ['http://192.168.1.1', 'blocked_address'],
    ['http://100.64.0.1', 'blocked_address'],
    ['http://[::1]', 'blocked_address'],
    ['http://[fd00:ec2::254]', 'blocked_address'],
    ['http://[fe80::1]', 'blocked_address'],
    ['http://2130706433', 'blocked_address'],
    ['http://0x7f.1', 'blocked_address'],
    ['http://8.8.8.8', 'blocked_address'],
    ['http://localhost', 'blocked_host'],
    ['http://printer.local', 'blocked_host'],
    ['http://db.internal', 'blocked_host'],
    ['http://metadata.google.internal', 'blocked_host'],
    ['https://example.com:8443', 'blocked_port'],
    ['ftp://example.com', 'blocked_scheme'],
    ['file:///etc/passwd', 'blocked_scheme'],
    ['https://user:pass@example.com', 'blocked_credentials'],
    ['not a url', 'invalid_url'],
  ])('refuses %s (%s) with a 400 and no outbound request', async (target, code) => {
    const { fetchMock } = stubUpstream();
    const { status, body, response } = await lookup(target);

    expect(status).toBe(400);
    expect(body).toEqual({ error: expect.any(String), code });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not answer its own outbound requests', async () => {
    const { fetchMock } = stubUpstream();
    const { status, body } = await lookup('example.com', {
      headers: { 'User-Agent': 'russ.tools-http-headers/1.0 (+https://russ.tools/http-headers)' },
    });

    expect(status).toBe(400);
    expect(body.code).toBe('blocked_host');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('/api/headers refuses hosts that resolve somewhere private', () => {
  it.each([
    ['an A record on loopback', { A: ['127.0.0.1'] }],
    ['an A record in RFC 1918 space', { A: ['10.20.30.40'] }],
    ['the metadata address', { A: ['169.254.169.254'] }],
    ['a CGNAT address', { A: ['100.64.1.1'] }],
    ['a unique-local AAAA record', { AAAA: ['fd00::1'] }],
    ['an IPv4-mapped AAAA record', { AAAA: ['::ffff:10.0.0.1'] }],
    ['one private address among public ones', { A: ['93.184.215.14', '192.168.0.10'] }],
  ])('stops at %s without fetching the host', async (_label, records) => {
    const { calls } = stubUpstream([dns({ 'rebind.example.com': records }), site('https://rebind.example.com/', reply(200))]);

    const { status, body } = await lookup('rebind.example.com');

    expect(status).toBe(200);
    expect(body).toMatchObject({
      success: false,
      requestedUrl: 'https://rebind.example.com/',
      chain: [],
      error: { code: 'blocked_address' },
    });
    expect(targetCalls(calls)).toEqual([]);
  });

  it('reports a name that does not resolve', async () => {
    const { calls } = stubUpstream([dns({})]);
    const { body } = await lookup('nowhere.example.com');

    expect(body).toMatchObject({ success: false, error: { code: 'dns_not_found' } });
    expect(targetCalls(calls)).toEqual([]);
  });

  it('fails closed when the resolver cannot be reached', async () => {
    const { calls } = stubUpstream([
      [(url) => url.startsWith(DOH), () => new Response('nope', { status: 503 })],
      site('https://example.com/', reply(200)),
    ]);
    const { body } = await lookup('example.com');

    expect(body).toMatchObject({ success: false, error: { code: 'dns_unavailable' } });
    expect(targetCalls(calls)).toEqual([]);
  });
});

describe('/api/headers re-validates every redirect', () => {
  it.each([
    ['a loopback address', 'http://127.0.0.1/admin', 'blocked_address'],
    ['the metadata address', 'http://169.254.169.254/latest/meta-data/', 'blocked_address'],
    ['a private address', 'http://192.168.1.1/', 'blocked_address'],
    ['localhost', 'http://localhost/', 'blocked_host'],
    ['an internal name', 'https://vault.internal/', 'blocked_host'],
    ['another port', 'https://example.com:8443/', 'blocked_port'],
    ['another scheme', 'ftp://example.com/file', 'blocked_scheme'],
    ['a URL with credentials', 'https://admin:hunter2@example.com/', 'blocked_credentials'],
  ])('stops at a redirect to %s and never requests it', async (_label, location, code) => {
    const { calls } = stubUpstream([
      dns({ 'example.com': PUBLIC }),
      site('https://example.com/', reply(302, { Location: location })),
    ]);

    const { status, body } = await lookup('example.com');

    expect(status).toBe(200);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(code);
    expect(body.error.message).toMatch(/^The site redirects to a target that is not checked/);
    expect(body.chain).toHaveLength(1);
    expect(body.chain[0]).toMatchObject({ url: 'https://example.com/', status: 302 });
    expect(targetCalls(calls).map((entry) => entry.url)).toEqual(['https://example.com/']);
    expect(body.headers).toBeUndefined();
  });

  it('stops at a redirect to a public name that resolves privately', async () => {
    const { calls } = stubUpstream([
      dns({ 'example.com': PUBLIC, 'inside.example.net': { A: ['10.0.0.5'] } }),
      site('https://example.com/', reply(301, { Location: 'https://inside.example.net/' })),
      site('https://inside.example.net/', reply(200)),
    ]);

    const { body } = await lookup('example.com');

    expect(body).toMatchObject({ success: false, error: { code: 'blocked_address' } });
    expect(body.chain).toEqual([
      { url: 'https://example.com/', status: 301, method: 'HEAD', location: 'https://inside.example.net/' },
    ]);
    expect(targetCalls(calls).map((entry) => entry.url)).toEqual(['https://example.com/']);
  });

  it('gives up after five redirects', async () => {
    let hop = 0;
    const { calls } = stubUpstream([
      dns({ 'example.com': PUBLIC }),
      site('https://example.com/', () => {
        hop += 1;
        return new Response(null, { status: 302, headers: { Location: `/hop-${hop}` } });
      }),
    ]);

    const { body } = await lookup('example.com');

    expect(body).toMatchObject({ success: false, error: { code: 'too_many_redirects' } });
    expect(body.chain).toHaveLength(6);
    expect(targetCalls(calls)).toHaveLength(6);
  });

  it('reports a redirect with no Location', async () => {
    stubUpstream([dns({ 'example.com': PUBLIC }), site('https://example.com/', reply(301))]);
    const { body } = await lookup('example.com');

    expect(body).toMatchObject({ success: false, error: { code: 'bad_redirect' } });
  });
});

describe('/api/headers failures', () => {
  it('reports a site that cannot be reached', async () => {
    stubUpstream([
      dns({ 'example.com': PUBLIC }),
      site('https://example.com/', () => {
        throw new TypeError('connect ECONNREFUSED');
      }),
    ]);

    const { status, body } = await lookup('example.com');

    expect(status).toBe(200);
    expect(body).toMatchObject({ success: false, chain: [], error: { code: 'unreachable' } });
  });

  it('gives up after eight seconds', async () => {
    vi.useFakeTimers();
    const answers = dns({ 'example.com': PUBLIC })[1];
    vi.stubGlobal(
      'fetch',
      vi.fn((url, init) =>
        url.startsWith(DOH)
          ? Promise.resolve(new Response(JSON.stringify(answers(url))))
          : new Promise((_resolve, reject) => {
              init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
            })
      )
    );

    const pending = lookup('example.com');
    await vi.advanceTimersByTimeAsync(8000);
    const { body } = await pending;

    expect(body).toMatchObject({ success: false, error: { code: 'timeout' } });
  });
});

describe('describeCookie', () => {
  it('keeps the name and the flags and nothing else', () => {
    expect(describeCookie('__Host-session=abc.def.ghi; path=/; secure; httponly; samesite=Strict; Partitioned')).toEqual({
      name: '__Host-session',
      secure: true,
      httpOnly: true,
      sameSite: 'Strict',
      path: '/',
      domain: null,
      persistent: false,
      partitioned: true,
    });
  });

  it('reads a value that itself contains equals signs and semicolons in quotes', () => {
    const cookie = describeCookie('token=a=b=c; Expires=Wed, 21 Oct 2026 07:28:00 GMT');
    expect(cookie.name).toBe('token');
    expect(cookie.persistent).toBe(true);
    expect(Object.values(cookie)).not.toContain('a=b=c');
  });

  it('survives a nameless cookie', () => {
    expect(describeCookie('justavalue').name).toBe('');
  });
});
