# WHOIS Lookup Tool

Look up public registration data for a domain or allocation and geolocation data for an IP address through the configured RDAP/WHOIS service.

<!-- help:start -->

## Quick start

1. Enter a domain, IPv4 address, or IPv6 address.
2. Select **Lookup** or press Enter.
3. Use **Information** for the normalized report and **Raw Data** for the complete returned JSON.
4. Copy or export the raw result when you need it for a ticket or investigation.
5. Repeat a recent query from history rather than entering it again.

## Understanding results

- Domain results can include registrar, registration and expiry dates, status codes, nameservers, contacts, DNSSEC, and source attribution.
- IP results can include the network allocation, organization, regional registry, route, location, and related metadata.
- Registrars and privacy services frequently redact contact fields; an absent value is not evidence that no registrant exists.
- Dates and status names are normalized for display, while Raw Data preserves the response structure supplied by the lookup service.

## Responsible lookup tips

- WHOIS and RDAP data is point-in-time public registry data and can be delayed, redacted, or inconsistent across sources.
- Confirm important ownership or incident-response findings with the authoritative registrar or regional internet registry.
- Respect provider rate limits and applicable privacy rules when using contact or registration information.
- A deep link such as `/whois-lookup/example.com` performs that query on load.

## Privacy and saved data

The query is sent to the configured Cloudflare Worker and its upstream lookup sources. The most recent 100 queries and a 30-minute result cache are stored locally in this browser. Exported JSON is saved wherever your browser downloads files and is then outside the app's storage controls.

## Troubleshooting

- Private, reserved, newly registered, or recently changed resources may return limited or no public data.
- If the service reports a rate limit or timeout, wait before retrying and use a cached result when suitable.
- For a malformed query, remove protocols, paths, ports, and surrounding punctuation; enter only the domain or IP address.

<!-- help:end -->

The request lifecycle and cache use the shared lookup hook; response normalization remains tool-specific. The tool contract is defined in [`src/tools/whois-lookup/manifest.mjs`](../../../src/tools/whois-lookup/manifest.mjs).
