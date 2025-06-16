# Cloudflare Workers - Backend Services Documentation

## Overview

The RussTools application uses a collection of Cloudflare Workers to provide secure, scalable backend services for API proxying, CORS handling, and data aggregation. These workers act as intermediaries between the client-side application and external APIs, providing security, caching, and data enrichment capabilities.

## Architecture

### Worker Services Overview
```
RussTools Cloudflare Workers
├── SSL Worker (ssl.js)              # SSL Labs API proxy and certificate analysis
├── Tenant Worker (tenant.js)        # Microsoft tenant discovery and analysis
├── WHOIS Worker (whois.js)          # Domain and IP lookup services
└── Configuration Files
    ├── wrangler-ssl.toml            # SSL Worker deployment configuration
    ├── wrangler-tenant.toml         # Tenant Worker deployment configuration
    └── wrangler-whois.toml          # WHOIS Worker deployment configuration
```

### Deployment Strategy
- **Edge Distribution**: Workers deployed globally on Cloudflare's edge network
- **Domain-Specific**: Each worker runs on dedicated subdomain (ssl.domain.com, tenant.domain.com)
- **Environment Isolation**: Separate configurations for development, staging, and production
- **Secret Management**: Environment variables and secrets managed through Wrangler CLI

## SSL Certificate Checker Worker

### Purpose and Functionality
The SSL Worker provides comprehensive SSL/TLS certificate analysis by proxying requests to SSL Labs API and other certificate validation services. It handles CORS restrictions, API key management, and response enrichment.

### Technical Implementation

#### Core Features
```javascript
const sslWorkerFeatures = {
  apiProxying: {
    sslLabs: 'Full SSL Labs API v4 integration',
    certificateChain: 'Complete certificate chain analysis',
    securityGrading: 'Industry-standard A+ to F grading',
    vulnerabilityScanning: 'Heartbleed, POODLE, BEAST detection'
  },
  
  corsHandling: {
    origins: 'Configurable allowed origins',
    methods: 'GET, POST, OPTIONS support',
    headers: 'Custom header passthrough',
    preflight: 'Automatic OPTIONS handling'
  },
  
  caching: {
    strategy: 'Intelligent caching with TTL',
    invalidation: 'Automatic cache invalidation',
    performance: 'Edge caching for repeated requests',
    efficiency: 'Reduced API calls to SSL Labs'
  }
};
```

#### Environment Configuration
```javascript
// Required environment variables
const sslWorkerConfig = {
  required: {
    SSL_LABS_EMAIL: 'Contact email for SSL Labs API',
    SSL_LABS_USER_AGENT: 'User agent string for API requests',
    ALLOWED_ORIGINS: 'Comma-separated list of allowed CORS origins'
  },
  
  optional: {
    SSL_LABS_API_KEY: 'API key for enhanced rate limits',
    CACHE_TTL: 'Custom cache time-to-live (default: 3600)',
    DEBUG_MODE: 'Enable verbose logging for debugging'
  }
};
```

#### API Endpoints and Methods

