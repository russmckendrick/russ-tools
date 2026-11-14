import { json, lookupHandler } from '../../functions-lib/http.js';

const SSL_LABS_BASE_URL = 'https://api.ssllabs.com/api/v4';
const DAY_MS = 1000 * 60 * 60 * 24;

function getSSLLabsConfig(env) {
  if (!env.SSL_LABS_EMAIL) {
    throw new Error('SSL_LABS_EMAIL environment variable is required');
  }

  if (!env.SSL_LABS_USER_AGENT) {
    throw new Error('SSL_LABS_USER_AGENT environment variable is required');
  }

  return {
    baseUrl: SSL_LABS_BASE_URL,
    email: env.SSL_LABS_EMAIL,
    userAgent: env.SSL_LABS_USER_AGENT,
  };
}

const FALLBACK_APIS = [
  {
    name: 'HackerTarget',
    url: (domain) => `https://api.hackertarget.com/sslcheck/?q=${encodeURIComponent(domain)}`,
    parser: parseHackerTargetResponse,
  },
];

async function sslLabsFetch(url, config) {
  return fetch(url, {
    headers: {
      'User-Agent': config.userAgent,
      Accept: 'application/json',
    },
  });
}

async function checkSSLLabs(domain, env) {
  const config = getSSLLabsConfig(env);
  const host = encodeURIComponent(domain);

  try {
    const infoResponse = await sslLabsFetch(`${config.baseUrl}/info`, config);

    if (!infoResponse.ok) {
      throw new Error(`SSL Labs info check failed: ${infoResponse.status}`);
    }

    await infoResponse.json();
  } catch (infoError) {
    throw new Error(`SSL Labs service unavailable: ${infoError.message}`);
  }

  let response = await sslLabsFetch(
    `${config.baseUrl}/analyze?host=${host}&publish=off&fromCache=on&maxAge=24&all=done`,
    config
  );

  if (!response.ok) {
    throw new Error(`SSL Labs analyze failed: ${response.status} ${response.statusText}`);
  }

  let data = await response.json();

  if (data.errors && data.errors.length > 0) {
    throw new Error(`SSL Labs error: ${data.errors[0].message}`);
  }

  if (data.status === 'READY' && data.endpoints && data.endpoints.length > 0) {
    return enhanceWithEndpointDetails(data, domain, config);
  }

  response = await sslLabsFetch(
    `${config.baseUrl}/analyze?host=${host}&publish=off&startNew=on&all=done`,
    config
  );

  if (!response.ok) {
    throw new Error(`SSL Labs start assessment failed: ${response.status} ${response.statusText}`);
  }

  data = await response.json();

  if (data.errors && data.errors.length > 0) {
    throw new Error(`SSL Labs error: ${data.errors[0].message}`);
  }

  if (data.status === 'ERROR') {
    throw new Error(`SSL Labs analysis failed: ${data.statusMessage || 'Assessment error'}`);
  }

  let recommendedPollInterval = 10;
  if (data.status === 'DNS') {
    recommendedPollInterval = 5;
  } else if (data.status === 'IN_PROGRESS') {
    const minEta =
      data.endpoints?.reduce((min, ep) => (ep.eta && ep.eta > 0 ? Math.min(min, ep.eta) : min), 60) || 60;
    recommendedPollInterval = Math.max(10, Math.min(30, minEta));
  }

  const enhancedData = await enhanceReadyEndpoints(data, domain, config);

  enhancedData.pollInfo = {
    shouldPoll: data.status === 'DNS' || data.status === 'IN_PROGRESS',
    recommendedInterval: recommendedPollInterval,
    nextPollTime: Date.now() + recommendedPollInterval * 1000,
  };

  return enhancedData;
}

async function fetchEndpointDetails(domain, ipAddress, config) {
  const response = await sslLabsFetch(
    `${config.baseUrl}/getEndpointData?host=${encodeURIComponent(domain)}&s=${ipAddress}`,
    config
  );

  if (!response.ok) return null;

  const endpointData = await response.json();
  return endpointData.details || null;
}

