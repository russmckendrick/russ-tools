# Cloudflare Workers

Three of the twenty-four tools need a server: SSL analysis, WHOIS/RDAP and Microsoft tenant
discovery cannot be done from a browser. Each is a small Cloudflare Worker that proxies a
public upstream and adds CORS. DNS and BGP tools call their named public data providers
directly; they do not use these Workers.

This document is written from the worker sources in `cloudflare-worker/` and the wrangler
configs in `cloudflare-worker/configs/`. It describes what the code does, not what it
could do — there is **no KV, no Durable Object, no D1 binding, no rate limiting and no API
key** in any of the four workers or their configs.

## Inventory

| Source | Worker name | Custom domain | Called by |
|---|---|---|---|
| `ssl.js` | `ssl-checker` | `ssl.russ.tools` | SSL Certificate Checker |
| `whois.js` | `whois-lookup` | `whois.russ.tools` | WHOIS Lookup |
| `tenant.js` | `microsoft-tenant-lookup` | `tenant.russ.tools` | Tenant Lookup, Microsoft Portals |
| `buzzwords.js` | `buzzword-generator` | `buzzwords.russ.tools` | nothing in this repository |

Each config declares a single `custom_domain` route and nothing else. There are no
environments, no staging variants and no `[vars]` blocks — every value the workers read is
a secret set with `wrangler secret put`.

The client side of the first three is `src/utils/api/apiConfig.json`, which gives each a
URL, a timeout and a retry count, and `src/core/api.js` (`apiFetch`/`buildUrl`), which
applies them. Tools import the endpoint and call it directly; there is no shared API
wrapper beyond that.

```json
"ssl":    { "url": "https://ssl.russ.tools/",    "timeout": 15000, "retries": 2 },
"whois":  { "url": "https://whois.russ.tools/",  "timeout": 10000, "retries": 2 },
"tenant": { "url": "https://tenant.russ.tools/", "timeout": 10000, "retries": 2 }
```

`buzzwords.js` has no caller: Buzzword Ipsum generates its text in the browser from
`src/tools/buzzword-ipsum/data/buzzwords.json`.

## Origin handling

`ssl.js`, `whois.js` and `tenant.js` share the same shape, copied three times rather than
factored out.

`ALLOWED_ORIGINS` is a required secret: a comma-separated list, split and trimmed on every
request. If it is missing the worker returns **500** with
`{"error":"Configuration error: …"}` and no CORS headers.

The check runs before anything else, including the `OPTIONS` preflight:

1. If the `Origin` header exactly matches an entry, the request is allowed.
2. Otherwise, if the `Referer` header *starts with* an allowed origin, the request is
   allowed. This is a prefix test, so `https://russ.tools.example.com/` matches an allowed
   `https://russ.tools`.
3. Otherwise the worker returns **403**.

Only `GET` and `OPTIONS` are accepted; anything else is **405**.

Behaviour of the 403 differs between the three, which matters because it decides whether
the browser can read the error at all:

| | 403 carries CORS headers? | Effect in the browser |
|---|---|---|
| `ssl.js` | yes | the JSON error body is readable |
| `whois.js` | no | surfaces as a network/CORS failure |
| `tenant.js` | no | surfaces as a network/CORS failure |

The success-path CORS headers also differ. All three reflect the request origin when it is
allowed. `ssl.js` and `whois.js` otherwise fall back to the *first* entry in
`ALLOWED_ORIGINS`; `whois.js` additionally falls back to `*` if reading the secret throws.
`tenant.js` sets no `Access-Control-Allow-Origin` at all for a non-matching origin, and
adds `Access-Control-Allow-Credentials: true` when it does match.

`buzzwords.js` does not use `ALLOWED_ORIGINS`. Its allowlist is hard-coded in the source
(`https://russ.tools`, `https://www.russ.tools`, `http://localhost:5173`,
`http://localhost:3000`) and a non-matching origin is answered with
`Access-Control-Allow-Origin: https://russ.tools` rather than refused.