##### Primary SSL Analysis Endpoint
```javascript
// POST /analyze
const sslAnalysisRequest = {
  endpoint: 'https://ssl.yourdomain.com/analyze',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'https://yourdomain.com'
  },
  body: {
    host: 'example.com',           // Domain to analyze
    port: 443,                     // Port number (default: 443)
    protocol: 'https',             // Protocol (default: https)
    fromCache: 'off',              // Cache preference
    all: 'done'                    // Analysis completeness
  }
};

const sslAnalysisResponse = {
  status: 'READY',                 // Analysis status
  host: 'example.com',
  port: 443,
  protocol: 'https',
  isPublic: true,
  status: 'READY',
  startTime: 1640995200000,
  testTime: 1640995800000,
  engineVersion: '2.2.0',
  criteriaVersion: '2009q',
  endpoints: [
    {
      ipAddress: '93.184.216.34',
      serverName: 'example.com',
      statusMessage: 'Ready',
      grade: 'A+',                 // Overall security grade
      gradeTrustIgnored: 'A+',
      futureGrade: 'A+',
      hasWarnings: false,
      isExceptional: true,
      progress: 100,
      duration: 120000,
      delegation: 1,
      details: {
        hostStartTime: 1640995200000,
        certChains: [
          {
            id: 'chain1',
            certIds: ['cert1', 'cert2'],
            trustPaths: [
              {
                certIds: ['cert1', 'cert2', 'root1'],
                trust: [
                  {
                    rootStore: 'Mozilla',
                    isTrusted: true
                  }
                ]
              }
            ]
          }
        ],
        protocols: [
          {
            id: 771,               // TLS 1.2
            name: 'TLS',
            version: '1.2'
          },
          {
            id: 772,               // TLS 1.3
            name: 'TLS',
            version: '1.3'
          }
        ],
        suites: {
          preference: true,
          protocol: 771,
          list: [
            {
              id: 49195,
              name: 'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
              cipherStrength: 128,
              kxType: 'ECDH',
              kxStrength: 256,
              dhBits: 0,
              dhP: 0,
              dhG: 0,
              dhYs: 0,
              namedGroupBits: 256,
              namedGroupId: 23,
              namedGroupName: 'secp256r1',
              q: 0
            }
          ]
        }
      }
    }
  ],
  certs: [
    {
      id: 'cert1',
      subject: 'CN=example.com',
      commonNames: ['example.com', 'www.example.com'],
      altNames: ['example.com', 'www.example.com'],
      notBefore: 1640908800000,
      notAfter: 1672444800000,
      issuerSubject: 'CN=DigiCert TLS RSA SHA256 2020 CA1',
      sigAlg: 'SHA256withRSA',
      revocationInfo: 0,
      crlURIs: ['http://crl3.digicert.com/...'],
      ocspURIs: ['http://ocsp.digicert.com'],
      keyAlg: 'RSA',
      keySize: 2048,
      keyStrength: 2048,
      keyKnownDebianInsecure: false,
      issues: 0,
      sct: true,
      mustStaple: false,
      sha1Hash: 'abcd1234...',
      sha256Hash: 'efgh5678...'
    }
  ]
};
```

##### Health Check Endpoint
```javascript
// GET /health
const healthCheckResponse = {
  status: 'healthy',
  timestamp: '2024-01-01T00:00:00.000Z',
  version: '1.0.0',
  uptime: 3600000,
  services: {
    sslLabs: 'available',
    cache: 'operational',
    cors: 'enabled'
  }
};
```

#### Error Handling and Rate Limiting
```javascript
const sslWorkerErrorHandling = {
  rateLimiting: {
    strategy: 'Token bucket with per-IP limiting',
    limits: {
      perMinute: 10,
      perHour: 100,
      perDay: 500
    },
    headers: {
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': '7',
      'X-RateLimit-Reset': '1640995260'
    }
  },
  
  errorResponses: {
    400: 'Bad Request - Invalid domain format',
    401: 'Unauthorized - Invalid API credentials',
    403: 'Forbidden - Origin not allowed',
    429: 'Too Many Requests - Rate limit exceeded',
    500: 'Internal Server Error - SSL Labs API unavailable',
    502: 'Bad Gateway - Upstream service error',
    503: 'Service Unavailable - Temporary maintenance'
  },
  
  fallbackStrategies: {
    cacheFirst: 'Return cached results when API unavailable',
    gracefulDegradation: 'Partial results when some services fail',
    retryLogic: 'Exponential backoff for transient failures'
  }
};
```

#### Caching Strategy
```javascript
const sslCachingStrategy = {
  levels: {
    edge: 'Cloudflare edge cache (300 seconds)',
    worker: 'Worker KV storage (1 hour)',
    browser: 'Client-side cache headers (15 minutes)'
  },
  
  invalidation: {
    manual: 'Force refresh with fromCache=off parameter',
    automatic: 'TTL-based expiration',
    conditional: 'Conditional requests with ETags'
  },
  
  keys: {
    format: 'ssl:{domain}:{port}:{protocol}',
    examples: [
      'ssl:example.com:443:https',
      'ssl:api.example.com:443:https'
    ]
  }
};
```

## Microsoft Tenant Lookup Worker

