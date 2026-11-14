import { describe, it, expect } from 'vitest';
import { analyse, analyseChain, analyseCookie, parseCsp, parseHsts, toPlain } from './analyse.js';

const result = (headers = {}, extra = {}) => ({
  success: true,
  requestedUrl: 'https://example.com/',
  finalUrl: 'https://example.com/',
  status: 200,
  method: 'HEAD',
  chain: [{ url: 'https://example.com/', status: 200, method: 'HEAD' }],
  headers,
  truncatedHeaders: [],
  cookies: [],
  ...extra,
});

const check = (id, headers, extra) => analyse(result(headers, extra)).checks.find((item) => item.id === id);

const HARDENED = {
  'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
  'content-security-policy': "default-src 'self'; script-src 'self' 'nonce-abc123'; frame-ancestors 'none'",
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-embedder-policy': 'require-corp',
  'cross-origin-resource-policy': 'same-origin',
};

describe('analyse', () => {
  it('passes a hardened response on every check', () => {
    const report = analyse(result(HARDENED));

    expect(report.checks.map((item) => [item.id, item.status])).toEqual([
      ['hsts', 'pass'],
      ['csp', 'pass'],
      ['content-type-options', 'pass'],
      ['framing', 'pass'],
      ['referrer-policy', 'pass'],
      ['permissions-policy', 'pass'],
      ['coop', 'pass'],
      ['coep', 'pass'],
      ['corp', 'pass'],
      ['leak-server', 'pass'],
      ['leak-x-powered-by', 'pass'],
    ]);
    expect(report.counts).toEqual({ pass: 11, warn: 0, fail: 0, info: 0 });
  });

  it('reports a bare response: three failures, three warnings, three notes', () => {
    const report = analyse(result({}));

    expect(Object.fromEntries(report.checks.map((item) => [item.id, item.status]))).toEqual({
      hsts: 'fail',
      csp: 'fail',
      'content-type-options': 'warn',
      framing: 'fail',
      'referrer-policy': 'warn',
      'permissions-policy': 'warn',
      coop: 'info',
      coep: 'info',
      corp: 'info',
      'leak-server': 'pass',
      'leak-x-powered-by': 'pass',
    });
    expect(report.counts).toEqual({ pass: 2, warn: 3, fail: 3, info: 3 });
    expect(report.checks.every((item) => item.purpose.endsWith('.') && item.finding.length > 0)).toBe(true);
    expect(report.checks.filter((item) => !item.id.startsWith('leak-')).every((item) => item.present === false)).toBe(true);
  });

  it('counts cookies with the header checks', () => {
    const report = analyse(
      result(HARDENED, {
        cookies: [
          { name: 'sid', secure: true, httpOnly: true, sameSite: 'Lax', path: '/', domain: null, persistent: false, partitioned: false },
          { name: 'theme', secure: false, httpOnly: false, sameSite: null, path: null, domain: null, persistent: true, partitioned: false },
        ],
      })
    );

    expect(report.cookies.map((cookie) => cookie.status)).toEqual(['pass', 'fail']);
    expect(report.counts).toEqual({ pass: 12, warn: 0, fail: 1, info: 0 });
  });

  it('never invents a grade', () => {
    const report = analyse(result(HARDENED));
    expect(Object.keys(report)).not.toContain('grade');
    expect(Object.keys(report)).not.toContain('score');
  });

  it('survives a result with nothing in it', () => {
    expect(() => analyse({})).not.toThrow();
    expect(analyse({}).counts.fail).toBeGreaterThan(0);
  });
});

describe('Strict-Transport-Security', () => {
  it.each([
    ['max-age=31536000', 'pass', /max-age is 1 year\. includeSubDomains is not set/],
    ['max-age=63072000; includeSubDomains; preload', 'pass', /max-age is 2 years\. Subdomains are covered\. preload is set\./],
    ['max-age=15552000; includeSubDomains', 'warn', /max-age is 180 days, under the one year/],
    ['max-age=86400', 'warn', /max-age is 1 day, under/],
    ['max-age=300', 'warn', /300 seconds/],
    ['max-age=0', 'fail', /forget the policy/],
    ['includeSubDomains', 'fail', /No readable max-age/],
    ['max-age=abc', 'fail', /No readable max-age/],
    ['MAX-AGE="31536000"; INCLUDESUBDOMAINS', 'pass', /Subdomains are covered/],
    ['max-age=31536000; preload', 'pass', /preload list also needs includeSubDomains/],
  ])('%s → %s', (value, status, finding) => {
    const hsts = check('hsts', { 'strict-transport-security': value });
    expect(hsts.status).toBe(status);
    expect(hsts.finding).toMatch(finding);
    expect(hsts.present).toBe(true);
  });

  it('fails when missing', () => {
    expect(check('hsts', {})).toMatchObject({ status: 'fail', present: false, sources: [{ name: 'Strict-Transport-Security', value: null }] });
  });

  it('fails over plain HTTP even when the header is sent', () => {
    const hsts = check('hsts', { 'strict-transport-security': 'max-age=63072000' }, { finalUrl: 'http://example.com/' });
    expect(hsts.status).toBe('fail');
    expect(hsts.finding).toMatch(/plain HTTP/);
  });

  it('reads the first header when two were sent', () => {
    expect(parseHsts('max-age=100, max-age=63072000; includeSubDomains')).toEqual({
      maxAge: 100,
      includeSubDomains: false,
      preload: false,
    });
  });
});

