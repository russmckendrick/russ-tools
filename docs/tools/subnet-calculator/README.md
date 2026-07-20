# Subnet Calculator

## Overview

The Subnet Calculator takes a single IPv4 or IPv6 address with a prefix length and reports the
full details of the network that address falls in — netmask, wildcard mask, host ranges, binary
and hexadecimal forms, address classification and reverse DNS name. Below the details it renders
a visual divide table, in which any subnet can be split in two and the halves joined back
together again.

It replaces the retired Network Designer. `/network-designer` 301-redirects here.

All arithmetic is performed in the browser. The tool makes no network requests, and it writes
nothing to `localStorage` — state lives entirely in the URL.

## Purpose

- **Subnet details**: resolve an address and prefix to its network, range and mask
- **Dual stack**: the same calculation for IPv4 and IPv6, detected from the input
- **Address classification**: identify private, loopback, documentation and other special-use ranges
- **Network division**: split a block into successively smaller subnets and see the result as a table
- **Sharing**: reproduce a calculation, including a divide tree, from a URL alone

## Key Features

### 1. Address family detection

A single input field accepts either family. The input is parsed as IPv4 first, then IPv6; the
detected family is shown beneath the field as you type. Accepted forms are a bare address
(`10.0.0.0`, `2001:db8::1`) or an address with a prefix (`10.0.0.0/24`, `2001:db8::/48`).

If the input carries no prefix, the prefix comes from the prefix selector, and when that has not
been set, from the family default: **/24 for IPv4 and /64 for IPv6**. The selector offers every
valid prefix for the detected family — 0–32 for IPv4, 0–128 for IPv6.

An address that cannot be parsed produces an inline error rather than a result. IPv6 zone
identifiers (`%eth0`) are rejected.

### 2. IPv4 details

For an IPv4 address and prefix the details panel lists:

| Row | Notes |
|---|---|
| Network address | The address masked to the prefix |
| Usable host range | First and last usable host |
| Broadcast address | Shown as `—` for /31 and /32 |
| Total addresses | 2^(32 − prefix) |
| Usable hosts | Total − 2, with the exceptions below |
| Netmask | Dotted quad |
| Wildcard mask | The inverse of the netmask |
| Binary netmask | Dotted binary, octets separated |
| Binary address | Dotted binary, octets separated |
| Hex / integer | `0x` form and the unsigned 32-bit integer |
| Class | Classful letter A–E, informational only |
| Type | Special-use classification (see below) |
| Reverse DNS (PTR) | `…in-addr.arpa` name for the address |

Prefix edge cases follow the standards: a **/31** has two usable hosts and no broadcast address
(RFC 3021), and a **/32** is a single host with no broadcast address.

The `Type` row reports the first matching classification: limited broadcast, `0.0.0.0/8`
("this network", RFC 791), loopback, private (RFC 1918), shared/CGN (RFC 6598), link-local
(APIPA), documentation, benchmarking (RFC 2544), multicast, reserved Class E, or public.

### 3. IPv6 details

For IPv6 the panel lists the network address, the address range (first to last), the total
address count, the expanded (fully zero-padded) forms of both the address and the network, the
address type, and the `ip6.arpa` PTR name.

Addresses are rendered in RFC 5952 canonical form: lowercase, no leading zeros, and the longest
run of two or more zero groups compressed to `::`. Totals larger than 2^20 are shown as
`2^n (exact count)`.

The `Type` row reports: unspecified, loopback, IPv4-mapped, NAT64 (RFC 6052), documentation,
6to4, link-local, unique local (ULA), multicast, global unicast, or reserved.

### 4. Divide table

The divide table starts as a single row — the network you calculated. Each row offers:

- **Split**: replaces the row with its two halves at prefix + 1, the lower half first. Splitting
  is available until the prefix reaches the family maximum (/32 or /128), at which point the
  button is disabled.
- **Join**: collapses a row back into its parent, which removes the sibling as well as every
  subnet beneath either of them. Join is offered on any row below the root.

Splits nest: splitting one half leaves the other half untouched. Rows are indented by depth and
always listed in address order. A running count of the leaf subnets is printed below the table.

Each row shows the subnet in CIDR form, the netmask (IPv4 only), the usable host range (IPv4) or
address range (IPv6), and the usable host count (IPv4) or address count (IPv6).

### 5. Copy and share

- **Copy details** puts the whole details panel on the clipboard as aligned plain text, headed by
  the CIDR.
- **Copy CIDR** copies just the network CIDR.
- **Copy share link** produces a `?config=` URL that restores both the network and the current
  divide tree.

## Usage Instructions

### Basic calculation

1. Enter an address, with or without a prefix, in the input field.
2. If the address carried no prefix, pick one from the prefix selector, or accept the default.
3. Press **Calculate** (or Enter). The details panel and the divide table appear below.

Note that the tool reports the network the address belongs to. Entering `192.168.1.130/25`
yields the network `192.168.1.128/25`.

### Dividing a network

1. Calculate a parent block, for example `10.0.0.0/16`.
2. Press **Split** on the row you want to subdivide. It becomes `10.0.0.0/17` and `10.0.128.0/17`.
3. Split either half again as needed — splitting `10.0.0.0/17` gives `10.0.0.0/18` and
   `10.0.64.0/18`, leaving `10.0.128.0/17` intact.
