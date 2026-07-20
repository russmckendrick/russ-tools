# Azure KQL Query Builder

Build Kusto Query Language queries for supported Azure services from guided templates, then copy, download, save, or open the result in Azure Portal.

<!-- help:start -->

## Quick start

1. Choose an Azure service in the Query Builder tab.
2. Select a template for the investigation or report you want to run.
3. Complete the required parameters and any useful optional filters.
4. Select **Generate Query** and review the KQL preview.
5. Copy or download the query, open it in Azure Portal, or add it to Favorites.

## Builder, favorites, history, and templates

- **Query Builder** combines a service template with your parameters and validates required values before generating KQL.
- **Favorites** keeps useful generated queries for reuse.
- **History** records generated queries and can load their service, template, parameters, and output back into the builder.
- **Templates** manages custom templates. A custom template must define the query pattern and any parameters it expects.

## Query tips

- Start with the narrowest practical time range; filtering `TimeGenerated` early reduces work in Log Analytics.
- Prefer exact values and selective filters to broad wildcard searches.
- Treat the generated query as a starting point and review it before running it against a production workspace.
- If **Open in Portal** cannot carry a long query reliably, copy the KQL and paste it into the Logs blade instead.
- A shared configuration URL contains the selected service, template, and parameter values. Review those values before sharing the link.

## Privacy and saved data

Query generation is client-side. The tool does not run the query or send its parameters to Azure. The local store retains builder state, history, and favorites in this browser. Opening Azure Portal is an explicit external action, and a share URL contains the configuration you chose to encode.

## Troubleshooting

- If a query will not generate, resolve the field-level validation messages and confirm every required parameter has a value.
- If a deep link selects a service but no template, choose one in the builder; not every service supports every template.
- If history or favorites do not persist, check that browser storage is enabled and has available space.

<!-- help:end -->

## Further documentation

- [User guide](user-guide.md)
- [Architecture](architecture.md)
- [Template development](template-development.md)
- [Azure Virtual Desktop queries](azure-virtual-desktop-queries.md)

The tool contract is defined in [`src/tools/azure-kql/manifest.mjs`](../../../src/tools/azure-kql/manifest.mjs).
