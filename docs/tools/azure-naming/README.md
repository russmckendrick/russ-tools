# Azure Resource Naming Tool

Generate names for Azure resources and validate them against resource-specific Cloud Adoption Framework constraints.

<!-- help:start -->

## Quick start

1. In **Name Builder**, search for and select one or more Azure resource types.
2. Complete the required naming components, including the workload and any fields required by your pattern.
3. Add optional environment, region, instance, project, owner, or cost information where your convention uses it.
4. Select **Generate Azure Resource Names**.
5. Review the generated names and validation messages, then copy or export the results.

## Resource rules and generated names

- Each Azure resource type has its own length, character, and uniqueness constraints.
- Region names are abbreviated from the current Azure region data before they enter a generated name.
- Selecting multiple resource types applies the same naming configuration to a related set of resources.
- **Generated Names** shows the output and validation status; **Saved Names** shows locally retained history.

## Naming tips

- Keep workload and project components short enough to leave room for resource-specific prefixes, suffixes, and instance values.
- Use the same component order across a deployment so related resources remain easy to scan.
- Validation confirms the selected resource type's naming rules; it does not confirm that a name is available in an Azure subscription.
- Use **Copy Configuration Share URL** to share the form state, then check the restored values before generating names.

## Privacy and saved data

Name generation and validation run in the browser. Generated-name history is stored locally. The tool loads its Azure resource and region reference data when this page opens, but it does not send your naming values to a service. A share URL contains the configuration you deliberately encode in it.

## Troubleshooting

- For a name that is too long, shorten the workload, project, owner, or other optional components.
- For invalid characters, follow the rule shown for the selected resource type; Azure services do not all permit the same separators.
- If generation is unavailable, wait for the resource reference data to finish loading and confirm at least one resource type and a workload are selected.

<!-- help:end -->

The rules engine and Azure reference data live under `src/utils/azure` and `src/data`. The tool contract is defined in [`src/tools/azure-naming/manifest.mjs`](../../../src/tools/azure-naming/manifest.mjs).
