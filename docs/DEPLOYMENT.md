# Deployment

The site is a static Astro build served by Cloudflare Pages. WHOIS, SSL analysis and
Microsoft tenant discovery are three Pages Functions in `functions/api/`, served by the
same project at `/api/*` and deployed with it — see
[`cloudflare-workers/README.md`](cloudflare-workers/README.md). DNS and routing lookups go
straight from the browser to their named public providers.

There is no server-side rendering and no adapter. A deploy is a directory of files plus
those three functions, and the only runtime configuration is the functions' secrets.

## Requirements

| | |
|---|---|
| Node | `>=20` (`engines` in `package.json`; CI uses 22) |
| Package manager | pnpm, pinned by `packageManager: pnpm@11.14.0` |
| Lockfile | `pnpm-lock.yaml` |
| Wrangler | not a dependency — invoked with `pnpm dlx wrangler` |

## The build

```bash
pnpm install --frozen-lockfile
pnpm build
```

`pnpm build` is five steps, in this order:

1. **`pnpm generate:sitemap`** — `scripts/generate-sitemap.js` writes `public/sitemap.xml`
   from the tool manifests. It runs first because Astro copies `public/` into the output.
   `lastmod` for each URL comes from that tool's last commit (`git log -1 --format=%cs`),
   so the file is only correct when built from a real checkout with history.
2. **`pnpm generate:llms`** — `scripts/generate-llms.mjs` writes the gitignored
   `public/llms.txt`, `public/llms-full.txt` and `public/agents.md` from the manifests and
   per-tool help blocks so Astro can copy them into the build.
3. **`astro build`** — prerenders every page to `dist/`. `astro.config.mjs` sets
   `output: 'static'`, `outDir: './dist'`, `trailingSlash: 'never'` and
   `build.format: 'file'`, so each tool becomes `dist/<tool>.html` and the URLs stay
   exactly as the previous site served them. The `astro-webmcp` integration also emits its
   discovery files here.
4. **`pnpm generate:redirects`** — `scripts/generate-redirects.mjs` writes
   `dist/_redirects` from the manifests. It exits non-zero if `dist/` does not exist, so it
   cannot silently produce nothing.
5. **`pnpm patch:webmcp`** — `scripts/patch-webmcp-manifest.mjs` replaces the integration's
   incomplete metadata for flat `<tool>.html` pages with manifest titles, descriptions,
   categories and help-page entries.

`pnpm preview` serves the build with Astro's own preview server. It does not apply
`_redirects`, so param deep links 404 there; use `wrangler pages dev dist` when that
matters (below).

## Cloudflare Pages configuration

The production project is git-connected and builds `main`.

| Setting | Value |
|---|---|
| Production branch | `main` |
| Build command | `pnpm build` |
| Build output directory | `dist` |
| Root directory | `/` |

If the Pages build image ships a Node older than the `engines` floor, set a `NODE_VERSION`
environment variable of `20` or higher on the project; there is no other environment
variable the build reads.

Pages picks up the top-level `functions/` directory by itself — there is no setting for it
and no `wrangler.toml`. Do not add a `wrangler.toml` carrying `pages_build_output_dir`: it
becomes the source of truth for the project and the matching dashboard fields stop being
editable.

### The API's secrets

The functions read five secrets, set under Settings → Variables and Secrets. **Production
and Preview are separate environments**; a value set in one is not present in the other.

| Secret | Endpoint | Without it |
|---|---|---|
| `SSL_LABS_EMAIL`, `SSL_LABS_USER_AGENT` | `/api/ssl` | no SSL Labs analysis: fallback summary or a grade-`T` connectivity result |
| `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET`, `GRAPH_TENANT_ID` | `/api/tenant` | no Microsoft Graph: realm and DNS detail, no tenant ID |

Use the values the `ssl-checker` and `microsoft-tenant-lookup` workers hold. Cloudflare
does not show a secret once set, so if they are not recorded elsewhere, issue a new Graph
client secret in the app registration rather than trying to read the old one back. Add them
as type **Secret**, then **redeploy** — a Pages secret takes effect on the next deployment,
not the next request.

Preview deployments are public `*.pages.dev` URLs outside the zone's WAF. Leaving the
secrets out of the Preview environment is a reasonable default: previews then exercise the
whole API on its unauthenticated sources and cannot spend the Graph or SSL Labs quota.

There is no `ALLOWED_ORIGINS`. The API accepts its own origin and nothing else, whatever
hostname it is served on, so a new preview needs no configuration.

Pushing to `main` triggers a build and deploys it. Branch pushes and pull requests produce
preview deployments using the same settings.

### `_redirects` and the param routes

Astro prerenders one file per tool. The deep-link routes — `/ssl-checker/:domain`,
`/jwt/:token`, `/base64/:input`, `/subnet-calculator/:ip/:prefix` and the rest — have no
file of their own, because the value is user data and cannot be enumerated at build time.

`dist/_redirects` handles them with a **200 rewrite**, not a redirect:

```
/ssl-checker/:domain                    /ssl-checker            200
```

The visitor keeps the URL they arrived on and Cloudflare serves the tool's page underneath
it; the island then reads the segment off `location.pathname` when it mounts. A 301 or 302
would rewrite the address bar and destroy the shareable-link property the whole site rests
on — these URLs are frozen contract #1.

Retired paths are the exception and are genuine 301s. They are emitted first in the file so
they match before any rewrite can:

