# Microsoft Portals Data

This directory contains JSON files that define the portal links for the Microsoft Portals Tool, specifically designed for CSP (Cloud Solution Provider) partners.

## File Structure

- `azure-portals.json` - Azure Portal deep links
- `m365-portals.json` - Microsoft 365 Admin Center links  
- `power-platform-portals.json` - Power Platform and Dynamics 365 links
- `advanced-portals.json` - Advanced developer and specialized portal links

## JSON Schema

### Azure Portals (`azure-portals.json`)
```json
{
  "portalKey": {
    "name": "Display Name",
    "description": "Portal description",
    "category": "Category Name",
    "path": "/blade/path/to/portal"
  }
}
```

### Other Portals (`m365-portals.json`, `power-platform-portals.json`, `advanced-portals.json`)
```json
{
  "portalKey": {
    "name": "Display Name", 
    "url": "https://portal.url.com",
    "urlWithTenant": "https://portal.url.com/?tenantId={tenantId}", // Optional - for tenant-specific URLs
    "urlWithDomain": "https://portal.url.com/{domain}", // Optional - for domain-specific URLs
    "description": "Portal description",
    "category": "Category Name"
  }
}
```

## CSP Partner Features

This tool is specifically designed for CSP partners and includes:

- **Partner Centre URLs**: Direct links to manage customer tenants via Partner Centre
- **Tenant-specific URLs**: Automatic tenant ID substitution for customer access
- **Domain-specific URLs**: Support for customer domain-based URLs
- **Delegated Administration**: Links that work with delegated admin privileges

## Categories

- **General** - Main portal pages
- **Admin Centers** - Administrative portals
- **Resources** - Resource management
- **Identity** - Identity and access management
- **Security** - Security and compliance
- **Management** - General management tools
- **Monitoring** - Monitoring and diagnostics
- **Compute** - Compute resources
- **Storage** - Storage resources
- **Networking** - Network resources
- **Users** - User management
- **Power Platform** - Power Platform services
- **Dynamics 365** - Dynamics 365 applications
- **Developer** - Developer tools and services

## Adding New Portals

1. Choose the appropriate JSON file based on the portal type
2. Add a new entry with a unique key
3. Follow the JSON schema above
4. Use appropriate category from the list above
5. For Azure portals, use `path` instead of `url`
6. For tenant-specific URLs, use `{tenantId}` placeholder
7. For domain-specific URLs, use `{domain}` placeholder 