### Purpose and Functionality
The Tenant Worker provides comprehensive Microsoft tenant discovery and analysis services. It aggregates data from multiple Microsoft APIs to provide complete tenant information including organizational details, DNS configuration, and authentication settings.

### Technical Implementation

#### Multi-API Integration Strategy
```javascript
const tenantApiSources = {
  primary: {
    microsoftGraph: {
      endpoint: 'https://graph.microsoft.com/v1.0/tenantRelationships/findTenantInformationByDomainName',
      authentication: 'Client credentials flow',
      dataProvided: 'Official tenant information, organization details',
      reliability: 'High - official Microsoft API'
    }
  },
  
  secondary: {
    getUserRealm: {
      endpoint: 'https://login.microsoftonline.com/GetUserRealm.srf',
      authentication: 'None required',
      dataProvided: 'Namespace type, federation details, cloud instance',
      reliability: 'High - public login API'
    },
    
    getCredentialType: {
      endpoint: 'https://login.microsoftonline.com/common/GetCredentialType',
      authentication: 'None required',
      dataProvided: 'Account type, tenant ID, federation brand name',
      reliability: 'High - public authentication API'
    },
    
    openIdConfiguration: {
      endpoint: 'https://login.microsoftonline.com/{domain}/.well-known/openid_configuration',
      authentication: 'None required',
      dataProvided: 'Authentication endpoints, issuer information',
      reliability: 'Medium - depends on tenant configuration'
    }
  },
  
  fallback: {
    knownTenants: {
      implementation: 'Static database of known Microsoft tenants',
      coverage: 'Major Microsoft domains (microsoft.com, outlook.com, etc.)',
      reliability: 'High - but limited coverage'
    }
  }
};
```

#### Comprehensive Data Aggregation
```javascript
const tenantDataAggregation = {
  tenantInformation: {
    tenantId: 'Primary tenant identifier (GUID)',
    displayName: 'Organization display name',
    defaultDomainName: 'Primary onmicrosoft.com domain',
    federationBrandName: 'Custom branding name',
    tenantType: 'Managed, Federated, or Consumer',
    tenantCategory: 'Home, Resource, or Guest',
    countryLetterCode: 'Organization country code'
  },
  
  domainConfiguration: {
    isManaged: 'Domain management type (cloud vs on-premises)',
    federationSettings: 'ADFS or third-party federation details',
    cloudInstanceName: 'Cloud environment (public, government, etc.)',
    authentication: 'Authentication endpoint configurations'
  },
  
  dnsAnalysis: {
    mxRecords: 'Mail exchange configuration',
    spfRecords: 'Sender Policy Framework records',
    txtRecords: 'All TXT records for domain verification',
    exchangeOnline: 'Exchange Online presence detection'
  },
  
  apiMetadata: {
    dataSources: 'List of APIs successfully queried',
    responseTime: 'Total aggregation time',
    cacheStatus: 'Cache hit/miss information',
    timestamp: 'Query execution timestamp'
  }
};
```

