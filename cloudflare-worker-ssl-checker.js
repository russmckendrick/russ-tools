/**
 * Cloudflare Worker for SSL Certificate Checking
 * Acts as a proxy to SSL Labs API and other SSL checking services
 * Handles CORS and provides a clean API for the client-side app
 */

// SSL Labs API configuration
const SSL_LABS_CONFIG = {
  baseUrl: 'https://api.ssllabs.com/api/v4',
  userAgent: 'RussTools/1.0 (ssllabs.site@wibble.email)',
  email: 'ssllabs.site@wibble.email' // Registered email for SSL Labs API v4
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

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleCORS();
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(request.url);
  const domain = url.searchParams.get('domain');

  if (!domain) {
    return new Response(JSON.stringify({ error: 'Domain parameter is required' }), {
      status: 400,
      headers: corsHeaders()
    });
  }

  try {
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
      result = await checkSSLLabs(cleanDomain);
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
      headers: corsHeaders()
    });

  } catch (error) {
    console.error(`💥 SSL check failed for ${domain}:`, error);
    
    return new Response(JSON.stringify({
      error: error.message || 'SSL check failed',
      host: domain,
      status: 'ERROR',
      timestamp: Date.now()
    }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

async function checkSSLLabs(domain) {
  // Step 1: Check SSL Labs API availability
  const infoUrl = `${SSL_LABS_CONFIG.baseUrl}/info`;
  
  try {
    const infoResponse = await fetch(infoUrl, {
      headers: {
        'User-Agent': SSL_LABS_CONFIG.userAgent,
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

  // Step 2: Always try to get cached results first (even if partial)
  let analyzeUrl = `${SSL_LABS_CONFIG.baseUrl}/analyze?host=${domain}&publish=off&fromCache=on&maxAge=168&all=done`;
  
  let response = await fetch(analyzeUrl, {
    headers: {
      'User-Agent': SSL_LABS_CONFIG.userAgent,
      'Accept': 'application/json',
      'email': SSL_LABS_CONFIG.email
    }
  });

  if (!response.ok) {
    throw new Error(`SSL Labs analyze failed: ${response.status} ${response.statusText}`);
  }

  let data = await response.json();
  
  if (data.errors && data.errors.length > 0) {
    throw new Error(`SSL Labs error: ${data.errors[0].message}`);
  }

  // Step 3: Check if we have usable cached results
  const hasUsableResults = data.status === 'READY' && data.endpoints && data.endpoints.length > 0;
  const hasPartialResults = data.endpoints && data.endpoints.some(ep => ep.statusMessage === 'Ready');
  
  if (hasUsableResults) {
    console.log(`✅ Found complete cached SSL Labs results for ${domain}`);
    return await enhanceWithEndpointDetails(data, domain);
  } else if (hasPartialResults) {
    console.log(`⚡ Found partial cached SSL Labs results for ${domain}`);
    return await enhanceWithEndpointDetails(data, domain);
  }

  // Step 4: Start new assessment but don't wait too long
  console.log(`🔄 Starting new SSL Labs assessment for ${domain}...`);
  
  analyzeUrl = `${SSL_LABS_CONFIG.baseUrl}/analyze?host=${domain}&publish=off&startNew=on&all=done`;
  
  response = await fetch(analyzeUrl, {
    headers: {
      'User-Agent': SSL_LABS_CONFIG.userAgent,
      'Accept': 'application/json',
      'email': SSL_LABS_CONFIG.email
    }
  });

  if (!response.ok) {
    throw new Error(`SSL Labs start assessment failed: ${response.status} ${response.statusText}`);
  }

  data = await response.json();
  
  if (data.errors && data.errors.length > 0) {
    throw new Error(`SSL Labs error: ${data.errors[0].message}`);
  }

  // Step 5: Limited polling for quick results (max 30 seconds for worker timeout)
  let pollCount = 0;
  const maxPolls = 3; // Max 3 polls = ~30 seconds total
  
  while ((data.status === 'DNS' || data.status === 'IN_PROGRESS') && pollCount < maxPolls) {
    console.log(`⏳ Quick poll ${pollCount + 1}/${maxPolls} for ${domain} - Status: ${data.status}`);
    
    await new Promise(resolve => setTimeout(resolve, 8000)); // Wait 8 seconds
    
    // Poll for results
    analyzeUrl = `${SSL_LABS_CONFIG.baseUrl}/analyze?host=${domain}&all=done`;
    
    response = await fetch(analyzeUrl, {
      headers: {
        'User-Agent': SSL_LABS_CONFIG.userAgent,
        'Accept': 'application/json',
        'email': SSL_LABS_CONFIG.email
      }
    });

    if (!response.ok) {
      console.log(`⚠️ Poll failed: ${response.status}, returning current results`);
      break;
    }

    data = await response.json();
    pollCount++;
    
    // If we have any ready endpoints, return partial results
    if (data.endpoints && data.endpoints.some(ep => ep.statusMessage === 'Ready')) {
      console.log(`⚡ Got partial results after ${pollCount} polls for ${domain}`);
      break;
    }
  }

  // Step 6: Return whatever we have (even if incomplete)
  if (data.status === 'ERROR') {
    console.log(`❌ SSL Labs returned ERROR for ${domain}: ${data.statusMessage || 'Unknown error'}`);
    throw new Error(`SSL Labs analysis failed: ${data.statusMessage || 'Assessment error'}`);
  }

  console.log(`📊 Returning SSL Labs results for ${domain} - Status: ${data.status}`);
  return await enhanceWithEndpointDetails(data, domain);
}

// Separate function to add endpoint details (but with timeout protection)
async function enhanceWithEndpointDetails(data, domain) {
  // Only try to get endpoint details for the first few ready endpoints to avoid timeout
  if (data.endpoints && data.endpoints.length > 0) {
    console.log(`🔍 Getting endpoint details for first few endpoints of ${domain}...`);
    
    const maxEndpointsToEnhance = 2; // Limit to first 2 endpoints to avoid timeout
    let enhancedCount = 0;
    
    for (let i = 0; i < data.endpoints.length && enhancedCount < maxEndpointsToEnhance; i++) {
      const endpoint = data.endpoints[i];
      
      // Only enhance ready endpoints that don't already have full details
      if (endpoint.statusMessage === 'Ready' && endpoint.ipAddress && (!endpoint.details || !endpoint.details.cert)) {
        try {
          const endpointUrl = `${SSL_LABS_CONFIG.baseUrl}/getEndpointData?host=${domain}&s=${endpoint.ipAddress}`;
          
          const endpointResponse = await fetch(endpointUrl, {
            headers: {
              'User-Agent': SSL_LABS_CONFIG.userAgent,
              'Accept': 'application/json',
              'email': SSL_LABS_CONFIG.email
            }
          });

          if (endpointResponse.ok) {
            const endpointData = await endpointResponse.json();
            if (endpointData.details) {
              data.endpoints[i].details = endpointData.details;
              enhancedCount++;
              console.log(`✅ Enhanced endpoint ${endpoint.ipAddress} (${enhancedCount}/${maxEndpointsToEnhance})`);
            }
          } else {
            console.log(`⚠️ Failed to enhance endpoint ${endpoint.ipAddress}: ${endpointResponse.status}`);
          }
        } catch (endpointError) {
          console.log(`⚠️ Error enhancing endpoint: ${endpointError.message}`);
          break; // Stop trying if we hit errors
        }
      }
    }
  }

  console.log(`✅ SSL Labs processing complete for ${domain}`);
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
  
  return {
    host: domain,
    status: data.status || 'READY',
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
        statusMessage: endpoint.statusMessage || 'SSL Labs analysis completed',
        grade: endpoint.grade || 'T',
        gradeTrustIgnored: endpoint.gradeTrustIgnored,
        futureGrade: endpoint.futureGrade,
        hasWarnings: endpoint.hasWarnings || false,
        isExceptional: endpoint.isExceptional || false,
        progress: endpoint.progress || 100,
        eta: endpoint.eta || 0,
        delegation: endpoint.delegation || 1,
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
        }
      };
    }) || [{
      statusMessage: 'SSL Labs analysis completed',
      grade: 'T',
      hasWarnings: false,
      isExceptional: false,
      progress: 100,
      eta: 0,
      delegation: 1,
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

function handleCORS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders()
  });
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
  };
} 