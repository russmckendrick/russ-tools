import { apiFetch, buildUrl } from '@/core';
import apiConfig from '@/utils/api/apiConfig.json';

const SSL = apiConfig.endpoints.ssl;

/**
 * SSL Labs analysis through the worker, with polling; when the worker is
 * unreachable, a browser connectivity probe.
 *
 * The probe used to *fabricate* an assessment — grade B, a made-up
 * certificate with invented validity dates, "Browser Verified Certificate
 * Authority" — plausible details for a check that never happened. It now
 * returns an honest `connectivityOnly` result and the island renders it as
 * "analysis unavailable — HTTPS connectivity verified"
 * (BEHAVIOR_CHANGES.md).
 */
export const performSSLCheck = async (domain, { signal } = {}) => {
  try {
    return await checkWithSSLAPI(domain, { signal });
  } catch (apiError) {
    if (signal?.aborted) throw apiError;

    try {
      return await performBrowserSSLCheck(domain, { signal });
    } catch (browserError) {
      throw new Error(
        `SSL check failed: ${apiError.message}. Browser fallback also failed: ${browserError.message}`
      );
    }
  }
};

const fetchAssessment = async (domain, signal) => {
  const response = await apiFetch(buildUrl(SSL.url, { domain }), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    timeout: SSL.timeout,
    retries: SSL.retries,
    signal,
  });
  return response.json();
};

// SSL API check with polling
export const checkWithSSLAPI = async (domain, { signal } = {}) => {
  const result = await fetchAssessment(domain, signal);

  if (result.pollInfo && result.pollInfo.shouldPoll) {
    return pollSSLAnalysis(domain, result, { signal });
  }

  return result;
};

// Poll SSL Labs analysis until complete
export const pollSSLAnalysis = async (domain, initialResult, { signal, maxAttempts = 12 } = {}) => {
  let attempts = 0;
  let currentResult = initialResult;

  while (attempts < maxAttempts && currentResult.pollInfo?.shouldPoll) {
    attempts++;
    const waitTime = Math.min(currentResult.pollInfo.recommendedInterval || 5, 10) * 1000;

    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, waitTime);
      signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new DOMException('aborted', 'AbortError'));
        },
        { once: true }
      );
    });

    try {
      currentResult = await fetchAssessment(domain, signal);

      // Analysis is complete when status is READY, polling is no longer
      // requested, or every endpoint reports complete.
      const allEndpointsComplete = currentResult.endpoints?.every(
        (endpoint) => endpoint.isComplete === true
      );
      const isAnalysisComplete =
        currentResult.status === 'READY' ||
        !currentResult.pollInfo?.shouldPoll ||
        (currentResult.endpoints?.length > 0 && allEndpointsComplete);

      if (isAnalysisComplete) {
        return currentResult;
      }
    } catch (pollError) {
      if (signal?.aborted) throw pollError;
      if (attempts >= maxAttempts) {
        throw new Error(`SSL analysis polling failed after ${attempts} attempts: ${pollError.message}`);
      }
    }
  }

  // Timed out: return the last result we got, even if not complete.
  return currentResult;
};

/**
 * Browser connectivity probe. Proves an HTTPS connection can be made and
 * claims nothing else — no grade, no certificate, no protocols.
 */
export const performBrowserSSLCheck = async (domain, { signal } = {}) => {
  const connectivityResult = {
    status: 'CONNECTIVITY_ONLY',
    connectivityOnly: true,
    browserCheck: true,
    host: domain,
    timestamp: Date.now(),
    note: 'Full analysis unavailable — HTTPS connectivity verified',
  };

  try {
    await fetch(`https://${domain}`, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
      signal,
    });
    return connectivityResult;
  } catch {
    try {
      await testSSLWithImageLoad(domain);
      return connectivityResult;
    } catch {
      throw new Error(
        `SSL connection failed: Unable to establish secure connection to ${domain}. This may indicate SSL/TLS configuration issues.`
      );
    }
  }
};

// Connectivity probe via image load, for hosts that reject HEAD.
export const testSSLWithImageLoad = (domain) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timeout = setTimeout(() => {
      reject(new Error('Connection timeout'));
    }, 10000);

    img.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('SSL connection failed via image load test'));
    };

    img.src = `https://${domain}/favicon.ico?_=${Date.now()}`;
  });
};
