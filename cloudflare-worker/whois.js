/**
 * Cloudflare Worker for WHOIS Lookups
 * Handles both domain WHOIS queries and IP address lookups
 * Provides CORS-enabled API for client-side applications
 */

// IP Information APIs (free, browser-friendly)
const IP_APIS = [
  {
    name: 'ipinfo.io',
    url: (ip) => `https://ipinfo.io/${ip}/json`,
    parser: parseIpinfoResponse,
    requiresAuth: false
  },
  {
    name: 'ip-api.com',
    url: (ip) => `http://ip-api.com/json/${ip}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,mobile,proxy,hosting,query`,
    parser: parseIpApiResponse,
    requiresAuth: false
  }
];

// RDAP (Registration Data Access Protocol) endpoints from IANA
// This is the modern replacement for WHOIS with structured JSON responses
const RDAP_BOOTSTRAP_URL = 'https://data.iana.org/rdap/dns.json';

// Cache for RDAP bootstrap data (updated periodically)
let rdapBootstrapCache = null;
let rdapCacheTimestamp = 0;
const RDAP_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Fetch and cache RDAP bootstrap data
async function getRDAPBootstrap() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (rdapBootstrapCache && (now - rdapCacheTimestamp) < RDAP_CACHE_DURATION) {
    return rdapBootstrapCache;
  }
  
  try {
    console.log('🔄 Fetching RDAP bootstrap data from IANA');
    const response = await fetch(RDAP_BOOTSTRAP_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch RDAP bootstrap: ${response.status}`);
    }
    
    const data = await response.json();
    rdapBootstrapCache = data;
    rdapCacheTimestamp = now;
    
    console.log('✅ RDAP bootstrap data cached successfully');
    return data;
    
  } catch (error) {
    console.error('❌ Failed to fetch RDAP bootstrap:', error);
    
    // Return cached data even if expired, or null
    return rdapBootstrapCache;
  }
}

// Find RDAP service URL for a given TLD
function findRDAPService(tld, bootstrap) {
  if (!bootstrap || !bootstrap.services) {
    return null;
  }
  
  // Search through RDAP services
  for (const service of bootstrap.services) {
    const [tlds, urls] = service;
    
    // Check if this TLD is handled by this service
    if (tlds.includes(tld)) {
      return urls[0]; // Return first URL
    }
  }
  
  return null;
}

// Extract effective TLD from domain (handling multi-part TLDs)
function extractEffectiveTLD(domain, bootstrap) {
  const parts = domain.split('.');
  
  if (!bootstrap || !bootstrap.services) {
    // Fallback to simple TLD extraction
    return parts[parts.length - 1];
  }
  
  // Build a set of all known TLDs from RDAP bootstrap
  const knownTLDs = new Set();
  for (const service of bootstrap.services) {
    const [tlds] = service;
    tlds.forEach(tld => knownTLDs.add(tld));
  }
  
  // Check for multi-part TLDs first (like co.uk, com.au)
  if (parts.length >= 3) {
    const twoPartTLD = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    if (knownTLDs.has(twoPartTLD)) {
      return twoPartTLD;
    }
  }
  
  // Check for three-part TLDs (rare but exist)
  if (parts.length >= 4) {
    const threePartTLD = `${parts[parts.length - 3]}.${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    if (knownTLDs.has(threePartTLD)) {
      return threePartTLD;
    }
  }
  
  // Fallback to single-part TLD
  const singlePartTLD = parts[parts.length - 1];
  return knownTLDs.has(singlePartTLD) ? singlePartTLD : null;
}

// Get allowed origins from environment
const getAllowedOrigins = (env) => {
  if (!env || !env.ALLOWED_ORIGINS) {
    throw new Error('ALLOWED_ORIGINS environment variable is required');
  }
  return env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
};

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
      console.log(`❌ Unauthorized WHOIS request from origin: ${origin || 'unknown'}`);
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
    const query = url.searchParams.get('query');
    const type = url.searchParams.get('type'); // 'domain', 'ip', or 'auto'

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query parameter is required' }), {
        status: 400,
        headers: corsHeaders(origin, env)
      });
    }

    console.log(`🔍 WHOIS lookup for: ${query}, type: ${type || 'auto'}`);
    
    const cleanQuery = query.trim().toLowerCase();
    
    // Determine if it's an IP or domain
    const isIP = isValidIP(cleanQuery);
    const lookupType = type || (isIP ? 'ip' : 'domain');
    
    let result;
    
    if (lookupType === 'ip' || isIP) {
      result = await performIPLookup(cleanQuery);
    } else {
      result = await performDomainWhois(cleanQuery);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: corsHeaders(origin, env)
    });

  } catch (error) {
    console.error('WHOIS Worker Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders(request.headers.get('Origin'), env)
    });
  }
}

// Check if string is a valid IP address
function isValidIP(str) {
  // IPv4 regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6 regex (simplified)
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
  
  if (ipv4Regex.test(str)) {
    // Validate IPv4 octets
    const octets = str.split('.');
    return octets.every(octet => parseInt(octet) >= 0 && parseInt(octet) <= 255);
  }
  
  return ipv6Regex.test(str);
}

