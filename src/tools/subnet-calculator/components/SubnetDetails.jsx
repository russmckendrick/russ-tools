import React from 'react';
import { Copy } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

/**
 * The subnet's full detail table — network address through reverse DNS.
 *
 * Lifted out of `island.jsx`, where it was inline JSX. It moved for two
 * reasons and only one of them is the ghost: a block this size reads better as
 * a named thing than as forty lines in the middle of a tool, and inline JSX
 * cannot be rendered anywhere else — which is what an empty-state ghost needs
 * it to do (see `ui/ghost.jsx`).
 *
 * Presentation only. Every value arrives computed; the two copy actions arrive
 * as callbacks, so this file knows nothing about clipboards or toasts.
 *
 * @param {object} props
 * @param {string} props.cidr
 * @param {number} props.family 4 or 6.
 * @param {[string, string][]} props.detailRows Label/value pairs, in order.
 * @param {() => void} props.onCopyDetails
 * @param {() => void} props.onCopyCidr
 */
export default function SubnetDetails({ cidr, family, detailRows, onCopyDetails, onCopyCidr }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-data-lg truncate">{cidr}</span>
            <Badge>IPv{family}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onCopyDetails}>
              <Copy className="mr-2 h-4 w-4" />
              Copy details
            </Button>
            <Button size="sm" variant="outline" onClick={onCopyCidr}>
              <Copy className="mr-2 h-4 w-4" />
              Copy CIDR
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {detailRows.map(([label, value]) => (
              <TableRow key={label}>
                <TableCell className="text-body-sm text-muted-foreground whitespace-nowrap">
                  {label}
                </TableCell>
                <TableCell className="font-mono text-data-md break-all select-all">
                  {value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
