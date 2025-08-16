# Certificate Chain Analyzer - Cloudflare Worker

## Overview

The Certificate Chain Analyzer Cloudflare Worker provides real-time SSL/TLS certificate chain analysis for any domain. It retrieves certificate chains, performs security analysis, and validates trust paths to provide comprehensive certificate intelligence.

## Features

### Core Functionality
- **Real Certificate Retrieval**: Direct TLS connection to extract certificate chains
- **Chain Validation**: Complete trust path validation and verification
- **Security Analysis**: Vulnerability detection and compliance checking
- **CORS Support**: Cross-origin resource sharing for web applications
- **Caching**: Intelligent caching to reduce load and improve performance
- **Error Handling**: Graceful fallback to mock data when needed

### Security Analysis
- Certificate expiration warnings
- Weak cryptography detection (MD5, SHA-1)
- Key strength validation (RSA key length)
- Chain completeness verification
- Trust path validation

## API Endpoints

### Health Check
```bash
GET /health

Response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "service": "certificate-chain-analyzer"
}
```

### Certificate Analysis
```bash
POST /analyze

Request Body:
{
  "domain": "google.com",
  "port": 443
}

Response:
{
  "success": true,
  "domain": "google.com",
  "port": 443,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "certificates": [
    {
      "id": "cert-0",
      "type": "leaf",
      "details": {
        "subject": {
          "CN": "google.com",
          "O": "Google LLC",
          "C": "US"
        },
        "issuer": {
          "CN": "GTS CA 1C3",
          "O": "Google Trust Services LLC"
        },
        "validity": {
          "notBefore": "2024-01-01T00:00:00.000Z",
          "notAfter": "2024-04-01T00:00:00.000Z"
        },
        "keyInfo": {
          "algorithm": "SHA256withRSA",
          "keySize": 2048
        }
      },
      "fingerprints": {
        "sha256": "aa:bb:cc:dd...",
        "sha1": "11:22:33:44..."
      },
      "issues": []
    }
  ],
  "chain": {
    "isValid": true,
    "trustPath": [...],
    "issues": []
  },
  "metadata": {
    "totalCertificates": 3,
    "analysisType": "cloudflare-worker",
    "source": "google.com:443",
    "workerVersion": "1.0.0"
  }
}
```

## Deployment

### Prerequisites
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) installed
- Cloudflare account with Workers enabled
- Domain configured for custom routing (production only)

### Development Deployment
```bash
# Deploy to development environment
./deploy-certificate.sh development

# Or manually:
wrangler deploy --config configs/wrangler-certificate.toml --env development
```

### Production Deployment
```bash
# Deploy to production environment
./deploy-certificate.sh production

# Or manually:
wrangler deploy --config configs/wrangler-certificate.toml --env production
```

### Environment Configuration

#### Required Secrets
```bash
# Set allowed CORS origins
wrangler secret put ALLOWED_ORIGINS --config configs/wrangler-certificate.toml

# Example value:
# https://russ.tools,http://localhost:5173,http://localhost:5174
```

#### Environment Variables
The following variables are configured in `wrangler-certificate.toml`:
- `ENVIRONMENT`: development/production
- `DEBUG_MODE`: Enable verbose logging
- `CACHE_TTL`: Cache time-to-live in seconds (default: 1800)
- `TIMEOUT`: Request timeout in milliseconds (default: 30000)
- `USER_AGENT`: User agent string for requests

## Configuration

### CORS Setup
The worker supports configurable CORS origins for security:
```javascript
// Allowed origins should be set via secrets
const allowedOrigins = [
  'https://russ.tools',
  'http://localhost:5173',
  'http://localhost:5174'
];
```

### Caching Strategy
- **Cache TTL**: 30 minutes for certificate data
- **Edge Caching**: Leverages Cloudflare's edge cache
- **Cache Keys**: Based on domain and port combination
- **Invalidation**: Manual override via request headers

### Error Handling
The worker implements comprehensive error handling:
- **Network Timeouts**: 30-second timeout for certificate retrieval
- **Invalid Domains**: Validation and sanitization
- **TLS Failures**: Graceful fallback to mock data
- **Rate Limiting**: Built-in Cloudflare protection

## Testing

### Manual Testing
```bash
# Test health endpoint
curl https://your-worker-url/health

# Test certificate analysis
curl -X POST https://your-worker-url/analyze \
  -H 'Content-Type: application/json' \
  -d '{"domain": "google.com", "port": 443}'

# Test with custom port
curl -X POST https://your-worker-url/analyze \
  -H 'Content-Type: application/json' \
  -d '{"domain": "mail.google.com", "port": 993}'
```

