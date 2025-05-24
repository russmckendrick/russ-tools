/**
 * Cloudflare Worker for SSL Certificate Checking
 * Acts as a proxy to SSL Labs API and other SSL checking services
 * Handles CORS and provides a clean API for the client-side app
 */

// SSL Labs API configuration - loaded from environment secrets
const getSSLLabsConfig = (env) => {
  console.log('getSSLLabsConfig called with env:', typeof env);
  
  if (!env) {
    throw new Error('Environment object is undefined');
  }
  
  if (!env.SSL_LABS_EMAIL) {
    console.error('SSL_LABS_EMAIL missing. Available env keys:', Object.keys(env));
    throw new Error('SSL_LABS_EMAIL environment variable is required');
  }
  
  if (!env.SSL_LABS_USER_AGENT) {
    console.error('SSL_LABS_USER_AGENT missing. Available env keys:', Object.keys(env));
    throw new Error('SSL_LABS_USER_AGENT environment variable is required');
  }
  
  console.log('SSL Labs config found:', {
    baseUrl: 'https://api.ssllabs.com/api/v4',
    email: env.SSL_LABS_EMAIL,
    userAgent: env.SSL_LABS_USER_AGENT
  });
  
  return {
    baseUrl: 'https://api.ssllabs.com/api/v4',
    email: env.SSL_LABS_EMAIL,
    userAgent: env.SSL_LABS_USER_AGENT
  };
};

// Allowed origins for CORS - loaded from environment secrets
const getAllowedOrigins = (env) => {
  console.log('getAllowedOrigins called with env:', typeof env);
  
  if (!env) {
    throw new Error('Environment object is undefined');
  }
  
  if (!env.ALLOWED_ORIGINS) {
    console.error('ALLOWED_ORIGINS missing. Available env keys:', Object.keys(env));
    throw new Error('ALLOWED_ORIGINS environment variable is required');
  }
  
  console.log('ALLOWED_ORIGINS found:', env.ALLOWED_ORIGINS);
  return env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
};

// Alternative SSL checking services
const FALLBACK_APIS = [
  {
    name: 'HackerTarget',
    url: (domain) => `https://api.hackertarget.com/sslcheck/?q=${domain}`,
    parser: parseHackerTargetResponse
  },
  {
    name: 'SSL Server Test',
    url: (domain) => `https://api.ssllabs.com/api/v4/analyze?host=${domain}&publish=off&fromCache=on&maxAge=24&all=done`,
    parser: parseSSLLabsResponse
  }
];

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};

