# Azure KQL Query Builder

Build Kusto (KQL) queries for Azure Monitor Logs from ready-made scenarios with typed filters, or write KQL freely, then copy, save or share the result.

<!-- help:start -->

## Quick start

1. Choose a **Service**, then a **Scenario**. A complete query appears straight away.
2. Set the **Time range** and, for row and top-N queries, the number of **Rows**.
3. Add filters from **Add a filter**. The query and the sentence above it update as you type.
4. Select **Copy query** and paste it into the Logs blade of your Log Analytics workspace.

There is no Generate button and nothing is sent anywhere: the query is built in your browser and is never run.

## What it covers

- **Azure Firewall**: `AZFWNetworkRule`, `AZFWApplicationRule`, `AZFWNatRule`, `AZFWDnsQuery`, `AZFWThreatIntel`, `AZFWIdpsSignature`
- **Application Gateway**: `AGWAccessLogs`, `AGWFirewallLogs`, and `AzureDiagnostics` for gateways still logging there
- **VNet flow logs**: `NTANetAnalytics` (traffic analytics)
- **Entra ID sign-ins**: `SigninLogs`, `AADNonInteractiveUserSignInLogs`, `AADServicePrincipalSignInLogs`
- **Entra ID audit log**: `AuditLogs`
- **Activity log**: `AzureActivity`
- **Key Vault**: `AZKVAuditLogs`
- **Storage (blobs)**: `StorageBlobLogs`
- **App Service**: `AppServiceHTTPLogs`, `AppServiceConsoleLogs`, `AppServiceAppLogs`
- **Kubernetes (AKS)**: `ContainerLogV2`, `KubeEvents`, `KubePodInventory`, `AKSAudit`, `AKSControlPlane`
- **Azure Virtual Desktop**: `WVDConnections`, `WVDErrors`
- **Virtual machines**: `Heartbeat`

Scenarios come in three shapes: **rows** (newest first, or slowest first), **top-N summaries** (counts by caller, by rule, by status), and **time charts** (a count per bucket, with the bucket sized to the time range).

Table and column names are taken from Microsoft's Azure Monitor table reference. A table only holds data if the matching diagnostic setting or data collection rule sends it to your workspace, so an empty result usually means the log category is not enabled, not that the query is wrong.

## Filters

A filter is one column, one operator and a value. What you can choose depends on the column's type:

- **Text**: is, is not, equals in any case, contains, does not contain, has the term, starts with, ends with, is one of, is none of, matches regex, is empty, is not empty.
- **IP address**: is and is not take an address or a CIDR range (`10.0.0.0/8`), and a range becomes `ipv4_is_in_range`. Is one of takes a list of addresses and ranges. Is a private address and is a public address need no value. IPv6 addresses and ranges work for is and is not.
- **Port and number**: equals, not equals, greater or less than, between, and is one of. A port must be 0 to 65535.
- **One of a set**: columns with a documented set of values offer them as a list, and compare without regard to case.
- **True or false** and **date and time** columns have their own operators. Dates are UTC.

For is one of and is none of, separate values with commas or new lines.

A value that is not valid for its column says why underneath, and that filter is left out of the query until it is fixed, so what you copy always parses. Values are escaped for you: quotes and backslashes in a value cannot break out of the string.

Filters marked **from the scenario** are what make the scenario what it is (for example `Action == "Deny"` in Top denied flows). You can change or remove them like any other.

## Time range

- **Last 15 minutes to last 90 days** writes `TimeGenerated > ago(...)`.
- **Custom range (UTC)** writes `TimeGenerated between (datetime(...) .. datetime(...))`.
- **Set in the portal** writes no time filter, so the time picker in the Logs blade decides.

## Write KQL

**Write KQL** is a plain editor with the same highlighting, copy, save and download. Use **Edit as KQL** on a built query to carry it across and change it by hand. Nothing you write there is checked or altered. Going back to **Build** keeps both.

## Saved and recent

- **Save** keeps the query under a name, with its filters, so it reopens in the builder. Rename or delete it from the list; a delete can be undone from the notice that appears.
- **Recent** records each query you copy or download, newest first, up to 50.
- Both lists are kept in this browser only. Use the Saved data page to clear them.
- Favourites, history and custom templates from the earlier version of this tool are carried over the first time you open it. Custom templates become saved KQL queries.

## Sharing and deep links

**Share Configuration**, beside Help, copies a link that reopens the same service, scenario, time range, rows and filters, or the KQL you wrote. Everything in the link is in the address itself, so check the filter values before sending it to someone.

`/azure-kql/<service>` opens a service and `/azure-kql/<service>/<scenario>` opens one scenario, for example `/azure-kql/entra-sign-ins/failed`.

## What it does not do

- It does not run queries or connect to Azure.
- It does not open the query in the portal. Microsoft publishes no link format for the Logs blade, and the ones the portal generates need your workspace's resource ID, so copy and paste is the reliable route.
- It does not cover NSG flow logs in `AzureNetworkAnalytics_CL`, which is outside the table reference. VNet flow logs are covered.

## Troubleshooting

- **"Failed to resolve table"** in Log Analytics: the table does not exist in that workspace yet. Enable the resource-specific log category on the resource.
- **No rows**: widen the time range, remove filters one at a time, and check the casing of exact-match values. Text comparisons with "is" are case-sensitive; "equals (any case)" and "contains" are not.
- **A filter is missing from the query**: look for the message under it.
- **An old link opens with a filter flagged**: the earlier version accepted values the table does not have. Change or remove the flagged filter.

<!-- help:end -->

## For maintainers

The tool contract is [`src/tools/azure-kql/manifest.mjs`](../../../src/tools/azure-kql/manifest.mjs). Everything that decides what a query says is plain JavaScript in `src/tools/azure-kql/lib/`, with tests beside it.

| File | What it holds |
|---|---|
| `lib/catalog/*.js`, `lib/catalog.js` | Services and scenarios |
| `lib/columns.js` | Per-table notes: the most-used columns, and which columns are IPs, ports or sets |
| `lib/schema.js` | Column lookups over `src/data/microsoft/azure-monitor-tables.json` |
| `lib/operators.js`, `lib/values.js`, `lib/kql.js` | Operators per type, value parsing with messages, KQL literals and escaping |
| `lib/build.js`, `lib/time.js` | State to query text and its plain-English reading |
| `lib/state.js` | The reducer, and `portable` / `restore` for anything that leaves the page |
| `lib/library.js`, `lib/legacy.js` | Saved and recent queries, and the one-time read of the old store and templates |
| `lib/share.js` | Share links, new and old |
| `lib/webmcp.js` | The `build_kql_query` WebMCP tool |

**Adding a scenario.** Add it to the service in `lib/catalog/`, then add its exact query, line by line, to `lib/fixtures/scenarios.json`; `build.test.js` fails until every scenario is pinned there. `catalog.test.js` fails if the scenario names a table or column that is not in the reference data.

**Adding a table.** Add its name to `TABLES` in `scripts/refresh-kql-schemas.mjs`, run `pnpm refresh:kql-schemas`, and give it an entry in `lib/columns.js`. The script reads the table's page in the Azure Monitor table reference on Microsoft Learn; a column goes in the data only if that page lists it.

**Stable ids.** `azure-firewall/basic`, `azure-firewall/application`, `azure-virtual-desktop/basic` and `azure-application-gateway/basic` are the ids the previous version used in deep links, share links and saved data. Keep them resolving.
