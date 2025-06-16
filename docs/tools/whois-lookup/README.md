# WHOIS Lookup Tool

## Overview

The WHOIS Lookup Tool is a comprehensive domain and IP address investigation tool that provides detailed registration information, network details, and organizational data. It supports both domain name queries and IP address lookups, offering insights into domain ownership, registration status, and network infrastructure.

## Purpose

This tool serves essential domain research and security analysis needs:
- **Domain Investigation**: Research domain ownership and registration details
- **IP Address Analysis**: Investigate network ownership and geographical location
- **Security Research**: Analyze suspicious domains and IP addresses for threat intelligence
- **Legal Compliance**: Gather domain registration information for legal proceedings
- **Network Administration**: Understand network ownership and contact information

## Key Features

### 1. Dual Query Support
- **Domain Queries**: Complete domain registration information
- **IP Address Queries**: Network ownership and geographical data
- **Automatic Detection**: Smart detection of input type (domain vs. IP)
- **Unified Interface**: Single interface for all WHOIS queries

### 2. Comprehensive Domain Information
- **Registration Details**: Domain creation, expiration, and last update dates
- **Registrar Information**: Domain registrar details and contact information
- **Name Servers**: DNS server configurations
- **Domain Status**: Current domain status codes and meanings
- **Contact Information**: Administrative and technical contact details

### 3. Detailed IP Address Data
- **Network Information**: IP range, ASN, and ISP details
- **Geographical Location**: Country, region, city, and coordinates
- **Organization Data**: Network owner and contact information
- **Security Intelligence**: Proxy/VPN detection and hosting provider identification
- **Network Infrastructure**: Reverse DNS and hostname information

### 4. Advanced Features
- **Caching System**: 30-minute cache for improved performance
- **History Tracking**: Recent query history with quick access
- **Export Functionality**: Download results as JSON
- **Calendar Integration**: Export domain expiration dates to calendar
- **Cross-Tool Integration**: Links to related DNS and SSL tools

### 5. Rich Data Visualization
- **Structured Display**: Organized presentation of complex WHOIS data
- **Interactive Elements**: Clickable elements for deeper investigation
- **Syntax Highlighting**: Color-coded raw WHOIS data
- **Responsive Design**: Optimized for all device sizes

## Usage Instructions

### Basic WHOIS Query

1. **Enter Query**
   - Type domain name (e.g., `example.com`)
   - Or enter IP address (e.g., `8.8.8.8`)
   - Tool automatically detects input type

2. **Execute Lookup**
   - Click "Lookup" button or press Enter
   - Real-time progress indicator during query
   - Results displayed in organized tabs

3. **Explore Results**
   - **Domain Information**: Registration and administrative details
   - **Data Sources**: Information about data providers
   - **Raw Data**: Complete WHOIS response with syntax highlighting

### Advanced Features

#### URL Parameters
```
/whois-lookup/example.com
/whois-lookup/8.8.8.8
```
Direct linking to specific WHOIS lookups

#### History Management
- **Recent Queries**: Quick access to previous lookups
- **Query Type Indicators**: Visual distinction between domains and IPs
- **Repeat Queries**: One-click re-execution of past queries
- **Clear History**: Remove all stored query history

#### Export Options
- **JSON Export**: Complete WHOIS data in machine-readable format
- **Calendar Export**: Domain expiration reminders (iCal format)
- **Raw Data Copy**: Copy complete WHOIS response text

## Technical Implementation

### Architecture

```
WHOISLookupTool (Main Component)
├── Query Input - Domain/IP input with autocomplete
├── Results Processing - Data normalization and presentation
├── History Management - Query history tracking
├── Export Functions - Data export capabilities
├── API Integration - WHOIS service integration
└── Data Visualization - Structured result display
```

### API Integration

#### Cloudflare Worker Proxy
```javascript
const whoisConfig = {
  endpoint: 'https://whois-lookup.your-worker.workers.dev',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};
```

