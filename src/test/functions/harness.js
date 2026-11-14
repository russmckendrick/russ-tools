import { vi } from 'vitest';

export const SITE = 'https://russ.tools';

const VOLATILE_KEYS = new Set(['timestamp', 'nextPollTime']);

export function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key, entry]) => !VOLATILE_KEYS.has(key) && entry !== undefined)
        .map(([key, entry]) => [key, stable(entry)])
    );
  }
  return value;
}

export function stubUpstream(routes = []) {
  const calls = [];

  const fetchMock = vi.fn(async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const call = { url, method: init.method ?? 'GET', headers: init.headers ?? {}, body: init.body };
    calls.push(call);

    for (const [matches, respond] of routes) {
      if (!matches(url, call)) continue;
      const result = typeof respond === 'function' ? await respond(url, call) : respond;
      if (result instanceof Response) return result;
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response('not found', { status: 404, statusText: 'Not Found' });
  });

  vi.stubGlobal('fetch', fetchMock);
  return { calls, fetchMock };
}

export const startsWith = (prefix) => (url) => url.startsWith(prefix);
export const includes = (...fragments) => (url) => fragments.every((fragment) => url.includes(fragment));

export function sameOriginRequest(path, { origin = SITE, headers = {}, method = 'GET' } = {}) {
  return new Request(`${origin}${path}`, {
    method,
    headers: { 'Sec-Fetch-Site': 'same-origin', ...headers },
  });
}

export async function call(onRequest, request, env = {}) {
  const response = await onRequest({ request, env });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { response, status: response.status, body };
}
