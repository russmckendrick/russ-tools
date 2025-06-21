import { notifications } from '@mantine/notifications';

/**
 * Safe JSON stringify that handles circular references and complex objects
 * @param {any} obj - Object to stringify
 * @returns {string} - Safe JSON string
 */
const safeStringify = (obj) => {
  const seen = new Set();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    // Skip function values and complex objects
    if (typeof value === 'function' || 
        (typeof value === 'object' && value !== null && value.constructor && value.constructor.name !== 'Object' && value.constructor.name !== 'Array')) {
      return undefined;
    }
    return value;
  });
};

/**
 * Filter parameters to only include safe types for URL encoding
 * @param {Object} parameters - Parameters object to filter
 * @returns {Object} - Filtered parameters with only safe types
 */
const getSafeParameters = (parameters) => {
  return Object.entries(parameters).reduce((acc, [key, value]) => {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      acc[key] = value;
    }
    return acc;
  }, {});
};

/**
 * Generate a shareable URL with encoded configuration
 * @param {Object} config - Configuration object to encode
 * @param {string} config.service - Service identifier
 * @param {string} config.template - Template identifier
 * @param {Object} config.parameters - Parameters object
 * @param {string} [baseUrl] - Optional base URL (defaults to current location)
 * @returns {string|null} - Shareable URL or null if generation fails
 */
export const generateShareableURL = (config, baseUrl) => {
  try {
    // Filter parameters to only include safe types
    const safeParameters = getSafeParameters(config.parameters || {});
    
    const safeConfig = {
      service: config.service,
      template: config.template,
      parameters: safeParameters
    };
    
    const encodedConfig = btoa(safeStringify(safeConfig));
    const currentUrl = baseUrl || (window.location.origin + window.location.pathname);
    const shareableUrl = `${currentUrl}?config=${encodedConfig}`;
    
    return shareableUrl;
  } catch (error) {
    console.error('Failed to generate shareable URL:', error);
    notifications.show({
      title: 'URL Generation Error',
      message: 'Failed to generate shareable URL',
      color: 'red'
    });
    return null;
  }
};

/**
 * Parse configuration from URL search parameters
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {Object|null} - Parsed configuration or null if parsing fails
 */
export const parseConfigFromURL = (searchParams) => {
  const configParam = searchParams.get('config');
  if (!configParam) {
    return null;
  }

  try {
    const config = JSON.parse(atob(configParam));
    return config;
  } catch (error) {
    console.error('Failed to parse config from URL:', error);
    notifications.show({
      title: 'URL Config Error',
      message: 'Failed to load configuration from URL',
      color: 'orange'
    });
    return null;
  }
};

/**
 * Update URL search parameters with encoded configuration
 * @param {Object} config - Configuration object to encode
 * @param {Function} setSearchParams - React Router's setSearchParams function
 * @param {Object} [options] - Options for setSearchParams (e.g., { replace: true })
 */
export const updateURLWithConfig = (config, setSearchParams, options = { replace: true }) => {
  try {
    // Filter parameters to only include safe types
    const safeParameters = getSafeParameters(config.parameters || {});
    
    const safeConfig = {
      service: config.service,
      template: config.template,
      parameters: safeParameters
    };
    
    const encodedConfig = btoa(safeStringify(safeConfig));
    setSearchParams({ config: encodedConfig }, options);
  } catch (error) {
    console.error('Failed to update URL:', error);
    // Don't update URL if there's an error
  }
};

/**
 * Copy shareable URL to clipboard
 * @param {Object} config - Configuration object to encode
 * @param {string} [baseUrl] - Optional base URL (defaults to current location)
 * @returns {Promise<boolean>} - Success status
 */
export const copyShareableURL = async (config, baseUrl) => {
  const shareableUrl = generateShareableURL(config, baseUrl);
  
  if (!shareableUrl) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(shareableUrl);
    notifications.show({
      title: 'URL Copied',
      message: 'Shareable URL has been copied to clipboard',
      color: 'green'
    });
    return true;
  } catch (error) {
    console.error('Failed to copy URL to clipboard:', error);
    notifications.show({
      title: 'Copy Failed',
      message: 'Failed to copy URL to clipboard',
      color: 'red'
    });
    return false;
  }
};