describe('Content-Security-Policy', () => {
  it.each([
    ["default-src 'self'", 'pass', /Restricts scripts/],
    ["script-src 'self' https://cdn.example.com; object-src 'none'", 'pass', /Restricts scripts/],
    ["default-src 'self' 'unsafe-inline'", 'warn', /unsafe-inline/],
    ["script-src 'self' 'unsafe-inline' 'unsafe-eval'", 'warn', /unsafe-inline.*; and allows 'unsafe-eval'/],
    ["script-src 'nonce-r4nd0m' 'unsafe-inline'", 'pass', /Restricts scripts/],
    ["script-src 'sha256-abc=' 'unsafe-inline' 'strict-dynamic'", 'pass', /Restricts scripts/],
    ["script-src 'self' 'unsafe-eval'", 'warn', /unsafe-eval/],
    ['script-src *', 'warn', /wildcard/],
    ["default-src https: 'self'", 'warn', /wildcard or a bare scheme/],
    ["script-src 'self' data:", 'warn', /data: URLs/],
    ["img-src 'self'; frame-ancestors 'none'", 'warn', /neither script-src nor default-src/],
    ["default-src 'none'; script-src 'self' 'UNSAFE-INLINE'", 'warn', /unsafe-inline/],
  ])('%s → %s', (value, status, finding) => {
    const csp = check('csp', { 'content-security-policy': value });
    expect(csp.status).toBe(status);
    expect(csp.finding).toMatch(finding);
  });

  it('prefers script-src to default-src, as browsers do', () => {
    expect(check('csp', { 'content-security-policy': "default-src 'unsafe-inline'; script-src 'self'" }).status).toBe('pass');
  });

  it('fails when missing, and only warns when a report-only policy stands in', () => {
    expect(check('csp', {})).toMatchObject({ status: 'fail', present: false });

    const reportOnly = check('csp', { 'content-security-policy-report-only': "default-src 'self'" });
    expect(reportOnly).toMatchObject({ status: 'warn', present: false });
    expect(reportOnly.finding).toMatch(/blocks nothing/);
    expect(reportOnly.sources.map((source) => source.name)).toEqual([
      'Content-Security-Policy',
      'Content-Security-Policy-Report-Only',
    ]);
  });

  it('treats two policies as the intersection browsers enforce', () => {
    expect(
      check('csp', { 'content-security-policy': "script-src 'self' 'unsafe-inline', script-src 'self'" }).status
    ).toBe('pass');
    expect(
      check('csp', { 'content-security-policy': "script-src 'unsafe-inline', default-src 'unsafe-inline'" }).status
    ).toBe('warn');
  });

  it('parses directives case-insensitively and keeps the first of a duplicate', () => {
    const [policy] = parseCsp("Script-Src 'self'; script-src *;  ; IMG-SRC data:");
    expect([...policy.keys()]).toEqual(['script-src', 'img-src']);
    expect(policy.get('script-src')).toEqual(["'self'"]);
  });
});

describe('X-Content-Type-Options', () => {
  it.each([
    ['nosniff', 'pass'],
    ['NoSniff', 'pass'],
    ['nosniff, nosniff', 'pass'],
    ['none', 'warn'],
  ])('%s → %s', (value, status) => {
    expect(check('content-type-options', { 'x-content-type-options': value }).status).toBe(status);
  });

  it('warns when missing', () => {
    expect(check('content-type-options', {})).toMatchObject({ status: 'warn', present: false });
  });
});

