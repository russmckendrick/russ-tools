# DNS Lookup Tool

## Overview

The DNS Lookup Tool is a comprehensive DNS query and analysis tool that allows users to perform various types of DNS lookups using multiple DNS providers. It provides detailed information about domain name resolution, DNS records, and supports advanced features like DNS over HTTPS (DoH) for enhanced security and privacy.

## Purpose

This tool addresses essential DNS analysis and troubleshooting needs:
- **DNS Record Analysis**: Query and analyze various DNS record types
- **Multi-Provider Testing**: Compare responses from different DNS servers
- **Network Troubleshooting**: Diagnose DNS-related connectivity issues
- **Security Research**: Investigate domain configurations and security settings
- **Educational Tool**: Learn about DNS infrastructure and record types

## Key Features

### 1. Comprehensive DNS Record Support
- **A Records**: IPv4 address resolution
- **AAAA Records**: IPv6 address resolution
- **MX Records**: Mail exchange server information
- **TXT Records**: Text records including SPF, DKIM, and other configurations
- **CNAME Records**: Canonical name aliases
- **NS Records**: Name server information
- **SOA Records**: Start of Authority information
- **PTR Records**: Reverse DNS lookups
- **SRV Records**: Service location records
- **CAA Records**: Certificate Authority Authorization

### 2. Multiple DNS Provider Support
- **Google DNS**: 8.8.8.8 (Primary resolver)
- **Cloudflare DNS**: 1.1.1.1 (Privacy-focused)
- **OpenDNS**: 208.67.222.222 (Security-enhanced)
- **Browser Default**: System default resolver
- **Custom Providers**: Support for additional DNS servers

### 3. DNS over HTTPS (DoH) Support
- **Encrypted Queries**: All DNS queries use HTTPS encryption
- **Privacy Protection**: Prevents DNS query interception
- **Bypass Restrictions**: Works around DNS blocking
- **Modern Standards**: RFC 8484 compliant implementation

### 4. Advanced Query Features
- **Automatic Domain Suggestions**: TLD-based autocomplete
- **Query History**: Track and repeat previous lookups
- **Caching System**: 5-minute cache for improved performance
- **Fallback Mechanisms**: Automatic failover between providers
- **Real-time Validation**: Instant feedback on query results

### 5. Rich Data Presentation
- **Structured Results**: Organized display of DNS records
- **Raw JSON Export**: Complete query response data
- **Interactive Links**: Click-through to related tools (WHOIS)
- **Timeline History**: Visual history of recent queries
- **Copy Functionality**: Easy copying of individual records

## Usage Instructions

### Basic DNS Lookup

1. **Enter Domain**
   - Type domain name (e.g., `example.com`)
   - Autocomplete suggests common domains and TLDs
   - Supports subdomain queries (e.g., `mail.example.com`)

2. **Select Record Type**
   - Choose from dropdown of supported record types
   - Default is A record for IPv4 addresses
   - Multiple record types can be queried sequentially

3. **Choose DNS Provider**
   - Select preferred DNS resolver
   - Different providers may return different results
   - Useful for comparing DNS configurations

4. **Execute Query**
   - Click "Lookup" button or press Enter
   - Real-time progress indicator during query
   - Results displayed in organized tabs

### Advanced Features

#### URL Parameters
```
/dns-lookup/example.com
```
Direct linking to specific domain lookups

#### History Management
- **Recent Queries**: Quick access to previous lookups
- **Repeat Queries**: One-click re-execution of past queries
- **Clear History**: Remove all stored query history
- **Export History**: Download query history for documentation

#### Multi-Provider Comparison
- Run same query against different DNS providers
- Compare results for DNS propagation analysis
- Identify DNS configuration inconsistencies
- Troubleshoot regional DNS differences

## Technical Implementation

### Architecture

```
DNSLookupTool (Main Component)
├── Domain Input - Domain entry with autocomplete
├── Provider Selection - DNS server selection
├── Record Type Selection - DNS record type picker
├── Results Display - Structured result presentation
├── History Management - Query history tracking
└── API Integration - DNS over HTTPS implementation
```

### DNS over HTTPS Implementation

#### Provider Endpoints
```javascript
const dohProviders = {
  google: 'https://dns.google/resolve',
  cloudflare: 'https://cloudflare-dns.com/dns-query',
  opendns: 'https://doh.opendns.com/dns-query'
};
```

#### Query Construction
```javascript
const buildDohQuery = (domain, recordType, provider) => {
  const params = new URLSearchParams({
    name: domain,
    type: recordType,
    ct: 'application/dns-json'
  });
  return `${dohProviders[provider]}?${params}`;
};
```

