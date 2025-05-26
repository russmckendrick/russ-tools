/**
 * TLD (Top Level Domain) utilities for domain autocomplete and validation
 */
import React from 'react';

// Fallback TLD list for when IANA RDAP is unavailable
const FALLBACK_TLDS = [
  // Generic TLDs
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'info', 'biz', 'name',
  'mobi', 'coop', 'museum', 'aero', 'pro', 'jobs', 'travel', 'cat', 'tel',
  
  // New gTLDs
  'app', 'blog', 'cloud', 'dev', 'tech', 'io', 'ai', 'co', 'me', 'tv',
  'fm', 'am', 'pm', 'ly', 'gl', 'ag', 'cc', 'ws', 'tk', 'ml', 'ga', 'cf',
  
  // Country codes (major ones)
  'us', 'uk', 'ca', 'au', 'de', 'fr', 'it', 'es', 'nl', 'be', 'ch', 'at',
  'se', 'no', 'dk', 'fi', 'ie', 'pt', 'gr', 'pl', 'cz', 'hu', 'ro', 'bg',
  'hr', 'si', 'sk', 'lt', 'lv', 'ee', 'ru', 'ua', 'by', 'md', 'rs', 'me',
  'ba', 'mk', 'al', 'tr', 'cy', 'mt', 'is', 'fo', 'gl', 'li', 'mc', 'sm',
  'va', 'ad', 'lu', 'jp', 'kr', 'cn', 'hk', 'tw', 'sg', 'my', 'th', 'vn',
  'ph', 'id', 'in', 'bd', 'pk', 'lk', 'np', 'bt', 'mv', 'af', 'ir', 'iq',
  'sa', 'ae', 'qa', 'kw', 'bh', 'om', 'ye', 'jo', 'sy', 'lb', 'il', 'ps',
  'eg', 'ly', 'tn', 'dz', 'ma', 'sd', 'et', 'ke', 'tz', 'ug', 'rw', 'bi',
  'cd', 'cg', 'cm', 'cf', 'td', 'ne', 'ng', 'gh', 'ci', 'bf', 'ml', 'sn',
  'gm', 'gw', 'gn', 'sl', 'lr', 'mr', 'mz', 'zm', 'zw', 'bw', 'na', 'sz',
  'ls', 'za', 'mg', 'mu', 'sc', 'km', 'dj', 'so', 'er', 'br', 'ar', 'cl',
  'pe', 'ec', 'co', 've', 'gy', 'sr', 'uy', 'py', 'bo', 'mx', 'gt', 'bz',
  'sv', 'hn', 'ni', 'cr', 'pa', 'cu', 'jm', 'ht', 'do', 'pr', 'bb', 'tt',
  'vc', 'lc', 'gd', 'ag', 'dm', 'kn', 'bs', 'tc', 'vg', 'vi', 'ky', 'bm'
].sort();

// Cache for TLD list to avoid repeated API calls
let tldCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Loads TLD list from IANA RDAP registry with fallback to static list
 * @returns {Promise<string[]>} Array of TLD strings
 */
export async function loadTLDs() {
  // Check if we have valid cached data
  if (tldCache && cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
    console.log(`📋 Using cached TLD list (${tldCache.length} TLDs)`);
    return tldCache;
  }

  try {
    // Try the main IANA RDAP bootstrap endpoint first
    console.log('📋 Fetching TLD list from IANA RDAP...');
    const response = await fetch('https://data.iana.org/rdap/dns.json');
    
    if (response.ok) {
      const data = await response.json();
      if (data.services) {
        // Extract TLDs from RDAP services
        const tlds = [];
        data.services.forEach(service => {
          const [tldArray] = service;
          tlds.push(...tldArray);
        });
        
        const sortedTlds = tlds.sort();
        console.log(`📋 Loaded ${sortedTlds.length} TLDs from IANA RDAP`);
        
        // Cache the results
        tldCache = sortedTlds;
        cacheTimestamp = Date.now();
        
        return sortedTlds;
      }
    }
  } catch (error) {
    console.log('Primary RDAP endpoint failed:', error);
  }

  // Fallback to comprehensive TLD list
  console.log('📋 Using fallback TLD list');
  tldCache = FALLBACK_TLDS;
  cacheTimestamp = Date.now();
  
  return FALLBACK_TLDS;
}

/**
 * Generates domain autocomplete suggestions based on partial input
 * @param {string} query - The partial domain input
 * @param {string[]} tldList - Array of available TLDs
 * @param {number} maxSuggestions - Maximum number of suggestions to return (default: 10)
 * @returns {string[]} Array of domain suggestions
 */