async function enhanceReadyEndpoints(data, domain, config) {
  if (data.endpoints && data.endpoints.length > 0) {
    const readyEndpoints = data.endpoints.filter((ep) => ep.statusMessage === 'Ready').slice(0, 2);

    for (const endpoint of readyEndpoints) {
      if (endpoint.ipAddress && (!endpoint.details || !endpoint.details.cert)) {
        try {
          const details = await fetchEndpointDetails(domain, endpoint.ipAddress, config);
          if (details) {
            const endpointIndex = data.endpoints.findIndex((ep) => ep.ipAddress === endpoint.ipAddress);
            if (endpointIndex !== -1) {
              data.endpoints[endpointIndex].details = details;
            }
          }
        } catch (endpointError) {
          console.log(`Failed to enhance endpoint ${endpoint.ipAddress}: ${endpointError.message}`);
        }
      }
    }
  }

  return parseSSLLabsResponse(data, domain);
}

async function enhanceWithEndpointDetails(data, domain, config) {
  if (data.endpoints && data.endpoints.length > 0) {
    const maxEndpointsToEnhance = 3;
    let enhancedCount = 0;

    for (let i = 0; i < data.endpoints.length && enhancedCount < maxEndpointsToEnhance; i++) {
      const endpoint = data.endpoints[i];

      if (
        endpoint.statusMessage === 'Ready' &&
        endpoint.ipAddress &&
        (!endpoint.details || !endpoint.details.cert)
      ) {
        try {
          const details = await fetchEndpointDetails(domain, endpoint.ipAddress, config);
          if (details) {
            data.endpoints[i].details = details;
            enhancedCount++;
          }
        } catch (endpointError) {
          console.log(`Error enhancing endpoint: ${endpointError.message}`);
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
      Accept: 'application/json, text/plain',
    },
  });

  if (!response.ok) {
    throw new Error(`${api.name} API failed: ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  const data =
    contentType && contentType.includes('application/json') ? await response.json() : await response.text();

  return api.parser(data, domain);
}

async function performBasicSSLCheck(domain) {
  try {
    await fetch(`https://${domain}`, {
      method: 'HEAD',
      cf: { timeout: 10000 },
    });

    return {
      host: domain,
      status: 'READY',
      endpoints: [
        {
          statusMessage: 'SSL connection successful (basic check)',
          grade: 'T',
          hasWarnings: false,
          isExceptional: false,
          progress: 100,
          eta: 0,
          delegation: 1,
          details: { cert: null },
        },
      ],
      apiCheck: true,
      apiSource: 'Cloudflare Worker Basic Check',
      timestamp: Date.now(),
    };
  } catch (error) {
    throw new Error(`SSL connection failed: ${error.message}`);
  }
}

