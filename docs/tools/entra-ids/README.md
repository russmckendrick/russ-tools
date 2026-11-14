# Entra ID Lookup

Paste a GUID from a sign-in log, a consent prompt or an app manifest and find out what it is. One search covers four kinds of identifier that Microsoft publishes, and every result says which kind it matched.

<!-- help:start -->

## Quick start

1. Paste a GUID, or type a name (`User.Read`, `Global Administrator`) or a sign-in error code (`AADSTS50076`).
2. Read the line above the results: it says what the identifier is.
3. Open a result for its IDs, description and the Microsoft page it came from. Every ID has a copy button.

A link such as `/entra-ids/00000003-0000-0000-c000-000000000000` opens straight on the answer.

## What it identifies

- **First-party application**: the application (client) ID, the name, other names Microsoft uses for the same ID, and the page that lists it.
- **Microsoft Graph permission**: the delegated scope ID and the application role ID, each with its display text, whether admin consent is required, and what it grants.
- **Directory role**: the role template ID, what the role can do, and whether Microsoft marks it privileged.
- **Sign-in error code**: the AADSTS code, its error name where Microsoft gives one, and its meaning.

Use the tabs to restrict the search to one kind, or leave it on **All**.

## Graph permissions have more than one ID

`Directory.Read.All` as a delegated scope and `Directory.Read.All` as an application role are different GUIDs with different consent rules. When you paste one, the result marks which side it is, because that decides whether the permission acts as the signed-in user or as the app itself. Resource-specific consent permissions (the ones ending `.Group` or `.Chat`) are listed too.

## When a GUID is not found

Not finding a GUID does not mean it is not Microsoft's. The tool knows only what Microsoft documents:

- **Applications** are the first-party IDs Microsoft tabulates across a handful of documentation pages, a few hundred of several thousand. There is no complete public list; the full set is only readable from inside a tenant.
- **Object IDs** from your own tenant (users, groups, service principals, your own app registrations) are never here. A service principal's object ID is different in every tenant; its application ID is not.
- **Permissions** are Microsoft Graph only, not the permissions of other APIs.
- The GUID may be an Azure RBAC role or a Microsoft 365 licence instead. The no-match message links to those tools with the GUID carried over.

## From the home page

Pasting a GUID into the box on the home page lists this tool first when the GUID is one it recognises, and last otherwise.

## Data freshness

The identifiers are re-pulled from Microsoft's documentation every week, and the date of the copy you are searching is shown under the search box.

Microsoft documents only a subset of AADSTS codes and rewords them. For a code that is not listed here, `https://login.microsoftonline.com/error` is the live source.

## Privacy and saved data

Nothing you paste leaves the browser. The tool does not use localStorage and makes no network lookups.

<!-- help:end -->

## Implementation notes

`pnpm refresh:entra-ids` rebuilds the dataset from Microsoft's documentation:

- Directory roles: the Microsoft Entra built-in roles reference (`MicrosoftDocs/entra-docs`, `docs/identity/role-based-access-control/permissions-reference.md`)
- Graph permissions: the Microsoft Graph permissions reference (`microsoftgraph/microsoft-graph-docs-contrib`, `concepts/permissions-reference.md`)
- Error codes: the Microsoft Entra authentication and authorization error codes reference (`MicrosoftDocs/entra-docs`, `docs/identity-platform/reference-error-codes.md`)
- Applications, merged from six pages: Power Platform's "Commonly used Microsoft first-party services and portal apps", "Verify first-party Microsoft applications in sign-in reports", the mandatory multifactor authentication page, the Conditional Access target resources page, the Microsoft Dev Box Conditional Access page, and the Microsoft 365 client application IDs table. Microsoft Graph's own ID is read from the permissions reference.

The exact URLs are in the header and `APP_SOURCES` of `scripts/refresh-entra-ids.mjs`. Counts are not written down anywhere: the tool reports them from the data.

- `lib/entraIds.js` flattens the dataset into searchable entries and classifies the query (GUID, GUID prefix, error code, text).
- `lib/idIndex.js` reads `entra-id-index.json`, the GUIDs alone (about 65 kB), which `src/lib/paste.js` loads on demand to rank this tool for a pasted GUID.
- `entra-ids.json` (about 670 kB before compression) is a dynamic import, so the page shell renders before it arrives.
- The Conditional Access explainer keeps its own smaller file, `entra-well-known-ids.json`, written by the same script. Its application list is typed in the script, and each row cites a Microsoft page that the run checks.
- WebMCP tool: `lookup_entra_id`.
