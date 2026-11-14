const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function json(body, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export function isLocalRuntime(request) {
  return LOOPBACK_HOSTS.has(new URL(request.url).hostname);
}

function isLoopbackOrigin(origin) {
  try {
    return LOOPBACK_HOSTS.has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

function forbidden() {
  return json(
    { error: 'Forbidden: this API only accepts same-origin requests from the site' },
    { status: 403, headers: { 'Cache-Control': 'no-store' } }
  );
}

export function guard(request) {
  const fetchSite = request.headers.get('Sec-Fetch-Site');
  if (fetchSite && fetchSite !== 'same-origin') return forbidden();

  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) {
    if (!(isLocalRuntime(request) && isLoopbackOrigin(origin))) return forbidden();
  }

  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, { status: 405, headers: { Allow: 'GET' } });
  }

  return null;
}

export function lookupHandler(handle) {
  return async ({ request, env }) => {
    const refused = guard(request);
    if (refused) return refused;
    return handle({ request, env: env ?? {}, url: new URL(request.url) });
  };
}
