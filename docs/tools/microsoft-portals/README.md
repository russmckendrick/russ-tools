# Microsoft Portals (GDAP)

Discover the Microsoft tenant for a domain and generate tenant-scoped links to Microsoft administration portals.

<!-- help:start -->

## Quick start

1. Enter a customer domain or email address and select **Search**.
2. Confirm the discovered domain, tenant ID, display name, and lookup method.
3. Filter the portal catalogue by category, tag, or favorites.
4. Open a portal in a new tab or copy its generated URL.
5. Star frequently used portals and use Recent Searches to switch tenants quickly.

## Tenant context and portal links

- The lookup resolves public Microsoft tenant metadata from the supplied domain.
- Portal URLs use the returned tenant ID or domain where that portal supports tenant scoping.
- The catalogue covers Azure, Microsoft 365, security, Power Platform, partner, and related administration surfaces.
- Grid and list views show the same generated links; filters only change which entries are visible.
- A generated link does not grant access. Microsoft still enforces the signed-in account's tenant role, GDAP relationship, and portal permissions.

## GDAP workflow tips

- Confirm the tenant name and ID before opening an administrative portal, especially when working across similarly named customers.
- Use favorites for the portals in your normal support workflow, then combine them with category or tag filters.
- If a portal opens in the wrong account context, sign out of conflicting Microsoft sessions or use the browser profile intended for that customer.
- A deep link such as `/microsoft-portals/contoso.com` starts the lookup for that domain on load.

## Privacy and saved data

Tenant discovery is a network lookup through the configured Cloudflare Worker and public Microsoft metadata endpoints. Recent domains, a ten-minute lookup cache, and favorite portal choices are stored locally in this browser. Portal navigation is an explicit external action and follows the destination's Microsoft authentication flow.

## Troubleshooting

- If no tenant is found, verify the domain spelling and confirm it is associated with an active Microsoft tenant.
- If a portal returns an authorization error, check the signed-in account, required role, and GDAP relationship; changing the generated URL cannot add permission.
- If stale tenant details appear, retry after the ten-minute cache window or clear saved site data.

<!-- help:end -->

Portal definitions are documented in [data-structure.md](data-structure.md). The tool contract is defined in [`src/tools/microsoft-portals/manifest.mjs`](../../../src/tools/microsoft-portals/manifest.mjs).