describe('framing: X-Frame-Options and CSP frame-ancestors', () => {
  it.each([
    [{ 'x-frame-options': 'DENY' }, 'pass', /cannot be framed/],
    [{ 'x-frame-options': 'sameorigin' }, 'pass', /only the site itself/],
    [{ 'x-frame-options': 'ALLOW-FROM https://example.org' }, 'warn', /obsolete/],
    [{ 'x-frame-options': 'yes' }, 'warn', /DENY or SAMEORIGIN/],
    [{ 'content-security-policy': "frame-ancestors 'none'" }, 'pass', /frame-ancestors restricts framing\.$/],
    [{ 'content-security-policy': "default-src 'self'; frame-ancestors 'self' https://partner.example" }, 'pass', /restricts/],
    [{ 'content-security-policy': 'frame-ancestors *' }, 'warn', /any site/],
    [{ 'content-security-policy': 'frame-ancestors https:' }, 'warn', /any site/],
    [{ 'x-frame-options': 'DENY', 'content-security-policy': "frame-ancestors 'self'" }, 'pass', /ignore X-Frame-Options/],
    [{ 'content-security-policy': "default-src 'self'" }, 'fail', /Neither header/],
    [{}, 'fail', /Neither header/],
  ])('%j → %s', (headers, status, finding) => {
    const framing = check('framing', headers);
    expect(framing.status).toBe(status);
    expect(framing.finding).toMatch(finding);
  });

  it('shows both values', () => {
    const framing = check('framing', { 'x-frame-options': 'DENY', 'content-security-policy': "frame-ancestors 'none'" });
    expect(framing.sources).toEqual([
      { name: 'X-Frame-Options', value: 'DENY' },
      { name: 'CSP frame-ancestors', value: "'none'" },
    ]);
  });
});

describe('Referrer-Policy', () => {
  it.each([
    ['no-referrer', 'pass'],
    ['strict-origin-when-cross-origin', 'pass'],
    ['same-origin', 'pass'],
    ['unsafe-url', 'warn'],
    ['no-referrer-when-downgrade', 'warn'],
    ['no-referrer, strict-origin-when-cross-origin', 'pass'],
    ['strict-origin, unsafe-url', 'warn'],
    ['unsafe-url, some-future-policy', 'warn'],
    ['made-up', 'warn'],
  ])('%s → %s', (value, status) => {
    expect(check('referrer-policy', { 'referrer-policy': value }).status).toBe(status);
  });

  it('warns when missing and names the browser default', () => {
    expect(check('referrer-policy', {}).finding).toMatch(/strict-origin-when-cross-origin/);
  });
});

describe('Permissions-Policy', () => {
  it('passes when set and counts the features', () => {
    expect(check('permissions-policy', { 'permissions-policy': 'camera=(), geolocation=(self)' }).finding).toBe(
      'Sets a policy for 2 features.'
    );
  });

  it('warns on the retired Feature-Policy alone', () => {
    const policy = check('permissions-policy', { 'feature-policy': "camera 'none'" });
    expect(policy).toMatchObject({ status: 'warn', present: false });
    expect(policy.finding).toMatch(/retired Feature-Policy/);
  });

  it('warns when missing', () => {
    expect(check('permissions-policy', {}).status).toBe('warn');
  });
});

describe('cross-origin isolation headers', () => {
  it.each([
    ['coop', 'cross-origin-opener-policy', 'same-origin', 'pass'],
    ['coop', 'cross-origin-opener-policy', 'same-origin-allow-popups', 'pass'],
    ['coop', 'cross-origin-opener-policy', 'same-origin; report-to="coop"', 'pass'],
    ['coop', 'cross-origin-opener-policy', 'unsafe-none', 'info'],
    ['coop', 'cross-origin-opener-policy', 'bogus', 'warn'],
    ['coep', 'cross-origin-embedder-policy', 'require-corp', 'pass'],
    ['coep', 'cross-origin-embedder-policy', 'credentialless', 'pass'],
    ['coep', 'cross-origin-embedder-policy', 'unsafe-none', 'info'],
    ['corp', 'cross-origin-resource-policy', 'same-site', 'pass'],
    ['corp', 'cross-origin-resource-policy', 'cross-origin', 'info'],
  ])('%s: %s: %s → %s', (id, header, value, status) => {
    expect(check(id, { [header]: value }).status).toBe(status);
  });

  it('notes, and does not penalise, a missing isolation header', () => {
    for (const id of ['coop', 'coep', 'corp']) {
      expect(check(id, {})).toMatchObject({ status: 'info', present: false });
    }
  });
});

