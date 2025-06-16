# Microsoft Tenant Lookup Tool

## Overview

The Microsoft Tenant Lookup Tool is a comprehensive tenant discovery service that provides detailed Microsoft organizational information for any domain or email address. It leverages multiple Microsoft APIs and DNS analysis to deliver complete tenant profiles, including organizational details, authentication configurations, DNS settings, and technical infrastructure information essential for IT administrators, CSP partners, and security professionals.

## Purpose

This tool addresses critical tenant discovery and analysis needs:
- **Tenant Intelligence**: Comprehensive Microsoft tenant information discovery
- **Security Research**: Investigate domain-to-tenant relationships for threat analysis
- **IT Infrastructure Assessment**: Understand Microsoft service configurations
- **CSP Partner Support**: Rapid customer tenant identification and validation
- **Compliance and Auditing**: Gather organizational data for compliance purposes

## Key Features

### 1. Multi-Method Tenant Discovery
- **Microsoft Graph API**: Primary tenant identification through official APIs
- **GetUserRealm API**: Federation and authentication configuration discovery
- **DNS Analysis**: Exchange Online, SPF, and Microsoft service detection
- **OpenID Configuration**: Authentication endpoint and issuer discovery
- **Intelligent Fallback**: Multiple discovery methods ensure comprehensive results

### 2. Comprehensive Tenant Information
- **Organizational Details**: Display name, tenant ID, and domain information
- **Federation Configuration**: Brand names, authentication settings, and realm details
- **Tenant Classification**: Type categorization (AAD, B2C, Hybrid, Cloud-only)
- **Service Detection**: Microsoft 365, Exchange Online, and security service identification
- **Technical Metadata**: Timestamps, discovery methods, and API source tracking

### 3. Advanced DNS Analysis
- **Exchange Online Detection**: Identify Exchange Online configuration through MX records
- **SPF Record Analysis**: Office 365 SPF detection and validation
- **TXT Record Enumeration**: Comprehensive TXT record analysis for Microsoft services
- **MX Record Parsing**: Mail exchange configuration and routing analysis
- **Service Verification**: Cross-reference DNS with tenant configuration

### 4. User Experience Features
- **Dual Input Support**: Accept both domain names and email addresses
- **Real-time Validation**: Instant input validation and domain extraction
- **Progressive Disclosure**: Collapsible sections for detailed information
- **Copy Functionality**: One-click copying of tenant IDs and JSON data
- **Cross-Tool Integration**: Direct links to Microsoft Portals (GDAP) tool

### 5. Technical Integration Features
- **URL Parameter Support**: Direct linking with pre-populated domains
- **JSON Export**: Complete tenant data export for programmatic use
- **API Integration**: RESTful API access through Cloudflare Worker proxy
- **Error Handling**: Comprehensive error reporting with actionable guidance
- **Performance Optimization**: Efficient API calls with intelligent caching

## Usage Instructions

### Basic Tenant Lookup

1. **Enter Domain or Email**
   - Type domain name (e.g., `contoso.com`)
   - Or enter email address (e.g., `user@contoso.com`)
   - Tool automatically extracts domain from email

2. **Execute Lookup**
   - Click "Lookup Tenant" button or press Enter
   - Real-time progress indicator during API calls
   - Results displayed in organized sections

3. **Review Results**
   - **Tenant Information**: Core organizational data
   - **DNS Information**: Microsoft service configuration
   - **User Realm Details**: Authentication and federation settings
   - **Metadata**: Lookup timestamp and API source information

### Advanced Features

#### URL Parameters
```
/tenant-lookup/contoso.com
```
Direct linking to specific tenant lookups for bookmarking or sharing

#### Data Export
- **Copy Tenant ID**: Quick copy button for tenant identification
- **Export JSON**: Complete tenant data in machine-readable format
- **Copy Raw Data**: Full JSON response for integration purposes

#### Cross-Tool Navigation
- **Microsoft Portals Integration**: Direct link to GDAP portal tool
- **Tenant-Specific URLs**: Pre-populated domain for related tools
- **Workflow Continuity**: Seamless transition between tenant tools

## Technical Implementation

### Architecture

```
TenantLookupTool (Main Component)
├── Input Processing - Domain/email validation and extraction
├── API Integration - Multiple Microsoft API endpoints
├── DNS Analysis - Exchange Online and SPF detection
├── Results Processing - Data normalization and presentation
├── Export System - JSON and clipboard integration
└── Cross-Tool Integration - Microsoft Portals linkage
```

### Tenant Discovery Engine

#### Primary API Integration
```javascript
const handleTenantLookup = async (domain) => {
  const tenantConfig = getApiEndpoint('tenant');
  const apiUrl = buildApiUrl(tenantConfig.url, { domain: cleanDomain });
  
  const response = await apiFetch(apiUrl, {
    method: 'GET',
    headers: {
      ...tenantConfig.headers,
      'Accept': 'application/json'
    }
  });
  
  return processTenantResponse(response);
};
```

