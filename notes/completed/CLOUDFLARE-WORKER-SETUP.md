# SSL Checker Cloudflare Worker Setup

This Cloudflare Worker acts as a proxy for SSL certificate checking, solving CORS issues and providing access to SSL Labs API.

## 🚀 Quick Deployment

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Deploy the Worker
```bash
wrangler deploy
```

### 4. Update Your App
After deployment, update the `WORKER_URL` in your SSL checker component:
```javascript
const WORKER_URL = 'https://ssl-checker.your-username.workers.dev';
```
Replace `your-username` with your actual Cloudflare username.

## 🔧 Configuration

### Optional: SSL Labs Registration
To get full SSL Labs functionality:

1. Register at [SSL Labs API](https://www.ssllabs.com/ssltest/)
2. Update the worker configuration:
```javascript
const SSL_LABS_CONFIG = {
  baseUrl: 'https://api.ssllabs.com/api/v3',
  userAgent: 'YourApp/1.0 (your-email@domain.com)'
};
```

### Environment Variables
You can set environment variables via Wrangler:
```bash
wrangler secret put SSL_LABS_USER_AGENT
```

## 📡 API Usage

The worker exposes a simple API:

```
GET https://ssl-checker.your-username.workers.dev?domain=example.com
```

Response format:
```json
{
  "host": "example.com",
  "status": "READY",
  "endpoints": [{
    "grade": "A+",
    "statusMessage": "SSL Labs analysis completed",
    "hasWarnings": false,
    "details": {
      "cert": {
        "subject": "CN=example.com",
        "issuerSubject": "CN=DigiCert",
        "notBefore": 1640995200000,
        "notAfter": 1672531200000
      }
    }
  }],
  "apiSource": "SSL Labs (via Cloudflare Worker)",
  "timestamp": 1640995200000
}
```

## 🔄 Fallback Strategy

The worker tries multiple SSL checking services:
1. **SSL Labs API** (primary - requires registration for full features)
2. **HackerTarget SSL Check** (fallback)
3. **Basic Cloudflare SSL Check** (final fallback)

## 🛡️ Security Features

- ✅ CORS headers configured for browser access
- ✅ Rate limiting friendly (5-minute cache)
- ✅ Error handling and graceful fallbacks
- ✅ Input validation and domain cleaning

## 📊 Monitoring

Check your worker logs in the Cloudflare dashboard:
1. Go to **Workers & Pages**
2. Select your **ssl-checker** worker
3. Click **Logs** to see real-time activity

## 🚨 Troubleshooting

### Worker not responding?
- Check the worker is deployed: `wrangler list`
- Verify the URL in your app matches the deployed worker
- Check the Cloudflare dashboard for errors

### SSL Labs not working?
- Ensure you've registered with SSL Labs
- Update the `userAgent` in the worker configuration
- Check worker logs for specific SSL Labs errors

### CORS errors?
- Verify the worker has proper CORS headers
- Ensure your app is calling the correct worker URL
- Check browser dev tools for specific CORS messages

## 💡 Benefits of This Approach

- **🌐 No CORS Issues**: Server-side requests bypass browser restrictions
- **🏆 Full SSL Labs Access**: Complete industry-standard SSL analysis
- **⚡ Fast & Cached**: 5-minute caching reduces API calls
- **🔄 Automatic Fallbacks**: Multiple SSL checking services
- **📈 Scalable**: Serverless architecture handles any load
- **🆓 Cost Effective**: Cloudflare Workers free tier is generous

## 🔗 Integration

Once deployed, your SSL checker will:
1. Try the Cloudflare Worker first (best results)
2. Fall back to direct API calls if worker fails
3. Finally use browser-based checks as last resort

This gives you the **best of all worlds** - industry-standard SSL analysis when possible, with graceful degradation for reliability! 🎯 