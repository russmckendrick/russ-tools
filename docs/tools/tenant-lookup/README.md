# Microsoft Tenant Lookup

Discover the public Microsoft tenant metadata, authentication endpoints, DNS configuration, and service signals associated with a domain.

<!-- help:start -->

## Quick start

1. Enter a domain such as `contoso.com` or an email address such as `user@contoso.com`.
2. Select **Lookup Tenant** or press Enter.
3. Review Tenant Info first, then inspect DNS Analysis, Service Verification, API Results, and Raw Data where available.
4. Copy identifiers or raw results from the relevant result panel.
5. Save a useful lookup locally so it can be loaded again without repeating the request.

## Understanding the tabs

- **Tenant Info** shows the tenant ID, display name, domain, tenant type, and other discovered organization metadata.
- **DNS Analysis** summarizes Microsoft-related MX, TXT, SPF, and other available DNS evidence.
- **Service Verification** interprets relevant TXT records as service-verification signals.
- **API Results** exposes which discovery endpoints responded; **Raw Data** provides the complete returned structure for debugging.
- Missing optional tabs mean that the corresponding data was not present in this lookup, not that the interface failed to render them.

## Lookup tips

- An email address is reduced to the domain after its final `@`; no mailbox lookup is performed.
- Public tenant metadata can confirm association and federation details, but it does not prove ownership or grant access.
- Use the Microsoft Portals tool after confirming a tenant when you need tenant-scoped administration links.
- A deep link such as `/tenant-lookup/contoso.com` starts that domain lookup when the page opens.

## Privacy and saved data

The domain is sent through the configured Cloudflare Worker to public Microsoft and DNS discovery endpoints. Results are not automatically retained, but selecting Save stores the complete lookup locally in this browser. Remove individual saved entries or use Clear All when they are no longer needed.

## Troubleshooting

- If no tenant is found, verify the spelling and confirm the domain is associated with Microsoft 365 or Entra ID.
- A network error can come from the browser, the Worker, Microsoft, or DNS; retry after checking connectivity.
- Federation and DNS results reflect public configuration and may lag behind recent tenant changes because of upstream caching.

<!-- help:end -->

The lookup uses the shared `useLookupTool` request lifecycle while saved lookups remain an explicit user action. The tool contract is defined in [`src/tools/tenant-lookup/manifest.mjs`](../../../src/tools/tenant-lookup/manifest.mjs).
