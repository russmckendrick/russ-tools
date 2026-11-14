# HTTP Security Headers

Request a public URL and read the security headers it answers with: what each one does, whether it is set, and what is wrong with the value when something is. The request is made by this site's server, because a browser will not show one site's response headers to another.

<!-- help:start -->

## Quick start

1. Enter a hostname such as `example.com`, or a full `http://` or `https://` URL. A bare hostname is requested over HTTPS.
2. Select **Check headers** or press Enter. The check takes up to eight seconds.
3. Read the counts at the top (passed, warnings, failed, notes), then the redirect chain, then each header in turn.
4. Use **Copy as JSON** to keep the result, or **Recheck** from the history after changing the site.

Type `http://example.com` to see whether plain HTTP is redirected to HTTPS, and where.

## What is checked

- **Redirect chain**: every hop with its status code and `Location`, up to five redirects. A redirect from HTTPS back to HTTP is a failure; an HTTP redirect to another host before HTTPS is a warning.
- **Strict-Transport-Security**: fails when missing, unreadable, `max-age=0`, or served over plain HTTP. Warns when `max-age` is under a year. Says whether `includeSubDomains` and `preload` are set.
- **Content-Security-Policy**: fails when missing. Warns on `'unsafe-inline'` without a nonce or hash, `'unsafe-eval'`, a wildcard or bare `https:` script source, `data:` scripts, a policy that restricts no scripts, or a report-only policy standing in for a real one.
- **X-Content-Type-Options**: passes only on `nosniff`.
- **X-Frame-Options and CSP `frame-ancestors`**: one check, because either protects against clickjacking. Fails when neither is set; warns on `ALLOW-FROM`, which current browsers ignore.
- **Referrer-Policy** and **Permissions-Policy**: warn when missing, and when Referrer-Policy sends full URLs to other sites.
- **Cross-Origin-Opener-Policy, -Embedder-Policy and -Resource-Policy**: optional. A missing one is a note, not a warning.
- **Server and X-Powered-By**: warn when they give a version number. `X-AspNet-Version`, `X-AspNetMvc-Version` and `X-Generator` are listed when sent.
- **Cookies**: the `Secure`, `HttpOnly`, `SameSite`, `Path`, `Domain` and prefix rules for each `Set-Cookie`. Names and flags only.

## Reading the result

There is no letter grade. A grade hides which header is wrong and rewards headers a site may not need; the counts say how many checks passed, warned and failed, and each row says why.

- **Fail**: a baseline protection is missing or switched off.
- **Warning**: the header is present and weak, or a recommended header is missing.
- **Note**: something optional is not set, or a header discloses a little and no version.
- **Pass**: set, with nothing to flag.

Only the final response is graded. Headers are read from one request to one URL: a site can send different headers on other paths, to signed-in users, or to other user agents. A `403` or `404` is still graded, because the headers on an error page matter too.

## Limits

- Public websites only. Addresses that are loopback, private, link-local or carrier-grade NAT, IP addresses of any kind, `localhost`, `.local` and `.internal` names, and cloud metadata addresses are refused, both for the address you enter and for every redirect. So are ports other than 80 and 443, and URLs carrying a username or password.
- The request is `HEAD`, then `GET` if the site refuses `HEAD`. The body is never read, so a policy set in a `<meta>` tag is not seen.
- No JavaScript runs and no cookies are sent, so this is the response a first-time visitor gets.
- The checker announces itself as `russ.tools-http-headers` in its User-Agent. A site that blocks unknown clients will answer with its block page.

## Privacy and saved data

This is one of the tools that leaves the browser. The URL you enter is sent to this site's own API, `/api/headers`, which resolves the hostname through Cloudflare DNS, requests the URL and returns the response headers. Cookie values are dropped on the server and never reach the page. Nothing is stored on the server.

Your recent checks and a five-minute result cache are kept in this browser's localStorage. **Clear history** removes the list.

<!-- help:end -->

## Implementation notes

- The lookup is the Pages Function `functions/api/headers.js`, built on `lookupHandler` like the other three. Target validation lives in `functions-lib/public-host.js`. Reference: `docs/cloudflare-workers/README.md#http-security-headers--apiheaders`.
- Grading is client-side, in `src/tools/http-headers/lib/analyse.js`: `analyse(result)` turns the API's response into checks, cookie findings and counts. The API returns facts only, so a change to a finding is not a contract change.
- `lib/target.js` cleans what was typed; `lib/headersApi.js` calls the API and turns a 400 refusal or a `success: false` body into a `HeadersCheckError` carrying the redirect chain reached so far.
- Tests: `lib/analyse.test.js`, `lib/target.test.js`, and for the server side `src/test/functions/headers.test.js` and `public-host.test.js`.
- The WebMCP tool is `check_http_security_headers`.
- Deep link: `/http-headers/:domain`. A hostname only; a path would need another segment.
