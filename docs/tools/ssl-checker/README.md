# SSL Certificate Checker

Request an SSL Labs assessment for a hostname and inspect its certificate, endpoints, chain, protocols, ciphers, and security findings.

<!-- help:start -->

## Quick start

1. Enter a hostname such as `example.com` without a path.
2. Select **Check SSL** or press Enter.
3. Wait for the assessment to complete; a fresh SSL Labs scan can take up to a few minutes.
4. Review the overall grade, certificate details, endpoint results, chain, protocols, ciphers, and warnings.
5. Re-run a recent domain from history when you need to compare its current result.

## Understanding results

- Grades summarize the server configuration reported by SSL Labs; endpoint warnings can reduce the grade.
- Certificate details cover subjects, issuers, names, validity, and chain information when the full assessment supplies them.
- Protocol and cipher sections show what the tested endpoint accepted, not what every client will negotiate.
- If the analysis service is unavailable, the browser may report **HTTPS connectivity verified**. That proves only that an HTTPS connection was possible; it is not a certificate inspection or security grade.

## Security tips

- Check every public hostname that terminates TLS, not just the parent domain.
- Treat expiry, hostname mismatch, incomplete chains, obsolete protocols, and weak ciphers as separate issues even when the headline grade looks acceptable.
- Re-test after changing a certificate or edge configuration, allowing time for caches and distributed endpoints to update.
- Use monitoring for production expiry alerts; this interactive check is a point-in-time assessment.

## Privacy and saved data

The hostname is sent to the configured analysis service through the Cloudflare Worker and may also be probed directly by the browser only when full analysis is unavailable. The last 50 checks and complete results cached for five minutes are stored locally in this browser. Partial connectivity-only results are not cached.

## Troubleshooting

- Enter only a hostname, not `https://`, a path, or a query string.
- If an assessment remains in progress, wait and retry; SSL Labs may be scanning the host or applying rate limits.
- If the browser can connect but the report is unavailable, do not infer certificate dates, issuer, ciphers, or grade from the connectivity-only result.

<!-- help:end -->

The fallback behavior is documented in [`docs/BEHAVIOR_CHANGES.md`](../../BEHAVIOR_CHANGES.md). The tool contract is defined in [`src/tools/ssl-checker/manifest.mjs`](../../../src/tools/ssl-checker/manifest.mjs).
