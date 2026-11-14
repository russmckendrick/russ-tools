import { describe, it, expect, vi } from 'vitest';
import { HeadersCheckError, fetchHeaders } from './headersApi.js';
import { cleanTarget, displayHost, validateTarget } from './target.js';

describe('cleanTarget', () => {
  it.each([
    ['example.com', 'example.com'],
    ['  Example.COM  ', 'example.com'],
    ['example.com/', 'example.com'],
    ['example.com/Login?next=/Home', 'example.com/Login?next=/Home'],
    ['https://example.com', 'https://example.com'],
    ['https://example.com/', 'https://example.com'],
    ['HTTPS://Example.com/Path#frag', 'https://example.com/Path'],
    ['http://example.com/a?b=c', 'http://example.com/a?b=c'],
    ['example.com:443', 'https://example.com'],
    ['', ''],
    ['   ', ''],
  ])('%j → %j', (input, expected) => {
    expect(cleanTarget(input)).toBe(expected);
  });

  it('leaves something unparseable for the validator to reject', () => {
    expect(cleanTarget('http://exa mple')).toBe('http://exa mple');
  });
});

describe('validateTarget', () => {
  it.each(['example.com', 'sub.example.co.uk/path', 'https://example.com', 'http://example.com/a?b=c', 'xn--bcher-kva.de'])(
    'accepts %s',
    (target) => {
      expect(validateTarget(target)).toBe('');
    }
  );

  it.each([
    ['', /Enter a URL/],
    ['http://exa mple', /not a URL/],
    ['ftp://example.com', /Only http and https/],
    ['https://user:pass@example.com', /username and password/],
    ['localhost', /public hostname/],
    ['intranet', /public hostname/],
    ['http://127.0.0.1', /public hostname/],
    ['http://10.0.0.10', /public hostname/],
    ['http://[::1]/', /public hostname/],
  ])('rejects %j', (target, message) => {
    expect(validateTarget(target)).toMatch(message);
  });
});

describe('displayHost', () => {
  it('names the host of a URL or a bare target', () => {
    expect(displayHost('https://example.com/path')).toBe('example.com');
    expect(displayHost('example.com/path')).toBe('example.com');
    expect(displayHost('http://exa mple')).toBe('http://exa mple');
  });
});

describe('fetchHeaders', () => {
  const answer = (body, status = 200) =>
    vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

  it('asks the same-origin API with the target as one encoded parameter', async () => {
    const fetchImpl = answer({ success: true, finalUrl: 'https://example.com/', headers: {} });

    const data = await fetchHeaders('https://example.com/a?b=c&d=e', { fetchImpl });

    expect(data.success).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toMatch(/\/api\/headers\?url=https%3A%2F%2Fexample\.com%2Fa%3Fb%3Dc%26d%3De$/);
    expect(init.method).toBe('GET');
  });

  it('turns a 400 refusal into its own message and code, without retrying', async () => {
    const fetchImpl = answer({ error: 'Only ports 80 and 443 are checked', code: 'blocked_port' }, 400);

    await expect(fetchHeaders('example.com:8443', { fetchImpl })).rejects.toMatchObject({
      name: 'HeadersCheckError',
      message: 'Only ports 80 and 443 are checked',
      code: 'blocked_port',
      chain: [],
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('carries the redirect chain out of a lookup that stopped part-way', async () => {
    const chain = [{ url: 'https://example.com/', status: 302, method: 'HEAD', location: 'http://127.0.0.1/' }];
    const fetchImpl = answer({ success: false, chain, error: { code: 'blocked_address', message: 'Stopped' } });

    const error = await fetchHeaders('example.com', { fetchImpl }).catch((caught) => caught);

    expect(error).toBeInstanceOf(HeadersCheckError);
    expect(error.message).toBe('Stopped');
    expect(error.code).toBe('blocked_address');
    expect(error.chain).toEqual(chain);
  });

  it('passes other failures through untouched', async () => {
    const fetchImpl = answer({ error: 'Forbidden' }, 403);
    await expect(fetchHeaders('example.com', { fetchImpl })).rejects.toMatchObject({ name: 'ApiError', status: 403 });
  });
});