#### API Request Flow
```javascript
// POST /lookup
const tenantLookupRequest = {
  endpoint: 'https://tenant.yourdomain.com/lookup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Origin': 'https://yourdomain.com'
  },
  body: {
    domain: 'contoso.com',         // Domain to analyze
    includeDns: true,              // Include DNS analysis
    includeGraph: true,            // Include Microsoft Graph data
    useCache: true                 // Allow cached responses
  }
};

const tenantLookupResponse = {
  success: true,
  domain: 'contoso.com',
  tenantId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  tenantInfo: {
    displayName: 'Contoso Corporation',
    defaultDomainName: 'contoso.onmicrosoft.com',
    federationBrandName: 'Contoso',
    tenantType: 'Managed',
    tenantCategory: 'Home',
    countryLetterCode: 'US',
    verifiedDomains: [
      {
        name: 'contoso.com',
        type: 'Managed',
        isDefault: false,
        isInitial: false
      },
      {
        name: 'contoso.onmicrosoft.com',
        type: 'Managed',
        isDefault: true,
        isInitial: true
      }
    ]
  },
  userRealm: {
    namespaceType: 'Managed',
    federationBrandName: 'Contoso',
    cloudInstanceName: 'microsoftonline.com',
    cloudAudienceUrn: 'urn:federation:MicrosoftOnline',
    login: 'test@contoso.com',
    domainName: 'contoso.com',
    federationGlobalVersion: 1,
    authUrl: 'https://login.microsoftonline.com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/wsfed',
    federationActiveAuthUrl: 'https://login.microsoftonline.com/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/wsfed'
  },
  dnsAnalysis: {
    exchangeOnline: true,
    spfRecord: 'v=spf1 include:spf.protection.outlook.com -all',
    mxRecords: [
      {
        priority: 0,
        exchange: 'contoso-com.mail.protection.outlook.com'
      }
    ],
    txtRecords: [
      'v=spf1 include:spf.protection.outlook.com -all',
      'MS=ms12345678',
      'google-site-verification=abc123...'
    ]
  },
  apiSources: [
    {
      name: 'Microsoft Graph API',
      success: true,
      responseTime: 245,
      dataContributed: ['tenantId', 'displayName', 'verifiedDomains']
    },
    {
      name: 'GetUserRealm API',
      success: true,
      responseTime: 156,
      dataContributed: ['namespaceType', 'federationBrandName', 'authUrl']
    },
    {
      name: 'DNS Analysis',
      success: true,
      responseTime: 89,
      dataContributed: ['mxRecords', 'spfRecord', 'txtRecords']
    }
  ],
  metadata: {
    timestamp: '2024-01-01T00:00:00.000Z',
    totalResponseTime: 490,
    cacheHit: false,
    method: 'Multi-API aggregation'
  }
};
```

#### Authentication and Security
```javascript
const tenantWorkerSecurity = {
  authentication: {
    microsoftGraph: {
      method: 'Client credentials flow',
      scope: 'https://graph.microsoft.com/.default',
      tokenEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      caching: 'Token cached until expiration'
    },
    
    publicApis: {
      method: 'No authentication required',
      rateLimiting: 'Respectful request patterns',
      userAgent: 'Custom user agent for identification'
    }
  },
  
  dataPrivacy: {
    noPersonalData: 'Only public organizational information',
    noLogging: 'Tenant lookups not logged or stored',
    caching: 'Temporary caching only for performance',
    compliance: 'GDPR and privacy regulation compliant'
  },
  
  cors: {
    origins: 'Restricted to authorized domains',
    methods: 'GET, POST, OPTIONS only',
    headers: 'Standard headers plus custom API headers',
    credentials: 'No credentials in cross-origin requests'
  }
};
```

#### DNS Analysis Integration
```javascript
const dnsAnalysisFeatures = {
  exchangeOnlineDetection: {
    indicators: [
      'MX records pointing to *.mail.protection.outlook.com',
      'SPF record includes spf.protection.outlook.com',
      'TXT records with MS= verification strings'
    ],
    verification: 'Multi-point verification for accuracy'
  },
  
  spfRecordAnalysis: {
    parsing: 'Complete SPF record parsing and validation',
    includes: 'Resolution of include: mechanisms',
    validation: 'Syntax and logic validation',
    security: 'Detection of SPF record security issues'
  },
  
  comprehensiveTxtRecords: {
    collection: 'All TXT records for the domain',
    categorization: 'Automatic categorization by purpose',
    filtering: 'Removal of sensitive or irrelevant records',
    formatting: 'Structured presentation for analysis'
  }
};
```

## WHOIS Lookup Worker

### Purpose and Functionality
The WHOIS Worker provides modern domain registration and IP address geolocation information using RDAP (Registration Data Access Protocol) and reliable IP geolocation services. It replaces traditional WHOIS queries with structured JSON responses.

### Technical Implementation

#### RDAP Protocol Integration
```javascript
const rdapImplementation = {
  bootstrap: {
    source: 'IANA RDAP Bootstrap Registry',
    url: 'https://data.iana.org/rdap/dns.json',
    caching: '24-hour cache for bootstrap data',
    updates: 'Automatic updates from IANA registry'
  },
  
  serverDiscovery: {
    process: 'Extract TLD from domain → Find authoritative RDAP server',
    fallback: 'Multiple server options per TLD',
    validation: 'Server response validation and fallback'
  },
  
  dataStructure: {
    domain: 'Complete domain registration information',
    nameservers: 'Authoritative DNS server details',
    entities: 'Registrar and contact information',
    events: 'Registration, expiration, and update dates',
    status: 'Domain status codes and meanings'
  }
};
```