function parseSSLLabsResponse(data, domain) {
  const firstCert = data.certs && data.certs.length > 0 ? data.certs[0] : null;

  const endpoints = data.endpoints || [];
  const totalEndpoints = endpoints.length;
  const readyEndpoints = endpoints.filter((ep) => ep.statusMessage === 'Ready').length;
  const inProgressEndpoints = endpoints.filter(
    (ep) => ep.statusMessage && ep.statusMessage.includes('progress')
  ).length;
  const pendingEndpoints = endpoints.filter((ep) => ep.statusMessage === 'Pending').length;

  const maxEta =
    data.endpoints?.reduce((max, ep) => (ep.eta && ep.eta > 0 ? Math.max(max, ep.eta) : max), 0) || 0;

  let overallStatusMessage = '';
  if (data.status === 'READY' && readyEndpoints === totalEndpoints) {
    overallStatusMessage = 'SSL Labs analysis completed';
  } else if (data.status === 'IN_PROGRESS' || inProgressEndpoints > 0 || pendingEndpoints > 0) {
    let etaText = '';
    if (maxEta > 0) {
      etaText = maxEta < 60 ? ` (ETA: ${maxEta} sec)` : ` (ETA: ${Math.ceil(maxEta / 60)} min)`;
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
      estimatedTimeRemaining: maxEta,
    },
    startTime: data.startTime,
    testTime: data.testTime,
    endpoints: data.endpoints?.map((endpoint) => {
      let cert = null;

      if (endpoint.details?.certChains && endpoint.details.certChains.length > 0) {
        const firstChain = endpoint.details.certChains[0];
        if (firstChain.certIds && firstChain.certIds.length > 0 && data.certs) {
          cert = data.certs.find((c) => c.id === firstChain.certIds[0]);
        }
      } else if (firstCert) {
        cert = firstCert;
      }

      const isReady = endpoint.statusMessage === 'Ready';

      return {
        ipAddress: endpoint.ipAddress,
        serverName: endpoint.serverName,
        statusMessage: endpoint.statusMessage || 'SSL Labs analysis in progress',
        grade: endpoint.grade || (isReady ? 'T' : '-'),
        gradeTrustIgnored: endpoint.gradeTrustIgnored,
        futureGrade: endpoint.futureGrade,
        hasWarnings: endpoint.hasWarnings || false,
        isExceptional: endpoint.isExceptional || false,
        progress: endpoint.progress || (isReady ? 100 : 0),
        eta: endpoint.eta || 0,
        delegation: endpoint.delegation || 1,
        isComplete: isReady,
        details: {
          cert: cert
            ? {
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
                daysUntilExpiry: cert.notAfter ? Math.ceil((cert.notAfter - Date.now()) / DAY_MS) : null,
              }
            : null,
          protocols:
            endpoint.details?.protocols?.map((protocol) => ({
              id: protocol.id,
              name: protocol.name,
              version: protocol.version,
              q: protocol.q,
            })) || [],
          suites: endpoint.details?.suites
            ? {
                list:
                  endpoint.details.suites.list?.map((suite) => ({
                    id: suite.id,
                    name: suite.name,
                    cipherStrength: suite.cipherStrength,
                    kxType: suite.kxType,
                    kxStrength: suite.kxStrength,
                    namedGroupBits: suite.namedGroupBits,
                    namedGroupId: suite.namedGroupId,
                    namedGroupName: suite.namedGroupName,
                    q: suite.q,
                  })) || [],
                preference: endpoint.details.suites.preference,
                chaCha20Preference: endpoint.details.suites.chaCha20Preference,
              }
            : { list: [] },
          ...(isReady
            ? {
                certChains:
                  endpoint.details?.certChains?.map((chain) => ({
                    id: chain.id,
                    certIds: chain.certIds,
                    trustPaths: chain.trustPaths,
                    issues: chain.issues,
                    noSni: chain.noSni,
                  })) || [],
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
                implementsTLS13MandatoryCS: endpoint.details?.implementsTLS13MandatoryCS,
                zeroRTTEnabled: endpoint.details?.zeroRTTEnabled,
                hstsPolicy: endpoint.details?.hstsPolicy,
                hstsPreloads: endpoint.details?.hstsPreloads,
                hpkpPolicy: endpoint.details?.hpkpPolicy,
                hpkpRoPolicy: endpoint.details?.hpkpRoPolicy,
                staticPkpPolicy: endpoint.details?.staticPkpPolicy,
                namedGroups: endpoint.details?.namedGroups,
                dhPrimes: endpoint.details?.dhPrimes,
                dhUsesKnownPrimes: endpoint.details?.dhUsesKnownPrimes,
                dhYsReuse: endpoint.details?.dhYsReuse,
                ecdhParameterReuse: endpoint.details?.ecdhParameterReuse,
                hasSct: endpoint.details?.hasSct,
                httpTransactions: endpoint.details?.httpTransactions,
                sims: endpoint.details?.sims,
              }
            : {}),
        },
      };
    }) || [
      {
        statusMessage: 'SSL Labs analysis in progress',
        grade: '-',
        hasWarnings: false,
        isExceptional: false,
        progress: 0,
        eta: 0,
        delegation: 1,
        isComplete: false,
        details: { cert: null },
      },
    ],
    certs:
      data.certs?.map((cert) => ({
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
        sha256Hash: cert.sha256Hash,
      })) || [],
    apiCheck: true,
    apiSource: 'SSL Labs API v4 (via Cloudflare Worker)',
    timestamp: Date.now(),
    engineVersion: data.engineVersion,
    criteriaVersion: data.criteriaVersion,
    certHostnames: data.certHostnames,
  };

  if (data.pollInfo) {
    result.pollInfo = data.pollInfo;
  }

  return result;
}

