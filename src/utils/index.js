/**
 * Validates if a string is a valid IPv4 address
 * @param {string} ip - IP address to validate
 * @returns {boolean} - true if valid IPv4 address, false otherwise
 */
export function isValidIPv4(ip) {
  const pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!pattern.test(ip)) return false;
  return ip.split('.').every(num => {
    const n = parseInt(num, 10);
    return n >= 0 && n <= 255;
  });
}

/**
 * Converts an IP address to its long number representation
 * @param {string} ip - IP address to convert
 * @returns {number} - 32-bit unsigned integer representation of the IP
 */
export function ipToLong(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

/**
 * Converts a long number to an IP address
 * @param {number} long - 32-bit unsigned integer to convert
 * @returns {string} - IP address in dotted-decimal notation
 */
export function longToIp(long) {
  return [24, 16, 8, 0].map(shift => (long >>> shift) & 255).join('.');
}

export { getSubnetBgColorHex } from './network/getSubnetBgColorHex';
export { 
  loadTLDs, 
  generateDomainSuggestions, 
  generateSubdomainSuggestions,
  isValidTLD, 
  extractTLD, 
  extractRootDomain,
  isDomainLike, 
  useTLDs, 
  tldUtils 
} from './tldUtils';
export { 
  getApiEndpoint, 
  getAllApiEndpoints, 
  getApiDefaults, 
  buildApiUrl, 
  apiFetch 
} from './api/apiUtils';