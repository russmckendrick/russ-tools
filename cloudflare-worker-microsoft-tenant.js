/**
 * Cloudflare Worker for Microsoft Tenant Lookups
 * Handles domain to tenant ID resolution for Microsoft 365/Azure tenants
 * Provides CORS-enabled API for client-side applications
 * 
 * Environment Variables:
 * - ALLOWED_ORIGINS: Comma-separated list of allowed CORS origins (required)
 * - GRAPH_CLIENT_ID: Azure App Registration client ID (optional, for tenant IDs)
 * - GRAPH_CLIENT_SECRET: Azure App Registration client secret (optional, for tenant IDs)  
 * - GRAPH_TENANT_ID: Azure tenant ID for app registration (optional, for tenant IDs)
 * 
 * Configure in wrangler.toml:
 * [vars]
 * ALLOWED_ORIGINS = "http://localhost:5173,https://yourdomain.com"
 */

// Microsoft tenant lookup APIs
const TENANT_APIS = [
  {
    name: 'Microsoft Graph API',
    url: (domain) => `https://graph.microsoft.com/v1.0/tenantRelationships/findTenantInformationByDomainName(domainName='${domain}')`,
    parser: parseGraphApiResponse,
    requiresAuth: true
  },
  {
    name: 'GetUserRealm API',
    url: (domain) => `https://login.microsoftonline.com/GetUserRealm.srf?login=test@${domain}`,
    parser: parseGetUserRealmResponse,
    requiresAuth: false
  },
  {
    name: 'GetCredentialType API',
    url: (domain) => `https://login.microsoftonline.com/common/GetCredentialType`,
    parser: parseGetCredentialTypeResponse,
    requiresAuth: false,
    method: 'POST',
    body: (domain) => JSON.stringify({ Username: `test@${domain}` })
  },
  {
    name: 'OpenID Connect Well-Known',
    url: (domain) => `https://login.microsoftonline.com/${domain}/.well-known/openid_configuration`,
    parser: parseOpenIdResponse,
    requiresAuth: false
  },
  {
    name: 'OpenID Connect v2.0',
    url: (domain) => `https://login.microsoftonline.com/${domain}/v2.0/.well-known/openid_configuration`,
    parser: parseOpenIdResponse,
    requiresAuth: false
  },
  {
    name: 'Office 365 Federation Provider',
    url: (domain) => `https://odc.officeapps.live.com/odc/v2.1/federationprovider?domain=${domain}`,
    parser: parseFederationResponse,
    requiresAuth: false
  }
];

// Known Microsoft tenant mappings for common domains (removed for testing)
const KNOWN_TENANTS = {};

// Get allowed origins from environment
const getAllowedOrigins = (env) => {
  if (!env || !env.ALLOWED_ORIGINS) {
    throw new Error('ALLOWED_ORIGINS environment variable is required. Set it in wrangler.toml [vars] section.');
  }
  
  const origins = env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(origin => origin.length > 0);
  
  if (origins.length === 0) {
    throw new Error('ALLOWED_ORIGINS must contain at least one valid origin');
  }
  
  console.log(`🔒 CORS configured for origins: ${origins.join(', ')}`);
  return origins;
};