describe('information leaks', () => {
  it.each([
    ['server', 'nginx/1.25.3', 'warn', /version number/],
    ['server', 'Apache/2.4.57 (Debian)', 'warn', /version number/],
    ['server', 'cloudflare', 'info', /no version/],
    ['x-powered-by', 'PHP/8.2.1', 'warn', /version number/],
    ['x-powered-by', 'Express', 'warn', /Nothing needs this header/],
  ])('%s: %s → %s', (header, value, status, finding) => {
    const leak = check(`leak-${header}`, { [header]: value });
    expect(leak.status).toBe(status);
    expect(leak.finding).toMatch(finding);
  });

  it('adds a row for the ASP.NET and generator headers only when they are sent', () => {
    const quiet = analyse(result({})).checks.map((item) => item.id);
    expect(quiet).not.toContain('leak-x-aspnet-version');

    const loud = analyse(result({ 'x-aspnet-version': '4.0.30319', 'x-generator': 'Drupal 10' }));
    expect(loud.checks.find((item) => item.id === 'leak-x-aspnet-version').status).toBe('warn');
    expect(loud.checks.find((item) => item.id === 'leak-x-generator').status).toBe('warn');
  });
});

describe('analyseCookie', () => {
  const cookie = (overrides) => ({
    name: 'sid',
    secure: true,
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    domain: null,
    persistent: false,
    partitioned: false,
    ...overrides,
  });

  it.each([
    [{}, 'pass', /all set/],
    [{ secure: false }, 'fail', /No Secure flag, so it is also sent over plain HTTP/],
    [{ httpOnly: false }, 'warn', /No HttpOnly flag/],
    [{ sameSite: null }, 'warn', /No SameSite attribute/],
    [{ sameSite: 'Sometimes' }, 'warn', /not Strict, Lax or None/],
    [{ sameSite: 'None' }, 'pass', /all set/],
    [{ sameSite: 'None', secure: false }, 'fail', /SameSite=None without Secure/],
    [{ name: '__Secure-id', secure: false }, 'fail', /__Secure- prefix requires Secure/],
    [{ name: '__Host-id', domain: 'example.com' }, 'fail', /__Host- prefix requires/],
    [{ name: '__Host-id', path: '/app' }, 'fail', /__Host- prefix requires/],
    [{ name: '__Host-id' }, 'pass', /all set/],
    [{ secure: false, httpOnly: false, sameSite: null }, 'fail', /No Secure flag.*; no HttpOnly flag.*; and no SameSite/],
  ])('%j → %s', (overrides, status, finding) => {
    const analysed = analyseCookie(cookie(overrides));
    expect(analysed.status).toBe(status);
    expect(analysed.finding).toMatch(finding);
  });

  it('carries no value field through', () => {
    expect(Object.keys(analyseCookie(cookie({})))).not.toContain('value');
  });
});

describe('analyseChain', () => {
  const hop = (url, status = 301) => ({ url, status, method: 'HEAD' });

  it('says nothing about a single HTTPS response', () => {
    expect(analyseChain([hop('https://example.com/', 200)])).toEqual([]);
  });

  it('credits an HTTP to HTTPS redirect', () => {
    expect(analyseChain([hop('http://example.com/'), hop('https://example.com/', 200)])).toEqual([
      { status: 'pass', text: 'Plain HTTP is redirected to HTTPS.' },
    ]);
  });

  it('fails a downgrade from HTTPS to HTTP', () => {
    const findings = analyseChain([hop('https://example.com/'), hop('http://example.com/landing', 200)]);
    expect(findings).toEqual([{ status: 'fail', text: 'Hop 1 redirects from HTTPS back to plain HTTP.' }]);
  });

  it('warns when HTTP hops to another host before upgrading', () => {
    const findings = analyseChain([
      hop('http://example.com/'),
      hop('http://www.example.com/'),
      hop('https://www.example.com/', 200),
    ]);
    expect(findings.map((finding) => finding.status)).toEqual(['warn', 'pass']);
  });

  it('ignores hops it cannot parse', () => {
    expect(analyseChain([{ url: 'nonsense', status: 200 }])).toEqual([]);
    expect(analyseChain()).toEqual([]);
  });
});

describe('toPlain', () => {
  it('is JSON-safe and keeps cookie names and flags only', () => {
    const plain = toPlain(
      analyse(
        result(HARDENED, {
          cookies: [{ name: 'sid', secure: true, httpOnly: true, sameSite: 'Strict', path: '/', domain: null, persistent: false, partitioned: false }],
        })
      )
    );
    const round = JSON.parse(JSON.stringify(plain));

    expect(round).toEqual(plain);
    expect(round.counts).toEqual({ pass: 12, warn: 0, fail: 0, info: 0 });
    expect(round.checks[0]).toEqual({
      id: 'hsts',
      header: 'Strict-Transport-Security',
      status: 'pass',
      present: true,
      values: { 'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload' },
      finding: 'max-age is 2 years. Subdomains are covered. preload is set.',
    });
    expect(round.cookies[0].name).toBe('sid');
    expect(round.redirects).toHaveLength(1);
  });
});
