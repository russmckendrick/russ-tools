# The lookup API and the Cloudflare Workers

Three of the twenty-four tools need a server: SSL analysis, WHOIS/RDAP and Microsoft tenant
discovery cannot be done from a browser. DNS and BGP tools call their named public data
providers directly and use none of this.

Since 2026-11-14 the three lookups are served by the site itself, as **Cloudflare Pages
Functions** at `/api/ssl`, `/api/whois` and `/api/tenant`. They deploy with the site, need
no CORS because the pages that call them are the same origin, and run locally under
`wrangler pages dev`.

The three standalone Workers they were ported from (`ssl.russ.tools`, `whois.russ.tools`,
`tenant.russ.tools`) were **retired on 2026-11-14** — see
[Retired standalone workers](#retired-standalone-workers). Those hostnames no longer
resolve.

There is **no KV, no Durable Object, no D1 binding and no API key** anywhere in this, and
no rate limiting in the code — see [Abuse and rate limiting](#abuse-and-rate-limiting).

## Layout

| Path | What it is |
|---|---|
| `functions/api/ssl.js` | `/api/ssl` — SSL Labs proxy with fallbacks |
| `functions/api/whois.js` | `/api/whois` — RDAP for domains, ipinfo.io + ip-api.com for IPs |
| `functions/api/tenant.js` | `/api/tenant` — Microsoft tenant discovery |
| `functions-lib/http.js` | the shared guard (origin check, method check) and JSON helper |
| `src/test/functions/` | Vitest: the guard, and each handler held to the captured production responses |
| `e2e/api.spec.js` | Playwright: routing, same-origin access and cross-origin refusal through the Pages runtime |
| `.dev.vars.example` | names of the local secrets; copy to the gitignored `.dev.vars` |
| `cloudflare-worker/` | the legacy standalone workers and their wrangler configs, plus `buzzwords.js` |

Pages turns every file under `functions/` into a route, which is why the shared module
lives in `functions-lib/` instead: importing from outside `functions/` is the documented
way to share code without creating a route. On build Pages generates a `_routes.json`
whose `include` is exactly `/api/whois`, `/api/tenant` and `/api/ssl`, so **only those
three paths invoke a Function** — every page and asset is still served as a free static
request, and the `_redirects` rewrites for the param deep links are unaffected (`_redirects`
is not applied to requests a Function serves, and no rule in it matches `/api/*`).

There is deliberately **no `wrangler.toml` for the Pages project**. Adding one with
`pages_build_output_dir` makes that file the source of truth and locks the same settings in
the dashboard; the project's build settings and secrets live in the dashboard, and should
stay there.

The client side is `src/utils/api/apiConfig.json`, which gives each endpoint a path, a
timeout and a retry count, and `src/core/api.js` (`apiFetch`/`buildUrl`), which applies
them. `buildUrl` resolves a root-relative base against the page's origin.

```json
"ssl":    { "url": "/api/ssl",    "timeout": 15000, "retries": 2 },
"whois":  { "url": "/api/whois",  "timeout": 10000, "retries": 2 },
"tenant": { "url": "/api/tenant", "timeout": 10000, "retries": 2 }
```

## Who can call it

**The honest version first: an API that a browser calls cannot be made private.** Whatever
the page can send, a script can send. What is implemented is everything that is real, and
no more:

1. **No CORS headers, on any response.** A page on another site can cause a request to be
   sent, but its JavaScript cannot read the status, the headers or the body. A cross-origin
   preflight gets a 403 with no `Access-Control-*` headers, so the browser never sends the
   real request.
2. **`Sec-Fetch-Site` must be `same-origin` when present.** Every current browser attaches
   this header and page script cannot set or remove it. `cross-site`, `same-site` (a
   sibling subdomain) and `none` (the URL typed into the address bar) are all refused.
3. **`Origin` must be the site's own when present.** "The site's own" is the origin of the
   request URL itself, so production, `www` and every preview deployment each accept
   exactly themselves with no list to maintain — there is no `ALLOWED_ORIGINS` secret.
4. **`GET` only.** Anything else is 405.

A refused request gets **403** `{"error":"Forbidden: this API only accepts same-origin
requests from the site"}` before any upstream is contacted.

What this does and does not achieve:

- It **does** stop another website from using the API through its visitors' browsers, and
  from reading it at all.
- It **does not** stop a non-browser client. `curl`, a script or a server can send
  `Sec-Fetch-Site: same-origin`, or simply send neither header — a request with no fetch
  metadata is let through, because older browsers send none. **These headers are forgeable
  outside a browser and nothing here claims otherwise.**
- The control for that kind of abuse is rate limiting, below — not the origin check.

### Local development

Under `wrangler pages dev` the function's own URL is on a loopback host (`localhost`,
`127.0.0.1` or `[::1]`). In that case, and only in that case, an `Origin` that is also a
loopback host on any port is accepted, so `astro dev` on `:4321` can proxy to wrangler on
`:8788`. The allowance is decided from the URL the runtime itself reports, not from a
configured list: a deployed function is never reached on a loopback hostname, so there is
no localhost entry that ships to production and nothing to remember to remove.
`Sec-Fetch-Site` is still enforced locally.

See [`docs/DEVELOPMENT.md`](../DEVELOPMENT.md#the-lookup-api-locally) for the two-terminal
workflow.

## Abuse and rate limiting

Each call fans out to third parties on the site's behalf — SSL Labs under the site's
registered user agent, Microsoft Graph under the site's app registration — so the realistic
abuse is someone scripting the API to spend those quotas. The code has no counter and no
storage, and should not grow one: **Cloudflare's rate limiting rules are the control.**

Create a rule on the `russ.tools` zone (Security → WAF → Rate limiting rules) matching
`starts_with(http.request.uri.path, "/api/")`, counting by IP, with a block action. A
person using the tools makes a handful of requests a minute; the SSL checker polls at most
once every five seconds while an assessment runs. Something in the region of 30 requests
per minute per IP leaves room for that and stops a loop.

Two limits of that control, stated plainly:

- A zone rule covers the custom domain only. The project's `*.pages.dev` hostnames
  (production alias and every preview) serve the same functions and are **not** behind the
  zone's WAF. If that matters, put the preview deployments behind Cloudflare Access, or
  leave the secrets out of the Preview environment so previews run the unauthenticated
  fallbacks only.
- Rate limiting slows abuse; it does not identify callers. There is still no API key.

## Secrets

Set on the Pages project (Settings → Variables and Secrets), separately for the
**Production** and **Preview** environments, as encrypted secrets:

| Name | Used by | If missing |
|---|---|---|
| `SSL_LABS_EMAIL` | `/api/ssl` | SSL Labs is skipped; falls back to HackerTarget, then a basic check, and says so in `statusMessage` |
| `SSL_LABS_USER_AGENT` | `/api/ssl` | as above — both are required together |
| `GRAPH_CLIENT_ID` | `/api/tenant` | Graph is skipped; no tenant ID, public endpoints only |
| `GRAPH_CLIENT_SECRET` | `/api/tenant` | as above — all three are required together |
| `GRAPH_TENANT_ID` | `/api/tenant` | as above |

`/api/whois` needs nothing. `ALLOWED_ORIGINS` is **not** read by the functions and must not
be added to the Pages project.

**`SSL_LABS_EMAIL` must be an address registered with SSL Labs**, not just any address.
The v4 API requires an `email` header on `analyze` and `getEndpointData` and refuses
everything else: 400 with an `email` field error when the header is missing, 441 when the
address is not registered. Registration is a one-off call, made by the owner, not by this
code:

```bash
curl -X POST https://api.ssllabs.com/api/v4/register \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"…","lastName":"…","email":"…","organization":"…"}'
```

All four fields are mandatory, and SSL Labs does not accept free mail providers such as
Gmail, Yahoo or Hotmail. The response carries `status: "success"` or `"failure"` with a
`message`. An address that is already registered answers with "Email already registered
with us", which is a pass: use it as it is. Register only if `/api/ssl` reports that SSL
Labs did not accept the address.

Secrets take effect on the next deployment, not the next request: after adding or changing
one, redeploy (retry the latest deployment, or push).

Locally the same names go in `.dev.vars` at the repository root, which `wrangler pages dev`
reads and nothing deploys. `.dev.vars.example` lists them with no values.

## What changed from the workers

The query parameters and the JSON bodies are the workers', unchanged — frozen contract #5.
`src/test/functions/` rebuilds each upstream's data from the responses captured from the
production workers (`src/test/fixtures/workers/`), runs the new handler against it, and
requires the captured response back. The differences are all outside the body of a
successful lookup, and each is in [`BEHAVIOR_CHANGES.md`](../BEHAVIOR_CHANGES.md):

| | Workers | `/api/*` |
|---|---|---|
| Address | one hostname each, `GET /?…` | one origin, `GET /api/<name>?…` |
| CORS | `Access-Control-*` on every response | none |
| Access | `Origin` exact match, else `Referer` prefix match, against `ALLOWED_ORIGINS` | `Sec-Fetch-Site` and `Origin` against the request's own origin |
| `OPTIONS` | 200 with CORS headers | 405, or 403 cross-origin |
| Other methods | 405, plain-text body | 405, `{"error":"Method not allowed"}`, `Allow: GET` |
| 403 body | differed per worker | one message, always JSON |
| Missing `ALLOWED_ORIGINS` | 500 `Configuration error` | not applicable |
| SSL in-progress response | `Cache-Control: public, max-age=300` | `Cache-Control: no-store` |
| SSL upstream query | domain interpolated raw | domain passed through `encodeURIComponent` |
| SSL Labs `email` header | never sent by the checked-in source | sent on `analyze` and `getEndpointData` |
| SSL fallback when SSL Labs is unconfigured or refuses the email | silent | top-level `statusMessage` says so |
| Logging | env keys, the SSL Labs email, whole upstream responses, every domain looked up | failures only |

## SSL Checker — `/api/ssl`

```
GET /api/ssl?domain=example.com
```

`domain` is required (**400** if absent) and is stripped of any scheme and path before use.

Secrets: `SSL_LABS_EMAIL`, `SSL_LABS_USER_AGENT`. Both are required by
`getSSLLabsConfig`; a missing one throws and the request falls through to the fallback path
below. There is no SSL Labs API key: the registered email *is* the credential. Requests to
`https://api.ssllabs.com/api/v4` carry the user agent as `User-Agent`, and `analyze` and
`getEndpointData` carry the address in an `email` header, which SSL Labs requires. `info`
needs neither and is sent without the email. The address is never logged and never appears
in a response.

This is a deliberate divergence from the retired `ssl-checker` worker's source, which read
`SSL_LABS_EMAIL` and never sent it — so, run as it was checked in, it was refused by SSL
Labs on every request and always fell back.

Flow:

1. `GET /info` on SSL Labs, to confirm the service is up.
2. `GET /analyze?host=…&publish=off&fromCache=on&maxAge=24&all=done`. If that returns
   `status: READY` with endpoints, up to three ready endpoints are enriched with
   `getEndpointData` and the result is returned.
3. Otherwise `GET /analyze?host=…&publish=off&startNew=on&all=done` starts a fresh
   assessment. The function does **not** poll; it returns the in-progress state immediately.
4. If SSL Labs fails entirely, `https://api.hackertarget.com/sslcheck/?q=<domain>` is tried
   and its text output parsed into the same shape.
5. If that also fails, the function performs a `HEAD` request to `https://<domain>` from
   the edge and returns a minimal result with `apiSource: 'Cloudflare Worker Basic Check'`
   and grade `T`. An HTTP error response counts as a successful connection here, so a host
   that does not resolve can still come back as grade `T` — inherited behaviour, pinned by
   the `ssl.error.json` fixture.

The `apiSource` strings still say "Cloudflare Worker". They are part of the response body
the client and its history entries were written against, so they did not change.

A fallback result (steps 4 and 5) normally has no top-level `statusMessage`. It gains one in
exactly two cases, so that a deployment that can never reach SSL Labs does not look like a
site with a poor certificate:

- the `SSL_LABS_*` secrets are missing: `SSL Labs analysis unavailable: it is not
  configured for this deployment. Showing a reduced check instead.`
- SSL Labs answered `analyze` with 441, or with 400 naming the `email` field: `SSL Labs
  analysis unavailable: SSL Labs did not accept this site's registered email. Showing a
  reduced check instead.`

The SSL checker shows `statusMessage` in its Status field. Any other SSL Labs failure — the
service being down, a host it cannot assess — falls back without one, as the worker did.

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

`pollInfo` is added by the function and only when a new assessment was started.
`recommendedInterval` is 5 seconds while the status is `DNS`, and between 10 and 30
seconds while `IN_PROGRESS`, derived from the endpoints' own ETAs. The client honours it in
`src/tools/ssl-checker/lib/sslApi.js`, which polls the same URL up to twelve times, capping
the wait at 10 seconds. Endpoint detail beyond the certificate, protocols and cipher suites
— the vulnerability flags, HSTS policy, named groups and so on — is only included for
endpoints whose `statusMessage` is `Ready`.

A finished result carries `Cache-Control: public, max-age=300` — five minutes in the
visitor's browser, no stored state. A response that asks to be polled carries
`Cache-Control: no-store` instead. The worker sent the five-minute header on those too,
which let a browser answer every poll of the same URL from its own cache with the same
in-progress body.

On an unhandled error the function returns **500** with `error`, **`stack`** and
`timestamp`. Returning the stack is inherited from the worker and kept because the body
shape is a frozen contract; it exposes nothing that is not in this public repository, but
it is a reasonable thing to drop the next time the contract is deliberately revised.

## WHOIS — `/api/whois`

```
GET /api/whois?query=example.com
GET /api/whois?query=8.8.8.8&type=ip
```

`query` is required (**400** if absent). `type` accepts `domain` or `ip`; when omitted the
function decides by regex — IPv4 with octet-range validation, or a simplified full-form
IPv6 pattern. It needs no secrets.

Domains are resolved over **RDAP**, not the WHOIS protocol. The IANA bootstrap file
`https://data.iana.org/rdap/dns.json` is fetched, held in a module-level variable for 24
hours (per isolate — this is not shared storage, and a cold isolate refetches), and used
both to find the effective TLD (multi-part TLDs such as `co.uk` are matched against the
bootstrap's own TLD set) and the RDAP base URL for it. The function then requests
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

`normalized` is the function's own flattening — for domains: `domain`, `status`, `events`,
`entities`, `nameservers`, `registrar`, `created`, `updated`, `expires`; for IPs:
`ip`, `location`, `network`, `organization`, `security`, preferring ipinfo.io and filling
gaps from ip-api.com. A failed lookup still returns 200, with `status: 'failed'` and an
`error` string. Unhandled errors return **500** with `error` and `details`.

## Microsoft Tenant Lookup — `/api/tenant`

```
GET /api/tenant?domain=example.com
```

`domain` is required (**400** if absent). An email address is accepted and reduced to its
domain, then validated against a domain regex; a failure is **400** with
`{"error":"Invalid domain format","domain":"…"}`.

Secrets, all optional: `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET` and `GRAPH_TENANT_ID`.
When all three are present the function fetches
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
tenant ID was found, the function additionally fetches the OpenID configuration for that
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

When the Graph token request is refused, the function logs one line — the HTTP status,
Microsoft's OAuth `error` and its `error_codes` (the AADSTS numbers), for example
`Failed to get Graph access token: 400 unauthorized_client 700016` — and carries on without
Graph. That line is the only way to tell a bad secret from a bad ID, because the response
looks the same either way: `tenantId: null` and `method: "GetUserRealm API"`. It never
includes `error_description` (which names the tenant and app and carries trace IDs), any
`GRAPH_*` value or the request body, and nothing about the failure is added to the response.
Read it with `wrangler pages deployment tail <deployment-id> --project-name russ-tools`.

Failure is also 200, with `success: false`, an `error` string and a `suggestions` array;
the client (`src/tools/tenant-lookup/island.jsx`) checks `success` rather than the status
code. Unhandled errors are **500** with `error` and `message`.

The three OpenID lookups request `…/.well-known/openid_configuration`, with an underscore.
Microsoft serves that document at `openid-configuration`, so these have never returned
anything and no captured response carries `openIdConfig`. The port keeps the URLs as they
are: correcting them would add fields to a response whose shape is frozen, which is a
contract change to make on purpose, not in passing.

The worker source also carried two inert pieces — an empty `KNOWN_TENANTS` map and an
unread `_ENHANCED_APIS` list with an Autodiscover SOAP request. Neither was ported.

## Deploying

There is nothing to deploy separately. The functions are part of the Pages project: a push
to `main` builds the site and publishes `functions/` with it, and every branch gets a
preview deployment whose `/api/*` is that branch's code. Rollback is the Pages rollback in
[`DEPLOYMENT.md`](../DEPLOYMENT.md#rolling-back) and takes the API with it.

## Testing without deploying

- **`pnpm test`** — `src/test/functions/guard.test.js` covers the access rules for all
  three endpoints; `whois.test.js`, `tenant.test.js` and `ssl.test.js` mock the upstreams
  (IANA and the registries, ipinfo.io, ip-api.com, Microsoft, Cloudflare DoH, SSL Labs,
  HackerTarget) and hold the handlers to the responses captured from production.
- **`pnpm build && pnpm test:e2e`** — `e2e/api.spec.js` runs against `wrangler pages dev
  dist`: the functions are routed, a same-origin browser fetch is answered, and a real
  browser on another origin gets a 403 it cannot read. None of it triggers an upstream
  lookup, so it is safe against a deployed target too.
- **By hand** — `pnpm dev:api` and a browser; see `docs/DEVELOPMENT.md`.

`src/test/msw/handlers.js` serves the same captured responses to the tool tests, so the
islands are exercised without network access or a running function.

## Retired standalone workers

Until 2026-11-14 the three lookups ran as separate Workers, each on its own hostname with
its own copy of an `ALLOWED_ORIGINS` secret:

| Worker | Custom domain | Replaced by |
|---|---|---|
| `ssl-checker` | `ssl.russ.tools` | `/api/ssl` |
| `whois-lookup` | `whois.russ.tools` | `/api/whois` |
| `microsoft-tenant-lookup` | `tenant.russ.tools` | `/api/tenant` |

They were deleted with `wrangler delete` once `/api/*` had been checked in production, and
their sources (`cloudflare-worker/ssl.js`, `whois.js`, `tenant.js`) and configs were
removed from the repository in the same change; git history has them. Deleting a worker
with a `custom_domain` route removed its DNS record, and the three hostnames no longer
resolve. Their secrets went with them.

What survives is the contract. The request parameters and response bodies documented per
endpoint above are the workers', captured from production before the move and replayed by
`src/test/functions/` from the fixtures in `src/test/fixtures/workers/` — which are still
named after the old hostnames.

Two things about the old workers worth knowing if their history is ever read: the origin
check fell back to a `Referer` prefix match, so an allowed `https://russ.tools` also
matched `https://russ.tools.example.com/`; and `ssl.js` logged the values of its SSL Labs
settings on every request. Neither was carried into the functions.

The one standalone worker left is `buzzword-generator`, below. `wrangler` is not a
dependency of this project; invoke it with `pnpm dlx`:

```bash
pnpm dlx wrangler deploy --config cloudflare-worker/configs/wrangler-buzzwords.toml
```

## Buzzword generator — `buzzwords.russ.tools`

A separate, deliberately public worker that the move to `/api/*` did not touch.

Routed by path, unlike the lookup workers:

| Path | Method | Parameters |
|---|---|---|
| `/health` | GET | — |
| `/generate` | GET, POST | `count` (1–50, default 1), `type` (`phrase`, `sentences`, `paragraphs`, `adverbs`, `adjectives`, `nouns`, `verbs`) |
| `/words` | GET | `type` (optional), `count` (1–100, default 10) |

Anything else is **404**. `/generate` accepts parameters as a query string on GET or a JSON
body on POST. Responses are 200 with `success`, `timestamp`, `type`, `count` and `data`,
and carry `Cache-Control: public, max-age=300` (`/words`: 1800). It reads no environment
variables at all.

It does not use `ALLOWED_ORIGINS`. Its allowlist is hard-coded in the source
(`https://russ.tools`, `https://www.russ.tools`, `http://localhost:5173`,
`http://localhost:3000`) and a non-matching origin is answered with
`Access-Control-Allow-Origin: https://russ.tools` rather than refused — so it is callable by
any non-browser client, and the two localhost entries are for dev servers this project no
longer runs (Astro is on `:4321`). Whether to prune them is the owner's call.

Two further caveats, both verifiable in the source:

- The file header and the `/health` payload (`services.rateLimit: "operational"`) claim
  rate limiting. There is none — no counter, no binding, no storage.
- Its import path pointed at `../src/components/tools/buzzword-ipsum/data/buzzwords.json`,
  which was deleted when the tools moved to `src/tools/<id>/`. A deploy from source would
  have failed to bundle. Corrected to `../src/tools/buzzword-ipsum/data/buzzwords.json`;
  the deployed worker predates the move and is unaffected until it is next deployed.

Nothing in this repository calls it: Buzzword Ipsum generates its text in the browser from
`src/tools/buzzword-ipsum/data/buzzwords.json`.
