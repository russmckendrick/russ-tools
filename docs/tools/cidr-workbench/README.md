# CIDR Workbench

Perform batch set operations over IPv4 and IPv6 ranges without uploading a firewall or routing list.

<!-- help:start -->

## Quick start

1. Paste one address, CIDR or explicit start-end range per line.
2. Choose Normalize, Subtract, Intersect or Gaps.
3. Add the second set when the selected operation needs one.
4. Copy or export the minimal CIDR result.

## Accepted input

IPv4 and IPv6 can be mixed. A bare address is treated as `/32` or `/128`; ranges use `start - end`; blank lines and lines beginning with `#` are ignored.

## Operations

Normalize merges overlaps and adjacent space before emitting the smallest exact CIDR set. Subtract removes the second set from the first. Intersect keeps only common space. Gaps reports unlisted space between the lowest and highest supplied blocks of each address family.

## Privacy and saved data

All parsing and arithmetic run in this tab. Nothing is uploaded or written to localStorage.

## Troubleshooting

The result never broadens the supplied address space merely to produce a shorter list. Fix any reported line errors before relying on the output in a firewall or route configuration.

<!-- help:end -->