// Perform IP address lookup using multiple APIs
async function performIPLookup(ip) {
  const results = {
    query: ip,
    type: 'ip',
    timestamp: Date.now(),
    status: 'success',
    data: {},
    sources: []
  };

  for (const api of IP_APIS) {
    try {
      console.log(`🌐 Trying ${api.name} for IP: ${ip}`);
      
      const response = await fetch(api.url(ip), {
        headers: {
          'User-Agent': 'RussTools-WHOIS/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.text();
      const parsed = api.parser(data, ip);
      
      if (parsed && !parsed.error) {
        results.data[api.name] = parsed;
        results.sources.push({
          name: api.name,
          status: 'success',
          timestamp: Date.now()
        });
        console.log(`✅ ${api.name} succeeded for IP: ${ip}`);
      } else {
        throw new Error(parsed?.error || 'Invalid response');
      }
      
    } catch (error) {
      console.log(`❌ ${api.name} failed for IP ${ip}: ${error.message}`);
      results.sources.push({
        name: api.name,
        status: 'failed',
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  // Check if we got any successful results
  if (Object.keys(results.data).length === 0) {
    results.status = 'failed';
    results.error = 'All IP lookup services failed';
  } else {
    // Merge and normalize data from different sources
    results.normalized = normalizeIPData(results.data);
  }

  return results;
}

// Perform domain WHOIS lookup
async function performDomainWhois(domain) {
  const results = {
    query: domain,
    type: 'domain',
    timestamp: Date.now(),
    status: 'success',
    data: {},
    sources: []
  };

  try {
    // Get RDAP bootstrap data
    const bootstrap = await getRDAPBootstrap();
    
    if (!bootstrap) {
      throw new Error('Failed to load RDAP bootstrap data');
    }

    // Extract effective TLD
    const tld = extractEffectiveTLD(domain, bootstrap);
    
    if (!tld) {
      results.status = 'failed';
      results.error = `No RDAP service found for domain: ${domain}`;
      return results;
    }

    // Find RDAP service for this TLD
    const rdapServiceUrl = findRDAPService(tld, bootstrap);
    
    if (!rdapServiceUrl) {
      results.status = 'failed';
      results.error = `No RDAP service found for TLD: ${tld}`;
      return results;
    }

    console.log(`🔍 Performing RDAP lookup for ${domain} using ${rdapServiceUrl}`);
    
    // Query RDAP service
    const rdapData = await queryRDAPService(domain, rdapServiceUrl);
    
    if (rdapData) {
      results.data.rdap = rdapData;
      results.sources.push({
        name: 'rdap',
        service: rdapServiceUrl,
        tld: tld,
        status: 'success',
        timestamp: Date.now()
      });
      results.normalized = normalizeRDAPData(rdapData);
    } else {
      throw new Error('RDAP service returned no data');
    }
    
  } catch (error) {
    console.log(`❌ RDAP lookup failed for ${domain}: ${error.message}`);
    results.status = 'failed';
    results.error = error.message;
    results.sources.push({
      name: 'rdap',
      status: 'failed',
      error: error.message,
      timestamp: Date.now()
    });
  }

  return results;
}

// Query RDAP service for domain information
async function queryRDAPService(domain, rdapServiceUrl) {
  try {
    // Construct RDAP domain query URL
    const rdapUrl = `${rdapServiceUrl.replace(/\/$/, '')}/domain/${domain}`;
    
    console.log(`🌐 Querying RDAP: ${rdapUrl}`);
    
    const response = await fetch(rdapUrl, {
      headers: {
        'User-Agent': 'RussTools-WHOIS/1.0',
        'Accept': 'application/rdap+json, application/json'
      }
    });
    
    if (!response.ok) {
      // RDAP services may return 404 for non-existent domains
      if (response.status === 404) {
        return {
          objectClassName: 'domain',
          ldhName: domain,
          status: ['not found'],
          rdapConformance: ['rdap_level_0'],
          notices: [
            {
              title: 'Domain Not Found',
              description: ['The requested domain was not found in the registry.']
            }
          ]
        };
      }
      throw new Error(`RDAP query failed: ${response.status} ${response.statusText}`);
    }
    
    const rdapData = await response.json();
    console.log(`✅ RDAP query successful for ${domain}`);
    
    return rdapData;
    
  } catch (error) {
    console.error(`❌ RDAP query failed for ${domain}:`, error);
    throw error;
  }
}

// Normalize RDAP data to a consistent format
function normalizeRDAPData(rdapData) {
  if (!rdapData) return null;
  
  const normalized = {
    domain: rdapData.ldhName || rdapData.unicodeName,
    status: rdapData.status || [],
    events: {},
    entities: {},
    nameservers: [],
    registrar: null,
    created: null,
    updated: null,
    expires: null
  };

  // Process events (registration, expiration, etc.)
  if (rdapData.events) {
    for (const event of rdapData.events) {
      const action = event.eventAction;
      const date = event.eventDate;
      
      normalized.events[action] = date;
      
      // Map common events to standard fields
      switch (action) {
        case 'registration':
          normalized.created = date;
          break;
        case 'expiration':
          normalized.expires = date;
          break;
        case 'last changed':
        case 'last update of RDAP database':
          normalized.updated = date;
          break;
      }
    }
  }

  // Process entities (registrar, registrant, etc.)
  if (rdapData.entities) {
    for (const entity of rdapData.entities) {
      const roles = entity.roles || [];
      
      // Extract registrar information
      if (roles.includes('registrar')) {
        normalized.registrar = {
          name: entity.vcardArray?.[1]?.[1]?.[3] || entity.handle,
          handle: entity.handle,
          url: entity.links?.[0]?.href
        };
        normalized.entities.registrar = entity;
      }
      
      // Store other entities by role
      roles.forEach(role => {
        if (!normalized.entities[role]) {
          normalized.entities[role] = [];
        }
        if (Array.isArray(normalized.entities[role])) {
          normalized.entities[role].push(entity);
        } else {
          normalized.entities[role] = [normalized.entities[role], entity];
        }
      });
    }
  }

  // Process nameservers
  if (rdapData.nameservers) {
    normalized.nameservers = rdapData.nameservers.map(ns => ({
      name: ns.ldhName || ns.unicodeName,
      status: ns.status,
      ipAddresses: {
        v4: ns.ipAddresses?.v4 || [],
        v6: ns.ipAddresses?.v6 || []
      }
    }));
  }

  return normalized;
}

// Parse ipinfo.io response
function parseIpinfoResponse(data, ip) {
  try {
    const json = JSON.parse(data);
    
    if (json.error) {
      return { error: json.error };
    }
    
    return {
      ip: json.ip,
      city: json.city,
      region: json.region,
      country: json.country,
      location: json.loc,
      organization: json.org,
      postal: json.postal,
      timezone: json.timezone,
      hostname: json.hostname,
      anycast: json.anycast,
      source: 'ipinfo.io'
    };
  } catch (error) {
    return { error: 'Failed to parse ipinfo.io response' };
  }
}

// Parse ip-api.com response
function parseIpApiResponse(data, ip) {
  try {
    const json = JSON.parse(data);
    
    if (json.status === 'fail') {
      return { error: json.message || 'IP API lookup failed' };
    }
    
    return {
      ip: json.query,
      city: json.city,
      region: json.regionName,
      region_code: json.region,
      country: json.country,
      country_code: json.countryCode,
      continent: json.continent,
      latitude: json.lat,
      longitude: json.lon,
      timezone: json.timezone,
      isp: json.isp,
      organization: json.org,
      as: json.as,
      asname: json.asname,
      reverse: json.reverse,
      mobile: json.mobile,
      proxy: json.proxy,
      hosting: json.hosting,
      source: 'ip-api.com'
    };
  } catch (error) {
    return { error: 'Failed to parse ip-api.com response' };
  }
}

// Normalize IP data from different sources
function normalizeIPData(data) {
  const normalized = {
    ip: null,
    location: {},
    network: {},
    organization: {},
    security: {}
  };

  // Prefer ipinfo.io data, fallback to ip-api.com
  const ipinfo = data['ipinfo.io'];
  const ipapi = data['ip-api.com'];

  if (ipinfo) {
    normalized.ip = ipinfo.ip;
    normalized.location = {
      city: ipinfo.city,
      region: ipinfo.region,
      country: ipinfo.country,
      coordinates: ipinfo.location,
      postal: ipinfo.postal,
      timezone: ipinfo.timezone
    };
    normalized.organization.name = ipinfo.organization;
    normalized.network.hostname = ipinfo.hostname;
  }

  if (ipapi) {
    normalized.ip = normalized.ip || ipapi.ip;
    normalized.location = {
      ...normalized.location,
      city: normalized.location.city || ipapi.city,
      region: normalized.location.region || ipapi.region,
      country: normalized.location.country || ipapi.country,
      country_code: ipapi.country_code,
      continent: ipapi.continent,
      latitude: ipapi.latitude,
      longitude: ipapi.longitude,
      timezone: normalized.location.timezone || ipapi.timezone
    };
    normalized.network = {
      ...normalized.network,
      isp: ipapi.isp,
      as: ipapi.as,
      asname: ipapi.asname,
      reverse: ipapi.reverse
    };
    normalized.organization = {
      ...normalized.organization,
      name: normalized.organization.name || ipapi.organization
    };
    normalized.security = {
      mobile: ipapi.mobile,
      proxy: ipapi.proxy,
      hosting: ipapi.hosting
    };
  }

  return normalized;
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
    'Access-Control-Max-Age': '86400',
  };

  try {
    const allowedOrigins = getAllowedOrigins(env);
    if (origin && allowedOrigins.includes(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
    } else {
      headers['Access-Control-Allow-Origin'] = allowedOrigins[0];
    }
  } catch (error) {
    // Fallback
    headers['Access-Control-Allow-Origin'] = '*';
  }

  return headers;
} 