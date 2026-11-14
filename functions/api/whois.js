import { json, lookupHandler } from '../../functions-lib/http.js';

const IP_APIS = [
  {
    name: 'ipinfo.io',
    url: (ip) => `https://ipinfo.io/${ip}/json`,
    parser: parseIpinfoResponse,
  },
  {
    name: 'ip-api.com',
    url: (ip) =>
      `http://ip-api.com/json/${ip}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,mobile,proxy,hosting,query`,
    parser: parseIpApiResponse,
  },
];

const RDAP_BOOTSTRAP_URL = 'https://data.iana.org/rdap/dns.json';
const RDAP_CACHE_DURATION = 24 * 60 * 60 * 1000;
const USER_AGENT = 'RussTools-WHOIS/1.0';

let rdapBootstrapCache = null;
let rdapCacheTimestamp = 0;

async function getRDAPBootstrap() {
  const now = Date.now();

  if (rdapBootstrapCache && now - rdapCacheTimestamp < RDAP_CACHE_DURATION) {
    return rdapBootstrapCache;
  }

  try {
    const response = await fetch(RDAP_BOOTSTRAP_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch RDAP bootstrap: ${response.status}`);
    }

    rdapBootstrapCache = await response.json();
    rdapCacheTimestamp = now;
    return rdapBootstrapCache;
  } catch (error) {
    console.error('Failed to fetch RDAP bootstrap:', error);
    return rdapBootstrapCache;
  }
}

function findRDAPService(tld, bootstrap) {
  if (!bootstrap || !bootstrap.services) return null;

  for (const [tlds, urls] of bootstrap.services) {
    if (tlds.includes(tld)) return urls[0];
  }

  return null;
}

function extractEffectiveTLD(domain, bootstrap) {
  const parts = domain.split('.');

  if (!bootstrap || !bootstrap.services) {
    return parts[parts.length - 1];
  }

  const knownTLDs = new Set();
  for (const [tlds] of bootstrap.services) {
    tlds.forEach((tld) => knownTLDs.add(tld));
  }

  if (parts.length >= 3) {
    const twoPartTLD = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    if (knownTLDs.has(twoPartTLD)) return twoPartTLD;
  }

  if (parts.length >= 4) {
    const threePartTLD = `${parts[parts.length - 3]}.${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    if (knownTLDs.has(threePartTLD)) return threePartTLD;
  }

  const singlePartTLD = parts[parts.length - 1];
  return knownTLDs.has(singlePartTLD) ? singlePartTLD : null;
}

function isValidIP(str) {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;

  if (ipv4Regex.test(str)) {
    return str.split('.').every((octet) => parseInt(octet) >= 0 && parseInt(octet) <= 255);
  }

  return ipv6Regex.test(str);
}

async function performIPLookup(ip) {
  const results = {
    query: ip,
    type: 'ip',
    timestamp: Date.now(),
    status: 'success',
    data: {},
    sources: [],
  };

  for (const api of IP_APIS) {
    try {
      const response = await fetch(api.url(ip), {
        headers: { 'User-Agent': USER_AGENT },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const parsed = api.parser(await response.text(), ip);

      if (parsed && !parsed.error) {
        results.data[api.name] = parsed;
        results.sources.push({
          name: api.name,
          status: 'success',
          timestamp: Date.now(),
        });
      } else {
        throw new Error(parsed?.error || 'Invalid response');
      }
    } catch (error) {
      results.sources.push({
        name: api.name,
        status: 'failed',
        error: error.message,
        timestamp: Date.now(),
      });
    }
  }

  if (Object.keys(results.data).length === 0) {
    results.status = 'failed';
    results.error = 'All IP lookup services failed';
  } else {
    results.normalized = normalizeIPData(results.data);
  }

  return results;
}

async function performDomainWhois(domain) {
  const results = {
    query: domain,
    type: 'domain',
    timestamp: Date.now(),
    status: 'success',
    data: {},
    sources: [],
  };

  try {
    const bootstrap = await getRDAPBootstrap();

    if (!bootstrap) {
      throw new Error('Failed to load RDAP bootstrap data');
    }

    const tld = extractEffectiveTLD(domain, bootstrap);

    if (!tld) {
      results.status = 'failed';
      results.error = `No RDAP service found for domain: ${domain}`;
      return results;
    }

    const rdapServiceUrl = findRDAPService(tld, bootstrap);

    if (!rdapServiceUrl) {
      results.status = 'failed';
      results.error = `No RDAP service found for TLD: ${tld}`;
      return results;
    }

    const rdapData = await queryRDAPService(domain, rdapServiceUrl);

    if (rdapData) {
      results.data.rdap = rdapData;
      results.sources.push({
        name: 'rdap',
        service: rdapServiceUrl,
        tld,
        status: 'success',
        timestamp: Date.now(),
      });
      results.normalized = normalizeRDAPData(rdapData);
    } else {
      throw new Error('RDAP service returned no data');
    }
  } catch (error) {
    results.status = 'failed';
    results.error = error.message;
    results.sources.push({
      name: 'rdap',
      status: 'failed',
      error: error.message,
      timestamp: Date.now(),
    });
  }

  return results;
}

async function queryRDAPService(domain, rdapServiceUrl) {
  const rdapUrl = `${rdapServiceUrl.replace(/\/$/, '')}/domain/${domain}`;

  const response = await fetch(rdapUrl, {
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/rdap+json, application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return {
        objectClassName: 'domain',
        ldhName: domain,
        status: ['not found'],
        rdapConformance: ['rdap_level_0'],
        notices: [
          {
            title: 'Domain Not Found',
            description: ['The requested domain was not found in the registry.'],
          },
        ],
      };
    }
    throw new Error(`RDAP query failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

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
    expires: null,
  };

  if (rdapData.events) {
    for (const event of rdapData.events) {
      const action = event.eventAction;
      const date = event.eventDate;

      normalized.events[action] = date;

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

  if (rdapData.entities) {
    for (const entity of rdapData.entities) {
      const roles = entity.roles || [];

      if (roles.includes('registrar')) {
        normalized.registrar = {
          name: entity.vcardArray?.[1]?.[1]?.[3] || entity.handle,
          handle: entity.handle,
          url: entity.links?.[0]?.href,
        };
        normalized.entities.registrar = entity;
      }

      roles.forEach((role) => {
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

  if (rdapData.nameservers) {
    normalized.nameservers = rdapData.nameservers.map((ns) => ({
      name: ns.ldhName || ns.unicodeName,
      status: ns.status,
      ipAddresses: {
        v4: ns.ipAddresses?.v4 || [],
        v6: ns.ipAddresses?.v6 || [],
      },
    }));
  }

  return normalized;
}

function parseIpinfoResponse(data) {
  try {
    const parsed = JSON.parse(data);

    if (parsed.error) {
      return { error: parsed.error };
    }

    return {
      ip: parsed.ip,
      city: parsed.city,
      region: parsed.region,
      country: parsed.country,
      location: parsed.loc,
      organization: parsed.org,
      postal: parsed.postal,
      timezone: parsed.timezone,
      hostname: parsed.hostname,
      anycast: parsed.anycast,
      source: 'ipinfo.io',
    };
  } catch {
    return { error: 'Failed to parse ipinfo.io response' };
  }
}

function parseIpApiResponse(data) {
  try {
    const parsed = JSON.parse(data);

    if (parsed.status === 'fail') {
      return { error: parsed.message || 'IP API lookup failed' };
    }

    return {
      ip: parsed.query,
      city: parsed.city,
      region: parsed.regionName,
      region_code: parsed.region,
      country: parsed.country,
      country_code: parsed.countryCode,
      continent: parsed.continent,
      latitude: parsed.lat,
      longitude: parsed.lon,
      timezone: parsed.timezone,
      isp: parsed.isp,
      organization: parsed.org,
      as: parsed.as,
      asname: parsed.asname,
      reverse: parsed.reverse,
      mobile: parsed.mobile,
      proxy: parsed.proxy,
      hosting: parsed.hosting,
      source: 'ip-api.com',
    };
  } catch {
    return { error: 'Failed to parse ip-api.com response' };
  }
}

function normalizeIPData(data) {
  const normalized = {
    ip: null,
    location: {},
    network: {},
    organization: {},
    security: {},
  };

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
      timezone: ipinfo.timezone,
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
      timezone: normalized.location.timezone || ipapi.timezone,
    };
    normalized.network = {
      ...normalized.network,
      isp: ipapi.isp,
      as: ipapi.as,
      asname: ipapi.asname,
      reverse: ipapi.reverse,
    };
    normalized.organization = {
      ...normalized.organization,
      name: normalized.organization.name || ipapi.organization,
    };
    normalized.security = {
      mobile: ipapi.mobile,
      proxy: ipapi.proxy,
      hosting: ipapi.hosting,
    };
  }

  return normalized;
}

export const onRequest = lookupHandler(async ({ url }) => {
  try {
    const query = url.searchParams.get('query');
    const type = url.searchParams.get('type');

    if (!query) {
      return json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const cleanQuery = query.trim().toLowerCase();
    const isIP = isValidIP(cleanQuery);
    const lookupType = type || (isIP ? 'ip' : 'domain');

    const result =
      lookupType === 'ip' || isIP
        ? await performIPLookup(cleanQuery)
        : await performDomainWhois(cleanQuery);

    return json(result);
  } catch (error) {
    console.error('WHOIS lookup error:', error);
    return json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
});