#### IP Geolocation Services
```javascript
const ipGeolocationSources = {
  primary: {
    ipinfo: {
      endpoint: 'https://ipinfo.io/{ip}/json',
      features: ['location', 'isp', 'organization', 'timezone'],
      accuracy: 'High for city-level geolocation',
      rateLimits: '50,000 requests/month free tier'
    }
  },
  
  secondary: {
    ipapi: {
      endpoint: 'http://ip-api.com/json/{ip}',
      features: ['location', 'isp', 'mobile', 'proxy', 'hosting'],
      accuracy: 'Good for general geolocation',
      rateLimits: '1,000 requests/minute'
    }
  },
  
  dataEnrichment: {
    flagEmojis: 'Country flag emoji generation',
    timezoneInfo: 'Timezone offset and DST information',
    securityAnalysis: 'Proxy, VPN, and hosting detection',
    networkInfo: 'ASN, organization, and ISP details'
  }
};
```

#### Comprehensive API Response
```javascript
// POST /lookup
const whoisLookupRequest = {
  endpoint: 'https://whois.yourdomain.com/lookup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: {
    query: 'example.com',          // Domain or IP address
    type: 'auto',                  // auto, domain, ip
    includeRaw: false              // Include raw RDAP/API responses
  }
};

// Domain lookup response
const domainLookupResponse = {
  success: true,
  type: 'domain',
  query: 'example.com',
  domain: {
    ldhName: 'example.com',
    unicodeName: 'example.com',
    handle: 'EXAMPLE-COM',
    status: [
      'client delete prohibited',
      'client transfer prohibited',
      'client update prohibited'
    ],
    entities: [
      {
        handle: 'REGISTRAR123',
        vcardArray: [
          'vcard',
          [
            ['version', {}, 'text', '4.0'],
            ['fn', {}, 'text', 'Example Registrar Inc.'],
            ['adr', {}, 'text', ['', '', '123 Main St', 'City', 'ST', '12345', 'US']],
            ['email', {}, 'text', 'admin@registrar.example'],
            ['tel', {}, 'text', '+1.1234567890']
          ]
        ],
        roles: ['registrar']
      }
    ],
    events: [
      {
        eventAction: 'registration',
        eventDate: '1995-08-14T04:00:00Z'
      },
      {
        eventAction: 'expiration',
        eventDate: '2024-08-13T04:00:00Z'
      },
      {
        eventAction: 'last changed',
        eventDate: '2023-08-14T04:00:00Z'
      }
    ],
    nameservers: [
      {
        ldhName: 'a.iana-servers.net',
        status: ['active']
      },
      {
        ldhName: 'b.iana-servers.net',
        status: ['active']
      }
    ],
    rdapConformance: ['rdap_level_0'],
    notices: [
      {
        title: 'Terms of Use',
        description: ['Service subject to Terms of Use.'],
        links: [
          {
            href: 'https://example.com/terms',
            rel: 'terms-of-service'
          }
        ]
      }
    ]
  },
  metadata: {
    rdapServer: 'https://rdap.verisign.com/com/v1/',
    queryTime: '2024-01-01T00:00:00.000Z',
    responseTime: 234,
    cacheHit: false
  }
};

// IP lookup response
const ipLookupResponse = {
  success: true,
  type: 'ip',
  query: '8.8.8.8',
  ip: {
    ip: '8.8.8.8',
    hostname: 'dns.google',
    city: 'Mountain View',
    region: 'California',
    country: 'US',
    countryName: 'United States',
    countryFlag: '🇺🇸',
    loc: '37.4056,-122.0775',
    coordinates: {
      latitude: 37.4056,
      longitude: -122.0775
    },
    timezone: 'America/Los_Angeles',
    postal: '94043',
    org: 'AS15169 Google LLC',
    asn: {
      asn: 15169,
      name: 'Google LLC',
      domain: 'google.com',
      route: '8.8.8.0/24',
      type: 'business'
    },
    isp: 'Google LLC',
    connectionType: 'business',
    usageType: 'Data Center/Web Hosting/Transit',
    mobile: false,
    proxy: false,
    vpn: false,
    tor: false,
    hosting: true,
    datacenter: true
  },
  metadata: {
    sources: ['ipinfo.io', 'ip-api.com'],
    queryTime: '2024-01-01T00:00:00.000Z',
    responseTime: 189,
    cacheHit: false
  }
};
```

