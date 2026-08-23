import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy } from 'lucide-react';

/**
 * A service plan and every SKU that carries it.
 *
 * This is the reverse lookup, and the reason the tool exists rather than a
 * bookmark to Microsoft's reference page: that page is ordered by product, so
 * "which licences would give this person Intune" means reading 620 rows by
 * eye. Here it is one query.
 */
export function PlanDetail({ plan, skus, onCopy, onSkuSelect }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{plan.friendly || plan.name}</CardTitle>
            <CardDescription>
              Included in {skus.length} {skus.length === 1 ? 'SKU' : 'SKUs'}
            </CardDescription>
          </div>
          <Badge variant="category">{plan.name}</Badge>
        </div>

        <div className="mt-4">
          <dt className="text-label-caps text-muted-foreground">Service plan ID</dt>
          <dd className="mt-1 flex items-center gap-2">
            <code className="font-mono text-data-sm break-all">{plan.id}</code>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Copy service plan ID"
              onClick={() => onCopy(plan.id, 'Service plan ID')}
            >
              <Copy aria-hidden="true" />
            </Button>
          </dd>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Part number</TableHead>
              <TableHead>SKU ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skus.map((sku) => (
              <TableRow key={sku.guid}>
                <TableCell>
                  <button
                    type="button"
                    className="text-left underline underline-offset-2 hover:text-primary-text"
                    onClick={() => onSkuSelect(sku.partNumber || sku.guid)}
                  >
                    {sku.name}
                  </button>
                </TableCell>
                <TableCell>
                  <code className="font-mono text-data-sm break-all">{sku.partNumber || '—'}</code>
                </TableCell>
                <TableCell>
                  <code className="font-mono text-data-sm break-all">{sku.guid}</code>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
