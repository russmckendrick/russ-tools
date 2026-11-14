# Azure Regions and VM Sizes

Two Azure references in one place: the region list, with pairs and availability zones, and the VM size tables, with each size name decoded. Both are dated snapshots of what Microsoft publishes, searched in the browser.

<!-- help:start -->

## Quick start

1. Type a region (`uksouth`, `West Europe`, `London`) or open **VM sizes** and type a size (`Standard_D4s_v5`).
2. Select a row to open it: a region shows its pair and codes, a size shows its name decoded and its specification.
3. Copy the programmatic name or size name with the copy button beside it.

A link such as `/azure-regions/uksouth` or `/azure-regions/Standard_D4s_v5` opens straight on that region or size.

## Regions

- Search matches the programmatic name, the display name, the geography, the area and the physical location.
- Filter by area (Americas, Europe, Asia Pacific and so on), by geography, or to regions with availability zones.
- Selecting a region shows its paired region, how many availability zones it has, and where it is.
- **Naming short code** is the abbreviation this site's Azure Naming tool uses for the region (`uks` for UK South). It is a naming convention, not a Microsoft identifier, and newer regions may not have one yet.
- A pair can be named without being in the list. Sweden South is Sweden Central's pair, but it is not a region you can deploy to, so it has no row of its own.
- **Restricted access** marks regions Microsoft reserves for specific scenarios, such as disaster recovery within a geography.

## The map

The map draws every region Microsoft publishes a position for. A filled marker has availability zones; a hollow one does not.

- Select a marker to open that region. Its paired region gets a dashed ring and a line between the two.
- Filtering the list zooms the map to what is left, so choosing an area or typing `germany` frames it.
- Drag to move the map and use the buttons above it to zoom or reset. On a phone the map is taller than the world is wide, so it opens on Europe and Africa and you drag sideways for the rest.
- Regions with no published position are listed under the map by name and can be opened from there. They are mostly the restricted pairs, such as Norway West and UAE Central.

Marker positions are Microsoft's own, from the data behind its datacentre globe. They mark the metropolitan area a region is named for, not a building. The map is drawn in the browser from a public-domain outline (Natural Earth), so no map tiles are requested and no third party sees your visit.

## VM sizes

- Search by size or series name. The `Standard_` prefix is optional.
- Filter by family prefix and by minimum vCPUs and memory. A size whose figure is not published never passes a minimum.
- The table shows vCPUs, memory, local temporary storage, the data-disk limit, and whether the series supports accelerated networking and premium storage.

## Reading a size name

Selecting a size, or typing a full name, decodes it using Microsoft's naming convention: family, subfamily, vCPUs, additive feature letters, accelerator type and version. In `Standard_D4s_v5`, `D` is the family, `4` the vCPUs, `s` means Premium SSD capable and `v5` is the version.

- The meaning of each letter is taken from Microsoft's naming-conventions article. A letter or segment that article does not list is shown as unlisted rather than guessed.
- Older series such as Dv2 number their sizes instead of counting vCPUs: `Standard_D3_v2` has four. When the published figure disagrees with the number in the name, the decoder says so.
- A name that is not in the tables is still decoded, and marked as not published.

## What is and is not covered

| Covered | Not covered |
| --- | --- |
| Every region in Microsoft's public-cloud regions list | Sovereign clouds (US Government, China) |
| A map position for the regions Microsoft's globe places | A position for the regions it does not place |
| Sizes tabulated in Microsoft's VM series articles | Which regions or zones offer a size |
| Series-level feature support | Prices, quotas and capacity restrictions |

Regional availability and prices come from Azure's Resource SKUs and Retail Prices APIs. The first needs a signed-in subscription, so this tool does not attempt it. Use `az vm list-skus --location <region>` for a definitive answer.

A handful of rows carry typing mistakes from the source articles (a missing family letter, for example). They are kept as published rather than corrected by hand.

## Data freshness

`pnpm refresh:azure-regions` rewrites both datasets from:

- `https://learn.microsoft.com/en-us/azure/reliability/regions-list` for regions
- `https://datacenters.microsoft.com/globe/data/geo/regions.json` for region coordinates
- Natural Earth's 1:110m land outline (`nvkelso/natural-earth-vector`, public domain) for the map
- the series articles in `MicrosoftDocs/azure-compute-docs` under `articles/virtual-machines/sizes` for sizes
- `articles/virtual-machines/vm-naming-conventions.md` and `sizes/overview.md` in the same repository for the letter meanings and families

The fetch date of each is shown at the top of the tool. Check it before relying on a figure for a production change.

## Privacy and saved data

Searches stay in the browser. The tool does not use localStorage and makes no network lookups.

<!-- help:end -->

## Implementation notes

- `lib/regions.js` and `lib/vmSizes.js` are pure functions over the two JSON files in `src/data/azure/`.
- `lib/map.js` holds the Equal Earth projection and the zoom and pan arithmetic. The refresh script imports its `project()` to draw the land outline, so the outline and the markers cannot disagree.
- `world-land.json` (about 50 kB) is one pre-projected SVG path, loaded after the island. There is no mapping library.
- `regions.json` loads with the island; `vm-sizes.json` (about 250 kB) loads when the VM sizes tab is first opened or a deep link names a size.
- Region short codes come from `src/utils/azure/region-parser.js`, the module the Azure Naming tool already uses, so there is one list.
- WebMCP tools: `lookup_azure_region` and `lookup_azure_vm_size`.
