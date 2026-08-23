# Email DNS Analyser

Check the DNS records that control mail delivery, authentication and transport policy for a domain.

<!-- help:start -->

## Quick start

1. Enter the mail domain, without an email address or URL.
2. Optionally enter a DKIM selector such as `selector1`.
3. Select **Analyse mail DNS**.
4. Review the evidence under Mail routing, SPF, DMARC, DKIM, MTA-STS and TLS reporting.

## Understanding findings

- Errors identify invalid or conflicting policy, such as multiple SPF records or an include loop.
- Warnings identify absent policy or configurations that deserve review.
- Informational findings describe optional transport and reporting signals.
- Success means the named record passed the check shown; it is not an end-to-end deliverability guarantee.

## SPF and DKIM limits

The SPF check follows include and redirect references and counts DNS-producing mechanisms across that graph. DKIM selectors cannot be discovered reliably from DNS, so the key check runs only when you provide a selector.

## Privacy and saved data

DNS names are queried through Google Public DNS over HTTPS. No message content is requested, uploaded or stored, and the tool writes nothing to localStorage.

## Troubleshooting

Enter the organizational mail domain rather than a host name from an MX record. If a selector is not found, confirm it from the sending service or a signed message header.

<!-- help:end -->
