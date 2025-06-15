import apiConfig from './apiConfig.json';

/**
 * Get API endpoint configuration
 * @param {string} service - The service name (e.g., 'tenant', 'ssl', 'whois')
 * @param {string} provider - Optional provider for services with multiple endpoints (e.g., 'google' for DNS)
 * @returns {object} API endpoint configuration
 */
export function getApiEndpoint(service, provider = null) {
  const endpoint = apiConfig.endpoints[service];
  
  if (!endpoint) {
    throw new Error(`API endpoint not found for service: ${service}`);
  }
  
  // If provider is specified and the endpoint has multiple providers
  if (provider && typeof endpoint === 'object' && endpoint[provider]) {
    return {
      url: endpoint[provider],
      timeout: endpoint.timeout || apiConfig.defaults.timeout,
      retries: endpoint.retries || apiConfig.defaults.retries,
      headers: { ...apiConfig.defaults.headers }
    };
  }
  
  // Return the main endpoint configuration
  return {
    url: endpoint.url || endpoint,
    timeout: endpoint.timeout || apiConfig.defaults.timeout,
    retries: endpoint.retries || apiConfig.defaults.retries,
    headers: { ...apiConfig.defaults.headers }
  };
}

/**
 * Get all available API endpoints
 * @returns {object} All API endpoint configurations
 */
export function getAllApiEndpoints() {
  return apiConfig.endpoints;
}

/**
 * Get default API configuration
 * @returns {object} Default API configuration
 */
export function getApiDefaults() {
  return apiConfig.defaults;
}

/**
 * Build URL with query parameters
 * @param {string} baseUrl - The base URL
 * @param {object} params - Query parameters as key-value pairs
 * @returns {string} Complete URL with query parameters
 */
export function buildApiUrl(baseUrl, params = {}) {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }
  
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.append(key, value);
    }
  });
  
  return url.toString();
}

/**
 * Create a fetch wrapper with retry logic and default configuration
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @param {number} retries - Number of retries (defaults to API config)
 * @returns {Promise} Fetch promise with retry logic
 */
export async function apiFetch(url, options = {}, retries = null) {
  const defaults = getApiDefaults();
  const maxRetries = retries !== null ? retries : defaults.retries;
  
  const fetchOptions = {
    ...options,
    headers: {
      ...defaults.headers,
      ...options.headers
    }
  };
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log(`API request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
    }
  }
  
  throw lastError;
} 