import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Copy, Download, ChevronDown } from 'lucide-react';
import { BUCKETS } from '../lib/rbac.js';

/** What each bucket means, in a sentence someone can act on. */
const BUCKET_COPY = {
  actions: ['Actions', 'Management-plane operations this role allows.'],
  notActions: ['NotActions', 'Subtracted from Actions. These are not granted.'],
  dataActions: ['DataActions', 'Data-plane operations, such as reading a blob’s contents.'],
  notDataActions: ['NotDataActions', 'Subtracted from DataActions. These are not granted.'],
};

/**
 * One role, with each permission bucket in its own collapsible panel.
 *
 * Collapsible rather than four open lists because the spread is enormous —
 * Reader carries one pattern, Virtual Machine Contributor carries dozens — and
 * a role page that opens two screens deep buries the summary that answers most
 * questions.
 */
export function RoleDetail({ role, catalogueSize, onCopy, onExport }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{role.name}</CardTitle>
            <CardDescription>{role.description}</CardDescription>
          </div>
          <Badge variant="category">{role.category}</Badge>
        </div>

        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-label-caps text-muted-foreground">Role definition ID</dt>
            <dd className="mt-1 flex items-center gap-2">
              <code className="font-mono text-data-sm break-all">{role.id}</code>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Copy role definition ID"
                onClick={() => onCopy(role.id, 'Role definition ID')}
              >
                <Copy aria-hidden="true" />
              </Button>
            </dd>
          </div>
          <div>
            <dt className="text-label-caps text-muted-foreground">Breadth</dt>
            <dd className="mt-1 font-mono text-data-sm">
              grants {role.breadth ?? '—'}
              {catalogueSize ? ` of ${catalogueSize}` : ''} catalogued operations
            </dd>
          </div>
        </dl>

        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={() => onExport(role)}>
            <Download aria-hidden="true" />
            Export as custom role JSON
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {BUCKETS.map((bucket) => {
          const [label, blurb] = BUCKET_COPY[bucket];
          const items = role[bucket];
          if (items.length === 0) return null;

          return (
            <Collapsible key={bucket} defaultOpen={bucket === 'actions'}>
              <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-md border-2 border-rule px-3 py-2 text-left">
                <span className="flex flex-wrap items-baseline gap-2">
                  <span className="text-title-sm">{label}</span>
                  <span className="text-body-sm text-muted-foreground">{blurb}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline">{items.length}</Badge>
                  <ChevronDown aria-hidden="true" className="size-4" />
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="mt-2 space-y-1 px-3">
                  {items.map((action) => (
                    <li key={action} className="font-mono text-data-sm break-all">
                      {action}
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}
