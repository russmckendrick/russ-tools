# API configuration

Where the tools' network endpoints are declared, and how they are called.

## Files

| File | Role |
|---|---|
| `src/utils/api/apiConfig.json` | Every endpoint a tool calls, with its timeout and retry count |
| `src/core/api.js` | `apiFetch`, `apiJson`, `buildUrl`, `ApiError` — the one HTTP client |
| `functions/api/*.js` | The site's own lookup API, which four of the endpoints point at |

There is no wrapper beyond that: a tool imports the JSON, picks its endpoint and calls
`apiFetch`. (`src/utils/apiUtils.js`, `getApiEndpoint` and `buildApiUrl`, which an earlier
version of this document described, were deleted at the cutover.)

## `apiConfig.json`

```json
{
  "endpoints": {
    "tenant": { "url": "/api/tenant", "timeout": 10000, "retries": 2 },
    "ssl":    { "url": "/api/ssl",    "timeout": 15000, "retries": 2 },
    "whois":  { "url": "/api/whois",  "timeout": 10000, "retries": 2 },
    "headers": { "url": "/api/headers", "timeout": 12000, "retries": 1 },
    "dns": {
      "google": "https://dns.google/resolve",
      "cloudflare": "https://1.1.1.1/dns-query",
      "timeout": 8000,
      "retries": 1
    },
    "external": { "azure_portal": "https://portal.azure.com", "timeout": 10000, "retries": 1 }
  },
  "defaults": { "timeout": 10000, "retries": 2, "headers": { "Accept": "application/json" } }
}
```

| Key | What it is | Called by |
|---|---|---|
| `tenant` | The site's own API, `/api/tenant` | `tenant-lookup`, `microsoft-portals` |
| `ssl` | The site's own API, `/api/ssl` | `ssl-checker` |
| `whois` | The site's own API, `/api/whois` | `whois-lookup` |
| `headers` | The site's own API, `/api/headers` | `http-headers` |
| `dns` | Public DNS-over-HTTPS resolvers, called directly from the browser | `src/core/dns.js` |
| `external` | A base URL for building portal links; nothing is fetched from it | `microsoft-portals` |

### The four `/api/*` endpoints are root-relative on purpose

They are served by the same Cloudflare Pages project as the pages (Pages Functions in
`functions/api/`), so a relative path is the whole address: production, `www`, every
preview deployment and local development each call their own origin with no per-environment
configuration. They accept same-origin requests only and send no CORS headers, so **an
absolute URL to another origin here would not work** — the API would answer 403. The access
model, the secrets and the response shapes are in
[`../cloudflare-workers/README.md`](../cloudflare-workers/README.md).

`headers` has a 12-second timeout because the function itself gives up after eight, and one
retry because a refused target is a 400, which is never retried anyway.

`src/tools/agent-discovery.test.js` pins these four values to `/api/<name>`, to a function
file of the same name, and to the published API catalog.

## Calling an endpoint

```javascript
import { apiFetch, buildUrl } from '@/core';
import apiConfig from '@/utils/api/apiConfig.json';

const WHOIS = apiConfig.endpoints.whois;

const response = await apiFetch(buildUrl(WHOIS.url, { query }), {
  headers: { Accept: 'application/json' },
  timeout: WHOIS.timeout,
  retries: WHOIS.retries,
  signal,
});
const data = await response.json();
```

`buildUrl(base, params)` appends query parameters, skipping `null`, `undefined` and `''`.
An absolute base is returned absolute. A root-relative base (`/api/whois`) is resolved
against `location.origin` when there is a page, and returned relative when there is not
(a unit test in the node environment).

`apiFetch(url, options)`:

- applies `timeout` per attempt with an `AbortController`, and honours a caller's `signal`;
- retries `retries` more times, with doubling backoff, on 408, 425, 429, 5xx and transport
  failures only — **a 4xx is an answer and is never retried**, which includes the API's 403;
- throws `ApiError` (`status`, `url`, `body`; `isTransport` when no status was ever seen)
  for anything that is not 2xx.

`apiJson(url, options)` is `apiFetch` plus JSON parsing.

## Adding an endpoint

1. Add it to `apiConfig.json` with a `url`, `timeout` and `retries`.
2. Import the JSON in the tool and call it as above.
3. If it is a third-party API called from the browser, it must send CORS headers for the
   site's origin; if it cannot, it needs a function in `functions/api/` — read the
   workers README first, and add its upstream to the tool's privacy note.

## Local development

`pnpm dev` proxies `/api` to a locally running `pnpm dev:api` (`wrangler pages dev`), so the
relative paths resolve there too. See
[`../DEVELOPMENT.md`](../DEVELOPMENT.md#the-lookup-api-locally).
