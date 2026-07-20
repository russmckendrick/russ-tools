# DNS Lookup Tool

Query common DNS record types through Google or Cloudflare DNS over HTTPS and keep a local lookup history.

<!-- help:start -->

## Quick start

1. Enter a domain or host name such as `example.com` or `mail.example.com`.
2. Choose the record type you want to inspect.
3. Choose Google DNS or Cloudflare DNS as the resolver.
4. Select **Lookup DNS** or press Enter.
5. Review the records, raw response details, and response metadata.

## Record types and providers

- **A** and **AAAA** map names to IPv4 and IPv6 addresses.
- **MX** identifies mail exchangers; lower preference values are tried first.
- **TXT** carries values such as SPF, DKIM, and service verification records.
- **CNAME** points a name at another canonical name; **NS** and **SOA** describe zone authority.
- **PTR** supports reverse-DNS data, **SRV** locates services, and **CAA** restricts certificate authorities.
- Google and Cloudflare may differ briefly because of cache location, propagation, or resolver policy.

## Lookup tips

- Query the exact host name involved in the problem; records at `example.com` and `www.example.com` can be different.
- Compare both providers when checking recent DNS changes.
- An empty answer can be a valid DNS response for the selected record type, not necessarily a failed lookup.
- Cache entries are scoped by domain, record type, and provider, so changing any of them performs or retrieves a distinct query.

## Privacy and saved data

DNS queries are sent over HTTPS to the selected public resolver. Lookup history and a five-minute response cache are stored locally in this browser. Clear history from the tool; saved data for all tools can also be managed from the site's Saved Data page.

## Troubleshooting

- If no records appear, verify the spelling and try A, AAAA, NS, or SOA to confirm the name exists.
- If a query times out, switch resolver and retry after checking the network connection.
- DNS answers are cached at several layers; compare TTLs and wait for propagation before assuming a change failed.

<!-- help:end -->

The current tool intentionally exposes only resolvers with a real public DNS-over-HTTPS JSON endpoint. The tool contract is defined in [`src/tools/dns-lookup/manifest.mjs`](../../../src/tools/dns-lookup/manifest.mjs).