## SSL Checker — `ssl.russ.tools`

```
GET /?domain=example.com
```

`domain` is required (**400** if absent) and is stripped of any scheme and path before use.

Secrets: `ALLOWED_ORIGINS`, `SSL_LABS_EMAIL`, `SSL_LABS_USER_AGENT`. The last two are
required by `getSSLLabsConfig`; a missing one throws and the request falls through to the
fallback path below. There is no SSL Labs API key — the email and user agent are sent as
the `User-Agent` header on requests to `https://api.ssllabs.com/api/v4`.

Flow:

1. `GET /info` on SSL Labs, to confirm the service is up.
2. `GET /analyze?host=…&publish=off&fromCache=on&maxAge=24&all=done`. If that returns
   `status: READY` with endpoints, up to three ready endpoints are enriched with
   `getEndpointData` and the result is returned.
3. Otherwise `GET /analyze?host=…&publish=off&startNew=on&all=done` starts a fresh
   assessment. The worker does **not** poll; it returns the in-progress state immediately.
4. If SSL Labs fails entirely, `https://api.hackertarget.com/sslcheck/?q=<domain>` is tried
   and its text output parsed into the same shape.
5. If that also fails, the worker performs a `HEAD` request to `https://<domain>` from the
   edge and returns a minimal result with `apiSource: 'Cloudflare Worker Basic Check'` and
   grade `T`.

The response is always 200 JSON, reshaped from SSL Labs rather than passed through:

```json
{
  "host": "example.com",
  "status": "READY | IN_PROGRESS | DNS | ERROR",
  "statusMessage": "SSL Labs analysis completed",
  "assessmentProgress": { "totalEndpoints": 2, "readyEndpoints": 2,
                          "inProgressEndpoints": 0, "pendingEndpoints": 0,
                          "completionPercentage": 100, "estimatedTimeRemaining": 0 },
  "startTime": 0, "testTime": 0,
  "endpoints": [ { "ipAddress": "…", "grade": "A+", "isComplete": true,
                   "details": { "cert": { "…": "…", "daysUntilExpiry": 61 },
                                "protocols": [], "suites": { "list": [] } } } ],
  "certs": [],
  "apiCheck": true,
  "apiSource": "SSL Labs API v4 (via Cloudflare Worker)",
  "timestamp": 0,
  "pollInfo": { "shouldPoll": true, "recommendedInterval": 10, "nextPollTime": 0 }
}
```

`pollInfo` is added by the worker and only when a new assessment was started.
`recommendedInterval` is 5 seconds while the status is `DNS`, and between 10 and 30
seconds while `IN_PROGRESS`, derived from the endpoints' own ETAs. The client honours it in
`src/tools/ssl-checker/lib/sslApi.js`, which polls the same URL up to twelve times, capping
the wait at 10 seconds. Endpoint detail beyond the certificate, protocols and cipher suites
— the vulnerability flags, HSTS policy, named groups and so on — is only included for
endpoints whose `statusMessage` is `Ready`.

Successful responses carry `Cache-Control: public, max-age=300`. That is the entirety of
the worker's caching: five minutes in the browser and at the edge, no stored state.

On an unhandled error the worker returns **500** with `error`, **`stack`** and `timestamp`.

## WHOIS — `whois.russ.tools`

```
GET /?query=example.com
GET /?query=8.8.8.8&type=ip
```

`query` is required (**400** if absent). `type` accepts `domain` or `ip`; when omitted the
worker decides by regex — IPv4 with octet-range validation, or a simplified full-form IPv6
pattern. Secret: `ALLOWED_ORIGINS` only.

