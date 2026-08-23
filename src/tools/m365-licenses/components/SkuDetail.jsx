import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy } from 'lucide-react';

/**
 * One SKU, with every service plan it carries.
 *
 * The plan name (`INTUNE_A`) and the friendly name ("Microsoft Intune") are
 * both shown because they are what you meet in two different places: the
 * former in Graph and PowerShell output, the latter in the admin centre. A
 * table that showed only one of them would fail half the lookups people
 * arrive with.
 */
export function SkuDetail({ sku, plans, onCopy, onPlanSelect }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{sku.name}</CardTitle>
            <CardDescription>
              {plans.length} service {plans.length === 1 ? 'plan' : 'plans'}
            </CardDescription>
          </div>
          <Badge variant="category">{sku.partNumber}</Badge>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-label-caps text-muted-foreground">SKU ID (GUID)</dt>
            <dd className="mt-1 flex items-center gap-2">
              <code className="font-mono text-data-sm break-all">{sku.guid}</code>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Copy SKU GUID"
                onClick={() => onCopy(sku.guid, 'SKU GUID')}
              >
                <Copy aria-hidden="true" />
              </Button>
            </dd>
          </div>
          <div>
            <dt className="text-label-caps text-muted-foreground">Part number (String ID)</dt>
            <dd className="mt-1 flex items-center gap-2">
              <code className="font-mono text-data-sm break-all">{sku.partNumber}</code>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Copy part number"
                onClick={() => onCopy(sku.partNumber, 'Part number')}
              >
                <Copy aria-hidden="true" />
              </Button>
            </dd>
          </div>
        </dl>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service plan</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Service plan ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>{plan.friendly || '—'}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    className="font-mono text-data-sm underline underline-offset-2 hover:text-primary-text"
                    onClick={() => onPlanSelect(plan.name || plan.id)}
                  >
                    {plan.name || plan.id}
                  </button>
                </TableCell>
                <TableCell>
                  <code className="font-mono text-data-sm break-all">{plan.id}</code>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