#### Data Enrichment and Processing
```javascript
const whoisDataEnrichment = {
  domainProcessing: {
    statusCodes: 'Human-readable status code explanations',
    dateFormatting: 'ISO 8601 to readable date conversion',
    entityExtraction: 'Structured contact information extraction',
    nameserverValidation: 'DNS server validation and analysis'
  },
  
  ipProcessing: {
    geolocationAccuracy: 'City-level accuracy assessment',
    securityFlags: 'VPN, proxy, and hosting detection',
    networkAnalysis: 'ASN and routing information',
    threatIntelligence: 'Basic threat and reputation scoring'
  },
  
  responseEnrichment: {
    countryFlags: 'Unicode flag emoji generation',
    timezoneHandling: 'Timezone offset and DST calculation',
    coordinateValidation: 'Geographic coordinate validation',
    dataQuality: 'Confidence scores for data accuracy'
  }
};
```

#### Caching and Performance
```javascript
const whoisCachingStrategy = {
  domainCaching: {
    ttl: '24 hours for domain registration data',
    invalidation: 'Manual cache clear option',
    keyFormat: 'whois:domain:{domain}',
    compression: 'Response compression for large datasets'
  },
  
  ipCaching: {
    ttl: '6 hours for IP geolocation data',
    invalidation: 'Automatic expiration',
    keyFormat: 'whois:ip:{ip}',
    deduplication: 'Shared cache for identical IP requests'
  },
  
  rdapBootstrap: {
    ttl: '24 hours for IANA bootstrap data',
    fallback: 'Static bootstrap data for emergencies',
    updates: 'Background refresh of bootstrap registry',
    validation: 'Bootstrap data integrity checking'
  }
};
```

## Deployment and Configuration

### Environment Setup

#### SSL Worker Configuration
```toml
# wrangler-ssl.toml
name = "ssl-russ-tools"
main = "ssl.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "ssl-russ-tools-prod"
route = { pattern = "ssl.yourdomain.com/*", zone_name = "yourdomain.com" }

[vars]
ENVIRONMENT = "production"
DEBUG_MODE = "false"
CACHE_TTL = "3600"

# Set via: wrangler secret put SSL_LABS_EMAIL
# Set via: wrangler secret put SSL_LABS_USER_AGENT
# Set via: wrangler secret put ALLOWED_ORIGINS
```

#### Tenant Worker Configuration
```toml
# wrangler-tenant.toml
name = "tenant-russ-tools"
main = "tenant.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "tenant-russ-tools-prod"
route = { pattern = "tenant.yourdomain.com/*", zone_name = "yourdomain.com" }

[vars]
ENVIRONMENT = "production"
DEBUG_MODE = "false"
CACHE_TTL = "600"

# Set via: wrangler secret put ALLOWED_ORIGINS
# Set via: wrangler secret put GRAPH_CLIENT_ID (optional)
# Set via: wrangler secret put GRAPH_CLIENT_SECRET (optional)
# Set via: wrangler secret put GRAPH_TENANT_ID (optional)
```

#### WHOIS Worker Configuration
```toml
# wrangler-whois.toml
name = "whois-russ-tools"
main = "whois.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "whois-russ-tools-prod"
route = { pattern = "whois.yourdomain.com/*", zone_name = "yourdomain.com" }

[vars]
ENVIRONMENT = "production"
DEBUG_MODE = "false"
CACHE_TTL = "21600"

# Set via: wrangler secret put ALLOWED_ORIGINS
```

