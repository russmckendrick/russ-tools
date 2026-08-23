# DNS Zone File Linter

Paste a BIND-style master zone file to parse, lint and normalize it entirely in your browser. A second mode compares canonical record sets, so formatting-only changes do not obscure the records being added or removed.

<!-- help:start -->

## Quick start

1. Paste a BIND-style zone into **Lint and normalize**, or load the example.
2. Review errors and warnings, then inspect the canonical record list.
3. Use **Compare zones** to see records added and removed between revisions.

## Checks

- Missing or multiple SOA records and missing apex NS records
- CNAME records that coexist with other data or appear at the zone apex
- MX and SRV records that target IP literals
- MX or NS records that target an in-zone CNAME
- Duplicate records and inconsistent TTLs within an RRset
- SOA field and serial structure, plus unusual CAA forms

## Supported syntax

The parser understands `$ORIGIN`, `$TTL`, comments, quoted fields, parenthesized multiline records, inherited owner names, standard TTL suffixes and common DNS record types. It reports unsupported directives such as `$INCLUDE` and `$GENERATE`; it does not read files or expand templates.

## Limits

This is a static preflight check, not a replacement for loading the file into the exact authoritative name-server implementation you deploy. It does not perform live delegation checks, DNSSEC signing validation or implementation-specific directive expansion. Use the DNSSEC & Delegation Checker after publication for live-chain evidence.

## Privacy and saved data

Zone text and comparisons stay in the browser and are not saved to localStorage.

<!-- help:end -->