#### Domain Extraction Logic
```javascript
const extractDomain = (input) => {
  const trimmed = input.trim();
  
  // Extract domain from email if @ symbol present
  if (trimmed.includes('@')) {
    return trimmed.split('@').pop().toLowerCase();
  }
  
  // Return as domain if no @ symbol
  return trimmed.toLowerCase();
};
```

### Multi-Method Discovery System

#### Microsoft Graph API Integration
```javascript
const discoverTenantViaGraph = async (domain) => {
  const graphEndpoint = `https://graph.microsoft.com/v1.0/tenantRelationships/findTenantInformationByDomainName(domainName='${domain}')`;
  
  return {
    method: 'Microsoft Graph API',
    endpoint: graphEndpoint,
    data: await fetchTenantData(graphEndpoint)
  };
};
```

#### GetUserRealm API Integration
```javascript
const discoverTenantViaUserRealm = async (domain) => {
  const userRealmEndpoint = `https://login.microsoftonline.com/getuserrealm.srf?login=user@${domain}&xml=1`;
  
  return {
    method: 'GetUserRealm API',
    endpoint: userRealmEndpoint,
    data: await fetchUserRealmData(userRealmEndpoint)
  };
};
```

#### OpenID Configuration Discovery
```javascript
const discoverTenantViaOpenID = async (domain) => {
  const openidEndpoint = `https://login.microsoftonline.com/${domain}/.well-known/openid_configuration`;
  
  return {
    method: 'OpenID Configuration',
    endpoint: openidEndpoint,
    data: await fetchOpenIDConfig(openidEndpoint)
  };
};
```

### DNS Analysis Engine

#### Exchange Online Detection
```javascript
const detectExchangeOnline = (mxRecords) => {
  const exchangeOnlinePatterns = [
    /\.mail\.protection\.outlook\.com$/,
    /\.mail\.eo\.outlook\.com$/,
    /outlook\.com$/
  ];
  
  return mxRecords.some(record => 
    exchangeOnlinePatterns.some(pattern => 
      pattern.test(record.exchange)
    )
  );
};
```

#### SPF Record Analysis
```javascript
const detectOffice365SPF = (txtRecords) => {
  const spfPatterns = [
    /include:spf\.protection\.outlook\.com/,
    /include:spf\.messaging\.microsoft\.com/,
    /v=spf1.*outlook\.com/
  ];
  
  return txtRecords.some(record => 
    spfPatterns.some(pattern => pattern.test(record))
  );
};
```

## API Integrations

### Primary: Cloudflare Worker Tenant API

#### Endpoint Configuration
```javascript
const tenantApiConfig = {
  endpoint: 'https://tenant-lookup.your-worker.workers.dev',
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'RussTools-TenantLookup/1.0'
  },
  timeout: 10000
};
```

#### Response Structure
```javascript
const tenantResponse = {
  success: true,
  domain: 'contoso.com',
  tenantId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  displayName: 'Contoso Corporation',
  federationBrandName: 'Contoso',
  defaultDomainName: 'contoso.onmicrosoft.com',
  tenantType: 'AAD',
  tenantCategory: 'Home',
  isCloudOnly: true,
  method: 'Microsoft Graph API',
  timestamp: Date.now(),
  dnsInfo: {
    hasExchangeOnline: true,
    hasOffice365SPF: true,
    mxRecords: [
      { priority: 10, exchange: 'contoso-com.mail.protection.outlook.com' }
    ],
    txtRecords: [
      'v=spf1 include:spf.protection.outlook.com -all',
      'MS=ms12345678'
    ]
  },
  userRealm: {
    NameSpaceType: 'Managed',
    CloudInstanceName: 'microsoftonline.com',
    FederationBrandName: 'Contoso Corporation'
  }
};
```

### Microsoft API Endpoints

#### Graph API Tenant Information
- **Endpoint**: `https://graph.microsoft.com/v1.0/tenantRelationships/findTenantInformationByDomainName`
- **Method**: GET
- **Authentication**: Application permissions
- **Rate Limits**: Standard Graph API throttling

#### GetUserRealm API
- **Endpoint**: `https://login.microsoftonline.com/getuserrealm.srf`
- **Method**: GET
- **Parameters**: `login=user@domain&xml=1`
- **Response**: XML format user realm information

#### OpenID Configuration
- **Endpoint**: `https://login.microsoftonline.com/{domain}/.well-known/openid_configuration`
- **Method**: GET
- **Format**: JSON metadata document
- **Purpose**: Authentication endpoint discovery

### DNS Resolution APIs

