import { json, lookupHandler } from '../../functions-lib/http.js';

const TENANT_APIS = [
  {
    name: 'Microsoft Graph API',
    url: (domain) =>
      `https://graph.microsoft.com/v1.0/tenantRelationships/findTenantInformationByDomainName(domainName='${domain}')`,
    parser: parseGraphApiResponse,
    requiresAuth: true,
  },
  {
    name: 'GetUserRealm API',
    url: (domain) => `https://login.microsoftonline.com/GetUserRealm.srf?login=test@${domain}`,
    parser: parseGetUserRealmResponse,
  },
  {
    name: 'GetCredentialType API',
    url: () => 'https://login.microsoftonline.com/common/GetCredentialType',
    parser: parseGetCredentialTypeResponse,
    method: 'POST',
    body: (domain) => JSON.stringify({ Username: `test@${domain}` }),
  },
  {
    name: 'OpenID Connect Well-Known',
    url: (domain) => `https://login.microsoftonline.com/${domain}/.well-known/openid_configuration`,
    parser: parseOpenIdResponse,
  },
  {
    name: 'OpenID Connect v2.0',
    url: (domain) => `https://login.microsoftonline.com/${domain}/v2.0/.well-known/openid_configuration`,
    parser: parseOpenIdResponse,
  },
  {
    name: 'Office 365 Federation Provider',
    url: (domain) => `https://odc.officeapps.live.com/odc/v2.1/federationprovider?domain=${domain}`,
    parser: parseFederationResponse,
  },
];

async function getGraphAccessToken(env) {
  if (!env.GRAPH_CLIENT_ID || !env.GRAPH_CLIENT_SECRET || !env.GRAPH_TENANT_ID) {
    return null;
  }

  try {
    const response = await fetch(
      `https://login.microsoftonline.com/${env.GRAPH_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: env.GRAPH_CLIENT_ID,
          client_secret: env.GRAPH_CLIENT_SECRET,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials',
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.access_token;
    }

    console.error('Failed to get Graph access token:', response.status);
    return null;
  } catch (error) {
    console.error('Error getting Graph access token:', error);
    return null;
  }
}

async function performDNSAnalysis(domain) {
  const dnsInfo = {
    hasExchangeOnline: false,
    hasOffice365SPF: false,
    mxRecords: [],
    txtRecords: [],
  };

  const dohBase = 'https://cloudflare-dns.com/dns-query';
  const headers = { Accept: 'application/dns-json' };

  try {
    const mxResponse = await fetch(`${dohBase}?name=${domain}&type=MX`, { headers });

    if (mxResponse.ok) {
      const mxData = await mxResponse.json();
      if (mxData.Answer) {
        dnsInfo.mxRecords = mxData.Answer.map((record) => {
          const parts = record.data.split(' ');
          return {
            priority: parseInt(parts[0]),
            exchange: parts[1],
          };
        });

        dnsInfo.hasExchangeOnline = dnsInfo.mxRecords.some((mx) =>
          mx.exchange.includes('mail.protection.outlook.com')
        );
      }
    }
  } catch (error) {
    console.log('MX lookup failed:', error.message);
  }

  try {
    const txtResponse = await fetch(`${dohBase}?name=${domain}&type=TXT`, { headers });

    if (txtResponse.ok) {
      const txtData = await txtResponse.json();
      if (txtData.Answer) {
        dnsInfo.txtRecords = txtData.Answer.map((record) => record.data);

        dnsInfo.hasOffice365SPF = dnsInfo.txtRecords.some((txt) =>
          txt.includes('include:spf.protection.outlook.com')
        );
      }
    }
  } catch (error) {
    console.log('TXT lookup failed:', error.message);
  }

  return dnsInfo;
}

function extractDomain(input) {
  if (!input || typeof input !== 'string') return '';

  const trimmed = input.trim();

  if (trimmed.includes('@')) {
    const parts = trimmed.split('@');
    return parts[parts.length - 1].toLowerCase();
  }

  return trimmed.toLowerCase();
}

function isValidDomain(input) {
  if (!input || typeof input !== 'string') return false;

  const trimmed = input.trim();
  if (trimmed.length === 0) return false;

  const domainRegex =
    /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
  return domainRegex.test(trimmed);
}

async function performComprehensiveTenantLookup(domain, env) {
  let result = {
    success: false,
    domain,
    timestamp: Date.now(),
  };

  let graphToken = null;
  const apiResults = {};

  for (const api of TENANT_APIS) {
    try {
      if (api.requiresAuth) {
        if (!graphToken) {
          graphToken = await getGraphAccessToken(env);
        }
        if (!graphToken) continue;
      }

      const fetchOptions = {
        method: api.method || 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Microsoft-Tenant-Lookup-Worker/1.0',
        },
      };

      if (api.requiresAuth && graphToken) {
        fetchOptions.headers.Authorization = `Bearer ${graphToken}`;
      }

      if (api.method === 'POST' && api.body) {
        fetchOptions.body = api.body(domain);
        fetchOptions.headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(api.url(domain), fetchOptions);

      if (response.ok) {
        const parsed = api.parser(await response.json(), domain);

        if (parsed) {
          apiResults[api.name] = parsed;

          if (!result.success && (parsed.tenantId || parsed.domain)) {
            result = {
              ...result,
              success: true,
              ...parsed,
              method: api.name,
            };
          }
        }
      }
    } catch (error) {
      console.log(`${api.name} failed for ${domain}:`, error.message);
    }
  }

  if (result.tenantId) {
    try {
      const openIdResponse = await fetch(
        `https://login.microsoftonline.com/${result.tenantId}/.well-known/openid_configuration`
      );

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
          id_token_signing_alg_values_supported: openIdData.id_token_signing_alg_values_supported,
        };
      }
    } catch (error) {
      console.log('OpenID configuration lookup failed:', error.message);
    }

    try {
      const userRealmResponse = await fetch(
        `https://login.microsoftonline.com/GetUserRealm.srf?login=admin@${domain}`
      );

      if (userRealmResponse.ok) {
        const userRealmData = await userRealmResponse.json();
        apiResults['User Realm Details'] = {
          NameSpaceType: userRealmData.NameSpaceType,
          FederationBrandName: userRealmData.FederationBrandName,
          CloudInstanceName: userRealmData.CloudInstanceName,
          DomainName: userRealmData.DomainName,
          AuthURL: userRealmData.AuthURL,
          ConsumerDomain: userRealmData.ConsumerDomain,
        };
      }
    } catch (error) {
      console.log('User realm lookup failed:', error.message);
    }
  }

  const dnsInfo = await performDNSAnalysis(domain);
  if (dnsInfo.mxRecords.length > 0 || dnsInfo.txtRecords.length > 0) {
    apiResults['DNS Analysis'] = dnsInfo;
  }

  if (result.success) {
    result.apiResults = apiResults;
    result.openIdConfig = apiResults['OpenID Configuration'];
    result.userRealm = apiResults['User Realm Details'];
    result.dnsInfo = apiResults['DNS Analysis'];

    if (!result.tenantType && result.tenantId) {
      result.tenantType = 'AAD';
    }

    if (result.userRealm?.NameSpaceType) {
      result.isCloudOnly = result.userRealm.NameSpaceType === 'Managed';
    }

    if (!result.tenantCategory) {
      result.tenantCategory = domain.includes('.onmicrosoft.com')
        ? 'Microsoft 365 Tenant'
        : 'Custom Domain';
    }

    return result;
  }

  return {
    success: false,
    error: `Unable to discover tenant information for domain: ${domain}`,
    domain,
    suggestions: [
      'The domain may not be associated with a Microsoft tenant',
      'The domain may use a different identity provider',
      'The lookup services may be temporarily unavailable',
    ],
    timestamp: Date.now(),
  };
}

