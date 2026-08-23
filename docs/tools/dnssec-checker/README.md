# DNSSEC & Delegation Checker

Compare a domain's DS and DNSKEY records and inspect the surrounding delegation.

<!-- help:start -->

## Quick start

1. Enter a delegated domain such as `example.com`.
2. Select **Check DNSSEC**.
3. Review the chain findings, key tags and DS digests.
4. Inspect the delegated name servers and their returned addresses.

## Chain results

A matching DS/DNSKEY pair means the published child key reproduces a digest in the parent delegation. The Authenticated Data flag reports whether the recursive resolver validated the returned address answer.

## Delegation checks

The tool checks for multiple NS records, visible A or AAAA addresses for each name server, and an SOA record. It uses a recursive resolver and does not claim to detect every lame or inconsistent authoritative server.

## Privacy and saved data

DNS names are queried through Google Public DNS over HTTPS. Results are kept in memory for the open page only and are not written to localStorage.

## Troubleshooting

A recently changed DS or DNSKEY can appear inconsistent while caches expire. Recheck after the relevant TTL and verify registrar-side DS values before changing keys again.

<!-- help:end -->
