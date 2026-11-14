import { json, lookupHandler } from '../../functions-lib/http.js';
import { TargetRefused, assertPublicUrl, isPublicAddress, parseTarget } from '../../functions-lib/public-host.js';

const USER_AGENT = 'russ.tools-http-headers/1.0 (+https://russ.tools/http-headers)';
const DOH_URL = 'https://cloudflare-dns.com/dns-query';
const API_SOURCE = 'russ.tools /api/headers';

const TIME_LIMIT_MS = 8000;
const MAX_REDIRECTS = 5;
const MAX_HEADER_LENGTH = 16384;
const MAX_HEADERS = 200;
const MAX_COOKIES = 50;
const MAX_COOKIE_FIELD = 256;

const REDIRECT_STATUS = new Set([301, 302, 303, 307, 308]);
const HEAD_UNRELIABLE = (status) => status >= 400;
const NO_STORE = { 'Cache-Control': 'no-store' };

const FAILURE_MESSAGES = {
  timeout: 'The site did not answer within eight seconds',
  unreachable: 'The site could not be reached',
  dns_not_found: 'That hostname does not resolve',
  dns_unavailable: 'The hostname could not be resolved, so it was not fetched',
  too_many_redirects: `The site redirected more than ${MAX_REDIRECTS} times`,
  bad_redirect: 'The site redirected without a usable Location header',
};

class LookupFailure extends Error {
  constructor(code, message = FAILURE_MESSAGES[code]) {
    super(message);
    this.name = 'LookupFailure';
    this.code = code;
  }
}

async function resolveAddresses(hostname, type, signal) {
  const response = await fetch(`${DOH_URL}?name=${encodeURIComponent(hostname)}&type=${type}`, {
    headers: { Accept: 'application/dns-json' },
    signal,
  });
  if (!response.ok) throw new Error(`DNS ${type} lookup returned ${response.status}`);

  const body = await response.json();
  if (body.Status !== 0 && body.Status !== 3) throw new Error(`DNS ${type} lookup status ${body.Status}`);

  const wanted = type === 'A' ? 1 : 28;
  return (body.Answer ?? []).filter((record) => record.type === wanted).map((record) => String(record.data));
}

async function assertResolvesPublicly(hostname, signal) {
  let addresses;
  try {
    const [v4, v6] = await Promise.all([
      resolveAddresses(hostname, 'A', signal),
      resolveAddresses(hostname, 'AAAA', signal),
    ]);
    addresses = [...v4, ...v6];
  } catch {
    if (signal.aborted) throw new LookupFailure('timeout');
    throw new LookupFailure('dns_unavailable');
  }

  if (addresses.length === 0) throw new LookupFailure('dns_not_found');
  if (!addresses.every(isPublicAddress)) {
    throw new TargetRefused('blocked_address', 'That hostname resolves to a loopback, private or link-local address');
  }
}

async function request(url, method, signal) {
  const response = await fetch(url.href, {
    method,
    redirect: 'manual',
    headers: { 'User-Agent': USER_AGENT, Accept: '*/*' },
    signal,
  });
  if (method !== 'HEAD') await response.body?.cancel().catch(() => {});
  return response;
}

async function fetchHop(url, signal) {
  let head = null;

  try {
    head = await request(url, 'HEAD', signal);
    if (!HEAD_UNRELIABLE(head.status)) return { response: head, method: 'HEAD' };
  } catch {
    if (signal.aborted) throw new LookupFailure('timeout');
  }

  try {
    return { response: await request(url, 'GET', signal), method: 'GET' };
  } catch {
    if (signal.aborted) throw new LookupFailure('timeout');
    if (head) return { response: head, method: 'HEAD' };
    throw new LookupFailure('unreachable');
  }
}

function collectHeaders(response) {
  const headers = {};
  const truncated = [];
  let count = 0;

  for (const [name, value] of response.headers) {
    const key = name.toLowerCase();
    if (key === 'set-cookie' || key === 'set-cookie2') continue;
    if (count >= MAX_HEADERS) break;
    count += 1;
    if (value.length > MAX_HEADER_LENGTH) truncated.push(key);
    headers[key] = value.slice(0, MAX_HEADER_LENGTH);
  }

  return { headers, truncated };
}