#### Query Processing
```javascript
const performWHOISLookup = async (query) => {
  const cleanQuery = query.trim().toLowerCase();
  const queryType = detectQueryType(cleanQuery);
  
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    body: JSON.stringify({ query: cleanQuery, type: queryType })
  });
  
  return processWHOISResponse(await response.json());
};
```

#### Data Normalization
```javascript
const normalizeWHOISData = (rawData) => ({
  domain: extractDomain(rawData),
  registrar: extractRegistrar(rawData),
  dates: extractDates(rawData),
  nameservers: extractNameservers(rawData),
  status: extractStatus(rawData),
  contacts: extractContacts(rawData)
});
```

### Caching Strategy

#### Cache Structure
```javascript
const cacheEntry = {
  query: 'example.com',
  type: 'domain', // or 'ip'
  timestamp: Date.now(),
  data: whoisResponse,
  ttl: 1800000 // 30 minutes
};
```

#### Cache Management
- **30-Minute TTL**: Balances freshness with performance
- **Query-Specific**: Separate cache entries per query
- **Automatic Cleanup**: Expired entries removed automatically
- **Memory Optimization**: Limited cache size with LRU eviction

### Data Processing

#### Domain Data Extraction
```javascript
const extractDomainInfo = (whoisData) => ({
  domain: whoisData.domain,
  registrar: {
    name: whoisData.registrar,
    url: whoisData.registrarUrl,
    email: whoisData.registrarEmail
  },
  dates: {
    created: new Date(whoisData.creationDate),
    expires: new Date(whoisData.expirationDate),
    updated: new Date(whoisData.updatedDate)
  },
  nameservers: whoisData.nameservers || [],
  status: whoisData.status || []
});
```

#### IP Address Processing
```javascript
const extractIPInfo = (whoisData) => ({
  ip: whoisData.ip,
  network: {
    range: whoisData.range,
    cidr: whoisData.cidr,
    asn: whoisData.asn,
    isp: whoisData.isp
  },
  location: {
    country: whoisData.country,
    region: whoisData.region,
    city: whoisData.city,
    coordinates: whoisData.coordinates
  },
  organization: whoisData.organization,
  security: {
    proxy: whoisData.isProxy,
    hosting: whoisData.isHosting,
    mobile: whoisData.isMobile
  }
});
```

## API Integrations

### Primary: Cloudflare Worker

#### Endpoint Configuration
```javascript
const workerEndpoint = 'https://whois-lookup.your-worker.workers.dev';
const requestConfig = {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query, type })
};
```

#### Response Format
```javascript
const whoisResponse = {
  success: true,
  query: 'example.com',
  type: 'domain',
  data: {
    normalized: {
      domain: 'example.com',
      registrar: { name: 'Example Registrar' },
      dates: { created: '2023-01-01', expires: '2024-01-01' }
    },
    raw: 'Raw WHOIS response text...',
    sources: [
      { name: 'Registry WHOIS', status: 'success' }
    ]
  },
  timestamp: Date.now()
};
```

### Fallback Services

#### Alternative WHOIS APIs
- Multiple WHOIS data providers for reliability
- Automatic failover when primary service unavailable
- Geographic diversity for global domain coverage

#### Error Handling
```javascript
const handleWHOISError = (error) => {
  if (error.code === 'RATE_LIMITED') {
    return 'Too many requests, please try again later';
  } else if (error.code === 'NOT_FOUND') {
    return 'Domain or IP address not found in WHOIS database';
  } else {
    return 'WHOIS lookup failed, please try again';
  }
};
```

## Data Storage and Privacy

### Local Storage
```javascript
const storageKeys = {
  history: 'whois-lookup-history',
  cache: 'whois-lookup-cache',
  preferences: 'whois-lookup-preferences'
};
```

### Data Retention
- **Query History**: 100 most recent queries
- **Cache**: 30-minute TTL with automatic cleanup
- **Preferences**: User settings and customizations

### Privacy Considerations
- **No Server Logging**: Queries processed through secure proxy
- **Local Storage Only**: All data stored locally in browser
- **Secure Communication**: HTTPS-only API communication
- **Data Minimization**: Only essential data cached locally

