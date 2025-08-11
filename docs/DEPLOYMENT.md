# RussTools - Deployment Guide

## Overview

RussTools is deployed as a static web application with Cloudflare Workers handling API proxying and backend services. This guide covers the complete deployment process for both the frontend application and backend services.

## Architecture

### Frontend Deployment
- **Static Site**: Vite-built React SPA deployed to CDN
- **Hosting**: Cloudflare Pages (recommended) or similar static hosting
- **Domain**: Custom domain with SSL/TLS certificate
- **CDN**: Global distribution for performance

### Backend Services
- **Cloudflare Workers**: Serverless functions for API proxying
- **Worker Domains**: Dedicated subdomains for each service
- **Environment Variables**: Secure configuration management
- **CORS Handling**: Cross-origin request management

## Prerequisites

### Required Accounts
- Cloudflare account with Workers and Pages access
- Domain name (optional, but recommended)
- Git repository access

### Development Environment
- Node.js 18+ 
- npm or yarn
- Wrangler CLI for Cloudflare Workers
- Git

### Setup Wrangler CLI
```bash
npm install -g wrangler
wrangler login
```

## Frontend Deployment

### 1. Build Configuration

#### Environment Variables
Create production environment file:
```bash
# .env.production
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_CLOUDFLARE_ZONE_ID=your-zone-id
VITE_ENVIRONMENT=production
```

#### Build Settings
```bash
# Build for production
npm run build

# Verify build output
npm run preview
```

### 2. Cloudflare Pages Deployment

#### Automatic Deployment (Recommended)
1. Connect Git repository to Cloudflare Pages
2. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node.js version: `18`

#### Build Configuration
```yaml
# Build settings in Cloudflare Pages
Build command: npm run build
Build output directory: dist
Root directory: /
Environment variables:
  NODE_VERSION: 18
  VITE_API_BASE_URL: https://api.yourdomain.com
```

#### Manual Deployment
```bash
# Install Wrangler CLI
npm install -g wrangler

# Build and deploy
npm run build
wrangler pages deploy dist --project-name russ-tools
```

### 3. Custom Domain Setup

#### DNS Configuration
```bash
# Add CNAME record
Type: CNAME
Name: www
Target: your-pages-domain.pages.dev

# Add A record for apex domain
Type: A
Name: @
Target: [Cloudflare IP addresses]
```

#### SSL/TLS Configuration
- Enable "Always Use HTTPS" in Cloudflare SSL/TLS settings
- Set SSL/TLS encryption mode to "Full" or "Full (strict)"
- Enable HTTP Strict Transport Security (HSTS)

## Backend Services Deployment

### 1. Cloudflare Workers Setup

#### Worker Configuration Structure
```
cloudflare-worker/
├── ssl.js              # SSL Certificate Checker API
├── tenant.js           # Microsoft Tenant Lookup API
├── whois.js            # WHOIS Lookup API
├── configs/
│   ├── wrangler-ssl.toml
│   ├── wrangler-tenant.toml
│   └── wrangler-whois.toml
```

#### Deploy SSL Worker
```bash
cd cloudflare-worker
wrangler deploy ssl.js --config configs/wrangler-ssl.toml
```

#### Deploy Tenant Worker
```bash
wrangler deploy tenant.js --config configs/wrangler-tenant.toml
```

#### Deploy WHOIS Worker
```bash
wrangler deploy whois.js --config configs/wrangler-whois.toml
```

### 2. Worker Configuration

#### SSL Worker Configuration
```toml
# configs/wrangler-ssl.toml
name = "ssl-russ-tools"
main = "ssl.js"
compatibility_date = "2024-01-01"

[env.production]
vars = { ENVIRONMENT = "production" }

[[routes]]
pattern = "ssl.yourdomain.com/*"
zone_name = "yourdomain.com"
```

#### Environment Variables
```bash
# Set secrets for workers
wrangler secret put SSL_LABS_API_KEY --config configs/wrangler-ssl.toml
wrangler secret put MICROSOFT_API_KEY --config configs/wrangler-tenant.toml
wrangler secret put WHOIS_API_KEY --config configs/wrangler-whois.toml
```

### 3. API Endpoint Configuration

#### Update Frontend API Configuration
Update `src/utils/api/apiConfig.json`:
```json
{
  "endpoints": {
    "ssl": {
      "url": "https://ssl.yourdomain.com/",
      "description": "SSL Certificate Checker API",
      "timeout": 30000,
      "retries": 2
    },
    "tenant": {
      "url": "https://tenant.yourdomain.com/",
      "description": "Microsoft Tenant Lookup API",
      "timeout": 15000,
      "retries": 2
    },
    "whois": {
      "url": "https://whois.yourdomain.com/",
      "description": "WHOIS Lookup API",
      "timeout": 10000,
      "retries": 2
    }
  }
}
```

## Monitoring and Analytics

### 1. Cloudflare Analytics
- Enable Cloudflare Web Analytics
- Configure Real User Monitoring (RUM)
- Set up custom events for tool usage

### 2. Performance Monitoring
```javascript
// Add to main.jsx
if (import.meta.env.PROD) {
  // Initialize performance monitoring
  import('./utils/analytics').then(({ initAnalytics }) => {
    initAnalytics();
  });
}
```