#### Response Processing
```javascript
const processDohResponse = (response) => ({
  status: response.Status === 0 ? 'Success' : 'Error',
  question: response.Question,
  answer: response.Answer || [],
  authority: response.Authority || [],
  additional: response.Additional || []
});
```

### Autocomplete System

#### TLD Integration
```javascript
// TLD-based domain suggestions
const generateSuggestions = (input) => {
  const tlds = ['.com', '.org', '.net', '.edu', '.gov'];
  return tlds.map(tld => `${input}${tld}`);
};
```

#### Common Domain Patterns
```javascript
// Popular domain suggestions
const commonPatterns = [
  'www.{domain}',
  'mail.{domain}',
  'ftp.{domain}',
  'api.{domain}'
];
```

### Caching Strategy

#### Cache Structure
```javascript
const cacheEntry = {
  domain: 'example.com',
  recordType: 'A',
  provider: 'google',
  timestamp: Date.now(),
  data: dnsResponse,
  ttl: 300000 // 5 minutes
};
```

#### Cache Management
- **Automatic Expiration**: 5-minute TTL for DNS records
- **Provider-Specific**: Separate cache per provider
- **Memory Optimization**: Limited cache size with LRU eviction

## API Integrations

### Primary: DNS over HTTPS APIs

#### Google DNS API
- **Endpoint**: `https://dns.google/resolve`
- **Format**: JSON over HTTPS
- **Features**: Complete DNS record support
- **Rate Limits**: Generous limits for web applications

#### Cloudflare DNS API
- **Endpoint**: `https://cloudflare-dns.com/dns-query`
- **Format**: RFC 8484 compliant
- **Features**: Privacy-focused, fast resolution
- **Security**: Enhanced privacy protections

#### OpenDNS API
- **Endpoint**: `https://doh.opendns.com/dns-query`
- **Format**: JSON responses
- **Features**: Security filtering, malware protection
- **Fallback**: Graceful fallback to Google DNS

### Integration with Other Tools

#### WHOIS Integration
```javascript
// Automatic WHOIS lookup for IP addresses
const handleIPResult = (ipAddress) => {
  const whoisUrl = `/whois-lookup/${encodeURIComponent(ipAddress)}`;
  return createActionButton('WHOIS Lookup', whoisUrl);
};
```

#### Cross-Tool Navigation
- Direct links to WHOIS tool for IP addresses
- SSL checker integration for domain validation
- Network designer integration for IP planning

## Data Storage and Privacy

### Local Storage
```javascript
const storageKeys = {
  history: 'dns-lookup-history',
  cache: 'dns-lookup-cache',
  preferences: 'dns-lookup-preferences'
};
```

### Data Retention
- **Query History**: 100 most recent queries
- **Cache**: 5-minute TTL with automatic cleanup
- **Preferences**: User-selected default providers

### Privacy Considerations
- **Encrypted Queries**: All DNS queries use HTTPS
- **No Server Logging**: Client-side only processing
- **Provider Privacy**: Respects DNS provider privacy policies
- **Local Storage**: All data stored locally in browser

### CORS Handling
- **Cloudflare Workers**: Proxy for CORS bypass when needed
- **Direct APIs**: Most DNS over HTTPS APIs support CORS
- **Fallback Methods**: Alternative approaches when CORS blocks requests

## Performance Considerations

### Optimization Strategies
- **Intelligent Caching**: 5-minute cache reduces redundant queries
- **Debounced Input**: Prevents excessive API calls during typing
- **Async Processing**: Non-blocking DNS queries
- **Progressive Loading**: Show partial results as they arrive

### Network Efficiency
- **Minimal Payloads**: Compact JSON responses
- **Compression**: Gzip compression for large responses
- **Connection Reuse**: HTTP/2 connection pooling
- **Timeout Management**: Reasonable timeouts prevent hanging

### User Experience
- **Real-time Feedback**: Progress indicators during queries
- **Error Recovery**: Graceful handling of failed queries
- **Responsive Design**: Works on mobile and desktop
- **Keyboard Navigation**: Full keyboard accessibility

## Security Features

### DNS over HTTPS Benefits
- **Query Encryption**: Prevents DNS eavesdropping
- **Integrity Protection**: Prevents DNS manipulation
- **Privacy Enhancement**: Hides DNS queries from ISPs
- **Censorship Resistance**: Bypasses DNS-based blocking

### Input Validation
```javascript
const validateDomain = (domain) => {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  return domainRegex.test(domain);
};
```

### Error Handling
- **Malformed Queries**: Validation before sending
- **Rate Limiting**: Respectful API usage
- **Timeout Handling**: Graceful timeout management
- **Provider Failures**: Automatic fallback to alternative providers

## Troubleshooting

### Common Issues

1. **No DNS Records Found**
   - Verify domain spelling and existence
   - Try different record types (A, AAAA, MX)
   - Check with multiple DNS providers

