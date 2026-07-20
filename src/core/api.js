/**
 * The HTTP client for the Cloudflare Worker lookups.
 *
 * `src/utils/api/apiUtils.js` — which this replaces at each tool's port —
 * gets three things wrong, and all three are visible to users:
 *
 *  - **The configured timeout is never applied.** `apiConfig.json` gives
 *    every endpoint one and nothing reads it, so a hung worker leaves a
 *    spinner running until the browser gives up, which can be minutes.
 *  - **It retries 4xx.** A 404 from the WHOIS worker is a definitive answer;
 *    retrying it three times with exponential backoff turns an instant "no
 *    such domain" into a seven-second wait for the same result.
 *  - **It detects network errors by matching on the message string**
 *    (`error.message.includes('CORS')`), which is browser-specific text that
 *    Firefox and Safari do not produce.
 *
 * So: retry 5xx, 408 and 429 plus genuine transport failures; never retry a
 * 4xx or an abort; and apply a real deadline with `AbortController`.
 *
 * Request and response *schemas* are untouched — frozen contract #5. This
 * changes when a request is given up on, not what is sent.
 */

/** Status codes where trying again can plausibly produce a different answer. */
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

const DEFAULT_TIMEOUT = 15000;
const DEFAULT_RETRIES = 2;

/** Thrown for any non-2xx response, carrying the status for the caller. */
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {{ status?: number, url?: string, body?: string, cause?: unknown }} [details]
   */
  constructor(message, { status, url, body, cause } = {}) {
    super(message, { cause });
    this.name = 'ApiError';
    this.status = status ?? 0;
    this.url = url;
    this.body = body;
  }

  /** True for a timeout or a dropped connection — no status was ever seen. */
  get isTransport() {
    return this.status === 0;
  }
}

/**
 * Add query parameters to a URL, skipping null/undefined.
 *
 * @param {string} baseUrl
 * @param {Record<string, unknown>} [params]
 * @returns {string}
 */
export function buildUrl(baseUrl, params = {}) {
  const entries = Object.entries(params ?? {}).filter(
    ([, value]) => value !== null && value !== undefined && value !== ''
  );
  if (entries.length === 0) return baseUrl;

  const url = new URL(baseUrl);
  for (const [key, value] of entries) url.searchParams.append(key, String(value));
  return url.toString();
}

/** @param {number} ms */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * One fetch with a deadline. Separated out so the retry loop stays readable
 * and so each attempt gets its own timer rather than sharing one budget.
 *
 * @param {string} url
 * @param {RequestInit & { timeout?: number, signal?: AbortSignal }} options
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, { timeout = DEFAULT_TIMEOUT, signal, ...init }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('timeout')), timeout);

  // A caller-supplied signal (component unmount) must still win.
  const onAbort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', onAbort, { once: true });

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

/**
 * Fetch with a deadline and 5xx/transport-only retries.
 *
 * @param {string} url
 * @param {object} [options]
 * @param {number} [options.timeout] per-attempt deadline in ms
 * @param {number} [options.retries] extra attempts after the first
 * @param {number} [options.retryDelay] base backoff in ms, doubled per attempt
 * @param {AbortSignal} [options.signal]
 * @param {typeof fetch} [options.fetchImpl] injected in tests
 * @returns {Promise<Response>}
 */
export async function apiFetch(url, options = {}) {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    retryDelay = 500,
    signal,
    fetchImpl,
    ...init
  } = options;

  const doFetch = fetchImpl
    ? (u, o) => fetchImpl(u, o)
    : (u, o) => fetchWithTimeout(u, o);

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal?.aborted) throw new ApiError('Request cancelled', { url });

    try {
      const response = await doFetch(url, { ...init, timeout, signal });

      if (response.ok) return response;

      const error = new ApiError(`HTTP ${response.status} ${response.statusText}`.trim(), {
        status: response.status,
        url,
        body: await response.text().catch(() => undefined),
      });

      // A 4xx is an answer. Returning it faster is the whole improvement.
      if (!RETRYABLE_STATUS.has(response.status)) throw error;
      lastError = error;
    } catch (error) {
      // An explicit cancellation is the caller's decision, not a failure to
      // work around.
      if (error instanceof ApiError && !RETRYABLE_STATUS.has(error.status)) throw error;
      if (signal?.aborted) throw new ApiError('Request cancelled', { url, cause: error });

      lastError =
        error instanceof ApiError
          ? error
          : new ApiError(`Request to ${url} failed`, { url, cause: error });
    }

    if (attempt < retries) await wait(retryDelay * 2 ** attempt);
  }

  throw lastError;
}

/**
 * `apiFetch` plus JSON parsing, which is what every caller wants.
 *
 * @template T
 * @param {string} url
 * @param {Parameters<typeof apiFetch>[1]} [options]
 * @returns {Promise<T>}
 */
export async function apiJson(url, options) {
  const response = await apiFetch(url, options);

  try {
    return await response.json();
  } catch (error) {
    throw new ApiError('Response was not valid JSON', {
      status: response.status,
      url,
      cause: error,
    });
  }
}