### CORS and Security
- **Cloudflare Worker**: Secure proxy for CORS bypass
- **Rate Limiting**: Respectful API usage patterns
- **Input Sanitization**: Validation of all user inputs
- **Error Handling**: Secure error message handling

## Security Features

### Input Validation
```javascript
const validateQuery = (input) => {
  // Domain validation
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  
  // IP validation (IPv4)
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IP validation (IPv6)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return domainRegex.test(input) || ipv4Regex.test(input) || ipv6Regex.test(input);
};
```

### Data Sanitization
- **Input Cleaning**: Remove potentially malicious characters
- **Output Encoding**: Properly encode displayed data
- **XSS Prevention**: Sanitize all user-generated content
- **CSRF Protection**: Secure API request patterns

### Rate Limiting
- **Client-Side Throttling**: Prevent excessive API calls
- **Respectful Usage**: Honor API provider rate limits
- **Progressive Backoff**: Intelligent retry mechanisms
- **User Feedback**: Clear communication of rate limits

## Performance Considerations

### Optimization Strategies
- **Smart Caching**: 30-minute cache reduces redundant queries
- **Async Processing**: Non-blocking WHOIS queries
- **Progressive Loading**: Show partial results as they arrive
- **Memory Management**: Efficient data storage and cleanup

### Network Efficiency
- **Compression**: Gzip compression for large responses
- **Connection Pooling**: Reuse HTTP connections when possible
- **Timeout Management**: Reasonable timeouts prevent hanging
- **Fallback Handling**: Quick failover to alternative services

### User Experience
- **Real-time Feedback**: Progress indicators during queries
- **Error Recovery**: Graceful handling of failed queries
- **Responsive Design**: Optimized for all screen sizes
- **Keyboard Accessibility**: Full keyboard navigation support

## Specialized Features

### Domain Expiration Tracking

#### Calendar Export
```javascript
const exportDomainExpiration = (domain, expirationDate) => {
  const icalContent = createICalEvent({
    summary: `Domain Renewal: ${domain}`,
    description: `Domain expires on ${expirationDate}`,
    start: new Date(expirationDate),
    reminder: 30 // days before
  });
  
  downloadFile(`domain-expiration-${domain}.ics`, icalContent);
};
```

#### Renewal Alerts
- **30-Day Reminder**: Calendar event created 30 days before expiration
- **Custom Reminders**: Configurable reminder intervals
- **Multiple Domains**: Bulk calendar export for domain portfolios

### Security Intelligence

#### IP Address Analysis
```javascript
const analyzeIPSecurity = (ipData) => ({
  riskScore: calculateRiskScore(ipData),
  threats: identifyThreats(ipData),
  reputation: checkReputation(ipData),
  geolocation: analyzeLocation(ipData)
});
```

#### Domain Security Assessment
- **Registration Patterns**: Analyze registration date patterns
- **Name Server Analysis**: Evaluate DNS infrastructure
- **Contact Information**: Assess contact data quality
- **Status Code Analysis**: Interpret domain status meanings

### Data Sources and Attribution

#### WHOIS Data Providers
```javascript
const dataSources = [
  {
    name: 'Registry WHOIS',
    coverage: 'gTLD domains',
    reliability: 'primary'
  },
  {
    name: 'Registrar WHOIS',
    coverage: 'Detailed contact info',
    reliability: 'secondary'
  },
  {
    name: 'Regional Internet Registry',
    coverage: 'IP address blocks',
    reliability: 'authoritative'
  }
];
```

## Troubleshooting

### Common Issues

1. **No WHOIS Data Found**
   - Domain may not exist or be newly registered
   - IP address may be private or not publicly routed
   - Try alternative spellings or check domain existence

2. **Rate Limiting Errors**
   - WHOIS servers have strict rate limits
   - Wait before retrying the query
   - Use cached results when available

3. **Incomplete Information**
   - Some registrars provide limited WHOIS data
   - Privacy protection may hide contact details
   - Try querying different WHOIS servers