4. Press **Join** on any row to merge it back with its sibling.

Recalculating (a new address or a new prefix) clears the divide tree.

### Deep links

Two parameterised routes are served, in addition to the bare `/subnet-calculator`:

```
/subnet-calculator/:ip
/subnet-calculator/:ip/:prefix
```

The tool calculates on load from these segments. Real examples:

| URL | Result |
|---|---|
| `/subnet-calculator/10.0.0.0` | No prefix given, so the IPv4 default applies — `10.0.0.0/24` |
| `/subnet-calculator/192.168.1.130/25` | The network the host falls in — `192.168.1.128/25`, netmask `255.255.255.128`, type "Private (RFC 1918)" |
| `/subnet-calculator/2001:db8::/48` | `2001:db8::/48`, type "Documentation" |
| `/subnet-calculator/2001:db8:abcd::/48` | `2001:db8:abcd::/48` |

The IPv6 address segment carries colons directly; both segments are URI-decoded, so an
encoded address works equally well.

### Redirects

`/network-designer` — and anything below it, such as `/network-designer/anything/here` — returns
a **301** to `/subnet-calculator`. The redirect is declared in the tool's manifest
(`redirectFrom`) and emitted into the static `_redirects` file at build time; the SPA serves the
same paths as router redirects.

### Share links

**Copy share link** encodes the current state into a `config` query parameter:

```
/subnet-calculator?config=<encoded>
```

The payload is `{ f, cidr, splits }` — the address family, the network CIDR, and the list of
split node keys. On load the tool decodes it, recalculates the network and restores the divide
tree. The `config` parameter is left in the address bar, so a restored link is itself shareable.

Split keys that do not sit inside the restored network are discarded, so a stale or hand-edited
payload cannot corrupt the table.

The codec is the shared one in `src/core/sharelink.js` and is a frozen contract:

```
safeStringify → pako.deflate (raw zlib, NOT gzip) → URL-safe base64, padding stripped
```

with a legacy fallback that reads the older uncompressed `btoa(JSON)` format. Do not change it —
it would break every link already shared.

## Technical Implementation

### Architecture

```
src/tools/subnet-calculator/
├── manifest.mjs        - routes, params, category, SEO, redirectFrom
├── island.jsx          - the React island: input, details panel, divide table
└── lib/
    ├── ipv4.js         - parse, format, mask, class, type, PTR, details
    ├── ipv6.js         - BigInt parse, RFC 5952 compress, expand, type, PTR, details
    └── divide.js       - the split tree (leaves, splitNode, joinNode, pruneSplits)
```

### IPv4 arithmetic

`ipv4.js` is pure and dependency-free. Addresses are unsigned 32-bit numbers, re-coerced with
`>>> 0` after every bitwise operation because JavaScript's bitwise operators are signed.
`ipv4Details(address, prefix)` returns the whole details object; `parseIPv4Cidr` splits an
`address/prefix` string, returning `null` for anything malformed and a `null` prefix when none
was given.

### IPv6 arithmetic

`ipv6.js` works in `BigInt`, since a 128-bit address does not fit in a `Number`. It parses full,
`::`-compressed, mixed-case and IPv4-tailed forms (`::ffff:192.0.2.1`), and rejects zone
identifiers. `compressIPv6` implements RFC 5952 canonical output — leftmost longest run wins on a
tie, and a single zero group is never compressed. `expandIPv6` produces the padded eight-group
form.

### The divide tree

`divide.js` does not store a tree. It stores the root block plus a `Set` of the node keys that
have been split, where a key is the canonical `network/prefix` string. Leaves are derived by
walking from the root and recursing wherever the key is in the set. That is what makes the state
serialisable as `{ cidr, splits: [...] }` for a share link.

Addresses are `BigInt` throughout, so IPv4 (32 bits) and IPv6 (128 bits) share one
implementation; the caller supplies a `family` object carrying `bits` and a `format` function.

- `leaves(family, root, splits)` — the ordered leaf list, each with `key`, `depth` and `splittable`
- `splitNode(splits, key)` — a new set with the node split
- `joinNode(family, splits, addr, prefix)` — removes the node and every descendant from the set
- `pruneSplits(family, root, keys)` — drops keys unreachable from the current root

## Data Storage and Privacy

### Local storage

The manifest declares `storageKeys: []` and `legacyKeys: []`. **The tool stores nothing in
`localStorage`.** It is stateless by design: results live in the URL, as deep-link segments or as
a `?config` share payload.

### Client-side processing

Every calculation runs in the browser. There is no API call, no Cloudflare Worker and no
server-side component — an address you enter is never transmitted anywhere. A share link only
carries data if you deliberately create one and send it.

## Testing

Behaviour is pinned by:

- `src/tools/subnet-calculator/lib/ipv4.test.js` — parsing, masks, classes, types, prefix edge cases
- `src/tools/subnet-calculator/lib/ipv6.test.js` — parsing, RFC 5952 compression, types, PTR
- `src/tools/subnet-calculator/lib/divide.test.js` — leaves, split, join and prune semantics
- `src/tools/subnet-calculator/__tests__/island.test.jsx` — deep links, split/join, `?config`
  restore, invalid input
- `e2e/deeplinks.spec.js` — the routes above, the `/network-designer` 301, and `?config` restore
  in a real browser
