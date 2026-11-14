import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { IssuerKeyError, discoverJwksUri, discoveryUrl, fetchJwks, httpsIssuer } from './issuer.js';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const ISSUER = 'https://issuer.example/tenant';
const DISCOVERY = 'https://issuer.example/tenant/.well-known/openid-configuration';
const JWKS = 'https://issuer.example/tenant/keys';

const caught = async (promise) => {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('expected a rejection');
};

describe('httpsIssuer', () => {
  it.each([
    ['https://issuer.example', 'https://issuer.example'],
    ['https://issuer.example/', 'https://issuer.example/'],
    ['https://login.example/tenant/v2.0', 'https://login.example/tenant/v2.0'],
  ])('accepts %s', (iss, expected) => {
    expect(httpsIssuer({ iss })).toBe(expected);
  });

  it.each([
    ['http://issuer.example', 'plain http'],
    ['issuer.example', 'no scheme'],
    ['my-service', 'a bare name'],
    ['https://user:pass@issuer.example', 'credentials in the URL'],
    ['https://issuer.example?tenant=1', 'a query string'],
    ['https://issuer.example/#frag', 'a fragment'],
    ['javascript:alert(1)', 'another scheme'],
    [42, 'a number'],
    [undefined, 'no issuer'],
  ])('refuses %s (%s)', (iss) => {
    expect(httpsIssuer({ iss })).toBeNull();
  });

  it('copes with no payload', () => {
    expect(httpsIssuer(null)).toBeNull();
  });
});

describe('discoveryUrl', () => {
  it('appends the well-known path, minding a trailing slash', () => {
    expect(discoveryUrl('https://issuer.example')).toBe('https://issuer.example/.well-known/openid-configuration');
    expect(discoveryUrl('https://issuer.example/')).toBe('https://issuer.example/.well-known/openid-configuration');
    expect(discoveryUrl(ISSUER)).toBe(DISCOVERY);
  });
});

describe('discoverJwksUri', () => {
  it('reads jwks_uri from the discovery document', async () => {
    server.use(http.get(DISCOVERY, () => HttpResponse.json({ issuer: ISSUER, jwks_uri: JWKS })));
    expect(await discoverJwksUri(ISSUER)).toEqual({
      discoveryUrl: DISCOVERY,
      jwksUri: JWKS,
      jwksHost: 'issuer.example',
      sameHost: true,
    });
  });

  it('says when the keys live on another host', async () => {
    server.use(
      http.get(DISCOVERY, () => HttpResponse.json({ jwks_uri: 'https://keys.elsewhere.example/certs' })),
    );
    expect(await discoverJwksUri(ISSUER)).toMatchObject({ jwksHost: 'keys.elsewhere.example', sameHost: false });
  });

  it('sends a bare GET: no cookies, no referrer, no token', async () => {
    let seen;
    server.use(
      http.get(DISCOVERY, ({ request }) => {
        seen = request;
        return HttpResponse.json({ jwks_uri: JWKS });
      }),
    );
    await discoverJwksUri(ISSUER);
    expect(seen.method).toBe('GET');
    expect(seen.url).toBe(DISCOVERY);
    expect(seen.credentials).toBe('omit');
    expect(seen.referrerPolicy).toBe('no-referrer');
    expect(seen.redirect).toBe('error');
    expect(seen.headers.get('authorization')).toBeNull();
    expect(seen.headers.get('cookie')).toBeNull();
    expect(seen.body).toBeNull();
  });

  it('reports a blocked or failed request as blocked, naming the host and the address', async () => {
    server.use(http.get(DISCOVERY, () => HttpResponse.error()));
    const error = await caught(discoverJwksUri(ISSUER));
    expect(error).toBeInstanceOf(IssuerKeyError);
    expect(error.code).toBe('blocked');
    expect(error.url).toBe(DISCOVERY);
    expect(error.message).toMatch(/issuer\.example does not let other websites read this address \(CORS\)/);
  });

  it('refuses to follow a redirect to somewhere else', async () => {
    server.use(
      http.get(DISCOVERY, () => HttpResponse.redirect('https://elsewhere.example/config', 302)),
      http.get('https://elsewhere.example/config', () => HttpResponse.json({ jwks_uri: JWKS })),
    );
    expect((await caught(discoverJwksUri(ISSUER))).code).toBe('blocked');
  });

  it('reports an HTTP error with its status', async () => {
    server.use(http.get(DISCOVERY, () => new HttpResponse('nope', { status: 404 })));
    const error = await caught(discoverJwksUri(ISSUER));
    expect(error.code).toBe('http');
    expect(error.message).toBe('issuer.example answered 404 for the discovery document.');
  });

  it('reports a body that is not JSON', async () => {
    server.use(http.get(DISCOVERY, () => new HttpResponse('<html>', { status: 200 })));
    expect((await caught(discoverJwksUri(ISSUER))).code).toBe('not-json');
  });

  it.each([
    [{}, /has no jwks_uri/],
    [{ jwks_uri: 'http://issuer.example/keys' }, /not an https URL/],
    [{ jwks_uri: 'nonsense' }, /not an https URL/],
    [null, /has no jwks_uri/],
  ])('refuses the document %o', async (document, message) => {
    server.use(http.get(DISCOVERY, () => HttpResponse.json(document)));
    const error = await caught(discoverJwksUri(ISSUER));
    expect(error.code).toBe('no-jwks-uri');
    expect(error.message).toMatch(message);
  });

  it('gives up when the issuer does not answer', async () => {
    const neverAnswers = (url, { signal }) =>
      new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
        setTimeout(() => signal.dispatchEvent(new Event('abort')), 0);
      });
    const error = await caught(discoverJwksUri(ISSUER, { fetchImpl: neverAnswers }));
    expect(error.code).toBe('timeout');
  });
});

describe('fetchJwks', () => {
  it('returns the keys', async () => {
    server.use(http.get(JWKS, () => HttpResponse.json({ keys: [{ kty: 'RSA', kid: 'a' }] })));
    expect(await fetchJwks(JWKS)).toEqual({ keys: [{ kty: 'RSA', kid: 'a' }] });
  });

  it.each([[{ keys: [] }], [{}], [[]], ['text']])('refuses %o as a key set', async (body) => {
    server.use(http.get(JWKS, () => HttpResponse.json(body)));
    expect((await caught(fetchJwks(JWKS))).code).toBe('no-keys');
  });

  it('reports a blocked request for the key set', async () => {
    server.use(http.get(JWKS, () => HttpResponse.error()));
    const error = await caught(fetchJwks(JWKS));
    expect(error.code).toBe('blocked');
    expect(error.url).toBe(JWKS);
    expect(error.message).toMatch(/The request for the key set did not complete/);
  });
});