#### DNS over HTTPS Integration
```javascript
const resolveDNSRecords = async (domain, recordType) => {
  const dohProviders = [
    'https://dns.google/resolve',
    'https://cloudflare-dns.com/dns-query',
    'https://dns.quad9.net/dns-query'
  ];
  
  for (const provider of dohProviders) {
    try {
      const response = await fetchDNSRecord(provider, domain, recordType);
      if (response.Status === 0) return response.Answer;
    } catch (error) {
      console.warn(`DNS provider ${provider} failed:`, error);
    }
  }
  
  throw new Error('All DNS providers failed');
};
```

## Data Storage and Privacy

### Data Handling
- **No Persistent Storage**: All tenant lookups are ephemeral
- **Client-Side Only**: Results not stored on server
- **Secure Transmission**: HTTPS-only API communication
- **Privacy Compliant**: No personal data collection or storage

### Security Considerations
- **Input Validation**: Comprehensive domain and email validation
- **API Security**: Secure headers and proper authentication
- **Error Handling**: No sensitive information in error messages
- **CORS Protection**: Requests routed through secure proxy

### API Rate Limiting
- **Respectful Usage**: Built-in delays and throttling
- **Fallback Methods**: Multiple APIs prevent single point of failure
- **Error Recovery**: Graceful handling of rate limit responses
- **Cache Headers**: Respect API cache directives

## Performance Considerations

### Optimization Strategies
- **Parallel API Calls**: Concurrent tenant discovery methods
- **Intelligent Timeouts**: Balanced timeout values for reliability
- **Progressive Loading**: Show partial results as they arrive
- **Efficient DNS Resolution**: Optimized DNS query patterns

### Network Efficiency
- **Minimal Payloads**: Request only necessary data fields
- **Compression Support**: Gzip compression for large responses
- **Connection Reuse**: HTTP/2 connection pooling when available
- **Regional Optimization**: API endpoint selection based on location

### User Experience
- **Real-time Feedback**: Progress indicators during lookups
- **Error Recovery**: Clear error messages with resolution steps
- **Responsive Design**: Optimized for all device sizes
- **Accessibility**: Full keyboard navigation and screen reader support

## Security Features

### Input Validation and Sanitization

#### Domain Validation
```javascript
const validateDomain = (domain) => {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
  
  if (!domainRegex.test(domain)) {
    throw new ValidationError('Invalid domain format');
  }
  
  return domain.toLowerCase();
};
```

#### Email Address Processing
```javascript
const extractAndValidateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
  
  return email.split('@')[1].toLowerCase();
};
```

### Data Protection
- **No Logging**: Tenant lookup queries not logged or stored
- **Secure Headers**: Proper security headers on all requests
- **Content Security Policy**: Strict CSP to prevent XSS attacks
- **Input Sanitization**: All user inputs validated and sanitized

### API Security
- **Authentication**: Proper API authentication for Microsoft services
- **Authorization**: Appropriate permissions for tenant discovery
- **Encrypted Communication**: TLS 1.3 for all API communications
- **Request Signing**: HMAC signing for sensitive API calls

## Advanced Use Cases

### IT Administration and Security

#### Tenant Reconnaissance
```javascript
const performTenantReconnaissance = async (domain) => {
  const tenantInfo = await lookupTenant(domain);
  const securityAnalysis = await analyzeTenantSecurity(tenantInfo);
  
  return {
    tenant: tenantInfo,
    security: {
      federationType: securityAnalysis.federationType,
      authenticationMethods: securityAnalysis.authMethods,
      riskAssessment: securityAnalysis.risk,
      recommendations: securityAnalysis.recommendations
    },
    compliance: await checkComplianceStatus(tenantInfo)
  };
};
```

#### Multi-Tenant Analysis
```javascript
const analyzeTenantPortfolio = async (domains) => {
  const results = await Promise.all(
    domains.map(async domain => {
      const tenant = await lookupTenant(domain);
      const analysis = await analyzeTenantConfig(tenant);
      
      return {
        domain,
        tenant,
        analysis,
        lastChecked: Date.now()
      };
    })
  );
  
  return generatePortfolioReport(results);
};
```

### CSP Partner Workflows

#### Customer Onboarding
```javascript
const onboardCustomer = async (customerDomain) => {
  const tenantInfo = await lookupTenant(customerDomain);
  
  if (!tenantInfo.success) {
    throw new Error('Customer domain not associated with Microsoft tenant');
  }
  
  return {
    customer: {
      domain: tenantInfo.domain,
      tenantId: tenantInfo.tenantId,
      displayName: tenantInfo.displayName
    },
    services: await detectCustomerServices(tenantInfo),
    portals: await generateCustomerPortals(tenantInfo),
    onboardingChecklist: await generateOnboardingTasks(tenantInfo)
  };
};
```

### Security and Compliance

