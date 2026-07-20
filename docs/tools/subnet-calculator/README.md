# Subnet Calculator

Calculate IPv4 or IPv6 network details and divide a block visually by splitting and joining child subnets.

<!-- help:start -->

## Quick start

1. Enter an IPv4 or IPv6 address, with or without a CIDR prefix.
2. If the address has no prefix, choose one from the Prefix control or accept the default.
3. Select **Calculate** or press Enter.
4. Review the normalized network, range, masks, totals, address type, and reverse-DNS form.
5. Use the Divide table to split the network into halves or join siblings back together.

## Calculation details

- The result is the network containing the entered address. For example, `192.168.1.130/25` belongs to `192.168.1.128/25`.
- IPv4 results include broadcast, usable-host range, netmask, wildcard mask, binary values, class, and PTR form.
- IPv6 results include the address range, expanded address and network, address type, totals, and nibble-aligned reverse-DNS form where applicable.
- **Split** replaces one row with its two equal children. **Join** collapses the selected leaf and its sibling back to their parent.

## Subnetting tips

- Recalculating a different address or prefix starts a new divide tree.
- IPv4 `/31` and `/32` networks have special host semantics; use the displayed totals and ranges in the context of your protocol.
- IPv6 networks contain very large address counts, so the tool formats totals without converting them to unsafe JavaScript numbers.
- **Copy share link** preserves the calculated network and current split tree in the URL.

## Privacy and saved data

All arithmetic runs locally and the tool stores nothing in localStorage. Deep links expose the address and prefix in the path. A share link deliberately encodes the current network and split state in its `config` query parameter, so anyone receiving the URL can recover that state.

## Troubleshooting

- IPv4 prefixes must be 0–32 and IPv6 prefixes 0–128.
- If the prefix selector appears to disagree with the input, the explicit `/prefix` in the input takes precedence when you calculate.
- A subnet can only be joined with its sibling from the same split; unrelated adjacent blocks are not merged.

<!-- help:end -->

The calculator core is split across [`lib/ipv4.js`](../../../src/tools/subnet-calculator/lib/ipv4.js), [`lib/ipv6.js`](../../../src/tools/subnet-calculator/lib/ipv6.js), and [`lib/divide.js`](../../../src/tools/subnet-calculator/lib/divide.js), with coverage for arithmetic, split/join behavior, deep links, and the share codec. The tool contract is defined in [`src/tools/subnet-calculator/manifest.mjs`](../../../src/tools/subnet-calculator/manifest.mjs).
