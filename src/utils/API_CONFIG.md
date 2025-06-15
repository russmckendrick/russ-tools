# API Configuration System

This document describes the centralized API configuration system for RussTools.

## Overview

The API configuration system centralizes all external API endpoints used by the tools into a single configuration file (`apiConfig.json`) with utility functions to access them consistently.

## Files

- `src/utils/apiConfig.json` - Main configuration file containing all API endpoints
- `src/utils/apiUtils.js` - Utility functions for accessing API configurations
- `src/utils/index.js` - Exports API utilities for easy importing

## Configuration Structure

### apiConfig.json

```json
{
  "endpoints": {
    "service_name": {
      "url": "https://api.example.com/",
      "description": "Service description",
      "timeout": 10000,
      "retries": 2
    }
  },
  "defaults": {
    "timeout": 10000,
    "retries": 2,
    "headers": {
      "Accept": "application/json",
      "User-Agent": "RussTools/1.0"
    }
  }
}
```

### Current Endpoints

- **tenant** - Microsoft Tenant Lookup API (`https://tenant.russ.tools/`)
- **ssl** - SSL Certificate Checker API (`https://ssl.russ.tools/`)
- **whois** - WHOIS Lookup API (`https://whois.russ.tools/`)
- **dns** - DNS over HTTPS providers (Google, Cloudflare)
- **external** - Third-party APIs (HackerTarget, Azure Portal)

## Usage

### Basic Usage

```javascript
import { getApiEndpoint, buildApiUrl, apiFetch } from '../../../utils/apiUtils';

// Get endpoint configuration
const sslConfig = getApiEndpoint('ssl');

// Build URL with parameters
const apiUrl = buildApiUrl(sslConfig.url, { domain: 'example.com' });

// Make API call with retry logic
const response = await apiFetch(apiUrl, {
  method: 'GET',
  headers: {
    ...sslConfig.headers,
    'Accept': 'application/json'
  }
});
```

### Multi-Provider Endpoints

For services with multiple providers (like DNS):

```javascript
// Get specific provider
const googleDns = getApiEndpoint('dns', 'google');
const cloudflareDns = getApiEndpoint('dns', 'cloudflare');
```

### Available Functions

- `getApiEndpoint(service, provider?)` - Get endpoint configuration
- `getAllApiEndpoints()` - Get all endpoint configurations
- `getApiDefaults()` - Get default configuration
- `buildApiUrl(baseUrl, params)` - Build URL with query parameters
- `apiFetch(url, options, retries?)` - Fetch with retry logic

## Benefits

1. **Centralized Configuration** - All API endpoints in one place
2. **Easy Updates** - Change URLs without touching component code
3. **Consistent Error Handling** - Built-in retry logic and error handling
4. **Type Safety** - Structured configuration prevents typos
5. **Environment Support** - Easy to switch between dev/prod endpoints
6. **Monitoring** - Centralized logging and debugging

## Adding New Endpoints

1. Add the endpoint to `apiConfig.json`:
```json
{
  "endpoints": {
    "new_service": {
      "url": "https://api.newservice.com/",
      "description": "New service API",
      "timeout": 15000,
      "retries": 3
    }
  }
}
```

2. Use in your component:
```javascript
import { getApiEndpoint, buildApiUrl, apiFetch } from '../../../utils/apiUtils';

const newServiceConfig = getApiEndpoint('new_service');
const response = await apiFetch(newServiceConfig.url);
```

## Migration Notes

All tools have been updated to use this system:
- SSL Checker Tool
- Tenant Lookup Tool  
- WHOIS Lookup Tool
- DNS Lookup Tool
- Microsoft Portals Tool

The old hardcoded URLs have been replaced with configuration-based calls. 