import { ApiError, apiFetch, buildUrl } from '@/core';
import apiConfig from '@/utils/api/apiConfig.json';

const HEADERS = apiConfig.endpoints.headers;

export class HeadersCheckError extends Error {
  constructor(message, { code = 'failed', chain = [] } = {}) {
    super(message);
    this.name = 'HeadersCheckError';
    this.code = code;
    this.chain = chain;
  }
}

function refusal(error) {
  if (!(error instanceof ApiError) || error.status !== 400) return null;
  try {
    const body = JSON.parse(error.body);
    return typeof body?.error === 'string' ? body : null;
  } catch {
    return null;
  }
}

export async function fetchHeaders(target, { signal, fetchImpl } = {}) {
  let response;
  try {
    response = await apiFetch(buildUrl(HEADERS.url, { url: target }), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      timeout: HEADERS.timeout,
      retries: HEADERS.retries,
      signal,
      fetchImpl,
    });
  } catch (error) {
    const refused = refusal(error);
    if (refused) throw new HeadersCheckError(refused.error, { code: refused.code });
    if (error instanceof ApiError && error.isTransport && !signal?.aborted) {
      throw new HeadersCheckError('The check could not be reached. Try again in a moment.', {
        code: 'api_unreachable',
      });
    }
    throw error;
  }

  const data = await response.json();
  if (!data?.success) {
    throw new HeadersCheckError(data?.error?.message ?? 'The check did not complete', {
      code: data?.error?.code,
      chain: data?.chain ?? [],
    });
  }
  return data;
}
