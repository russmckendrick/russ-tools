# Azure Service Tags

Search Microsoft’s Azure Public service-tag dataset without sending the query anywhere. The checked-in snapshot makes lookups reproducible and keeps reverse IP searches fast in the browser.

<!-- help:start -->

## Quick start

1. Enter a tag, region, system service or individual IP address.
2. Select **Search snapshot** and choose a matching tag.
3. Inspect, copy or export the published IPv4 and IPv6 prefixes.

## Lookup

- Search by service-tag name, Azure region or system service.
- Enter an individual IPv4 or IPv6 address to find every matching tag.
- Select a result to inspect, copy or export its published CIDR prefixes.

## Compare snapshots

Load an older Microsoft service-tags JSON file to see prefixes added and removed per tag. The comparison runs locally and accepts either Microsoft’s original shape or this project’s normalized snapshot.

## Data freshness

The dataset is refreshed from Microsoft’s official download page with `pnpm refresh:azure-service-tags`. Each refresh records the source URL, date, global change number and per-tag metadata. The refresh script refuses an unexpectedly large tag-count drop as a guard against publishing a partial response.

This is published reference data, not a live Azure control-plane API. Check the displayed snapshot date before using the ranges in a production change.

## Privacy and saved data

Searches and snapshot comparisons stay in the browser. The tool does not use localStorage.

<!-- help:end -->