function parseFederationResponse(data, domain) {
  if (!data) return null;

  if (data.tenantid) {
    return {
      tenantId: data.tenantid,
      domain,
      displayName: data.displayName || domain,
      federationBrandName: data.federationBrandName,
    };
  }

  return null;
}

function parseOpenIdResponse(data) {
  if (!data || !data.issuer) return null;

  const issuerMatch = data.issuer.match(/https:\/\/login\.microsoftonline\.com\/([^/]+)\/v2\.0/);

  if (issuerMatch && issuerMatch[1]) {
    return {
      tenantId: issuerMatch[1],
      issuer: data.issuer,
      authorizationEndpoint: data.authorization_endpoint,
      tokenEndpoint: data.token_endpoint,
    };
  }

  return null;
}

function parseGetUserRealmResponse(data, domain) {
  if (!data) return null;

  if (data.DomainName && data.DomainName.toLowerCase() === domain.toLowerCase()) {
    return {
      tenantId: null,
      domain,
      displayName: data.FederationBrandName || domain,
      namespaceType: data.NameSpaceType,
      cloudInstance: data.CloudInstanceName,
    };
  }

  return null;
}

function parseGraphApiResponse(data, domain) {
  if (!data) return null;

  if (data.tenantId) {
    return {
      tenantId: data.tenantId,
      domain,
      displayName: data.displayName || domain,
      federationBrandName: data.federationBrandName,
      defaultDomainName: data.defaultDomainName,
      tenantType: 'AAD',
      isCloudOnly: data.federationBrandName === null,
      tenantCategory: domain.includes('.onmicrosoft.com') ? 'Microsoft 365 Tenant' : 'Custom Domain',
    };
  }

  return null;
}

function parseGetCredentialTypeResponse(data, domain) {
  if (!data) return null;

  if (data.Username && data.Username.includes(`@${domain}`)) {
    return {
      tenantId: null,
      domain,
      displayName: domain,
      userExists: data.IfExistsResult === 0,
      isUnmanaged: data.IsUnmanaged,
      domainType: data.EstsProperties?.DomainType,
    };
  }

  return null;
}

export const onRequest = lookupHandler(async ({ url, env }) => {
  try {
    const domain = url.searchParams.get('domain');

    if (!domain) {
      return json({ error: 'Domain parameter is required' }, { status: 400 });
    }

    const cleanDomain = extractDomain(domain);
    if (!isValidDomain(cleanDomain)) {
      return json({ error: 'Invalid domain format', domain: cleanDomain }, { status: 400 });
    }

    return json(await performComprehensiveTenantLookup(cleanDomain, env));
  } catch (error) {
    console.error('Error in tenant lookup:', error);
    return json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
});