### Deployment Commands

#### Development Deployment
```bash
# Deploy to development environment
wrangler deploy ssl.js --config configs/wrangler-ssl.toml --env development
wrangler deploy tenant.js --config configs/wrangler-tenant.toml --env development
wrangler deploy whois.js --config configs/wrangler-whois.toml --env development
```

#### Production Deployment
```bash
# Deploy to production environment
wrangler deploy ssl.js --config configs/wrangler-ssl.toml --env production
wrangler deploy tenant.js --config configs/wrangler-tenant.toml --env production
wrangler deploy whois.js --config configs/wrangler-whois.toml --env production
```

#### Secret Management
```bash
# SSL Worker secrets
wrangler secret put SSL_LABS_EMAIL --config configs/wrangler-ssl.toml
wrangler secret put SSL_LABS_USER_AGENT --config configs/wrangler-ssl.toml
wrangler secret put ALLOWED_ORIGINS --config configs/wrangler-ssl.toml

# Tenant Worker secrets
wrangler secret put ALLOWED_ORIGINS --config configs/wrangler-tenant.toml
wrangler secret put GRAPH_CLIENT_ID --config configs/wrangler-tenant.toml
wrangler secret put GRAPH_CLIENT_SECRET --config configs/wrangler-tenant.toml
wrangler secret put GRAPH_TENANT_ID --config configs/wrangler-tenant.toml

# WHOIS Worker secrets
wrangler secret put ALLOWED_ORIGINS --config configs/wrangler-whois.toml
```

### Monitoring and Observability

#### Built-in Health Checks
```javascript
const healthCheckEndpoints = {
  ssl: 'https://ssl.yourdomain.com/health',
  tenant: 'https://tenant.yourdomain.com/health',
  whois: 'https://whois.yourdomain.com/health'
};

const healthCheckResponse = {
  status: 'healthy',
  timestamp: '2024-01-01T00:00:00.000Z',
  version: '1.0.0',
  uptime: 3600000,
  environment: 'production',
  services: {
    upstream: 'available',
    cache: 'operational',
    cors: 'enabled'
  },
  performance: {
    avgResponseTime: 245,
    requestCount: 15420,
    errorRate: 0.02
  }
};
```

#### Logging and Debugging
```javascript
const loggingStrategy = {
  production: {
    level: 'info',
    structure: 'JSON structured logging',
    fields: ['timestamp', 'level', 'message', 'requestId', 'userId'],
    sensitive: 'No sensitive data in logs'
  },
  
  development: {
    level: 'debug',
    structure: 'Human-readable console output',
    fields: ['timestamp', 'level', 'message', 'stack', 'context'],
    debugging: 'Verbose output for troubleshooting'
  },
  
  monitoring: {
    metrics: 'Request count, response time, error rate',
    alerts: 'Threshold-based alerting for failures',
    dashboards: 'Cloudflare Analytics integration',
    tracing: 'Request tracing for performance analysis'
  }
};
```

### Security Considerations

#### CORS Security
```javascript
const corsSecurityPolicy = {
  originValidation: {
    whitelist: 'Explicit origin whitelist only',
    wildcards: 'No wildcard origins in production',
    validation: 'Runtime origin validation against environment variables'
  },
  
  headerSecurity: {
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
    maxAge: '86400 seconds for preflight cache'
  },
  
  credentialHandling: {
    credentials: 'No credentials in cross-origin requests',
    cookies: 'No cookie transmission',
    authentication: 'API key authentication only'
  }
};
```

#### Rate Limiting and DDoS Protection
```javascript
const rateLimitingStrategy = {
  ipBasedLimiting: {
    implementation: 'Token bucket algorithm per client IP',
    limits: {
      burst: 10,
      sustained: 100,
      daily: 1000
    },
    storage: 'Cloudflare KV for distributed state'
  },
  
  ddosProtection: {
    cloudflare: 'Built-in Cloudflare DDoS protection',
    customRules: 'Custom rate limiting rules',
    geoBlocking: 'Geographic access restrictions if needed',
    botProtection: 'Bot and scraper detection'
  }
};
```

