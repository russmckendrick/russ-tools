# Behaviour changes

The characterization suites pin what the code **does**, not what it should do.
Where the captured behaviour is a bug, it is annotated `KNOWN-BUG` at capture
time and listed here until it is fixed.

Frozen contract #6 of [the redesign plan](plans/redesign-plan.md): *every
deliberate divergence updates its fixture in the same PR and is logged here.*

Two rules:

1. A test that changes because behaviour changed on purpose gets an entry here,
   in the PR that changes it. No entry, no merge.
2. A test that changes because behaviour changed *by accident* is not a
   behaviour change — it is a regression. Fix the code, not the fixture.

---

## Open — captured as KNOWN-BUG, not yet fixed

*Nothing currently open.*

---

## Landed

### A fourth server-side lookup: `/api/headers` (2026-11-14)

The HTTP Security Headers tool (`/http-headers`) cannot work in the browser: a page is not
allowed to read another site's response headers. So the site's API gains a fourth Pages
Function, `/api/headers`, and **the list of things that leave the browser grows by one.**

- **What is sent.** The URL or hostname the user enters goes to `/api/headers` on the
  site's own origin. The function resolves the hostname through Cloudflare DNS-over-HTTPS
  and requests the URL itself, so the target site sees a request from Cloudflare with the
  User-Agent `russ.tools-http-headers/1.0`, not from the user. Nothing else about the user
  is forwarded, and nothing is stored on the server.
- **What comes back.** Status codes and URLs for each redirect hop, the final response's
  headers, and for each cookie its name and attributes. A cookie's value is discarded in
  the function. No response body is read or returned.
- **What it refuses.** Anything that is not a public website on port 80 or 443: IP
  literals of any kind, loopback, private, link-local and carrier-grade NAT addresses,
  `localhost`, `.local`, `.internal` and similar names, cloud metadata addresses, other
  schemes, and URLs carrying credentials. The same rules are applied to every redirect and
  to the addresses a hostname resolves to. The full list, and what it does not protect
  against, is in `docs/cloudflare-workers/README.md#http-security-headers--apiheaders`.
- **Same access model as the other three.** Same-origin only, GET only, no CORS, no key,
  no rate limiting in code. The zone rate-limiting rule covers it because it matches
  `/api/`.

Statements that said "three lookups" were corrected in the same change: `PRODUCT.md` (which
still said "three Cloudflare Workers"), `README.md`, `docs/README.md`, `AGENTS.md`,
`docs/ARCHITECTURE.md`, `docs/DEPLOYMENT.md`, `docs/DEVELOPMENT.md`, `docs/api/API_CONFIG.md`,
the generated `/agents.md`, and `public/.well-known/api-catalog`. The contract is pinned by
`src/test/functions/headers.test.js`, `public-host.test.js` and the `/api/headers` cases in
`e2e/api.spec.js`. It has no production capture to replay, because it was never a Worker.

The SAML Decoder added alongside it (`/saml`) is entirely client-side and changes no
boundary.

### The paste panel offers the headers checker for a domain or a URL (2026-11-14)

A bare hostname pasted into the index's paste panel used to offer seven tools and now
offers eight: HTTP Headers sits sixth, after SSL Checker and before Tenant Lookup. A pasted
`http://` or `https://` URL gets the same eight, reduced to its host as before; the chip
for the headers checker is labelled as reading a URL. The order of the other seven is
unchanged and Enter still opens DNS Lookup. A URL whose host is an IP address is unchanged
(the four address tools), because the checker refuses IP literals.

`src/lib/paste.test.js` and the paste-panel and 404 tests in `e2e/deeplinks.spec.js` assert
the new count.

### The paste panel reads timestamps, and a GUID gets a third answer (2026-11-14)

Two inputs to the index's paste panel now dispatch differently, both because of tools that
did not exist before.

- A bare **ten-digit number** used to be one chip, BGP Explorer, because ten digits is a
  legal 32-bit AS number. It is now Timestamp Converter first and BGP Explorer second, and
  Enter opens the converter. A ten-digit number above 4294967295 gets the converter alone.
  A bare **thirteen-digit number** used to fall through to the Base64 encoder and now opens
  the converter. Numbers of any other length, and anything prefixed `AS`, are unchanged.
- A bare **GUID** still offers Azure RBAC and M365 Licences, in that order, and now offers
  the UUID decoder third. Enter still opens Azure RBAC.

`src/lib/paste.test.js` and the paste-panel test in `e2e/deeplinks.spec.js` assert the new
lists.

### Password Generator: the exclusions now hold for every character (2026-11-14)

Each enabled character class is guaranteed one character in a password. That
character was drawn from the whole class, not from the class with **Exclude
similar characters** / **Exclude ambiguous symbols** applied, so a password
generated with an exclusion on could still contain one excluded character per
class: about a 1-in-13 chance of an `L` or `O` in the uppercase slot, for
instance. Found while moving the generator into `lib/password.js`, pinned
there as `KNOWN-BUG`, and fixed in the same branch.