Domains are resolved over **RDAP**, not the WHOIS protocol. The IANA bootstrap file
`https://data.iana.org/rdap/dns.json` is fetched, held in a module-level variable for 24
hours (per isolate — this is not shared storage, and a cold isolate refetches), and used
both to find the effective TLD (multi-part TLDs such as `co.uk` are matched against the
bootstrap's own TLD set) and the RDAP base URL for it. The worker then requests
`<rdap-base>/domain/<domain>`. A 404 from the registry is turned into a synthetic
`status: ['not found']` RDAP object rather than an error.

IP lookups query `https://ipinfo.io/<ip>/json` and `http://ip-api.com/json/<ip>?fields=…`
in turn, keeping whatever succeeds. Neither is authenticated.

Both shapes return 200 with the same envelope:

```json
{
  "query": "example.com",
  "type": "domain | ip",
  "timestamp": 0,
  "status": "success | failed",
  "data": { "rdap": {} },
  "sources": [ { "name": "rdap", "service": "…", "tld": "com",
                 "status": "success", "timestamp": 0 } ],
  "normalized": {}
}
```

`normalized` is the worker's own flattening — for domains: `domain`, `status`, `events`,
`entities`, `nameservers`, `registrar`, `created`, `updated`, `expires`; for IPs:
`ip`, `location`, `network`, `organization`, `security`, preferring ipinfo.io and filling
gaps from ip-api.com. A failed lookup still returns 200, with `status: 'failed'` and an
`error` string. Unhandled errors return **500** with `error` and `details`.

## Microsoft Tenant Lookup — `tenant.russ.tools`

```
GET /?domain=example.com
```

`domain` is required (**400** if absent). An email address is accepted and reduced to its
domain, then validated against a domain regex; a failure is **400** with
`{"error":"Invalid domain format","domain":"…"}`.

Secrets: `ALLOWED_ORIGINS` (required) and, optionally, `GRAPH_CLIENT_ID`,
`GRAPH_CLIENT_SECRET` and `GRAPH_TENANT_ID`. When all three are present the worker fetches
a client-credentials token for `https://graph.microsoft.com/.default` and calls
`findTenantInformationByDomainName`; when any is missing the Graph step is skipped and the
lookup proceeds on the unauthenticated sources alone.

Sources tried, in order, with every success recorded:

- Microsoft Graph `tenantRelationships/findTenantInformationByDomainName` (authenticated)
- `login.microsoftonline.com/GetUserRealm.srf?login=test@<domain>`
- `login.microsoftonline.com/common/GetCredentialType` (POST)
- `login.microsoftonline.com/<domain>/.well-known/openid_configuration`
- `login.microsoftonline.com/<domain>/v2.0/.well-known/openid_configuration`
- `odc.officeapps.live.com/odc/v2.1/federationprovider?domain=<domain>`

The first result carrying a `tenantId` or `domain` becomes the base of the response. If a
tenant ID was found, the worker additionally fetches the OpenID configuration for that
tenant ID and `GetUserRealm.srf?login=admin@<domain>`. It then runs a DNS pass over
Cloudflare DoH (`https://cloudflare-dns.com/dns-query`) for MX and TXT records, flagging
`mail.protection.outlook.com` and `include:spf.protection.outlook.com`.

Success is 200 with:

```json
{
  "success": true,
  "domain": "example.com",
  "timestamp": 0,
  "tenantId": "…", "displayName": "…", "method": "Office 365 Federation Provider",
  "tenantType": "AAD",
  "tenantCategory": "Microsoft 365 Tenant | Custom Domain",
  "isCloudOnly": true,
  "apiResults": {},
  "openIdConfig": {},
  "userRealm": {},
  "dnsInfo": { "hasExchangeOnline": true, "hasOffice365SPF": true,
               "mxRecords": [], "txtRecords": [] }
}
```

Failure is also 200, with `success: false`, an `error` string and a `suggestions` array;
the client (`src/tools/tenant-lookup/island.jsx`) checks `success` rather than the status
code. Unhandled errors are **500** with `error` and `message`.

Two things in the source are inert and should not be taken as behaviour: `KNOWN_TENANTS`
is an empty object, and `_ENHANCED_APIS` — including the Autodiscover SOAP request — is
never read by any code path.

## Buzzword generator — `buzzwords.russ.tools`

Routed by path, unlike the other three:

| Path | Method | Parameters |
|---|---|---|
| `/health` | GET | — |
| `/generate` | GET, POST | `count` (1–50, default 1), `type` (`phrase`, `sentences`, `paragraphs`, `adverbs`, `adjectives`, `nouns`, `verbs`) |
| `/words` | GET | `type` (optional), `count` (1–100, default 10) |

Anything else is **404**. `/generate` accepts parameters as a query string on GET or a JSON
body on POST. Responses are 200 with `success`, `timestamp`, `type`, `count` and `data`,
and carry `Cache-Control: public, max-age=300` (`/words`: 1800). It reads no environment
variables at all.

Two caveats, both verifiable in the source:

- The file header and the `/health` payload (`services.rateLimit: "operational"`) claim
  rate limiting. There is none — no counter, no binding, no storage.
- Its import path pointed at `../src/components/tools/buzzword-ipsum/data/buzzwords.json`,
  which was deleted when the tools moved to `src/tools/<id>/`. A deploy from source would
  have failed to bundle. Corrected to `../src/tools/buzzword-ipsum/data/buzzwords.json`;
  the deployed worker predates the move and is unaffected until it is next deployed.

## Logging

All four workers log to `console`, which means Cloudflare's live tail and any log push
destination configured on the account. Some of it is more than an operator needs:

- `ssl.js` logs `Object.keys(env)` on every request, and logs the resolved SSL Labs config
  including the value of `SSL_LABS_EMAIL` and `SSL_LABS_USER_AGENT`.
- `ssl.js` logs the entire SSL Labs response, pretty-printed, for every parse.
- `ssl.js` returns `error.stack` in the body of its 500 responses, so internals are exposed
  to the caller as well as the log.
- `tenant.js` logs the full `ALLOWED_ORIGINS` list on every request.
- `whois.js` and `tenant.js` log every domain and IP looked up, which is user-supplied
  query data on a site that otherwise processes everything in the browser.

None of this is required for the workers to function. It is recorded here because the
privacy claim made elsewhere in these docs is about the client, and the logs are the one
place a lookup leaves a trace.

## Deploying

`wrangler` is not a dependency of this project; invoke it with `pnpm dlx`. Each worker is
deployed with its own config, from the repository root:

```bash
pnpm dlx wrangler login

pnpm dlx wrangler deploy --config cloudflare-worker/configs/wrangler-ssl.toml
pnpm dlx wrangler deploy --config cloudflare-worker/configs/wrangler-whois.toml
pnpm dlx wrangler deploy --config cloudflare-worker/configs/wrangler-tenant.toml
pnpm dlx wrangler deploy --config cloudflare-worker/configs/wrangler-buzzwords.toml
```

Secrets are set per worker, and the same way:

```bash
pnpm dlx wrangler secret put ALLOWED_ORIGINS \
  --config cloudflare-worker/configs/wrangler-ssl.toml
```

`ssl-checker` additionally needs `SSL_LABS_EMAIL` and `SSL_LABS_USER_AGENT`;
`microsoft-tenant-lookup` optionally takes `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET` and
`GRAPH_TENANT_ID`. `buzzword-generator` needs none.

There is no CI deployment for the workers — they are deployed by hand, independently of the
site, and a change to one does not require a site build. Rollback is
`pnpm dlx wrangler rollback --config <config>`.

## Testing without deploying

`src/test/msw/handlers.js` holds captured responses from all three lookup workers, in
`src/test/fixtures/workers/`, taken with `Origin: https://russ.tools`. Unit tests run
against those, so worker behaviour can be exercised without network access or a deployment.