#### Threat Intelligence
```javascript
const analyzeThreatIndicator = async (domain) => {
  const tenantInfo = await lookupTenant(domain);
  
  return {
    indicator: domain,
    tenant: tenantInfo,
    riskFactors: await assessRiskFactors(tenantInfo),
    reputation: await checkDomainReputation(domain),
    intelligence: await gatherThreatIntelligence(domain, tenantInfo)
  };
};
```

## Integration Examples

### Automated Monitoring
```bash
# Example API usage for monitoring
curl -s "https://russ.tools/api/tenant-lookup?domain=contoso.com" | \
  jq -r '.tenantId'
```

### PowerShell Integration
```powershell
# Example PowerShell function
function Get-TenantInfo {
    param([string]$Domain)
    
    $uri = "https://russ.tools/api/tenant-lookup?domain=$Domain"
    $response = Invoke-RestMethod -Uri $uri -Method Get
    
    if ($response.success) {
        return $response
    } else {
        throw "Tenant lookup failed: $($response.error)"
    }
}
```

### Python Integration
```python
import requests

def lookup_tenant(domain):
    """Lookup Microsoft tenant information for a domain."""
    url = f"https://russ.tools/api/tenant-lookup"
    params = {"domain": domain}
    
    response = requests.get(url, params=params)
    response.raise_for_status()
    
    data = response.json()
    if data.get("success"):
        return data
    else:
        raise Exception(f"Tenant lookup failed: {data.get('error')}")

# Example usage
tenant_info = lookup_tenant("contoso.com")
print(f"Tenant ID: {tenant_info['tenantId']}")
print(f"Display Name: {tenant_info['displayName']}")
```

## Troubleshooting

### Common Issues

1. **Tenant Not Found**
   - Domain may not be associated with Microsoft tenant
   - Check domain spelling and try alternative formats
   - Verify domain has active Microsoft services
   - Test with known Microsoft domains for tool validation

2. **API Timeout Errors**
   - Microsoft APIs may be experiencing high load
   - Check network connectivity and DNS resolution
   - Try again after a few minutes
   - Verify Cloudflare Worker is operational

3. **CORS or Network Errors**
   - Browser blocking cross-origin requests
   - Network firewall or proxy interference
   - VPN or geographic restrictions
   - Check browser console for specific error details

### Error Resolution Guide
```javascript
const errorResolution = {
  'TENANT_NOT_FOUND': 'Domain not associated with Microsoft tenant - verify domain has Microsoft services',
  'API_TIMEOUT': 'Request timeout - check network connectivity and try again',
  'INVALID_DOMAIN': 'Invalid domain format - ensure proper domain syntax',
  'RATE_LIMITED': 'Too many requests - wait before retrying',
  'NETWORK_ERROR': 'Network connectivity issue - check internet connection',
  'CORS_ERROR': 'Cross-origin request blocked - using secure proxy fallback'
};
```

### Debugging Features
- **Raw JSON Export**: Complete API response for debugging
- **Method Tracking**: Shows which discovery method succeeded
- **Timestamp Logging**: Precise timing for performance analysis
- **Error Context**: Detailed error information with resolution steps

### Browser Compatibility
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Required Features**: Fetch API, Promises, ES6 support, JSON processing
- **Mobile Support**: Full functionality on mobile browsers
- **Progressive Enhancement**: Core features work on older browsers

## Best Practices

### Tenant Discovery Workflow
1. **Input Validation**: Always validate domain format before lookup
2. **Error Handling**: Implement proper error handling and user feedback
3. **Rate Limiting**: Respect API rate limits and implement delays
4. **Data Verification**: Cross-reference results with multiple sources

### Security Considerations
1. **Input Sanitization**: Validate and sanitize all user inputs
2. **Secure Storage**: Never store sensitive tenant information
3. **Access Control**: Implement appropriate access controls for API usage
4. **Audit Logging**: Maintain logs for security and compliance purposes

### Performance Optimization
1. **Caching Strategy**: Implement intelligent caching for repeated lookups
2. **Parallel Processing**: Use concurrent API calls when possible
3. **Timeout Management**: Set appropriate timeouts for reliability
4. **Error Recovery**: Implement graceful fallback mechanisms

## Contributing

### Development Guidelines
1. Test with various Microsoft tenant types and configurations
2. Ensure proper error handling for all API failure scenarios
3. Validate accessibility and keyboard navigation functionality
4. Test mobile responsiveness and touch interfaces

### Testing Scenarios
- Valid and invalid domain formats
- Email address domain extraction
- Various Microsoft tenant types (B2B, B2C, Enterprise)
- API timeout and network failure conditions
- Edge cases and malformed inputs

For additional technical details, see the [API Configuration Guide](../../api/API_CONFIG.md) and [Microsoft Graph Integration Documentation](../../integrations/microsoft-graph.md).