function setCookieLines(response) {
  if (typeof response.headers.getSetCookie === 'function') return response.headers.getSetCookie();
  if (typeof response.headers.getAll === 'function') return response.headers.getAll('set-cookie');
  return [];
}

export function describeCookie(line) {
  const [pair, ...attributes] = String(line).split(';');
  const separator = pair.indexOf('=');
  const name = (separator === -1 ? '' : pair.slice(0, separator)).trim().slice(0, MAX_COOKIE_FIELD);

  const cookie = {
    name,
    secure: false,
    httpOnly: false,
    sameSite: null,
    path: null,
    domain: null,
    persistent: false,
    partitioned: false,
  };

  for (const attribute of attributes) {
    const split = attribute.indexOf('=');
    const key = (split === -1 ? attribute : attribute.slice(0, split)).trim().toLowerCase();
    const value = split === -1 ? '' : attribute.slice(split + 1).trim().slice(0, MAX_COOKIE_FIELD);

    if (key === 'secure') cookie.secure = true;
    else if (key === 'httponly') cookie.httpOnly = true;
    else if (key === 'partitioned') cookie.partitioned = true;
    else if (key === 'samesite') cookie.sameSite = value || null;
    else if (key === 'path') cookie.path = value || null;
    else if (key === 'domain') cookie.domain = value || null;
    else if (key === 'max-age' || key === 'expires') cookie.persistent = true;
  }

  return cookie;
}

function hopLocation(response, url) {
  const location = response.headers.get('location');
  if (!location) throw new LookupFailure('bad_redirect');
  try {
    return new URL(location, url);
  } catch {
    throw new LookupFailure('bad_redirect');
  }
}

async function follow(start, signal, chain) {
  let url = start;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    await assertResolvesPublicly(url.hostname.replace(/\.$/, ''), signal);
    const { response, method } = await fetchHop(url, signal);
    const entry = { url: url.href, status: response.status, method };
    chain.push(entry);

    if (!REDIRECT_STATUS.has(response.status)) return { url, response, method };

    const next = hopLocation(response, url);
    next.hash = '';
    entry.location = next.href;

    try {
      assertPublicUrl(next);
    } catch (error) {
      if (error instanceof TargetRefused) error.message = `The site redirects to a target that is not checked. ${error.message}`;
      throw error;
    }

    url = next;
  }

  throw new LookupFailure('too_many_redirects');
}

function failed(error, requestedUrl, chain) {
  return json(
    {
      success: false,
      requestedUrl,
      chain,
      error: { code: error.code, message: error.message },
      timestamp: Date.now(),
      apiSource: API_SOURCE,
    },
    { headers: NO_STORE }
  );
}

export const onRequest = lookupHandler(async ({ request, url }) => {
  const input = url.searchParams.get('url');
  if (!input) return json({ error: 'URL parameter is required' }, { status: 400 });

  if (request.headers.get('User-Agent') === USER_AGENT) {
    return json({ error: 'This API does not check itself', code: 'blocked_host' }, { status: 400, headers: NO_STORE });
  }

  let target;
  try {
    target = parseTarget(input);
  } catch (error) {
    if (!(error instanceof TargetRefused)) throw error;
    console.log(`Headers check refused (${error.code})`);
    return json({ error: error.message, code: error.code }, { status: 400, headers: NO_STORE });
  }

  const chain = [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIME_LIMIT_MS);

  try {
    const final = await follow(target, controller.signal, chain);
    const { headers, truncated } = collectHeaders(final.response);

    return json(
      {
        success: true,
        requestedUrl: target.href,
        finalUrl: final.url.href,
        status: final.response.status,
        method: final.method,
        chain,
        headers,
        truncatedHeaders: truncated,
        cookies: setCookieLines(final.response).slice(0, MAX_COOKIES).map(describeCookie),
        timestamp: Date.now(),
        apiSource: API_SOURCE,
      },
      { headers: NO_STORE }
    );
  } catch (error) {
    if (error instanceof TargetRefused || error instanceof LookupFailure) {
      console.log(`Headers check for ${target.hostname} stopped (${error.code}) after ${chain.length} hop(s)`);
      return failed(error, target.href, chain);
    }
    console.error('Headers check failed:', error?.message);
    return json({ error: 'Internal server error' }, { status: 500, headers: NO_STORE });
  } finally {
    clearTimeout(timer);
  }
});