export function generateDomainSuggestions(query, tldList, maxSuggestions = 10) {
  if (!query || !query.includes('.') || query.length <= 1 || !tldList || tldList.length === 0) {
    return [];
  }

  const parts = query.split('.');
  const lastPart = parts[parts.length - 1].toLowerCase();
  const domainBase = parts.slice(0, -1).join('.');
  
  if (!domainBase || lastPart.length === 0) {
    return [];
  }

  const suggestions = tldList
    .filter(tld => tld && tld.toLowerCase().startsWith(lastPart))
    .slice(0, maxSuggestions)
    .map(tld => `${domainBase}.${tld}`);

  return suggestions;
}

/**
 * Generates domain suggestions for subdomains and full domains
 * This function is more flexible and handles subdomain cases better
 * @param {string} query - The partial domain/subdomain input
 * @param {string[]} tldList - Array of available TLDs
 * @param {number} maxSuggestions - Maximum number of suggestions to return (default: 10)
 * @returns {string[]} Array of domain/subdomain suggestions
 */
export function generateSubdomainSuggestions(query, tldList, maxSuggestions = 10) {
  if (!query || query.length <= 1 || !tldList || tldList.length === 0) {
    return [];
  }

  // If query doesn't contain a dot, return empty (need at least domain.tld structure)
  if (!query.includes('.')) {
    return [];
  }

  const parts = query.split('.');
  const lastPart = parts[parts.length - 1].toLowerCase();
  
  // If we have at least 2 parts and the last part could be a TLD
  if (parts.length >= 2) {
    const domainBase = parts.slice(0, -1).join('.');
    
    if (domainBase && lastPart.length >= 0) {
      const suggestions = tldList
        .filter(tld => tld && tld.toLowerCase().startsWith(lastPart))
        .slice(0, maxSuggestions)
        .map(tld => `${domainBase}.${tld}`);

      return suggestions;
    }
  }

  return [];
}

/**
 * Extracts the root domain from a subdomain (e.g., "mail.example.com" -> "example.com")
 * @param {string} domain - The domain or subdomain
 * @returns {string|null} The root domain or null if invalid
 */
export function extractRootDomain(domain) {
  if (!domain || typeof domain !== 'string') return null;
  
  const parts = domain.split('.');
  if (parts.length < 2) return null;
  
  // For most cases, the root domain is the last two parts
  // This is a simplified approach - in reality, some TLDs have multiple parts (e.g., .co.uk)
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }
  
  return domain;
}

/**
 * Validates if a TLD is in the known TLD list
 * @param {string} tld - The TLD to validate
 * @param {string[]} tldList - Array of valid TLDs
 * @returns {boolean} True if TLD is valid
 */
export function isValidTLD(tld, tldList) {
  if (!tld || !tldList) return false;
  return tldList.includes(tld.toLowerCase());
}

/**
 * Extracts the TLD from a domain name
 * @param {string} domain - The domain name
 * @returns {string|null} The TLD or null if invalid
 */
export function extractTLD(domain) {
  if (!domain || typeof domain !== 'string') return null;
  
  const parts = domain.split('.');
  if (parts.length < 2) return null;
  
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Checks if a string looks like a domain name
 * @param {string} input - The input to check
 * @returns {boolean} True if it looks like a domain
 */
export function isDomainLike(input) {
  if (!input || typeof input !== 'string') return false;
  
  // Basic domain pattern: at least one dot, no spaces, reasonable length
  const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;
  return domainPattern.test(input.trim());
}

/**
 * React hook for TLD functionality
 * @returns {Object} Object containing TLD utilities and state
 */
export function useTLDs() {
  const [tldList, setTldList] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const loadTLDList = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const tlds = await loadTLDs();
        setTldList(tlds);
      } catch (err) {
        console.error('Failed to load TLD list:', err);
        setError(err.message);
        // Use fallback list on error
        setTldList(FALLBACK_TLDS);
      } finally {
        setLoading(false);
      }
    };

    loadTLDList();
  }, []);

  const generateSuggestions = React.useCallback((query, maxSuggestions = 10) => {
    return generateDomainSuggestions(query, tldList, maxSuggestions);
  }, [tldList]);

  const generateSubdomainSuggestionsCallback = React.useCallback((query, maxSuggestions = 10) => {
    return generateSubdomainSuggestions(query, tldList, maxSuggestions);
  }, [tldList]);

  const validateTLD = React.useCallback((tld) => {
    return isValidTLD(tld, tldList);
  }, [tldList]);

  return {
    tldList,
    loading,
    error,
    generateSuggestions,
    generateSubdomainSuggestions: generateSubdomainSuggestionsCallback,
    validateTLD,
    isReady: tldList.length > 0 && !loading
  };
}

// For environments where React is not available, export a non-hook version
export const tldUtils = {
  loadTLDs,
  generateDomainSuggestions,
  generateSubdomainSuggestions,
  isValidTLD,
  extractTLD,
  extractRootDomain,
  isDomainLike
}; 