### 3. Error Tracking
```javascript
// Add global error handling
window.addEventListener('error', (event) => {
  // Log errors to monitoring service
  console.error('Global error:', event.error);
});
```

## Security Configuration

### 1. Content Security Policy
Add to `index.html`:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob:;
  connect-src 'self' https://*.yourdomain.com https://dns.google https://cloudflare-dns.com;
  font-src 'self' https://fonts.gstatic.com;
">
```

### 2. Security Headers
Configure in Cloudflare:
```yaml
# _headers file for Cloudflare Pages
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### 3. Rate Limiting
Configure in Workers:
```javascript
// Add to worker code
const rateLimiter = new Map();

export default {
  async fetch(request) {
    const clientIP = request.headers.get('CF-Connecting-IP');
    const key = `rate_limit:${clientIP}`;
    
    // Implement rate limiting logic
    if (rateLimiter.has(key)) {
      const requests = rateLimiter.get(key);
      if (requests >= 100) {
        return new Response('Rate limit exceeded', { status: 429 });
      }
    }
    
    // Continue with request processing
  }
};
```

## Performance Optimization

### 1. Build Optimization
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
         vendor: ['react', 'react-dom'],
          networking: ['netmask'],
          crypto: ['jose', 'jwt-decode'],
          utils: ['js-yaml', '@iarna/toml']
        }
      }
    }
  }
});
```

### 2. Caching Strategy
```javascript
// Add to worker configuration
const cache = caches.default;

export default {
  async fetch(request) {
    const cacheKey = new Request(request.url, request);
    let response = await cache.match(cacheKey);
    
    if (!response) {
      response = await fetch(request);
      // Cache for 1 hour
      response.headers.set('Cache-Control', 'public, max-age=3600');
      await cache.put(cacheKey, response.clone());
    }
    
    return response;
  }
};
```

### 3. Asset Optimization
```bash
# Optimize images
npm install -g imagemin-cli
imagemin public/assets/*.png --out-dir=public/assets/optimized

# Compress assets
gzip -k dist/assets/*.js
gzip -k dist/assets/*.css
```

## Deployment Scripts

### 1. Automated Deployment
Create `scripts/deploy.sh`:
```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Build frontend
echo "📦 Building frontend..."
npm run build

# Deploy workers
echo "☁️ Deploying workers..."
cd cloudflare-worker
wrangler deploy ssl.js --config configs/wrangler-ssl.toml
wrangler deploy tenant.js --config configs/wrangler-tenant.toml
wrangler deploy whois.js --config configs/wrangler-whois.toml
cd ..

# Deploy frontend
echo "🌐 Deploying frontend..."
wrangler pages deploy dist --project-name russ-tools

echo "✅ Deployment completed!"
```

### 2. Staging Deployment
```bash
# Deploy to staging environment
VITE_ENVIRONMENT=staging npm run build
wrangler pages deploy dist --project-name russ-tools-staging
```

## Rollback Procedures

### 1. Frontend Rollback
```bash
# Rollback to previous Pages deployment
wrangler pages deployment list --project-name russ-tools
wrangler pages deployment rollback [DEPLOYMENT_ID] --project-name russ-tools
```

### 2. Worker Rollback
```bash
# Deploy previous worker version
wrangler rollback [WORKER_NAME] --version-id [VERSION_ID]
```

## Health Checks

### 1. Automated Health Checks
```javascript
// Add to worker
export default {
  async fetch(request) {
    if (request.url.endsWith('/health')) {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Handle other requests
  }
};
```

### 2. Monitoring Setup
```bash
# Monitor endpoints
curl -f https://ssl.yourdomain.com/health
curl -f https://tenant.yourdomain.com/health
curl -f https://whois.yourdomain.com/health
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Worker Deployment Issues
```bash
# Check worker logs
wrangler tail [WORKER_NAME]

# Debug worker locally
wrangler dev [WORKER_FILE]
```

#### SSL/TLS Issues
```bash
# Check SSL configuration
curl -I https://yourdomain.com
openssl s_client -connect yourdomain.com:443
```

### Performance Issues
```bash
# Analyze bundle size
npm run build -- --analyze

# Check Core Web Vitals
lighthouse https://yourdomain.com --only-categories=performance
```

## Maintenance

### 1. Regular Updates
- Update dependencies monthly
- Monitor security advisories
- Review and update CSP headers
- Audit third-party integrations

### 2. Backup Strategy
- Git repository serves as source backup
- Database exports (if applicable)
- Configuration backups

### 3. Documentation Updates
- Keep deployment documentation current
- Document configuration changes
- Maintain runbooks for common procedures

## Support and Monitoring

### 1. Logging Strategy
```javascript
// Structured logging in workers
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  message: 'API request processed',
  requestId: request.headers.get('cf-ray'),
  clientIP: request.headers.get('cf-connecting-ip')
}));
```

### 2. Alerting Setup
- Configure Cloudflare alerts for error rates
- Set up uptime monitoring
- Monitor performance metrics

### 3. Incident Response
- Establish escalation procedures
- Document common resolution steps
- Maintain emergency contact list

This deployment guide provides a comprehensive framework for deploying and maintaining the RussTools application with high availability, security, and performance.