# BGP & ASN Explorer

Inspect how an address, prefix or autonomous system is observed in the global routing table.

<!-- help:start -->

## Quick start

1. Enter an IPv4 or IPv6 address, CIDR prefix, or ASN such as `AS3333`.
2. Select **Explore routing**.
3. Review origin ASNs, holder, observation times and RIS visibility.
4. Inspect related or announced prefixes and the RPKI result when available.

## Understanding results

RIPE RIS visibility is the number of route-collector peers observing a route, not a universal reachability guarantee. Multi-origin prefixes can legitimately list more than one ASN.

## RPKI

Valid means a Route Origin Authorization covers the exact prefix length and origin ASN. Unknown means no covering ROA was found. Invalid ASN and invalid length are materially different failure modes.

## Privacy and saved data

The resource being inspected is sent to the public RIPEstat Data API. Results are not written to localStorage.

## Troubleshooting

New announcements and withdrawals can take time to reach every collector. Compare important incident findings with your own routers or another looking glass.

<!-- help:end -->