// Get Microsoft Graph access token
async function getGraphAccessToken(env) {
  if (!env.GRAPH_CLIENT_ID || !env.GRAPH_CLIENT_SECRET || !env.GRAPH_TENANT_ID) {
    console.log('⚠️ Graph API credentials not configured, skipping Graph API');
    return null;
  }

  try {
    const tokenUrl = `https://login.microsoftonline.com/${env.GRAPH_TENANT_ID}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      client_id: env.GRAPH_CLIENT_ID,
      client_secret: env.GRAPH_CLIENT_SECRET,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body
    });

    if (response.ok) {
      const data = await response.json();
      return data.access_token;
    } else {
      console.error('Failed to get Graph access token:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error getting Graph access token:', error);
    return null;
  }
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};

async function handleRequest(request, env) {
  try {
    // Security check for allowed origins
    const origin = request.headers.get('Origin');
    const referer = request.headers.get('Referer');
    
    let isAllowedOrigin = false;
    let allowedOrigins;
    
    try {
      allowedOrigins = getAllowedOrigins(env);
    } catch (originsError) {
      return new Response(JSON.stringify({ 
        error: `Configuration error: ${originsError.message}` 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check origin authorization
    if (origin && allowedOrigins.includes(origin)) {
      isAllowedOrigin = true;
    }
    
    if (!isAllowedOrigin && referer) {
      for (const allowedOrigin of allowedOrigins) {
        if (referer.startsWith(allowedOrigin)) {
          isAllowedOrigin = true;
          break;
        }
      }
    }
    
    if (!isAllowedOrigin) {
      console.log(`❌ Unauthorized tenant lookup request from origin: ${origin || 'unknown'}`);
      return new Response(JSON.stringify({ 
        error: 'Unauthorized origin' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS(origin, env);
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders(origin, env)
      });
    }

    const url = new URL(request.url);
    const domain = url.searchParams.get('domain');

    if (!domain) {
      return new Response(JSON.stringify({ error: 'Domain parameter is required' }), {
        status: 400,
        headers: corsHeaders(origin, env)
      });
    }

    // Validate and clean domain
    const cleanDomain = extractDomain(domain);
    if (!isValidDomain(cleanDomain)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid domain format',
        domain: cleanDomain
      }), {
        status: 400,
        headers: corsHeaders(origin, env)
      });
    }

    console.log(`🔍 Looking up Microsoft tenant for domain: ${cleanDomain}`);

    // Perform tenant lookup
    const tenantInfo = await performTenantLookup(cleanDomain, env);

    return new Response(JSON.stringify(tenantInfo), {
      status: 200,
      headers: corsHeaders(origin, env)
    });

  } catch (error) {
    console.error('❌ Error in tenant lookup:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders(request.headers.get('Origin'), env)
    });
  }
}

// Extract domain from email if user enters email instead of domain
function extractDomain(input) {
  if (!input || typeof input !== 'string') return '';
  
  const trimmed = input.trim();
  
  // If it contains @, treat as email and extract domain
  if (trimmed.includes('@')) {
    const parts = trimmed.split('@');
    return parts[parts.length - 1].toLowerCase();
  }
  
  // Otherwise return as-is (assuming it's already a domain)
  return trimmed.toLowerCase();
}

// Validate if a string looks like a domain
function isValidDomain(input) {
  if (!input || typeof input !== 'string') return false;
  
  const trimmed = input.trim();
  if (trimmed.length === 0) return false;
  
  // Basic domain validation regex
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
  return domainRegex.test(trimmed);
}

// Main tenant lookup function
async function performTenantLookup(domain, env) {
  // Check known tenants first
  if (KNOWN_TENANTS[domain]) {
    const knownTenant = KNOWN_TENANTS[domain];
    console.log(`✅ Found known tenant for ${domain}: ${knownTenant.tenantId}`);
    return {
      success: true,
      tenantId: knownTenant.tenantId,
      domain: domain,
      displayName: knownTenant.displayName,
      method: knownTenant.method,
      timestamp: Date.now()
    };
  }

  // Get Graph API access token if needed
  let graphToken = null;
  
  // Try each API in sequence
  for (const api of TENANT_APIS) {
    try {
      console.log(`🔄 Trying ${api.name} for ${domain}`);
      
      // Skip Graph API if authentication is required but not available
      if (api.requiresAuth) {
        if (!graphToken) {
          graphToken = await getGraphAccessToken(env);
        }
        if (!graphToken) {
          console.log(`⚠️ Skipping ${api.name} - no authentication available`);
          continue;
        }
      }
      
      const fetchOptions = {
        method: api.method || 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Microsoft-Tenant-Lookup-Worker/1.0'
        }
      };

      // Add authentication header for Graph API
      if (api.requiresAuth && graphToken) {
        fetchOptions.headers['Authorization'] = `Bearer ${graphToken}`;
      }

      // Add body for POST requests
      if (api.method === 'POST' && api.body) {
        fetchOptions.body = api.body(domain);
        fetchOptions.headers['Content-Type'] = 'application/json';
      }
      
      const response = await fetch(api.url(domain), fetchOptions);

      if (response.ok) {
        const data = await response.json();
        const parsed = api.parser(data, domain);
        
        if (parsed && (parsed.tenantId || parsed.domain)) {
          console.log(`✅ Successfully found tenant info via ${api.name}`);
          
          const result = {
            success: true,
            ...parsed,
            method: api.name,
            timestamp: Date.now()
          };
          
          // Add note if tenant ID is missing
          if (!parsed.tenantId) {
            result.note = "Tenant confirmed to exist. Tenant ID requires additional lookup via Microsoft Graph API or admin access.";
          }
          
          return result;
        }
      } else {
        console.log(`⚠️ ${api.name} returned status ${response.status} for ${domain}`);
      }
      
    } catch (error) {
      console.log(`❌ ${api.name} failed for ${domain}:`, error.message);
    }
  }

  // If all methods fail
  console.log(`❌ No tenant found for domain: ${domain}`);
  return {
    success: false,
    error: `Unable to discover tenant information for domain: ${domain}`,
    domain: domain,
    suggestions: [
      'The domain may not be associated with a Microsoft tenant',
      'The domain may use a different identity provider',
      'The lookup services may be temporarily unavailable'
    ],
    timestamp: Date.now()
  };
}

// Parse Office 365 Federation Provider response
function parseFederationResponse(data, domain) {
  if (!data) return null;
  
  // The federation API returns tenantid (lowercase)
  if (data.tenantid) {
    return {
      tenantId: data.tenantid,
      domain: domain,
      displayName: data.displayName || domain,
      federationBrandName: data.federationBrandName
    };
  }
  
  return null;
}

// Parse OpenID Connect Well-Known response
function parseOpenIdResponse(data, domain) {
  if (!data || !data.issuer) return null;
  
  // Extract tenant ID from the issuer field
  // Issuer format: https://login.microsoftonline.com/{tenant-id}/v2.0
  const issuerMatch = data.issuer.match(/https:\/\/login\.microsoftonline\.com\/([^\/]+)\/v2\.0/);
  
  if (issuerMatch && issuerMatch[1]) {
    return {
      tenantId: issuerMatch[1],
      domain: domain,
      issuer: data.issuer,
      authorizationEndpoint: data.authorization_endpoint,
      tokenEndpoint: data.token_endpoint
    };
  }
  
  return null;
}

// Parse GetUserRealm API response
function parseGetUserRealmResponse(data, domain) {
  if (!data) return null;
  
  // GetUserRealm returns domain information including federation details
  if (data.DomainName && data.DomainName.toLowerCase() === domain.toLowerCase()) {
    return {
      tenantId: null, // This API doesn't return tenant ID directly
      domain: domain,
      displayName: data.FederationBrandName || domain,
      namespaceType: data.NameSpaceType,
      cloudInstance: data.CloudInstanceName
    };
  }
  
  return null;
}

// Parse Microsoft Graph API response
function parseGraphApiResponse(data, domain) {
  if (!data) return null;
  
  // Graph API returns complete tenant information
  if (data.tenantId) {
    const result = {
      tenantId: data.tenantId,
      domain: domain,
      displayName: data.displayName || domain,
      federationBrandName: data.federationBrandName,
      defaultDomainName: data.defaultDomainName
    };

    // Add computed information
    result.tenantType = "AAD"; // Default for findTenantInformationByDomainName
    result.isCloudOnly = data.federationBrandName === null;
    
    // Determine likely region from domain
    if (domain.includes('.onmicrosoft.com')) {
      result.tenantCategory = "Microsoft 365 Tenant";
    } else {
      result.tenantCategory = "Custom Domain";
    }

    return result;
  }
  
  return null;
}



// Parse GetCredentialType API response  
function parseGetCredentialTypeResponse(data, domain) {
  if (!data) return null;
  
  // GetCredentialType returns user credential information
  if (data.Username && data.Username.includes(`@${domain}`)) {
    return {
      tenantId: null, // This API doesn't return tenant ID directly
      domain: domain,
      displayName: domain,
      userExists: data.IfExistsResult === 0, // 0 means user exists
      isUnmanaged: data.IsUnmanaged,
      domainType: data.EstsProperties?.DomainType
    };
  }
  
  return null;
}

// Handle CORS preflight requests
function handleCORS(origin, env) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(origin, env)
  });
}

// Generate CORS headers
function corsHeaders(origin, env) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };

  // Set origin-specific CORS headers
  if (origin) {
    try {
      const allowedOrigins = getAllowedOrigins(env);
      if (allowedOrigins.includes(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
        headers['Access-Control-Allow-Credentials'] = 'true';
      }
    } catch (error) {
      console.error('Error setting CORS headers:', error);
    }
  }

  return headers;
} 