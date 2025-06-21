import { notifications } from '@mantine/notifications';
import * as pako from 'pako';

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
 * Convert Uint8Array to URL-safe base64 string
 * @param {Uint8Array} bytes - Bytes to encode
 * @returns {string} - URL-safe base64 string
 */
const uint8ArrayToBase64Url = (bytes) => {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

/**
 * Convert URL-safe base64 string to Uint8Array
 * @param {string} base64Url - URL-safe base64 string
 * @returns {Uint8Array} - Decoded bytes
 */
const base64UrlToUint8Array = (base64Url) => {
  // Add padding if needed
  const padding = base64Url.length % 4;
  const base64 = base64Url
    .replace(/-/g, '+')
    .replace(/_/g, '/') + 
    (padding === 2 ? '==' : padding === 3 ? '=' : '');
  
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Compress and encode configuration data for URL
 * @param {Object} config - Configuration object to compress
 * @returns {string} - URL-safe base64 encoded compressed data
 */
const compressConfig = (config) => {
  try {
    const jsonString = safeStringify(config);
    const compressed = pako.deflate(jsonString);
    return uint8ArrayToBase64Url(compressed);
  } catch (error) {
    console.error('Failed to compress config:', error);
    throw new Error('Compression failed');
  }
};

/**
 * Decompress and decode configuration data from URL
 * @param {string} encodedData - URL-safe base64 encoded compressed data
 * @returns {Object} - Decompressed configuration object
 */
const decompressConfig = (encodedData) => {
  try {
    const bytes = base64UrlToUint8Array(encodedData);
    const decompressed = pako.inflate(bytes, { to: 'string' });
    return JSON.parse(decompressed);
  } catch (error) {
    console.error('Failed to decompress config:', error);
    throw new Error('Decompression failed');
  }
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
    const encodedConfig = compressConfig(config);
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
    const config = decompressConfig(configParam);
    return config;
  } catch (error) {
    console.error('Failed to parse config from URL:', error);
    // Try legacy format (uncompressed base64) for backward compatibility
    try {
      const legacyConfig = JSON.parse(atob(configParam));
      console.log('Loaded legacy URL format');
      return legacyConfig;
    } catch (legacyError) {
      console.error('Failed to parse legacy config format:', legacyError);
      notifications.show({
        title: 'URL Config Error',
        message: 'Failed to load configuration from URL',
        color: 'orange'
      });
      return null;
    }
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
    const encodedConfig = compressConfig(config);
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