#### Secret Management
```javascript
const secretManagement = {
  storage: {
    method: 'Cloudflare Workers environment variables',
    encryption: 'Encrypted at rest and in transit',
    access: 'Runtime access only, no logging',
    rotation: 'Manual secret rotation procedures'
  },
  
  apiKeys: {
    sslLabs: 'SSL Labs API credentials',
    microsoftGraph: 'Azure App Registration credentials',
    monitoring: 'Optional monitoring service keys'
  },
  
  bestPractices: [
    'Never commit secrets to version control',
    'Use separate secrets per environment',
    'Implement secret rotation procedures',
    'Monitor secret usage and access',
    'Use least privilege access principles'
  ]
};
```

## Performance Optimization

### Caching Strategies
```javascript
const performanceOptimization = {
  multiLayerCaching: {
    edge: 'Cloudflare edge cache (5-15 minutes)',
    worker: 'Worker KV storage (1-24 hours)',
    browser: 'Client cache headers (5-30 minutes)'
  },
  
  cacheKeys: {
    ssl: 'ssl:{domain}:{port}:{protocol}',
    tenant: 'tenant:{domain}:{includeDns}',
    whois: 'whois:{query}:{type}'
  },
  
  invalidation: {
    manual: 'Cache-Control: no-cache header support',
    automatic: 'TTL-based expiration',
    conditional: 'ETag and Last-Modified support'
  }
};
```

### Response Optimization
```javascript
const responseOptimization = {
  compression: {
    gzip: 'Automatic gzip compression for large responses',
    minification: 'JSON response minification',
    streaming: 'Streaming responses for large datasets'
  },
  
  dataReduction: {
    fieldSelection: 'Client-specified field filtering',
    pagination: 'Paginated responses for large datasets',
    summarization: 'Summary data with detail expansion'
  },
  
  concurrency: {
    parallelRequests: 'Concurrent upstream API calls',
    timeout: 'Configurable request timeouts',
    fallback: 'Graceful degradation for failed services'
  }
};
```

## Error Handling and Resilience

### Comprehensive Error Management
```javascript
const errorHandlingFramework = {
  categories: {
    client: '4xx errors for client-side issues',
    server: '5xx errors for server-side problems',
    upstream: 'Upstream service failures',
    rateLimit: '429 for rate limiting violations'
  },
  
  responses: {
    structured: 'Consistent error response format',
    actionable: 'Clear error messages with solutions',
    noSensitiveData: 'No internal details in error messages',
    correlationIds: 'Request correlation for debugging'
  },
  
  resilience: {
    retryLogic: 'Exponential backoff for transient failures',
    circuitBreaker: 'Circuit breaker for cascading failures',
    fallbackData: 'Cached or default data when services fail',
    gracefulDegradation: 'Partial functionality during outages'
  }
};
```

### Testing and Quality Assurance

#### Testing Strategy
```javascript
const testingFramework = {
  unitTests: {
    coverage: 'Individual function testing',
    mocking: 'Mock external API dependencies',
    assertions: 'Comprehensive input/output validation'
  },
  
  integrationTests: {
    apiTesting: 'End-to-end API workflow testing',
    corsValidation: 'Cross-origin request testing',
    errorScenarios: 'Error condition and recovery testing'
  },
  
  performanceTests: {
    loadTesting: 'High-volume request testing',
    latencyTesting: 'Response time validation',
    cacheEfficiency: 'Cache hit ratio optimization'
  }
};
```

#### Quality Metrics
```javascript
const qualityMetrics = {
  availability: {
    target: '99.9% uptime',
    measurement: 'Health check success rate',
    alerting: 'Automated alerts for downtime'
  },
  
  performance: {
    responseTime: 'P95 < 500ms, P99 < 1000ms',
    throughput: '1000+ requests per minute',
    cacheHitRate: '>80% cache hit rate'
  },
  
  reliability: {
    errorRate: '<1% error rate',
    successRate: '>99% success rate',
    consistency: 'Consistent response formats'
  }
};
```

This comprehensive documentation provides complete coverage of the Cloudflare Workers infrastructure supporting the RussTools application, including implementation details, deployment procedures, security considerations, and operational best practices.