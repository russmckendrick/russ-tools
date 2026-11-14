import React, { useId, useState } from 'react';
import { Combine, Copy, Download, ListOrdered, Scissors, Share2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { formatIPv4, ipv4Details, maskFromPrefix } from '../lib/ipv4';
import { compressIPv6, ipv6Details } from '../lib/ipv6';
import { FAMILIES, formatCount, formatTotal } from '../lib/format';
import SplitTree from './SplitTree';
import SubnetPlanner from './SubnetPlanner';

/**
 * The davidc.net-style divide table: split a subnet in two, join halves back.
 *
 * Lifted out of `island.jsx`, where it was a hundred lines of inline JSX with
 * `setSplits` called from inside the row map. The split and join actions are
 * callbacks now, so this file computes and draws and the island owns the
 * state — which is what lets an empty-state ghost render it (see
 * `ui/ghost.jsx`), and is a better shape regardless.
 *
 * Row details are derived here rather than passed in: a row knows its address
 * and prefix, and deriving the rest is a pure call to the same `ipv4Details` /
 * `ipv6Details` the details panel uses. Passing thirteen fields per row to
 * avoid two function calls would be the wrong trade.
 *
 * @param {object} props
 * @param {number} props.family 4 or 6.
 * @param {object[]} props.rows Leaves of the split tree, in display order.
 * @param {boolean} props.joinable Whether anything has been split yet.
 * @param {Record<string, string>} [props.names] Labels by subnet key, from a plan.
 * @param {string} [props.cidr] The parent block, as the planner names it.
 * @param {object|null} [props.plan] The last allocation, while the divide still shows it.
 * @param {(requirements: object[]) => void} [props.onPlan]
 * @param {() => void} [props.onDownloadCsv]
 * @param {() => void} [props.onCopyMarkdown]
 * @param {(key: string) => void} props.onSplit
 * @param {(family: object, addr: bigint, prefix: number) => void} props.onJoin
 * @param {() => void} props.onShare
 */
export default function SubnetDivide({
  family,
  rows,
  joinable,
  names = {},
  cidr = '',
  plan = null,
  onSplit,
  onJoin,
  onShare,
  onPlan = () => {},
  onDownloadCsv = () => {},
  onCopyMarkdown = () => {},
}) {
  const v4 = family === 4;
  const plannerId = useId();
  const [planning, setPlanning] = useState(false);
  const labelled = rows.some((row) => names[row.key]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div>
            <h3 className="text-title-sm">Divide</h3>
            <p className="text-body-sm text-muted-foreground mt-1">
              Split any subnet in two, join halves back together, or plan subnets by size
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              aria-expanded={planning}
              aria-controls={plannerId}
              onClick={() => setPlanning((open) => !open)}
            >
              <ListOrdered className="mr-2 h-4 w-4" />
              Plan by size
            </Button>
            <Button size="sm" variant="outline" onClick={onShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Copy share link
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div id={plannerId} hidden={!planning}>
          <SubnetPlanner family={family} cidr={cidr} plan={plan} onPlan={onPlan} />
        </div>
        <SplitTree family={family} rows={rows} names={names} onSplit={onSplit} onJoin={onJoin} />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {labelled && <TableHead>Label</TableHead>}
                <TableHead>Subnet</TableHead>
                {v4 && <TableHead>Netmask</TableHead>}
                <TableHead>{v4 ? 'Usable range' : 'Range'}</TableHead>
                <TableHead className="text-right">{v4 ? 'Usable hosts' : 'Addresses'}</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const rowFamily = FAMILIES[family];
                const d = v4
                  ? ipv4Details(formatIPv4(Number(row.addr)), row.prefix)
                  : ipv6Details(compressIPv6(row.addr), row.prefix);
                const canJoin = joinable && row.depth > 0;

                return (
                  <TableRow key={row.key}>
                    {labelled && (
                      <TableCell className="max-w-48 truncate text-body-sm" title={names[row.key]}>
                        {names[row.key] ?? <span className="text-on-surface-faint">—</span>}
                      </TableCell>
                    )}
                    <TableCell
                      className="font-mono text-data-md whitespace-nowrap"
                      style={{ paddingLeft: `${row.depth * 16 + 13}px` }}
                    >
                      {row.key}
                    </TableCell>
                    {v4 && (
                      <TableCell className="font-mono text-data-md whitespace-nowrap">
                        {formatIPv4(maskFromPrefix(row.prefix))}
                      </TableCell>
                    )}
                    <TableCell className="font-mono text-data-md whitespace-nowrap">
                      {v4 ? `${d.firstHost} – ${d.lastHost}` : `${d.firstAddress} – ${d.lastAddress}`}
                    </TableCell>
                    <TableCell className="font-mono text-data-md text-right whitespace-nowrap">
                      {v4
                        ? formatCount(d.usableHosts)
                        : formatTotal(d.totalAddresses, row.prefix, 128)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="inline-flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!row.splittable}
                          onClick={() => onSplit(row.key)}
                          aria-label={`Split ${row.key}`}
                        >
                          <Scissors className="h-4 w-4 mr-1" />
                          Split
                        </Button>
                        {canJoin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Joining a leaf collapses its parent: the
                              // parent's key leaves the split set.
                              const parentPrefix = row.prefix - 1;
                              const parentSize = 1n << BigInt(rowFamily.bits - parentPrefix);
                              onJoin(rowFamily, (row.addr / parentSize) * parentSize, parentPrefix);
                            }}
                            aria-label={`Join ${row.key} with its sibling`}
                          >
                            <Combine className="h-4 w-4 mr-1" />
                            Join
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <p className="text-data-sm font-mono text-muted-foreground">
            {rows.length} subnet{rows.length === 1 ? '' : 's'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={onDownloadCsv}>
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </Button>
            <Button size="sm" variant="outline" onClick={onCopyMarkdown}>
              <Copy className="mr-2 h-4 w-4" />
              Copy as Markdown
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