function parseHackerTargetResponse(data, domain) {
  const lines = data.split('\n').filter((line) => line.trim());
  const certInfo = {};

  lines.forEach((line) => {
    if (line.includes('Subject:')) certInfo.subject = line.split('Subject:')[1]?.trim();
    if (line.includes('Issuer:')) certInfo.issuer = line.split('Issuer:')[1]?.trim();
    if (line.includes('Valid from:')) certInfo.validFrom = line.split('Valid from:')[1]?.trim();
    if (line.includes('Valid until:')) certInfo.validUntil = line.split('Valid until:')[1]?.trim();
    if (line.includes('Serial:')) certInfo.serial = line.split('Serial:')[1]?.trim();
  });

  const hasValidCert = !data.toLowerCase().includes('error') && !data.toLowerCase().includes('failed');
  const expiryDate = certInfo.validUntil ? new Date(certInfo.validUntil) : null;
  const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate - new Date()) / DAY_MS) : null;

  let grade = 'F';
  if (hasValidCert) {
    if (daysUntilExpiry > 90) grade = 'A+';
    else if (daysUntilExpiry > 30) grade = 'A';
    else if (daysUntilExpiry > 7) grade = 'B';
    else if (daysUntilExpiry > 0) grade = 'C';
  }

  return {
    host: domain,
    status: 'READY',
    endpoints: [
      {
        statusMessage: hasValidCert
          ? `Certificate valid - expires in ${daysUntilExpiry} days`
          : 'Certificate validation failed',
        grade,
        hasWarnings: daysUntilExpiry < 30,
        isExceptional: hasValidCert && daysUntilExpiry > 90,
        progress: 100,
        eta: 0,
        delegation: 1,
        details: {
          cert:
            hasValidCert && certInfo.subject
              ? {
                  subject: certInfo.subject,
                  issuerSubject: certInfo.issuer,
                  notBefore: certInfo.validFrom ? new Date(certInfo.validFrom).getTime() : null,
                  notAfter: certInfo.validUntil ? new Date(certInfo.validUntil).getTime() : null,
                  sigAlg: 'Unknown',
                  serialNumber: certInfo.serial,
                }
              : null,
        },
      },
    ],
    apiCheck: true,
    apiSource: 'HackerTarget (via Cloudflare Worker)',
    timestamp: Date.now(),
  };
}

export const onRequest = lookupHandler(async ({ url, env }) => {
  try {
    const domain = url.searchParams.get('domain');

    if (!domain) {
      return json({ error: 'Domain parameter is required' }, { status: 400 });
    }

    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .trim()
      .toLowerCase();

    let result = null;

    try {
      result = await checkSSLLabs(cleanDomain, env);
    } catch (sslLabsError) {
      console.log(`SSL Labs failed: ${sslLabsError.message}`);

      for (const api of FALLBACK_APIS) {
        try {
          result = await checkWithAPI(api, cleanDomain);
          break;
        } catch (apiError) {
          console.log(`${api.name} failed: ${apiError.message}`);
        }
      }
    }

    if (!result) {
      result = await performBasicSSLCheck(cleanDomain);
    }

    return json(result, {
      headers: {
        'Cache-Control': result.pollInfo?.shouldPoll ? 'no-store' : 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('SSL check failed:', error);
    return json(
      {
        error: error.message || 'SSL check failed',
        stack: error.stack,
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
});