2. **Query Timeouts**
   - Network connectivity issues
   - DNS provider service problems
   - Try alternative providers

3. **CORS Errors** (Rare)
   - Browser security restrictions
   - Fallback to Cloudflare Worker proxy
   - Check browser console for details

### Debugging Features
- **Raw Response View**: Complete JSON response data
- **Query Details**: Exact query parameters sent
- **Provider Comparison**: Side-by-side provider results
- **Network Timing**: Response time measurements

### Browser Compatibility
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **Required Features**: Fetch API, Promises, JSON parsing
- **Mobile Support**: Full functionality on mobile browsers

## DNS Record Type Guide

### Common Record Types

#### A Record (IPv4)
```
example.com. 300 IN A 93.184.216.34
```
- Maps domain to IPv4 address
- Most common DNS record type
- Used for web servers, email servers

#### AAAA Record (IPv6)
```
example.com. 300 IN AAAA 2606:2800:220:1:248:1893:25c8:1946
```
- Maps domain to IPv6 address
- Growing importance with IPv6 adoption
- Same functionality as A record for IPv6

#### MX Record (Mail Exchange)
```
example.com. 300 IN MX 10 mail.example.com.
```
- Specifies mail servers for domain
- Priority value determines order
- Essential for email delivery

#### TXT Record (Text)
```
example.com. 300 IN TXT "v=spf1 include:_spf.google.com ~all"
```
- Arbitrary text data
- Used for SPF, DKIM, domain verification
- Security and authentication purposes

#### CNAME Record (Canonical Name)
```
www.example.com. 300 IN CNAME example.com.
```
- Creates alias for another domain
- Cannot coexist with other record types
- Common for www subdomains

### Advanced Record Types

#### NS Record (Name Server)
```
example.com. 86400 IN NS ns1.example.com.
```
- Specifies authoritative name servers
- Controls DNS delegation
- Critical for domain management

#### SOA Record (Start of Authority)
```
example.com. 86400 IN SOA ns1.example.com. admin.example.com. (
  2023010101 ; serial
  3600       ; refresh
  1800       ; retry
  604800     ; expire
  86400      ; minimum TTL
)
```
- Contains domain administration information
- Defines zone transfer parameters
- One per DNS zone

#### CAA Record (Certificate Authority Authorization)
```
example.com. 300 IN CAA 0 issue "letsencrypt.org"
```
- Specifies which CAs can issue certificates
- Important for SSL/TLS security
- Prevents unauthorized certificate issuance

## Best Practices

### DNS Query Optimization
1. **Choose Appropriate Record Types**: Query specific records needed
2. **Use Multiple Providers**: Compare results for accuracy
3. **Cache Results**: Avoid redundant queries
4. **Monitor TTL Values**: Respect DNS caching recommendations

### Troubleshooting Methodology
1. **Start Simple**: Begin with A record queries
2. **Progressive Complexity**: Add more record types as needed
3. **Provider Comparison**: Use multiple DNS servers
4. **Document Results**: Keep records of DNS configurations

### Security Considerations
1. **Use DoH Providers**: Enhanced privacy and security
2. **Verify Results**: Cross-reference with multiple sources
3. **Monitor Changes**: Track DNS record modifications
4. **Validate Certificates**: Check CAA records for domains

## Integration Examples

### Automated Monitoring
```javascript
// Example DNS monitoring script
const monitorDNS = async (domains) => {
  for (const domain of domains) {
    const aRecord = await queryDNS(domain, 'A', 'google');
    const mxRecord = await queryDNS(domain, 'MX', 'cloudflare');
    
    if (!aRecord.answer.length) {
      alertMissingARecord(domain);
    }
  }
};
```

### Network Diagnostics
```bash
# Example CLI integration
curl -s "https://russ.tools/api/dns-lookup?domain=example.com&type=A" | \
  jq -r '.answer[].data'
```

### Infrastructure Validation
```yaml
# Example CI/CD pipeline step
- name: Validate DNS Configuration
  run: |
    DNS_RESULT=$(curl -s "https://russ.tools/api/dns-lookup?domain=$DOMAIN&type=A")
    echo "$DNS_RESULT" | jq -e '.answer | length > 0'
```

## Contributing

### Development Guidelines
1. Test with various domain types and configurations
2. Ensure proper error handling for all DNS providers
3. Validate accessibility and keyboard navigation
4. Test caching behavior with different TTL values

### Testing Scenarios
- Valid and invalid domain names
- Different DNS record types
- Provider failover scenarios
- Network timeout conditions
- Large DNS responses

For more technical details, see the [API Configuration Guide](../../api/API_CONFIG.md) and [TLD Utilities Documentation](../../utils/tld-utilities.md).