The guaranteed characters are now drawn from the filtered classes
(`enabledClasses`), and a class that filtering leaves empty has its guarantee
skipped instead of producing a broken draw. No class can be emptied with the
current character sets; the guard is for a future set that could. Passwords
generated with no exclusion on are drawn exactly as before. `password.test.js`
generates several thousand passwords with each exclusion on and asserts that
no excluded character appears.

### Data Converter: CSV and XML, and TOML integers that convert (2026-11-14)

CSV and XML are input and output formats beside JSON, YAML and TOML
(`lib/csv.js`, `lib/xml.js`; the mappings are in the tool's help). What
changed for input that worked, or failed, before:

- **Auto Detect has two new answers.** Text starting with `<` is XML, and if
  it is not well formed it reports XML errors; it used to be accepted as one
  long YAML string. A consistent table with a plausible header row (two or
  more columns, two or more rows) is CSV; it also used to be a YAML string.
  A YAML mapping or list, TOML, and a single line of prose are detected as
  before, and `convert.test.js` pins those.
- **A chosen input format is honoured as you type.** The live path ignored
  the format select and always auto-detected. It now tries the chosen format
  first and falls back to detection only when that fails, which is what lets
  a single-column CSV be read as CSV. Input that parsed before still parses
  to the same thing.
- **TOML with integers converts to JSON and YAML.** `@ltd/j-toml` returns
  integers as `BigInt`, which `JSON.stringify` and `js-yaml` both throw on,
  so any TOML document with a whole number failed with "Conversion failed:
  Do not know how to serialize a BigInt". `toPlainData` now turns them into
  numbers (or text, past 2^53) on the way to JSON, YAML, CSV and XML. TOML to
  TOML keeps them as integers.
- **A refused conversion is shown, not toasted on every pause.** When input
  parses but cannot be written in the output format, the reason is drawn
  under the output editor. The live path used to raise a "Conversion failed"
  toast each time typing paused; only the **Convert** button toasts now, and
  it no longer follows a failure with "Successfully converted".
- **Two settings were added** to the stored settings object, with defaults:
  `csvDelimiter: 'auto'` and `inferTypes: true`. Existing saved settings are
  read as before and gain the defaults.

One deliberate step past the stated XML mapping: a top-level list, which has
no root name, is written as `<rows><row>...</row></rows>` instead of being
refused, so CSV converts to XML and back. Any other document without a
single root is refused with a message.

### JWT: verify against the issuer's published keys, and an honest signature state (2026-11-14)

**The tool can now make network requests, on a button press only.** For an
RS, PS or ES token whose `iss` is an `https` address, **Fetch issuer keys**
GETs `<iss>/.well-known/openid-configuration` and then the `jwks_uri` it
names, picks the key by `kid`, and verifies with `jose`. The token is not
sent; the requests carry no credentials and no referrer, refuse redirects,
and a `jwks_uri` on a different host from the issuer needs a second, explicit
press. A CORS or network failure names the address and points at the paste
route. The manifest's "No data sent to servers" / "100% client-side
processing" features were reworded to what is now true: the token never
leaves the browser.

Changed behaviour in the existing validation, all in `lib/signature.js`:

- **The key box also takes a JWKS** (`{"keys": [...]}`), searched by `kid`.
- **Validation re-runs when anything changes.** It used to run only when the
  token changed, so pasting the key after the token did nothing until the
  token was edited.
- **The signature and the time claims are separate.** Verification used
  `jwtVerify`, which also enforces `exp` and `nbf`, so a correctly signed but
  expired token read "Signature validation failed". It now uses
  `compactVerify`: that token is "verified", and the diagram's Time claims
  step still says "expired".
- **Three states, from the real result.** The diagram's Signature step read
  "verified" for an unsigned (`alg: none`) token, because "no validation
  required" was returned as valid, and "invalid" for an HMAC token that was
  never tested. It now reads **verified**, **failed** or **not checked**:
  unsigned, HMAC, no key, an unreadable key and a missing `kid` are all "not
  checked", and only a signature that was tested and did not match is
  "failed". The old "waiting for a key" label is folded into "not checked".

### Password Generator: a passphrase mode, and the maths moved to `lib/` (2026-11-14)

A **Password / Passphrase** switch sits above the settings. Passphrase mode
draws 3 to 10 words (5 by default) from the EFF large wordlist with the same
`crypto.getRandomValues` helper, joined by a chosen separator, optionally
capitalised and with one digit appended. Its entropy is
`words * log2(7776)` plus `log2(10)` for the digit, shown through the same
Security Analysis panel, whose second figure is now labelled **Word List**
in that mode and **Character Pool** otherwise.

Password mode is unchanged: the generation and strength code moved verbatim
from `island.jsx` into `lib/` and is now pinned by tests, quirks included.
Visible differences are wording only: headings, buttons, toasts and the
download file follow the mode ("Generate Passphrases",
`passphrases_<date>.txt`), and the download header reports the length of the
values in the file, not the current slider position.

The page still opens on Password with one result drawn, and still stores
nothing: the mode and the passphrase settings are forgotten on reload. The
word list (`data/eff_large_wordlist.txt`, 109 kB, unmodified) is a dynamic
import, so it is fetched from the site the first time Passphrase is opened
and never in password mode.

### CRON builder: upcoming run times, names, and a validator that reads as you type (2026-11-14)

Under the expression on both tabs the tool now lists the next five run times
(`lib/schedule.js`, a pure function of the expression and a from-date). Three
things changed that were pinned or visible before:

- **Month and weekday names validate.** `0 9 * * MON-FRI` used to be "Invalid
  day of week value"; `validateCronExpression` now reads `JAN`-`DEC` and
  `SUN`-`SAT` in those two fields, in any case, and the two error strings
  gained "or JAN-DEC" / "or SUN-SAT". The `parseInt` quirks pinned in
  `cron.test.js` are untouched, and `looksLikeCron` (the paste sniffer) still
  refuses names, so prose cannot reach it.
- **The Expression Validator tab checks what is typed.** It used to report on
  the builder's expression until **Load** was pressed, so the status under the
  box could describe a different expression from the one in it. It now reads
  the box as you type and falls back to the builder's expression, labelled as
  such, only when the box is empty. **Load** still copies into the builder.
- **The diagram's either-or rule follows Vixie cron.** `CronFlow` drew
  "either" whenever both day fields were anything but a bare `*`. A field that
  starts with `*` (so `*/2`) is unrestricted in Vixie cron and cronie, where
  both fields must then match, and the diagram and the run times now share
  that one rule (`daysMatchEither`).

The run-time calculator is stricter than the validator: an expression the
validator lets through on a `parseInt` tail (`5x * * * *`) gets "run times
cannot be worked out" instead of a guess.

### The Subnet Calculator plans by size, and its share links can carry names (2026-11-14)

The Divide panel gained **Plan by size**: a list of host counts (IPv4) or prefix
lengths (IPv6) is allocated largest first out of the calculated network and
written as ordinary splits. Three things changed that a user or a fixture can see:

- The share payload has an optional fourth key, `names` (`{ "<cidr>": "<label>" }`),
  written only when a current leaf has a label. A divide with no labels encodes to
  the same bytes as before, and a link without `names` restores as before; both are
  pinned in the island test against the fixture `e2e/deeplinks.spec.js` captured.
  The codec in `src/core/sharelink.js` is untouched. Names are cleaned on the way in
  (control characters and angle brackets dropped, 32 characters at most).
- The divide table shows a **Label** column while any row is labelled, and has
  **Download CSV** and **Copy as Markdown** under it.
- A second WebMCP tool, `plan_subnets`, registers beside `calculate_subnet`.

Two hosts are given a `/31` and one a `/32`, matching what the details panel already
calls usable. A `/30` is asked for by prefix (`link /30`).

### The three lookup workers are retired (2026-11-14)

`ssl.russ.tools`, `whois.russ.tools` and `tenant.russ.tools` no longer exist. The
`ssl-checker`, `whois-lookup` and `microsoft-tenant-lookup` workers were deleted from
Cloudflare after `/api/ssl`, `/api/whois` and `/api/tenant` were confirmed on the live site
(tenant ID through Microsoft Graph, a full SSL Labs grade, a live WHOIS record, and a 403 to
a cross-origin call), and their sources and configs were removed from the repository.

Anything outside this repository that called those hostnames now fails to resolve them. A
page that was loaded before the cutover and never reloaded will show failed lookups until
it is refreshed. `buzzword-generator` on `buzzwords.russ.tools` was not touched.

### The mobile and desktop refinement pass (2026-11-14)

A full review of every page at 390px and 1440px. Most of it is layout and is
recorded in the plan's Session Log; these are the changes a user would notice
as behaviour.

| Tool | Before | After | Why |
|---|---|---|---|
| every tool | Help was an outline button on a row of its own above the tool, rendered by the island after hydration | Help is a link on the band beside the breadcrumb, prerendered by `ToolLayout.astro` | The row cost 48px on every page for one small button, and the link did not exist until JavaScript ran. `[data-tool-actions]` is still the container, so the e2e help matrix is unchanged. |
| azure-kql, azure-naming | The share button sat in that same row | It is portalled onto the band beside Help; on a phone its label shortens to "Share" (the accessible name is unchanged) | One place for page-level actions. |
| password-generator | Opened on an empty "Generated Passwords" panel and waited for a click | Draws one password on arrival, silently (no toast); the result panel leads the page on a phone and the right-hand column on desktop | A generator that shows nothing until asked hides the one thing it is for. |
| password-generator | "Average time to crack" read `737475384536082688.0T years`, and any span between 1,000 and a billion years read `0.0B years` | One ladder: years, thousand, million, billion, trillion, then `7.4 × 10^29 years` | The old branches skipped six orders of magnitude and never rounded past a trillion. |
| microsoft-portals | Stated "31 portals" in the manifest, the page head and the empty state; the catalogue holds 91 | Says 91, counted from the data in the island and pinned by `portalLinks.test.js` | The number was typed once and never updated as three more catalogues were added. |
| microsoft-portals | Always opened in the card grid; the list view was a five-column table | Opens in the list view below 640px; the list is one ruled row per portal | Ninety-one cards in a single column was 18,662px of scrolling on a phone, and the table needed a sideways scroll to reach "Open". |
| microsoft-portals | "Open" was a button calling `window.open` | "Open" is a real link (`target="_blank" rel="noopener noreferrer"`) | Middle-click, copy-link and the status-bar URL all work; assistive tech announces a link. |
| ssl-checker | When only connectivity could be verified, a green "SSL Check Complete — certificate analysis completed" toast appeared above a panel saying analysis was unavailable | An info toast: "HTTPS reachable, analysis unavailable" | The tool was contradicting itself. |
| base64 | The file-upload dropzone sat above the Input and Output fields | It sits below them, and is a third of the height | Text is the common route; the dropzone pushed both fields off the first screen. |
| cron-builder | The flow diagram sat between the expression and its selectors at every width | Unchanged on desktop; on a phone it follows the selectors | Pele draws it top-down on a narrow screen, which put 700px between the expression and the controls that change it. |

### The toolbox mark became the hex key (2026-11-14)

The site mark was an outlined toolbox. It is now a hex key bent to the "r" of
russ, with the bolt it turns standing as the dot of russ.tools, in the existing
green: white key and mint bolt on the band, ink key and deep-green bolt in the
footer. It came from the identity proposal in
`design/proposals/2026-11-identity/` (direction A); the owner took the mark,
kept the colour scheme, and asked for the bolt to be larger than drawn there
(radius 3.75 to 4.5 on the 24px grid, still aligned to the end of the key's
arm and the foot of its stem).

The favicon changed shape as well as drawing: it was a bare glyph that swapped
its stroke on `prefers-color-scheme`, and is now the mark on a rounded band
tile, which reads the same on a light or a dark tab strip. `favicon.ico`, the
touch icon, the two home-screen PNGs and all 25 OG cards were regenerated;
`pnpm generate:icons` is new and produces the icon files from `SiteMark.astro`.

### The index became one stream, and grew a paste dispatcher

| | |
|---|---|
| **Where** | `src/pages/index.astro`, `src/pages/404.astro`, `src/shell/ToolCard.astro`, `src/styles/shell.css`; `src/shell/PastePanel.astro`, `src/lib/paste.js`, `src/lib/pastePanel.js`, `src/lib/hostname.js`, `src/lib/nearestTool.js`, `src/tools/cron-builder/lib/cron.js` (new); `src/tools/dns-lookup/manifest.mjs`, `src/tools/cron-builder/manifest.mjs`, `src/tools/cron-builder/island.jsx` |
| **Pinned by** | `src/lib/paste.test.js`, `src/lib/hostname.test.js`, `src/lib/nearestTool.test.js`, `src/tools/cron-builder/lib/cron.test.js` (all new); `src/tools/registry.test.js` (route count 26 → 28); `e2e/deeplinks.spec.js` (index block rewritten, two routes and a /404 test added) |
| **Landed** | owner decision, 2026-08-22 |

Five deliberate divergences.

**The five category sections are gone.** The index is one `flex-wrap` stream
of fifteen tiles whose widths come in three steps, so rows break 3/2/3/3/4
instead of snapping to three tracks. Why: the category was stated three times
per card — the section heading, the icon tile and the `rt-card-badge` — on a
row where every card shared it, and the fixed grid manufactured a hole at the
tail of every short category. The badge is deleted; the chips and the icon hue
carry the category now. `/#network` and its four peers survive as ids on the
first tile of each run, with a visually-hidden `h2` beside each so the heading
rotor keeps more than one entry. /404 still renders the old group markup, so
`.rt-board` / `.rt-group*` / `.rt-grid` stay in `shell.css`.

**Filtering no longer promotes one group and demotes the rest.** There are no
groups left to promote: a category chip hides the tiles that do not carry its
`data-category`. The `is-filtered` and `[data-demoted]` rules are deleted; the
`min-height` floor that stopped a short filter trapping space above the footer
moved to `.rt-stream`. The `?q=` and `#category` URL contracts are unchanged.

**Two new deep-link routes**, `/dns-lookup/:domain` and `/cron/:expression`,
added deliberately to the frozen list in `registry.test.js` (26 → 28) so the
paste panel can reach six tools rather than four. DNS Lookup needed only the
manifest — its island already passed `urlParam: 'domain'` to `useLookupTool`.
The cron route also proves, end-to-end, that a `%2F` survives the Pages
rewrite intact; nothing had tested that before.

**/404 reads the URL that failed.** It used to show a standing list of three
popular tools, which threw away the one piece of information the page has that
the index does not. It now shows the failed path, ranks the catalogue against
its first segment (`/subnet-calcualtor` → Subnet Calculator, `/dns` → DNS
Lookup) and seeds the paste panel from any value riding on the path
(`/whois/example.com` arrives with the domain already in the field). The
popular-tools list and the "URL may be mistyped…" paragraph are **removed**
(owner decision) — the header's own nav is the way out, and a dead-end page
does not need a second catalogue. Consequence worth knowing: without
JavaScript /404 is now the headline and nothing else, where it used to carry
three cards.

**The homepage gained a dispatching control** — the page's one
`panel-emphasis`, spent on a control rather than a banner. `suggest()` ranks
tools by what the pasted value is; five tools accept a bare hostname, so it
returns all five as chips rather than choosing one silently. It ships no React:
the detectors come from `subnet-calculator/lib/ipv4.js`, `ipv6.js`,
`cron-builder/lib/cron.js` and the new `hostname.js`, all dependency-free.

Two smaller notes recorded rather than hidden:

- `validateCronExpression` moved out of `cron-builder/island.jsx` into
  `lib/cron.js` **verbatim**, quirks included (`parseInt` reads `5x` as 5; a
  step's base is bounds-checked but the step is not; `L` is day-of-month only).
  `cron.test.js` pins those as quirks. `looksLikeCron` is new, and exists
  because the quirks make the validator too generous to sniff arbitrary text
  with.
- `translateCronExpression` splits on a single space where
  `validateCronExpression` splits on any run of whitespace, so `'  0 0 * * *'`
  validates and then translates to "Invalid CRON expression". Unreachable
  until `/cron/:expression` existed. Fixed at the param boundary — the island
  collapses whitespace before parsing, and `paste.js` emits normalised
  expressions — rather than in the extracted function, so the extraction stays
  behaviour-preserving. The underlying divergence is still there for anyone
  who types two spaces into the manual box.

### The three lookups moved to a same-origin API

| | |
|---|---|
| **Where** | `functions/api/ssl.js`, `functions/api/whois.js`, `functions/api/tenant.js`, `functions-lib/http.js` (all new, ported from `cloudflare-worker/`); `src/utils/api/apiConfig.json`, `src/core/api.js` (`buildUrl`); `astro.config.mjs` (dev proxy); `public/.well-known/api-catalog`, `scripts/generate-llms.mjs`; `playwright.config.js`, `e2e/deeplinks.spec.js` |
| **Pinned by** | `src/test/functions/guard.test.js`, `whois.test.js`, `tenant.test.js`, `ssl.test.js`, `e2e/api.spec.js` (all new); `src/tools/agent-discovery.test.js`, `src/core/api.test.js`, `src/test/msw/handlers.test.js` (updated) |
| **Landed** | owner decision, 2026-11-14 |

WHOIS, SSL and tenant lookups are now Cloudflare Pages Functions at
`/api/whois`, `/api/ssl` and `/api/tenant`, called same-origin, instead of
three workers on three hostnames. **Query parameters and JSON bodies did not
change** (frozen contract #5): the new suites rebuild each upstream's data
from the responses captured from the production workers, run the handler, and
require the captured response back — for a completed and an in-progress SSL
assessment, the basic-check fallback, a domain and an IP WHOIS, and two
tenants. Today's live responses were compared key-for-key with the 2026-07-19
fixtures first; nothing had drifted. No worker fixture was edited.

What did change, all of it outside the body of a successful lookup:

- **Address.** `GET https://<name>.russ.tools/?…` became `GET /api/<name>?…`.
  The old hostnames still answer; nothing in the site calls them.
- **Access model.** The workers matched `Origin` (or a `Referer` prefix)
  against an `ALLOWED_ORIGINS` secret and sent CORS headers. The functions
  send no CORS headers at all, refuse a `Sec-Fetch-Site` other than
  `same-origin` and an `Origin` other than the request's own, and need no
  list. A refusal is 403 with one JSON message for all three (the workers'
  wording and CORS headers on a 403 differed per worker). This is not
  authentication: a non-browser client can forge those headers, and the docs
  say so.
- **Methods.** `OPTIONS` was 200 with CORS headers and is now 405 (403 when
  cross-origin). Other non-GET methods were 405 with a plain-text body under a
  JSON content type and are now 405 `{"error":"Method not allowed"}` with
  `Allow: GET`.
- **No `Configuration error` 500.** It existed only for a missing
  `ALLOWED_ORIGINS`.
- **SSL: an in-progress response is `Cache-Control: no-store`.** The worker
  sent `public, max-age=300` on every 200, including the ones whose `pollInfo`
  tells the client to ask again in 5–30 seconds — at the same URL, which a
  browser may then answer from its own cache for five minutes. Finished
  results keep the five-minute header.
- **SSL: the domain is URL-encoded into the SSL Labs and HackerTarget
  queries.** It was interpolated raw, so `domain=example.com%26publish%3Don`
  added a parameter to the upstream call. A hostname encodes to itself;
  pinned in `ssl.test.js`.
- **SSL: the registered email is sent to SSL Labs.** `cloudflare-worker/ssl.js`
  reads `SSL_LABS_EMAIL` and never transmits it, and the v4 API answers
  `analyze` without an `email` header with 400. A faithful port therefore
  never reached SSL Labs at all. The functions send `email` on `analyze` and
  `getEndpointData` (not `info`). This diverges from the checked-in worker
  and matches the *deployed* one, which returns SSL Labs results and so must
  already send it. Pinned in `ssl.test.js`.
- **SSL: a fallback says why, in two cases.** When the `SSL_LABS_*` secrets
  are missing, or SSL Labs refuses the email (441, or 400 naming the `email`
  field), the HackerTarget or basic-check result gains a top-level
  `statusMessage` — a key the SSL Labs shape already has and the client
  already shows. Before, both cases were indistinguishable from a real
  grade-`T` result. Every other fallback is unchanged, which the
  `ssl.error.json` replay still pins.
- **Tenant: a refused Graph token is logged with its cause.** The worker
  logged the HTTP status alone. The function adds Microsoft's OAuth `error`
  and `error_codes` to that one line and nothing else — never
  `error_description`, a `GRAPH_*` value or the request body — and the
  response body is unchanged. Pinned in `tenant.test.js`.
- **Logging.** The workers logged the env keys, the SSL Labs email, whole
  upstream responses and every query. The functions log failures only.
- **`buildUrl` accepts a root-relative base**, resolving it against the page
  origin (and leaving it relative where there is no page). Absolute bases are
  untouched.
- **The deep-link matrix stubs `/api/**`.** Those lookups used to fail closed
  against a worker that did not list the test origin; against a local or
  deployed same-origin API they would be four real third-party queries per
  run.

Carried over on purpose, because fixing them changes a response body: the
`apiSource` strings still read "…via Cloudflare Worker"; the tenant lookup's
three `openid_configuration` URLs (underscore) still never match, so
`openIdConfig` is still absent; the SSL 500 body still includes `stack`; and
the SSL scheme strip is still case-sensitive. `cloudflare-worker/` is
untouched and `buzzwords.js` was out of scope.

### The site grew an AI-agent surface

| | |
|---|---|
| **Where** | `scripts/generate-llms.mjs`, `scripts/patch-webmcp-manifest.mjs` (new); `astro-webmcp` in `astro.config.mjs`; `src/lib/useWebMCPTool.js` (new); `src/tools/subnet-calculator/island.jsx`, `src/tools/base64/island.jsx` |
| **Pinned by** | `src/tools/llms.test.js`, `src/tools/webmcp.test.js`, `src/lib/useWebMCPTool.test.jsx` (all new) |
| **Landed** | owner decision, 2026-08-22 |

Additive, no fixture diverged. The build now ships `/llms.txt`,
`/llms-full.txt` and `/agents.md` (generated from the manifests + help
blocks, gitignored like the sitemap), plus `/_webmcp/manifest.json` and
`/.well-known/skills/index.json` from `astro-webmcp`, whose entries are
rewritten from the manifests post-build because its own dist scan cannot
read `build.format:'file'` pages. Every page's injected WebMCP client
registers site search/navigation tools on supporting browsers; the Subnet
Calculator and Base64 islands additionally register `calculate_subnet` and
`base64_encode`/`base64_decode` backed by their own `lib/` functions.
robots.txt deliberately unchanged (allow-all, owner decision).

### Tool help is a page, not a drawer

| | |
|---|---|
| **Where** | `src/pages/[tool]/help.astro` + `src/bridge/HelpArticle.jsx` (new); `src/bridge/ToolHelp.jsx` (now a link); `src/components/ui/help-dialog.jsx`, `src/components/ui/sheet.jsx` (deleted) |
| **Pinned by** | `e2e/help.spec.js` (rewritten), `src/tools/sitemap.test.js` (help URLs added) |
| **Landed** | owner decision, 2026-08-22 |

The slide-in help drawer is gone. Every tool's Help action is now a plain
link to `/<tool>/help`, a prerendered page rendering the same
`help:start`/`help:end` block of `docs/tools/<id>/README.md` at a full
reading measure, with jump chips per section and a back link. Why: the
drawer set its section headings in ALL-CAPS Space Mono (a Signal idiom
Stacks retired — mono is data only), capped the copy at 448px, and dimmed
the tool it was meant to be read alongside. The help pages are in the
sitemap and carry canonical + breadcrumb schema; for tools with param
deep-links the generated `_redirects` emits a `/help` self-rewrite ahead of
the `/:param` rewrite so Cloudflare serves the page rather than rewriting
it onto the tool. Field-level `HelpHint` tooltips are unchanged.

### Network Designer removed, replaced by the Subnet Calculator

| | |
|---|---|
| **Where** | `src/tools/subnet-calculator/` (new); `src/components/tools/network-designer/`, `src/tools/network-designer/`, `src/utils/network/` (deleted) |
| **Pinned by** | `src/tools/subnet-calculator/lib/*.test.js` + `__tests__/island.test.jsx` |
| **Landed** | owner decision, 2026-07-19 (Session 7) |

The Network Designer — saved multi-subnet plans, drag-reorder, diagram and
Terraform export — is gone, replaced by a **Subnet Calculator** in the mould
of the classic tools (mxtoolbox, calculator.net, davidc.net): full IPv4 *and*
IPv6 details for any address and prefix, plus a visual divide table with
split and join. `/subnet-calculator/:ip/:prefix` deep-links, and divide trees
share via the standard `?config` codec.

What a user can notice:

- **`/network-designer` 301-redirects** to `/subnet-calculator` (declared as
  `redirectFrom` in the manifest; the SPA serves a `<Navigate>`).
- **Saved networks are not deleted** — contract #3 holds; the nine legacy
  keys stay in localStorage and surface on `/delete` as unclaimed data — but
  no tool reads them any more, so saved plans are unreachable.
- **Old network-designer share URLs no longer restore a plan.**
- **Terraform export (AWS/Azure/VCD) is gone** with its generators and their
  Phase 0 characterization tests — the owner chose a pure calculator.
- `@dnd-kit`, `netmask` and `html2canvas` leave the dependency tree (they had
  no other consumers).

The three allocator entries that used to sit under *Open* died with the tool:
the aligned-block bug (`/25` offered for a 128-address gap at `.64` it could
not hold) is *not carried into* the calculator — its divide table splits into
exact halves, where the failure mode cannot exist — and the suspected
middle-vs-trailing gap off-by-one had already been investigated and found to
be no bug (both formulas were correct inclusive counts). The §A allocator lib
and suite, built as that port's first task, were deleted along with the
component they were extracted from.

### azure-kql filter ordering works, and custom templates round-trip

| | |
|---|---|
| **Where** | `src/tools/azure-kql/utils/queryGenerator.js`, `templateLoader.js` |
| **Pinned by** | `src/tools/azure-kql/utils/queryGenerator.test.js` |
| **Landed** | Phase 5, azure-kql port |

`FILTER_PRIORITY`'s keys are camelCase (`sourceIp`) while template fields are
PascalCase (`SourceIp`), so the priority lookup never hit: every filter got
default priority 99 and `| where` clauses came out in whatever order the
parameters happened to be typed. The lookup now normalises the first letter,
so generated queries order their filters as the priority table always
intended — a visible change to query text for multi-filter queries.

The Templates tab also stops being write-only: a saved custom template now
appears in its service's template list (category "Custom") and loads into
the builder. Custom templates persist as `rt:azure-kql:custom-templates`,
reading the pre-port `azure-kql-custom-templates` key forward.

### ssl-checker stops fabricating certificates when analysis is unavailable

| | |
|---|---|
| **Where** | `src/tools/ssl-checker/lib/sslApi.js` + the island |
| **Pinned by** | `src/tools/ssl-checker/__tests__/island.test.jsx` |
| **Landed** | Phase 4, ssl-checker port (pre-declared in *Planned* below) |

When the analysis worker was unreachable, the browser fallback returned an
*invented* assessment: grade B, a certificate with made-up validity dates,
issuer "Browser Verified Certificate Authority" — plausible details for a
check that never ran. It now returns a `connectivityOnly` result and the page
renders an honest state: **"Analysis unavailable — HTTPS connectivity
verified"**, with no grade, no certificate, and nothing cached as an
assessment (`isSSLDataComplete` now rejects probe results — the old code
counted them "always complete", which is exactly how the fabrication
propagated into cache and history).

### dns-lookup no longer offers providers it cannot query

| | |
|---|---|
| **Where** | `src/tools/dns-lookup/` (island + `DNSLookupForm`), `apiConfig.json` |
| **Pinned by** | `src/tools/dns-lookup/__tests__/island.test.jsx` |
| **Landed** | Phase 4, dns-lookup port (pre-declared in *Planned* below) |

"OpenDNS (208.67.222.222)" and "Browser Default" were listed as providers and
both silently queried `dns.google` — OpenDNS has no public DoH JSON API. Both
options are removed rather than relabelled; Google and Cloudflare remain, and
a history entry recorded under a removed provider replays via Google. The
`apiConfig.json` aliases that encoded the lie are gone.

### `convertToCSV` keeps falsy cells

| | |
|---|---|
| **Where** | `src/tools/markdown-table-tool/utils/csvParser.js` |
| **Pinned by** | `csvParser.test.js` (fixture updated in the same PR) |
| **Landed** | Phase 3, markdown-table port |

Cells were coerced with `String(field \|\| '')`, so a numeric `0` and a
boolean `false` exported as empty cells — any table with a genuine zero in it
exported wrong, silently. The coercion now tests for `null`/`undefined` only:
`0` exports as `0`, `false` as `false`, and empty stays empty. CSV, TSV and
the tab-delimiter path all inherit the fix through the shared `escapeField`.

In the same port, `MarkdownPreview` warnings now render with the `warning`
alert variant — they rendered as info, so a warning was indistinguishable
from a note.

### `/base64/:input` now decodes a base64 payload on mount

| | |
|---|---|
| **Where** | `src/tools/base64/island.jsx` (the Phase 3 port) |
| **Pinned by** | `src/tools/base64/__tests__/island.test.jsx` |
| **Landed** | Phase 3, base64 port |

A deep link whose param was valid base64 used to be processed with the
component's *initial* mode (`encode`) while a separate auto-detect effect
flipped the visible switch to Decode — so the page showed a Decode toggle
above the payload **re-encoded**. Verified against the live component before
the port (input `SGVsbG8gd29ybGQ=` produced output
`U0dWc2JHOGdkMjl5YkdRPQ==`, switch on Decode).

Now the mount effect makes the same decision the auto-detect makes — base64
decodes, anything else encodes — and processes with it, which is what the
plan's frozen-contract note always said this route was for. A plain-text
param behaves exactly as before.

---

### The index filter promotes one group instead of hiding the other four

| | |
|---|---|
| **Where** | `src/pages/index.astro`, `src/styles/shell.css` |
| **Pinned by** | `e2e/deeplinks.spec.js` (three index tests), `src/styles/category-accent.test.js` |
| **Landed** | Post-cutover, index critique follow-up |

Clicking a category chip used to set `hidden` on every other group. On
`/#content` — one tool of fifteen — that left a single card in the top-left
corner of an otherwise empty viewport, about 85% of the page blank under a
full-width hairline rule that drew attention to it. That is precisely the
failure DESIGN.md's **No Void Rule** names, occurring on the page's own
primary interaction, and it also worked against the index's job of showing a
visitor that the other fourteen tools exist.

The selected group is now promoted and the rest are demoted to a row of
counted, clickable group headings (`[data-demoted]`). Measured at 1280×800,
the gap above the footer went from ~85% of the viewport to 16.7%, and the
remaining space now sits *between* the promoted group and the demoted strip
rather than trailing below everything.

Three further changes ride with it, each observable:

- **The filter writes the URL.** `#category` via `pushState`, and the name
  filter rides in `?q=` via `replaceState` so a search is shareable without a
  history entry per keystroke. Back now clears the filter instead of leaving
  the site. The `hashchange` listener and the breadcrumb links that point at
  `/#microsoft-azure` already existed; only the control was silent.
- **The chips are a radio group**, not six `aria-pressed` toggles, with
  roving tabindex and arrow/Home/End keys. Six mutually exclusive filters
  were being announced as six independent switches.
- **Group counts moved conditionally.** DESIGN.md says the chips "carry the
  only index counts", so the group head shows a count *only* while demoted,
  where it is the affordance rather than a duplicate.

---

## Signal: the visual language replaced

`design_handoff_signal/` specified a replacement design language and it has been
applied. Almost all of it is presentational, but seven changes are observable
behaviour or a deliberate departure from the handoff, so they are logged here.

### The six alternate palettes are gone

Solarized, Catppuccin, Dracula, Nord, Tokyo Night and GitHub are retired, along
with the palette picker in the header. Signal ships **graphite dark** and **bone
light**, and the three-state system/light/dark toggle is unchanged.

`DEFAULT_PALETTE` was `catppuccin`, so this changes the look for *every*
returning visitor, not only the ones who had chosen a palette.
`russ-tools-palette` is deliberately **left in localStorage** rather than
deleted — nothing reads it, so a stored value degrades to the only theme pair
there is, and clearing a key the app no longer owns is not its business.
`StorageManager` must still not delete it; that is asserted in both
`StorageManager.test.jsx` and `e2e/deeplinks.spec.js`.

### Nine colours differ from the handoff

The handoff's palette failed 37 of the contrast assertions this repo enforces in
CI. Every correction preserves the hue exactly and moves only lightness; the
table and the measured ratios are in `DESIGN.md` under *Contrast corrections*.
The worst was `outline-strong` at **1.50:1** — Signal assigns it to the `select`
border, which is a WCAG 1.4.11 control boundary.

Three roles the handoff did not declare were added for the same reason:
`on-status` (ink on a solid status fill, which flips with the theme while the
accent's ink does not), `on-footer` / `on-footer-muted` (the footer is dark in
*both* themes, so light mode was putting `#16171b` text on a `#16171b` ground),
and the reinstated `*-subtle` tints, which twelve tool files already used and
the handoff dropped.

### The 3px panel rule is opt-in

DESIGN.md's `panel` in the handoff carries a 3px `rule` along its top. That
works on a page with one result panel, which is what the prototype drew. A tool
here stacks five to ten, and the CRON builder rendered as six bright stripes
down the page, none of which signalled anything because they all did. The rule
moved to `panel-emphasis` / `<Card emphasis>` and marks the one panel per page
that is the page's subject. Applied so far to the SSL grade and the CRON
generated expression.

### The tool tile dropped its badge strip

The index tile used to end with `tool.badges` ("A · AAAA · MX · TXT") above the
route path. Signal's tile has four elements and no room for it, and the solid
category block does the marking now. **The badges are still in the search
haystack**, so filtering by "MX" still finds the DNS tool — the string is no
longer drawn, not no longer indexed.

### Card entrance motion is gone

`rt-surface-enter`, `rt-content-enter` and the nth-child stagger are retired,
along with the `restage()` call that re-fired the stagger on filter. A ruled
grid arriving one cell at a time reads as a rendering fault. `.rt-enter-*`
survive as no-op class names so the ~50 call sites did not all have to change
at once; new code should not add them.

### Escape closes the mobile menu from anywhere

Previously the `keydown` listener was scoped to the menu, so Escape only worked
when focus was already inside it — which it was, but only because opening the
palette picker put it there. With the picker gone that became "Escape does
nothing", so the listener moved to `document` and is gated on the menu being
open. Strictly better than before.

### The brand mark stayed

The handoff's header and footer show a plain 14px chartreuse square. That is a
prototype stand-in for a logo it did not have access to — the handoff's own
Assets section says no new icons were drawn. `SiteMark` is kept and rendered in
the accent, which honours the intent without discarding an identity the
favicon, the OG cards and the web manifest all share.

---

## Planned, deliberate, not yet made

Called out in the plan so they are not mistaken for regressions when they land:

- ~~**network-designer subnet colours** (Phase 5)~~ — withdrawn: the tool was
  removed (see *Network Designer removed* above), so the `{name, index}` →
  hex migration and its share-URL shape upgrade are moot.