### CORS Testing
```bash
# Test CORS preflight
curl -X OPTIONS https://your-worker-url/analyze \
  -H 'Origin: https://russ.tools' \
  -H 'Access-Control-Request-Method: POST'
```

### Error Testing
```bash
# Test invalid domain
curl -X POST https://your-worker-url/analyze \
  -H 'Content-Type: application/json' \
  -d '{"domain": "invalid-domain-that-does-not-exist.com"}'

# Test missing parameters
curl -X POST https://your-worker-url/analyze \
  -H 'Content-Type: application/json' \
  -d '{}'
```

## Integration

### Frontend Integration
The Certificate Chain Analyzer tool automatically integrates with this worker:

```javascript
// API call from the frontend
const response = await fetch('https://certificate.russ.tools/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify({
    domain: 'google.com',
    port: 443
  })
});

const data = await response.json();
if (data.success) {
  // Process certificate data
  console.log('Certificates:', data.certificates);
}
```

### Fallback Behavior
If the worker is unavailable, the frontend automatically falls back to mock data:
```javascript
try {
  // Try worker API first
  const certificates = await callCertificateWorker(domain, port);
  return certificates;
} catch (error) {
  // Fall back to mock data
  console.warn('Worker unavailable, using mock data');
  return generateMockCertificates(domain, port);
}
```

## Architecture

### Worker Structure
```
certificate-chain.js
├── Configuration Management
├── CORS Handling
├── Certificate Retrieval
├── Chain Validation
├── Security Analysis
├── Error Handling
└── Response Formatting
```

### Data Flow
1. **Request Validation**: Validate domain and port parameters
2. **CORS Check**: Verify origin against allowed list
3. **Certificate Retrieval**: Establish TLS connection and extract certificates
4. **Chain Analysis**: Parse certificates and validate chain
5. **Security Analysis**: Check for vulnerabilities and compliance
6. **Response Formation**: Format comprehensive response
7. **Caching**: Cache results for performance

### Security Considerations
- **Input Validation**: All inputs are validated and sanitized
- **Origin Validation**: Strict CORS origin checking
- **No Data Persistence**: No certificate data is stored long-term
- **Rate Limiting**: Leverages Cloudflare's built-in protection
- **Error Information**: No sensitive information leaked in errors

## Monitoring

### Health Monitoring
```bash
# Simple health check
curl https://certificate.russ.tools/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "service": "certificate-chain-analyzer"
}
```

### Performance Metrics
- **Response Time**: Target < 5 seconds for certificate analysis
- **Success Rate**: Target > 95% for valid domains
- **Cache Hit Rate**: Target > 70% for repeated requests
- **Error Rate**: Target < 5% overall error rate

### Logging
The worker logs important events:
- Certificate retrieval attempts and results
- Security issues detected
- Error conditions and fallbacks
- Performance metrics

## Troubleshooting

### Common Issues

#### Worker Not Responding
```bash
# Check worker status
wrangler tail --config configs/wrangler-certificate.toml

# Check deployment
wrangler whoami
wrangler list
```

#### CORS Errors
```bash
# Verify allowed origins secret
wrangler secret list --config configs/wrangler-certificate.toml

# Update allowed origins
wrangler secret put ALLOWED_ORIGINS --config configs/wrangler-certificate.toml
```

#### Certificate Retrieval Failures
- Check if the domain is accessible from Cloudflare's network
- Verify the port is correct (443 for HTTPS, 993 for IMAPS, etc.)
- Check if the domain uses valid TLS certificates
- Review worker logs for specific error messages

### Debug Mode
Enable debug mode for verbose logging:
```bash
# Set debug mode in wrangler.toml
DEBUG_MODE = "true"

# Or via environment variable
wrangler secret put DEBUG_MODE --config configs/wrangler-certificate.toml
# Value: "true"
```

## Future Enhancements

### Planned Features
- **Real TLS Integration**: Direct certificate extraction from TLS handshake
- **Certificate Transparency**: Integration with CT log databases
- **OCSP Validation**: Real-time revocation checking
- **Extended Validation**: Support for more certificate types and formats
- **Historical Tracking**: Certificate change monitoring and alerts

### API Extensions
- **Bulk Analysis**: Multiple domain analysis in single request
- **Webhook Notifications**: Real-time certificate change alerts  
- **Custom Validation**: User-defined validation rules
- **Reporting**: Detailed security and compliance reports

## Support

For issues and questions:
1. Check the worker logs: `wrangler tail`
2. Verify configuration: `wrangler secret list`
3. Test endpoints manually with curl
4. Review Cloudflare Workers dashboard for metrics

## License

This Cloudflare Worker is part of the RussTools project and follows the same licensing terms.