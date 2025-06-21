/**
 * Cloudflare Worker for Microsoft Tenant Lookups
 * Handles domain to tenant ID resolution for Microsoft 365/Azure tenants
 * Provides CORS-enabled API for client-side applications
 * Gathers ALL available public information in a single request
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
    url: () => `https://login.microsoftonline.com/common/GetCredentialType`,
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

// Additional reconnaissance APIs for enhanced information gathering
const ENHANCED_APIS = [
  {
    name: 'OpenID Configuration by Tenant ID',
    url: (tenantId) => `https://login.microsoftonline.com/${tenantId}/.well-known/openid_configuration`,
    parser: parseOpenIdConfigResponse,
    requiresAuth: false
  },
  {
    name: 'User Realm by Domain',
    url: (domain) => `https://login.microsoftonline.com/GetUserRealm.srf?login=admin@${domain}`,
    parser: parseUserRealmResponse,
    requiresAuth: false
  },
  {
    name: 'Autodiscover Service',
    url: () => `https://autodiscover-s.outlook.com/autodiscover/autodiscover.svc`,
    parser: parseAutodiscoverResponse,
    requiresAuth: false,
    method: 'POST',
    body: (domain) => `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:exm="http://schemas.microsoft.com/exchange/services/2006/messages" xmlns:ext="http://schemas.microsoft.com/exchange/services/2006/types" xmlns:a="http://www.w3.org/2005/08/addressing" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Header>
    <a:Action soap:mustUnderstand="1">http://schemas.microsoft.com/exchange/2010/Autodiscover/Autodiscover/GetDomainSettings</a:Action>
    <a:To soap:mustUnderstand="1">https://autodiscover-s.outlook.com/autodiscover/autodiscover.svc</a:To>
    <a:ReplyTo>
      <a:Address>http://www.w3.org/2005/08/addressing/anonymous</a:Address>
    </a:ReplyTo>
  </soap:Header>
  <soap:Body>
    <GetDomainSettingsRequestMessage xmlns="http://schemas.microsoft.com/exchange/2010/Autodiscover">
      <Request>
        <Domains>
          <Domain>${domain}</Domain>
        </Domains>
        <RequestedSettings>
          <Setting>ExternalEwsUrl</Setting>
          <Setting>ExternalEwsVersion</Setting>
        </RequestedSettings>
      </Request>
    </GetDomainSettingsRequestMessage>
  </soap:Body>
</soap:Envelope>`,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': 'http://schemas.microsoft.com/exchange/2010/Autodiscover/Autodiscover/GetDomainSettings'
    }
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

// Perform DNS lookups for additional information
async function performDNSAnalysis(domain) {
  const dnsInfo = {
    hasExchangeOnline: false,
    hasOffice365SPF: false,
    mxRecords: [],
    txtRecords: []
  };

  try {
    // Use Cloudflare's DNS over HTTPS API
    const dohBase = 'https://cloudflare-dns.com/dns-query';
    
    // Check MX records
    try {
      const mxResponse = await fetch(`${dohBase}?name=${domain}&type=MX`, {
        headers: { 'Accept': 'application/dns-json' }
      });
      
      if (mxResponse.ok) {
        const mxData = await mxResponse.json();
        if (mxData.Answer) {
          dnsInfo.mxRecords = mxData.Answer.map(record => {
            const parts = record.data.split(' ');
            return {
              priority: parseInt(parts[0]),
              exchange: parts[1]
            };
          });
          
          // Check for Exchange Online
          dnsInfo.hasExchangeOnline = dnsInfo.mxRecords.some(mx => 
            mx.exchange.includes('mail.protection.outlook.com')
          );
        }
      }
    } catch (error) {
      console.log('MX lookup failed:', error.message);
    }

    // Check TXT records for SPF
    try {
      const txtResponse = await fetch(`${dohBase}?name=${domain}&type=TXT`, {
        headers: { 'Accept': 'application/dns-json' }
      });
      
      if (txtResponse.ok) {
        const txtData = await txtResponse.json();
        if (txtData.Answer) {
          dnsInfo.txtRecords = txtData.Answer.map(record => record.data);
          
          // Check for Office 365 SPF
          dnsInfo.hasOffice365SPF = dnsInfo.txtRecords.some(txt => 
            txt.includes('include:spf.protection.outlook.com')
          );
        }
      }
    } catch (error) {
      console.log('TXT lookup failed:', error.message);
    }

  } catch (error) {
    console.log('DNS analysis failed:', error.message);
  }

  return dnsInfo;
}

export default {
  async fetch(request, env) {
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

    console.log(`🔍 Performing comprehensive tenant lookup for domain: ${cleanDomain}`);

    // Perform comprehensive tenant lookup with all available information
    const tenantInfo = await performComprehensiveTenantLookup(cleanDomain, env);

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

// Comprehensive tenant lookup function that gathers ALL available information
async function performComprehensiveTenantLookup(domain, env) {
  console.log(`🔍 Starting comprehensive lookup for ${domain}`);
  
  // Initialize result object
  let result = {
    success: false,
    domain: domain,
    timestamp: Date.now()
  };

  // Check known tenants first
  if (KNOWN_TENANTS[domain]) {
    const knownTenant = KNOWN_TENANTS[domain];
    console.log(`✅ Found known tenant for ${domain}: ${knownTenant.tenantId}`);
    result = {
      ...result,
      success: true,
      tenantId: knownTenant.tenantId,
      displayName: knownTenant.displayName,
      method: knownTenant.method
    };
  }

  // Get Graph API access token if needed
  let graphToken = null;
  
  // Collect all tenant information from various APIs
  const apiResults = {};
  
  // Try each primary API
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
          'User-Agent': 'Microsoft-Tenant-Lookup-Worker/1.0',
          ...(api.headers || {})
        }
      };

      // Add authentication header for Graph API
      if (api.requiresAuth && graphToken) {
        fetchOptions.headers['Authorization'] = `Bearer ${graphToken}`;
      }

      // Add body for POST requests
      if (api.method === 'POST' && api.body) {
        fetchOptions.body = api.body(domain);
        if (!api.headers || !api.headers['Content-Type']) {
          fetchOptions.headers['Content-Type'] = 'application/json';
        }
      }
      
      const response = await fetch(api.url(domain), fetchOptions);

      if (response.ok) {
        const data = await response.json();
        const parsed = api.parser(data, domain);
        
        if (parsed) {
          console.log(`✅ Got data from ${api.name}`);
          apiResults[api.name] = parsed;
          
          // If this is our first successful result, use it as the base
          if (!result.success && (parsed.tenantId || parsed.domain)) {
            result = {
              ...result,
              success: true,
              ...parsed,
              method: api.name
            };
          }
        }
      } else {
        console.log(`⚠️ ${api.name} returned status ${response.status} for ${domain}`);
      }
      
    } catch (error) {
      console.log(`❌ ${api.name} failed for ${domain}:`, error.message);
    }
  }

  // If we have a tenant ID, gather additional information
  if (result.tenantId) {
    console.log(`🔍 Gathering additional information for tenant ${result.tenantId}`);
    
    // Get OpenID configuration using tenant ID
    try {
      const openIdUrl = `https://login.microsoftonline.com/${result.tenantId}/.well-known/openid_configuration`;
      const openIdResponse = await fetch(openIdUrl);
      
      if (openIdResponse.ok) {
        const openIdData = await openIdResponse.json();
        apiResults['OpenID Configuration'] = {
          issuer: openIdData.issuer,
          authorization_endpoint: openIdData.authorization_endpoint,
          token_endpoint: openIdData.token_endpoint,
          userinfo_endpoint: openIdData.userinfo_endpoint,
          jwks_uri: openIdData.jwks_uri,
          response_types_supported: openIdData.response_types_supported,
          subject_types_supported: openIdData.subject_types_supported,
          id_token_signing_alg_values_supported: openIdData.id_token_signing_alg_values_supported
        };
        console.log(`✅ Got OpenID configuration for tenant ${result.tenantId}`);
      }
    } catch (error) {
      console.log(`❌ OpenID configuration lookup failed:`, error.message);
    }

    // Get detailed user realm information
    try {
      const userRealmUrl = `https://login.microsoftonline.com/GetUserRealm.srf?login=admin@${domain}`;
      const userRealmResponse = await fetch(userRealmUrl);
      
      if (userRealmResponse.ok) {
        const userRealmData = await userRealmResponse.json();
        apiResults['User Realm Details'] = {
          NameSpaceType: userRealmData.NameSpaceType,
          FederationBrandName: userRealmData.FederationBrandName,
          CloudInstanceName: userRealmData.CloudInstanceName,
          DomainName: userRealmData.DomainName,
          AuthURL: userRealmData.AuthURL,
          ConsumerDomain: userRealmData.ConsumerDomain
        };
        console.log(`✅ Got user realm details for ${domain}`);
      }
    } catch (error) {
      console.log(`❌ User realm lookup failed:`, error.message);
    }
  }

  // Perform DNS analysis
  console.log(`🔍 Performing DNS analysis for ${domain}`);
  const dnsInfo = await performDNSAnalysis(domain);
  if (dnsInfo.mxRecords.length > 0 || dnsInfo.txtRecords.length > 0) {
    apiResults['DNS Analysis'] = dnsInfo;
    console.log(`✅ Got DNS information for ${domain}`);
  }

  // Compile comprehensive result
  if (result.success) {
    result.apiResults = apiResults;
    result.openIdConfig = apiResults['OpenID Configuration'];
    result.userRealm = apiResults['User Realm Details'];
    result.dnsInfo = apiResults['DNS Analysis'];
    
    // Add computed fields
    if (!result.tenantType && result.tenantId) {
      result.tenantType = "AAD";
    }
    
    if (result.userRealm?.NameSpaceType) {
      result.isCloudOnly = result.userRealm.NameSpaceType === 'Managed';
    }
    
    if (!result.tenantCategory) {
      if (domain.includes('.onmicrosoft.com')) {
        result.tenantCategory = "Microsoft 365 Tenant";
      } else {
        result.tenantCategory = "Custom Domain";
      }
    }

    console.log(`✅ Comprehensive lookup completed for ${domain}`);
    return result;
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
function parseOpenIdResponse(data) {
  if (!data || !data.issuer) return null;
  
  // Extract tenant ID from the issuer field
  // Issuer format: https://login.microsoftonline.com/{tenant-id}/v2.0
  const issuerMatch = data.issuer.match(/https:\/\/login\.microsoftonline\.com\/([^/]+)\/v2\.0/);
  
  if (issuerMatch && issuerMatch[1]) {
    return {
      tenantId: issuerMatch[1],
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

// Additional parsers for enhanced APIs
function parseOpenIdConfigResponse(data) {
  if (!data || !data.issuer) return null;
  
  return {
    issuer: data.issuer,
    authorization_endpoint: data.authorization_endpoint,
    token_endpoint: data.token_endpoint,
    userinfo_endpoint: data.userinfo_endpoint,
    jwks_uri: data.jwks_uri
  };
}

function parseUserRealmResponse(data) {
  if (!data) return null;
  
  return {
    NameSpaceType: data.NameSpaceType,
    FederationBrandName: data.FederationBrandName,
    CloudInstanceName: data.CloudInstanceName,
    DomainName: data.DomainName,
    AuthURL: data.AuthURL
  };
}

function parseAutodiscoverResponse() {
  // This would parse XML response from autodiscover
  // For now, return null as it's complex to implement
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