async function handleRequest(request, env) {
  try {
    // Debug: Log environment variables (safely)
    console.log('Environment check:', {
      hasEmail: !!env.SSL_LABS_EMAIL,
      hasUserAgent: !!env.SSL_LABS_USER_AGENT, 
      hasOrigins: !!env.ALLOWED_ORIGINS,
      originsValue: env.ALLOWED_ORIGINS ? 'SET' : 'NOT_SET',
      envKeys: Object.keys(env || {}),
      envType: typeof env
    });

    // Check origin for security
    const origin = request.headers.get('Origin');
    const referer = request.headers.get('Referer');
    
    let isAllowedOrigin = false;
    
    // Get allowed origins with error handling
    let allowedOrigins;
    try {
      allowedOrigins = getAllowedOrigins(env);
    } catch (originsError) {
      console.error('Failed to get allowed origins:', originsError.message);
      return new Response(JSON.stringify({ 
        error: `Configuration error: ${originsError.message}` 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Check if origin is in allowed list
    if (origin && allowedOrigins.includes(origin)) {
      isAllowedOrigin = true;
    }
    
    // Fallback: check referer if no origin (some requests might not have origin)
    if (!isAllowedOrigin && referer) {
      for (const allowedOrigin of allowedOrigins) {
        if (referer.startsWith(allowedOrigin)) {
          isAllowedOrigin = true;
          break;
        }
      }
    }
    
    // Reject unauthorized requests
    if (!isAllowedOrigin) {
      console.log(`❌ Unauthorized request from origin: ${origin || 'unknown'}, referer: ${referer || 'unknown'}`);
      return new Response(JSON.stringify({ 
        error: 'Unauthorized origin. This SSL checker is restricted to authorized domains only.' 
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
        }
      });
    }

    // Handle CORS preflight requests
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

    console.log(`🔍 Checking SSL for domain: ${domain}`);
    
    // Clean the domain
    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .trim()
      .toLowerCase();

    // Try SSL Labs first, then fallback to other services
    let result = null;
    
    try {
      result = await checkSSLLabs(cleanDomain, env);
      console.log(`✅ SSL Labs succeeded for ${cleanDomain}`);
    } catch (sslLabsError) {
      console.log(`❌ SSL Labs failed: ${sslLabsError.message}`);
      
      // Try fallback APIs
      for (const api of FALLBACK_APIS) {
        if (api.name === 'SSL Server Test') continue; // Skip if SSL Labs already failed
        
        try {
          console.log(`🔄 Trying ${api.name} for ${cleanDomain}`);
          result = await checkWithAPI(api, cleanDomain);
          console.log(`✅ ${api.name} succeeded for ${cleanDomain}`);
          break;
        } catch (apiError) {
          console.log(`❌ ${api.name} failed: ${apiError.message}`);
          continue;
        }
      }
    }

    if (!result) {
      // Final fallback - basic SSL connectivity check
      result = await performBasicSSLCheck(cleanDomain);
    }

    return new Response(JSON.stringify(result), {
      headers: corsHeaders(origin, env)
    });

  } catch (error) {
    console.error(`💥 SSL check failed:`, error);
    
    return new Response(JSON.stringify({
      error: error.message || 'SSL check failed',
      stack: error.stack,
      timestamp: Date.now()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

async function checkSSLLabs(domain, env) {
  // Step 1: Check SSL Labs API availability
  const infoUrl = `${getSSLLabsConfig(env).baseUrl}/info`;
  
  try {
    const infoResponse = await fetch(infoUrl, {
      headers: {
        'User-Agent': getSSLLabsConfig(env).userAgent,
        'Accept': 'application/json'
      }
    });
    
    if (!infoResponse.ok) {
      throw new Error(`SSL Labs info check failed: ${infoResponse.status}`);
    }
    
    const infoData = await infoResponse.json();
    console.log(`✅ SSL Labs available - Engine: ${infoData.engineVersion}, Criteria: ${infoData.criteriaVersion}`);
  } catch (infoError) {
    console.log(`❌ SSL Labs info check failed: ${infoError.message}`);
    throw new Error(`SSL Labs service unavailable: ${infoError.message}`);
  }

  // Step 2: Try to get cached results first (prefer recent cache)
  let analyzeUrl = `${getSSLLabsConfig(env).baseUrl}/analyze?host=${domain}&publish=off&fromCache=on&maxAge=24&all=done`;
  
  let response = await fetch(analyzeUrl, {
    headers: {
      'User-Agent': getSSLLabsConfig(env).userAgent,
      'Accept': 'application/json',
      'email': getSSLLabsConfig(env).email
    }
  });

  if (!response.ok) {
    throw new Error(`SSL Labs analyze failed: ${response.status} ${response.statusText}`);
  }

  let data = await response.json();
  
  if (data.errors && data.errors.length > 0) {
    throw new Error(`SSL Labs error: ${data.errors[0].message}`);
  }

  // Step 3: If we have recent cached results, return them
  if (data.status === 'READY' && data.endpoints && data.endpoints.length > 0) {
    console.log(`✅ Found complete cached SSL Labs results for ${domain}`);
    return await enhanceWithEndpointDetails(data, domain, env);
  }

  // Step 4: If no good cache, start new assessment and return immediately with progress
  console.log(`🔄 Starting new SSL Labs assessment for ${domain}...`);
  
  analyzeUrl = `${getSSLLabsConfig(env).baseUrl}/analyze?host=${domain}&publish=off&startNew=on&all=done`;
  
  response = await fetch(analyzeUrl, {
    headers: {
      'User-Agent': getSSLLabsConfig(env).userAgent,
      'Accept': 'application/json',
      'email': getSSLLabsConfig(env).email
    }
  });

  if (!response.ok) {
    throw new Error(`SSL Labs start assessment failed: ${response.status} ${response.statusText}`);
  }

  data = await response.json();
  
  if (data.errors && data.errors.length > 0) {
    throw new Error(`SSL Labs error: ${data.errors[0].message}`);
  }

  // Step 5: Return immediately with current status (don't poll in worker)
  if (data.status === 'ERROR') {
    console.log(`❌ SSL Labs returned ERROR for ${domain}: ${data.statusMessage || 'Unknown error'}`);
    throw new Error(`SSL Labs analysis failed: ${data.statusMessage || 'Assessment error'}`);
  }

  console.log(`📊 Returning SSL Labs status for ${domain} - Status: ${data.status}`);
  
  // Calculate next poll time based on SSL Labs recommendations
  let recommendedPollInterval = 10; // Default 10 seconds
  if (data.status === 'DNS') {
    recommendedPollInterval = 5; // Poll every 5 seconds until IN_PROGRESS
  } else if (data.status === 'IN_PROGRESS') {
    // Use the minimum ETA from endpoints, or default to 10 seconds
    const minEta = data.endpoints?.reduce((min, ep) => {
      return ep.eta && ep.eta > 0 ? Math.min(min, ep.eta) : min;
    }, 60) || 60;
    recommendedPollInterval = Math.max(10, Math.min(30, minEta)); // Between 10-30 seconds
  }

  // Enhance ready endpoints only
  const enhancedData = await enhanceReadyEndpoints(data, domain, env);
  
  // Add polling guidance to response
  enhancedData.pollInfo = {
    shouldPoll: data.status === 'DNS' || data.status === 'IN_PROGRESS',
    recommendedInterval: recommendedPollInterval,
    nextPollTime: Date.now() + (recommendedPollInterval * 1000)
  };

  return enhancedData;
}

// Enhanced function that only processes ready endpoints (fast)
async function enhanceReadyEndpoints(data, domain, env) {
  if (data.endpoints && data.endpoints.length > 0) {
    console.log(`🔍 Enhancing ready endpoints for ${domain}...`);
    
    // Only enhance first 2 ready endpoints to keep response fast
    const readyEndpoints = data.endpoints.filter(ep => ep.statusMessage === 'Ready').slice(0, 2);
    
    for (const endpoint of readyEndpoints) {
      if (endpoint.ipAddress && (!endpoint.details || !endpoint.details.cert)) {
        try {
          const endpointUrl = `${getSSLLabsConfig(env).baseUrl}/getEndpointData?host=${domain}&s=${endpoint.ipAddress}`;
          
          const endpointResponse = await fetch(endpointUrl, {
            headers: {
              'User-Agent': getSSLLabsConfig(env).userAgent,
              'Accept': 'application/json',
              'email': getSSLLabsConfig(env).email
            }
          });

          if (endpointResponse.ok) {
            const endpointData = await endpointResponse.json();
            if (endpointData.details) {
              // Find and update the endpoint in the original data
              const endpointIndex = data.endpoints.findIndex(ep => ep.ipAddress === endpoint.ipAddress);
              if (endpointIndex !== -1) {
                data.endpoints[endpointIndex].details = endpointData.details;
                console.log(`✅ Enhanced endpoint ${endpoint.ipAddress}`);
              }
            }
          }
        } catch (endpointError) {
          console.log(`⚠️ Failed to enhance endpoint ${endpoint.ipAddress}: ${endpointError.message}`);
        }
      }
    }
  }

  console.log(`✅ SSL Labs processing complete for ${domain}`);
  return parseSSLLabsResponse(data, domain);
}

// Keep the original enhanceWithEndpointDetails for complete results
async function enhanceWithEndpointDetails(data, domain, env) {
  // For complete cached results, enhance more endpoints
  if (data.endpoints && data.endpoints.length > 0) {
    console.log(`🔍 Getting detailed endpoint data for ${domain}...`);
    
    const maxEndpointsToEnhance = 3; // Slightly more for cached complete results
    let enhancedCount = 0;
    
    for (let i = 0; i < data.endpoints.length && enhancedCount < maxEndpointsToEnhance; i++) {
      const endpoint = data.endpoints[i];
      
      if (endpoint.statusMessage === 'Ready' && endpoint.ipAddress && (!endpoint.details || !endpoint.details.cert)) {
        try {
          const endpointUrl = `${getSSLLabsConfig(env).baseUrl}/getEndpointData?host=${domain}&s=${endpoint.ipAddress}`;
          
          const endpointResponse = await fetch(endpointUrl, {
            headers: {
              'User-Agent': getSSLLabsConfig(env).userAgent,
              'Accept': 'application/json',
              'email': getSSLLabsConfig(env).email
            }
          });

          if (endpointResponse.ok) {
            const endpointData = await endpointResponse.json();
            if (endpointData.details) {
              data.endpoints[i].details = endpointData.details;
              enhancedCount++;
              console.log(`✅ Enhanced endpoint ${endpoint.ipAddress} (${enhancedCount}/${maxEndpointsToEnhance})`);
            }
          }
        } catch (endpointError) {
          console.log(`⚠️ Error enhancing endpoint: ${endpointError.message}`);
          break;
        }
      }
    }
  }

  return parseSSLLabsResponse(data, domain);
}

async function checkWithAPI(api, domain) {
  const response = await fetch(api.url(domain), {
    headers: {
      'User-Agent': 'RussTools-SSL-Worker/1.0',
      'Accept': 'application/json, text/plain'
    }
  });

  if (!response.ok) {
    throw new Error(`${api.name} API failed: ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  let data;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return api.parser(data, domain);
}

async function performBasicSSLCheck(domain) {
  try {
    // Try to fetch the domain to check SSL connectivity
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      cf: {
        timeout: 10000
      }
    });

    return {
      host: domain,
      status: 'READY',
      endpoints: [{
        statusMessage: 'SSL connection successful (basic check)',
        grade: 'T',
        hasWarnings: false,
        isExceptional: false,
        progress: 100,
        eta: 0,
        delegation: 1,
        details: { cert: null }
      }],
      apiCheck: true,
      apiSource: 'Cloudflare Worker Basic Check',
      timestamp: Date.now()
    };
  } catch (error) {
    throw new Error(`SSL connection failed: ${error.message}`);
  }
}

function parseSSLLabsResponse(data, domain) {
  console.log(`📊 Parsing SSL Labs response for ${domain}:`, JSON.stringify(data, null, 2));
  
  // Find the first certificate in the certificate chains if available
  let firstCert = null;
  if (data.certs && data.certs.length > 0) {
    firstCert = data.certs[0]; // First cert in the chain is usually the leaf certificate
  }
  
  // Count endpoint statuses
  const totalEndpoints = data.endpoints ? data.endpoints.length : 0;
  const readyEndpoints = data.endpoints ? data.endpoints.filter(ep => ep.statusMessage === 'Ready').length : 0;
  const inProgressEndpoints = data.endpoints ? data.endpoints.filter(ep => ep.statusMessage && ep.statusMessage.includes('progress')).length : 0;
  const pendingEndpoints = data.endpoints ? data.endpoints.filter(ep => ep.statusMessage === 'Pending').length : 0;
  
  // Calculate overall ETA
  const maxEta = data.endpoints?.reduce((max, ep) => {
    return ep.eta && ep.eta > 0 ? Math.max(max, ep.eta) : max;
  }, 0) || 0;
  
  // Determine overall status message
  let overallStatusMessage = '';
  if (data.status === 'READY' && readyEndpoints === totalEndpoints) {
    overallStatusMessage = 'SSL Labs analysis completed';
  } else if (data.status === 'IN_PROGRESS' || inProgressEndpoints > 0 || pendingEndpoints > 0) {
    let etaText = '';
    if (maxEta > 0) {
      if (maxEta < 60) {
        etaText = ` (ETA: ${maxEta} sec)`;
      } else {
        etaText = ` (ETA: ${Math.ceil(maxEta / 60)} min)`;
      }
    }
    overallStatusMessage = `SSL Labs analysis in progress - ${readyEndpoints}/${totalEndpoints} endpoints complete${etaText}`;
  } else if (readyEndpoints > 0) {
    overallStatusMessage = `SSL Labs partial results - ${readyEndpoints}/${totalEndpoints} endpoints analyzed`;
  } else if (data.status === 'DNS') {
    overallStatusMessage = 'SSL Labs resolving domain...';
  } else {
    overallStatusMessage = 'SSL Labs analysis started';
  }
  
  const result = {
    host: domain,
    status: data.status || 'READY',
    statusMessage: overallStatusMessage,
    assessmentProgress: {
      totalEndpoints,
      readyEndpoints,
      inProgressEndpoints,
      pendingEndpoints,
      completionPercentage: totalEndpoints > 0 ? Math.round((readyEndpoints / totalEndpoints) * 100) : 0,
      estimatedTimeRemaining: maxEta
    },
    startTime: data.startTime,
    testTime: data.testTime,
    endpoints: data.endpoints?.map(endpoint => {
      // Extract certificate from endpoint details or from the certs array
      let cert = null;
      
      if (endpoint.details?.certChains && endpoint.details.certChains.length > 0) {
        // Get the first certificate from the first chain
        const firstChain = endpoint.details.certChains[0];
        if (firstChain.certIds && firstChain.certIds.length > 0 && data.certs) {
          const leafCertId = firstChain.certIds[0];
          cert = data.certs.find(c => c.id === leafCertId);
        }
      } else if (firstCert) {
        // Fallback to first cert from global certs array
        cert = firstCert;
      }

      return {
        ipAddress: endpoint.ipAddress,
        serverName: endpoint.serverName,
        statusMessage: endpoint.statusMessage || 'SSL Labs analysis in progress',
        grade: endpoint.grade || (endpoint.statusMessage === 'Ready' ? 'T' : '-'),
        gradeTrustIgnored: endpoint.gradeTrustIgnored,
        futureGrade: endpoint.futureGrade,
        hasWarnings: endpoint.hasWarnings || false,
        isExceptional: endpoint.isExceptional || false,
        progress: endpoint.progress || (endpoint.statusMessage === 'Ready' ? 100 : 0),
        eta: endpoint.eta || 0,
        delegation: endpoint.delegation || 1,
        isComplete: endpoint.statusMessage === 'Ready',
        details: {
          cert: cert ? {
            subject: cert.subject,
            issuerSubject: cert.issuerSubject,
            notBefore: cert.notBefore,
            notAfter: cert.notAfter,
            sigAlg: cert.sigAlg,
            keyAlg: cert.keyAlg,
            keySize: cert.keySize,
            keyStrength: cert.keyStrength,
            serialNumber: cert.serialNumber,
            commonNames: cert.commonNames,
            altNames: cert.altNames,
            issues: cert.issues,
            validationType: cert.validationType,
            revocationStatus: cert.revocationStatus,
            crlRevocationStatus: cert.crlRevocationStatus,
            ocspRevocationStatus: cert.ocspRevocationStatus,
            sha1Hash: cert.sha1Hash,
            sha256Hash: cert.sha256Hash,
            pinSha256: cert.pinSha256,
            mustStaple: cert.mustStaple,
            sct: cert.sct,
            // Calculate days until expiration
            daysUntilExpiry: cert.notAfter ? Math.ceil((cert.notAfter - Date.now()) / (1000 * 60 * 60 * 24)) : null
          } : null,
          protocols: endpoint.details?.protocols?.map(protocol => ({
            id: protocol.id,
            name: protocol.name,
            version: protocol.version,
            q: protocol.q
          })) || [],
          suites: endpoint.details?.suites ? {
            list: endpoint.details.suites.list?.map(suite => ({
              id: suite.id,
              name: suite.name,
              cipherStrength: suite.cipherStrength,
              kxType: suite.kxType,
              kxStrength: suite.kxStrength,
              namedGroupBits: suite.namedGroupBits,
              namedGroupId: suite.namedGroupId,
              namedGroupName: suite.namedGroupName,
              q: suite.q
            })) || [],
            preference: endpoint.details.suites.preference,
            chaCha20Preference: endpoint.details.suites.chaCha20Preference
          } : { list: [] },
          // Only include detailed security info for ready endpoints
          ...(endpoint.statusMessage === 'Ready' ? {
            // Certificate chain information
            certChains: endpoint.details?.certChains?.map(chain => ({
              id: chain.id,
              certIds: chain.certIds,
              trustPaths: chain.trustPaths,
              issues: chain.issues,
              noSni: chain.noSni
            })) || [],
            // Security features and vulnerabilities
            vulnBeast: endpoint.details?.vulnBeast,
            renegSupport: endpoint.details?.renegSupport,
            sessionResumption: endpoint.details?.sessionResumption,
            compressionMethods: endpoint.details?.compressionMethods,
            supportsNpn: endpoint.details?.supportsNpn,
            npnProtocols: endpoint.details?.npnProtocols,
            supportsAlpn: endpoint.details?.supportsAlpn,
            alpnProtocols: endpoint.details?.alpnProtocols,
            sessionTickets: endpoint.details?.sessionTickets,
            ocspStapling: endpoint.details?.ocspStapling,
            staplingRevocationStatus: endpoint.details?.staplingRevocationStatus,
            sniRequired: endpoint.details?.sniRequired,
            httpStatusCode: endpoint.details?.httpStatusCode,
            httpForwarding: endpoint.details?.httpForwarding,
            supportsRc4: endpoint.details?.supportsRc4,
            rc4WithModern: endpoint.details?.rc4WithModern,
            forwardSecrecy: endpoint.details?.forwardSecrecy,
            supportsAead: endpoint.details?.supportsAead,
            supportsCBC: endpoint.details?.supportsCBC,
            protocolIntolerance: endpoint.details?.protocolIntolerance,
            miscIntolerance: endpoint.details?.miscIntolerance,
            // Vulnerability tests
            heartbleed: endpoint.details?.heartbleed,
            heartbeat: endpoint.details?.heartbeat,
            openSslCcs: endpoint.details?.openSslCcs,
            openSSLLuckyMinus20: endpoint.details?.openSSLLuckyMinus20,
            ticketbleed: endpoint.details?.ticketbleed,
            bleichenbacher: endpoint.details?.bleichenbacher,
            zombiePoodle: endpoint.details?.zombiePoodle,
            goldenDoodle: endpoint.details?.goldenDoodle,
            zeroLengthPaddingOracle: endpoint.details?.zeroLengthPaddingOracle,
            sleepingPoodle: endpoint.details?.sleepingPoodle,
            poodle: endpoint.details?.poodle,
            poodleTls: endpoint.details?.poodleTls,
            fallbackScsv: endpoint.details?.fallbackScsv,
            freak: endpoint.details?.freak,
            logjam: endpoint.details?.logjam,
            drownVulnerable: endpoint.details?.drownVulnerable,
            drownErrors: endpoint.details?.drownErrors,
            drownHosts: endpoint.details?.drownHosts,
            // TLS 1.3 features
            implementsTLS13MandatoryCS: endpoint.details?.implementsTLS13MandatoryCS,
            zeroRTTEnabled: endpoint.details?.zeroRTTEnabled,
            // Security policies
            hstsPolicy: endpoint.details?.hstsPolicy,
            hstsPreloads: endpoint.details?.hstsPreloads,
            hpkpPolicy: endpoint.details?.hpkpPolicy,
            hpkpRoPolicy: endpoint.details?.hpkpRoPolicy,
            staticPkpPolicy: endpoint.details?.staticPkpPolicy,
            // Additional details
            namedGroups: endpoint.details?.namedGroups,
            dhPrimes: endpoint.details?.dhPrimes,
            dhUsesKnownPrimes: endpoint.details?.dhUsesKnownPrimes,
            dhYsReuse: endpoint.details?.dhYsReuse,
            ecdhParameterReuse: endpoint.details?.ecdhParameterReuse,
            hasSct: endpoint.details?.hasSct,
            httpTransactions: endpoint.details?.httpTransactions,
            sims: endpoint.details?.sims
          } : {})
        }
      };
    }) || [{
      statusMessage: 'SSL Labs analysis in progress',
      grade: '-',
      hasWarnings: false,
      isExceptional: false,
      progress: 0,
      eta: 0,
      delegation: 1,
      isComplete: false,
      details: { cert: null }
    }],
    // Include certificate data at root level
    certs: data.certs?.map(cert => ({
      id: cert.id,
      subject: cert.subject,
      issuerSubject: cert.issuerSubject,
      notBefore: cert.notBefore,
      notAfter: cert.notAfter,
      commonNames: cert.commonNames,
      altNames: cert.altNames,
      keyAlg: cert.keyAlg,
      keySize: cert.keySize,
      serialNumber: cert.serialNumber,
      sha256Hash: cert.sha256Hash
    })) || [],
    apiCheck: true,
    apiSource: 'SSL Labs API v4 (via Cloudflare Worker)',
    timestamp: Date.now(),
    engineVersion: data.engineVersion,
    criteriaVersion: data.criteriaVersion,
    certHostnames: data.certHostnames
  };

  // Preserve pollInfo if it exists (added by the worker)
  if (data.pollInfo) {
    result.pollInfo = data.pollInfo;
  }

  return result;
}

function parseHackerTargetResponse(data, domain) {
  const lines = data.split('\n').filter(line => line.trim());
  const certInfo = {};
  
  lines.forEach(line => {
    if (line.includes('Subject:')) certInfo.subject = line.split('Subject:')[1]?.trim();
    if (line.includes('Issuer:')) certInfo.issuer = line.split('Issuer:')[1]?.trim();
    if (line.includes('Valid from:')) certInfo.validFrom = line.split('Valid from:')[1]?.trim();
    if (line.includes('Valid until:')) certInfo.validUntil = line.split('Valid until:')[1]?.trim();
    if (line.includes('Serial:')) certInfo.serial = line.split('Serial:')[1]?.trim();
  });

  const hasValidCert = !data.toLowerCase().includes('error') && !data.toLowerCase().includes('failed');
  const now = new Date();
  const expiryDate = certInfo.validUntil ? new Date(certInfo.validUntil) : null;
  const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)) : null;
  
  let grade = 'T';
  if (hasValidCert) {
    if (daysUntilExpiry > 90) grade = 'A+';
    else if (daysUntilExpiry > 30) grade = 'A';
    else if (daysUntilExpiry > 7) grade = 'B';
    else if (daysUntilExpiry > 0) grade = 'C';
    else grade = 'F';
  } else {
    grade = 'F';
  }
  
  return {
    host: domain,
    status: 'READY',
    endpoints: [{
      statusMessage: hasValidCert ? 
        `Certificate valid - expires in ${daysUntilExpiry} days` : 
        'Certificate validation failed',
      grade: grade,
      hasWarnings: daysUntilExpiry < 30,
      isExceptional: hasValidCert && daysUntilExpiry > 90,
      progress: 100,
      eta: 0,
      delegation: 1,
      details: {
        cert: hasValidCert && certInfo.subject ? {
          subject: certInfo.subject,
          issuerSubject: certInfo.issuer,
          notBefore: certInfo.validFrom ? new Date(certInfo.validFrom).getTime() : null,
          notAfter: certInfo.validUntil ? new Date(certInfo.validUntil).getTime() : null,
          sigAlg: 'Unknown',
          serialNumber: certInfo.serial
        } : null
      }
    }],
    apiCheck: true,
    apiSource: 'HackerTarget (via Cloudflare Worker)',
    timestamp: Date.now()
  };
}

function handleCORS(origin, env) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(origin, env)
  });
}

function corsHeaders(origin, env) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin && getAllowedOrigins(env).includes(origin) ? origin : getAllowedOrigins(env)[0],
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
  };
} 