```
/network-designer                       /subnet-calculator      301
/network-designer/*                     /subnet-calculator      301
```

Every line is derived from a manifest — the param patterns from `params`, the 301s from
`redirectFrom` — so a route cannot be lost by forgetting to list it. The file carries a
generated-file header; do not edit `dist/_redirects` by hand, and do not commit one.

For a tool with a param route, the generator also emits a `/<tool>/help` self-rewrite
before `/<tool>/:param`. Cloudflare evaluates the first matching rule, so this keeps the
real prerendered help page from being mistaken for a parameter value.

### Verifying a deployment

`e2e/deeplinks.spec.js` and `e2e/help.spec.js` are the browser-level gates for the routing
above. They only mean anything against something that applies `_redirects`, which
`astro dev` does not.

Against Cloudflare's runtime locally:

```bash
pnpm build
pnpm test:e2e     # auto-starts `wrangler pages dev dist` on :8788
```

Against a deployed target:

```bash
PW_BASE_URL=https://russ.tools pnpm test:e2e
```

`e2e/api.spec.js` runs against a deployed target too and is safe to: every request in it is
refused or is missing its parameter, so it proves the functions are routed and guarded
without causing a single upstream lookup. It cannot tell you the secrets are right — check
that by hand after the first deploy:

- `/whois-lookup/github.com` shows registrar and nameservers (no secret involved).
- `/ssl-checker/github.com` shows a letter grade and a certificate chain. Grade `T` with one
  "basic check" endpoint means the `SSL_LABS_*` secrets are missing from that environment.
- `/tenant-lookup/microsoft.com` shows a tenant ID. "Detection Method: GetUserRealm API"
  with no tenant ID means the `GRAPH_*` secrets are missing or wrong.
- From any other site's console, `fetch('https://russ.tools/api/whois?query=github.com')`
  rejects with a CORS error.

## Continuous integration

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`: install, **build**,
test, lint. The build step comes before the tests deliberately — `canonical.test.js`,
`seo.test.js` and the sitemap suite assert the built output in `dist/`, and skip silently
without it. Lint is blocking at zero errors.

CI does not deploy. Cloudflare Pages builds `main` itself from the git connection.

## Rate limiting

The API has none in code. Add a rate limiting rule on the `russ.tools` zone for
`starts_with(http.request.uri.path, "/api/")`, per IP; the reasoning and its limits are in
[`cloudflare-workers/README.md`](cloudflare-workers/README.md#abuse-and-rate-limiting).

## Legacy workers

The three standalone lookup workers (`ssl.russ.tools`, `whois.russ.tools`,
`tenant.russ.tools`) are still deployed and still in `cloudflare-worker/`, but the site no
longer calls them. They stay until the steps in
[Retiring the old workers](cloudflare-workers/README.md#retiring-the-old-workers) are done.
`buzzword-generator` is a separate public API and is not being retired.

The workers are not part of the site build and are not deployed by CI. Each has its own
config under `cloudflare-worker/configs/` and is deployed individually:

```bash
pnpm dlx wrangler deploy --config cloudflare-worker/configs/wrangler-ssl.toml
```

### Rotating ALLOWED_ORIGINS

`ALLOWED_ORIGINS` is a comma-separated list of exact origins, held as a secret on each of
the `ssl-checker`, `whois-lookup` and `microsoft-tenant-lookup` workers. It is read on
every request, so a change takes effect on the next request with no redeploy. It is the
only thing standing between these workers and open public use, so it needs pruning whenever
a temporary origin — a preview deployment, a local port — stops being needed. With the site
on `/api/*`, the tidy state until the workers are deleted is the production origins alone:
no localhost entry and no preview origins.

Set it per worker; the value replaces the previous one in full:

```bash
echo 'https://russ.tools,https://www.russ.tools' \
  | pnpm dlx wrangler secret put ALLOWED_ORIGINS \
      --config cloudflare-worker/configs/wrangler-ssl.toml
```

Repeat for `wrangler-whois.toml` and `wrangler-tenant.toml`. The three lists are set
separately and can drift; check all three when auditing.

Two things to know before editing the value. The origin check falls back to a `Referer`
prefix match when there is no `Origin` header, so a trailing-slash-free entry such as
`https://russ.tools` also matches a referer of `https://russ.tools.example.com/` — keep the
list tight. And the first entry doubles as the default `Access-Control-Allow-Origin` for
requests the workers do not recognise, so put the production origin first.

`buzzword-generator` does not read this secret; its allowlist is compiled into
`cloudflare-worker/buzzwords.js` and changing it requires an edit and a redeploy.

## Rolling back

**The site.** In the Cloudflare Pages dashboard, open the project's Deployments list, find
the last known-good deployment and roll back to it. That is instant and needs no build, and
it takes `/api/*` back with it — the functions are part of the deployment.
Reverting the offending commit on `main` produces a fresh build and is the durable fix.

**A worker.** `pnpm dlx wrangler rollback --config cloudflare-worker/configs/<config>.toml`
restores its previous version. Secrets are not versioned with the code — a bad
`ALLOWED_ORIGINS` is fixed by setting it again, not by rolling back.

**A build-settings change.** The Pages build command and output directory are dashboard
settings, not repository files. Reverting them means editing them back and triggering a
redeploy; nothing in the repository records what they were, so note the previous values
before changing them.
