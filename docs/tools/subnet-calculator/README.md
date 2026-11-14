# Subnet Calculator

Calculate IPv4 or IPv6 network details, divide a block visually by splitting and joining child subnets, and plan subnets by size (VLSM).

<!-- help:start -->

## Quick start

1. Enter an IPv4 or IPv6 address, with or without a CIDR prefix.
2. If the address has no prefix, choose one from the Prefix control or accept the default.
3. Select **Calculate** or press Enter.
4. Review the normalized network, range, masks, totals, address type, and reverse-DNS form.
5. Use the Divide table to split the network into halves or join siblings back together, or select **Plan by size** to have the subnets allocated for you.

## Calculation details

- The result is the network containing the entered address. For example, `192.168.1.130/25` belongs to `192.168.1.128/25`.
- IPv4 results include broadcast, usable-host range, netmask, wildcard mask, binary values, class, and PTR form.
- IPv6 results include the address range, expanded address and network, address type, totals, and nibble-aligned reverse-DNS form where applicable.
- **Split** replaces one row with its two equal children. **Join** collapses the selected leaf and its sibling back to their parent.

## Plan by size

**Plan by size** in the Divide panel is a VLSM planner: say what you need and the tool carves it out of the calculated network.

1. Select **Plan by size** and list what you need, one subnet per line: an optional name, then the number of hosts. For example `web 500`, `db 120`, `mgmt 60`, `p2p 2`.
2. Select **Allocate**. Each line gets the smallest subnet that holds it, largest first, each starting on its own boundary, packed from the start of the network.
3. Read the result under the list: how many were allocated, any that did not fit and why, and how much address space is left.

- The plan replaces the current divide and is drawn as ordinary splits, so the tree and the table show it and you can go on splitting or joining by hand.
- A named line carries its name into a **Label** column in the table and onto its block in the tree.
- Host counts are usable hosts. A subnet loses its network and broadcast addresses, so 500 hosts takes a `/23` (510 usable). Two hosts take a `/31` and one takes a `/32`, the same way the calculator counts them.
- To ask for an exact size, write a prefix in place of the count: `link /30`.
- For IPv6, list prefix lengths: `site /56`, `lan /64`, `link /127`.
- A name and its number can be separated by a space, comma, colon, tab or equals sign, so a column pasted from a spreadsheet works. Write counts without thousands separators (`1000`, not `1,000`).
- **Download CSV** and **Copy as Markdown** under the table export every row of the divide as it stands: label, subnet, netmask, range and host count.

## Subnetting tips

- Recalculating a different address or prefix starts a new divide tree.
- IPv4 `/31` and `/32` networks have special host semantics; use the displayed totals and ranges in the context of your protocol.
- IPv6 networks contain very large address counts, so the tool formats totals without converting them to unsafe JavaScript numbers.
- **Copy share link** preserves the calculated network, the current split tree and any labels in the URL.
- Recalculating clears the divide and its labels but keeps the list you typed, so a plan that did not fit can be run again against a larger network.

## Privacy and saved data

All arithmetic runs locally and the tool stores nothing in localStorage. Deep links expose the address and prefix in the path. A share link deliberately encodes the current network, split state and subnet labels in its `config` query parameter, so anyone receiving the URL can recover that state. Exports are built in the browser.

## Troubleshooting

- IPv4 prefixes must be 0–32 and IPv6 prefixes 0–128.
- If the prefix selector appears to disagree with the input, the explicit `/prefix` in the input takes precedence when you calculate.
- A subnet can only be joined with its sibling from the same split; unrelated adjacent blocks are not merged.
- If a requirement did not fit, it is either larger than the whole network or there was no room left after the larger ones. Calculate a shorter prefix (a bigger network) and allocate again.
- A plan is allocated largest first, so the subnets do not come out in the order you typed them. The labels say which is which.
- The tree is drawn for up to 32 blocks. A plan that leaves more than that, which a small prefix inside a large IPv6 network does, says so and still fills the table.

<!-- help:end -->

The calculator core is split across [`lib/ipv4.js`](../../../src/tools/subnet-calculator/lib/ipv4.js), [`lib/ipv6.js`](../../../src/tools/subnet-calculator/lib/ipv6.js), [`lib/divide.js`](../../../src/tools/subnet-calculator/lib/divide.js) and [`lib/plan.js`](../../../src/tools/subnet-calculator/lib/plan.js) (the allocator), with coverage for arithmetic, split/join behavior, deep links, and the share codec. The tool contract is defined in [`src/tools/subnet-calculator/manifest.mjs`](../../../src/tools/subnet-calculator/manifest.mjs).