### Error Handling
```javascript
const handleWHOISErrors = {
  'NOT_FOUND': 'Domain or IP address not found in WHOIS database',
  'RATE_LIMITED': 'Too many requests, please wait before trying again',
  'TIMEOUT': 'WHOIS query timed out, please try again',
  'INVALID_QUERY': 'Invalid domain name or IP address format',
  'SERVICE_UNAVAILABLE': 'WHOIS service temporarily unavailable'
};
```

### Browser Compatibility
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **Required Features**: Fetch API, Promises, Local Storage, Blob API
- **Mobile Support**: Full functionality on mobile browsers

## Best Practices

### WHOIS Query Optimization
1. **Respect Rate Limits**: Wait between queries to avoid blocking
2. **Use Caching**: Leverage cached results when possible
3. **Verify Data**: Cross-reference with multiple sources
4. **Document Results**: Keep records for legal or compliance purposes

### Privacy and Ethics
1. **Respect Privacy**: Use WHOIS data responsibly
2. **Legal Compliance**: Follow applicable privacy laws
3. **Data Protection**: Secure handling of personal information
4. **Legitimate Use**: Only use for legitimate business purposes

### Security Research
1. **Verify Findings**: Corroborate WHOIS data with other sources
2. **Context Analysis**: Consider data age and reliability
3. **Threat Intelligence**: Integrate with other security tools
4. **Documentation**: Maintain investigation trails

## Integration Examples

### Automated Domain Monitoring
```javascript
// Example domain portfolio monitoring
const monitorDomains = async (domains) => {
  for (const domain of domains) {
    const whoisData = await queryWHOIS(domain);
    const daysUntilExpiry = calculateDaysUntilExpiry(whoisData.expires);
    
    if (daysUntilExpiry < 30) {
      sendExpirationAlert(domain, daysUntilExpiry);
    }
  }
};
```

### Security Investigation
```javascript
// Example threat investigation workflow
const investigateThreat = async (indicator) => {
  const whoisData = await queryWHOIS(indicator);
  const riskAssessment = analyzeRisk(whoisData);
  const relatedIndicators = findRelatedIndicators(whoisData);
  
  return {
    indicator,
    risk: riskAssessment,
    related: relatedIndicators,
    intelligence: whoisData
  };
};
```

### Legal Compliance
```javascript
// Example legal documentation
const generateLegalReport = (domain) => {
  const whoisData = queryWHOIS(domain);
  return {
    domain,
    registrant: whoisData.contacts.registrant,
    registrar: whoisData.registrar,
    dates: whoisData.dates,
    evidence: whoisData.raw,
    timestamp: new Date().toISOString()
  };
};
```

## API Reference

### Query Endpoint
```
POST /api/whois-lookup
{
  "query": "example.com",
  "type": "domain"
}
```

### Response Format
```json
{
  "success": true,
  "query": "example.com",
  "type": "domain",
  "data": {
    "normalized": {
      "domain": "example.com",
      "registrar": {
        "name": "Example Registrar Inc.",
        "url": "https://www.example-registrar.com"
      },
      "dates": {
        "created": "2023-01-01T00:00:00Z",
        "expires": "2024-01-01T00:00:00Z",
        "updated": "2023-06-01T00:00:00Z"
      }
    },
    "raw": "Raw WHOIS response...",
    "sources": [
      {
        "name": "Registry WHOIS",
        "status": "success",
        "timestamp": 1640995200000
      }
    ]
  },
  "timestamp": 1640995200000
}
```

## Contributing

### Development Guidelines
1. Test with various domain types and IP address ranges
2. Ensure proper error handling for all edge cases
3. Validate accessibility and keyboard navigation
4. Test caching behavior with different TTL values

### Testing Scenarios
- Valid and invalid domain names
- IPv4 and IPv6 addresses
- Domains with privacy protection
- Expired and suspended domains
- Rate limiting scenarios

For additional technical information, see the [API Configuration Documentation](../../api/API_CONFIG.md) and [TLD Utilities Guide](../../utils/tld-utilities.md).