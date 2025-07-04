import React from 'react';
import { getApiEndpoint, buildApiUrl, apiFetch } from '../../../utils/api/apiUtils';

/**
 * Utility functions for Microsoft tenant lookup
 */

/**
 * Get tenant ID from domain using multiple fallback methods
 * @param {string} domain - Domain name to lookup (e.g., "contoso.com")
 * @returns {Promise<Object>} Tenant information including ID and details
 */
export const getTenantId = async (domain) => {
  if (!domain || !domain.trim()) {
    throw new Error('Domain is required');
  }

  const cleanDomain = domain.trim().toLowerCase();
  
  // Validate domain format (basic validation)
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
  if (!domainRegex.test(cleanDomain)) {
    throw new Error('Invalid domain format');
  }

  console.log(`🔍 Looking up tenant for domain: ${cleanDomain}`);

  // Use configured tenant API for lookup (bypasses CORS issues)
  try {
    const tenantConfig = getApiEndpoint('tenant');
    const apiUrl = buildApiUrl(tenantConfig.url, { domain: cleanDomain });
    
    const response = await apiFetch(apiUrl, {
      method: 'GET',
      headers: {
        ...tenantConfig.headers,
        'Accept': 'application/json',
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      if (data.success && data.tenantId) {
        return {
          tenantId: data.tenantId,
          domain: data.domain,
          displayName: data.displayName || cleanDomain,
          federationBrandName: data.federationBrandName,
          defaultDomainName: data.defaultDomainName,
          tenantType: data.tenantType,
          isCloudOnly: data.isCloudOnly,
          tenantCategory: data.tenantCategory,
          issuer: data.issuer,
          authorizationEndpoint: data.authorizationEndpoint,
          tokenEndpoint: data.tokenEndpoint,
          method: data.method,
          timestamp: data.timestamp
        };
      } else if (!data.success) {
        // Worker returned structured error
        throw new Error(data.error || 'Tenant lookup failed');
      }
    } else {
      throw new Error(`Worker returned status ${response.status}`);
    }
  } catch (error) {
    console.error('Cloudflare Worker lookup failed:', error);
    
    // Fallback to known tenants if worker fails
    const knownTenants = {
      'microsoft.com': {
        tenantId: '72f988bf-86f1-41af-91ab-2d7cd011db47',
        displayName: 'Microsoft Corporation',
        method: 'Known tenant database (fallback)'
      },
      'outlook.com': {
        tenantId: '9188040d-6c67-4c5b-b112-36a304b66dad',
        displayName: 'Microsoft Services',
        method: 'Known tenant database (fallback)'
      },
      'hotmail.com': {
        tenantId: '9188040d-6c67-4c5b-b112-36a304b66dad',
        displayName: 'Microsoft Services',
        method: 'Known tenant database (fallback)'
      }
    };

    if (knownTenants[cleanDomain]) {
      const knownTenant = knownTenants[cleanDomain];
      return {
        tenantId: knownTenant.tenantId,
        domain: cleanDomain,
        displayName: knownTenant.displayName,
        method: knownTenant.method,
        timestamp: Date.now()
      };
    }
    
    // Re-throw the original error if no fallback available
    throw error;
  }

  // If all methods fail
  throw new Error(`Unable to discover tenant information for domain: ${cleanDomain}. 

This could mean:
• The domain is not associated with a Microsoft tenant
• The domain uses a different identity provider
• The lookup services are temporarily unavailable

Try testing with a known Microsoft domain like 'microsoft.com' or 'outlook.com' to verify the tool is working.`);
};



/**
 * Validate if a string looks like a domain
 * @param {string} input - Input to validate
 * @returns {boolean} Whether the input looks like a valid domain
 */
export const isValidDomain = (input) => {
  if (!input || typeof input !== 'string') return false;
  
  const trimmed = input.trim();
  if (trimmed.length === 0) return false;
  
  // Basic domain validation regex
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
  return domainRegex.test(trimmed);
};

/**
 * Extract domain from email if user enters email instead of domain
 * @param {string} input - Input that might be email or domain
 * @returns {string} Extracted domain
 */
export const extractDomain = (input) => {
  if (!input || typeof input !== 'string') return '';
  
  const trimmed = input.trim();
  
  // If it contains @, treat as email and extract domain
  if (trimmed.includes('@')) {
    const parts = trimmed.split('@');
    return parts[parts.length - 1].toLowerCase();
  }
  
  // Otherwise return as-is (assuming it's already a domain)
  return trimmed.toLowerCase();
};

// This component doesn't render anything, it's just utility functions
const TenantLookup = () => null;

export default TenantLookup; 