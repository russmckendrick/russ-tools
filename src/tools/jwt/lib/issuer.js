export const REQUEST_TIMEOUT_MS = 10000;

export class IssuerKeyError extends Error {
  constructor(code, message, url) {
    super(message);
    this.name = 'IssuerKeyError';
    this.code = code;
    this.url = url;
  }
}

const parseHttpsUrl = (value) => {
  if (typeof value !== 'string') return null;
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.username || url.password) return null;
  return url;
};

export function httpsIssuer(payload) {
  const url = parseHttpsUrl(payload?.iss);
  if (!url || url.search || url.hash) return null;
  return payload.iss.trim();
}

export function discoveryUrl(issuer) {
  return `${issuer.replace(/\/+$/, '')}/.well-known/openid-configuration`;
}

const hostOf = (url) => new URL(url).host;

async function getJson(url, what, fetchImpl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetchImpl(url, {
      method: 'GET',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      redirect: 'error',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new IssuerKeyError('timeout', `${hostOf(url)} did not answer within ${REQUEST_TIMEOUT_MS / 1000} seconds.`, url);
    }
    throw new IssuerKeyError(
      'blocked',
      `The request for ${what} did not complete. A browser cannot tell a network fault from a refusal, but the usual cause is that ${hostOf(url)} does not let other websites read this address (CORS).`,
      url,
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new IssuerKeyError('http', `${hostOf(url)} answered ${response.status} for ${what}.`, url);
  }

  try {
    return await response.json();
  } catch {
    throw new IssuerKeyError('not-json', `${hostOf(url)} answered, but ${what} is not JSON.`, url);
  }
}

export async function discoverJwksUri(issuer, { fetchImpl = fetch } = {}) {
  const url = discoveryUrl(issuer);
  const document = await getJson(url, 'the discovery document', fetchImpl);

  const jwksUrl = parseHttpsUrl(document?.jwks_uri);
  if (!jwksUrl) {
    throw new IssuerKeyError(
      'no-jwks-uri',
      typeof document?.jwks_uri === 'string'
        ? 'The discovery document names a key address that is not an https URL, so it was not fetched.'
        : 'The discovery document has no jwks_uri, so the issuer does not say where its keys are.',
      url,
    );
  }

  return {
    discoveryUrl: url,
    jwksUri: jwksUrl.href,
    jwksHost: jwksUrl.host,
    sameHost: jwksUrl.host === hostOf(url),
  };
}

export async function fetchJwks(jwksUri, { fetchImpl = fetch } = {}) {
  const jwks = await getJson(jwksUri, 'the key set', fetchImpl);
  if (!jwks || !Array.isArray(jwks.keys) || jwks.keys.length === 0) {
    throw new IssuerKeyError('no-keys', `${hostOf(jwksUri)} answered, but the key set has no keys in it.`, jwksUri);
  }
  return { keys: jwks.keys };
}
