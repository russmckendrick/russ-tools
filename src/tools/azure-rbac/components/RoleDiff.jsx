import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { diffRoles, BUCKETS } from '../lib/rbac.js';

const BUCKET_LABEL = {
  actions: 'Actions',
  notActions: 'NotActions',
  dataActions: 'DataActions',
  notDataActions: 'NotDataActions',
};

/** One column of a bucket's diff. Empty columns still render, so the three-way
 * split stays aligned across buckets and a gap reads as "none" rather than as
 * a rendering slip. */
function Column({ title, items, tone }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-label-caps text-muted-foreground">{title}</span>
        <Badge variant={tone}>{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">None</p>
      ) : (
        <ul className="space-y-1">
          {items.map((a) => (
            <li key={a} className="font-mono text-data-sm break-all">
              {a}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Two roles, bucket by bucket.
 *
 * The interesting answer is nearly always in the exclusive columns — what one
 * role has that the other does not — so those carry the badge tone and the
 * shared column stays neutral.
 */
export function RoleDiff({ a, b }) {
  const diff = useMemo(() => diffRoles(a, b), [a, b]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {a.name} vs {b.name}
        </CardTitle>
        <CardDescription>
          {a.name} grants {a.breadth ?? '—'} catalogued operations; {b.name} grants{' '}
          {b.breadth ?? '—'}.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {BUCKETS.map((bucket) => {
          const d = diff[bucket];
          const total = d.shared.length + d.onlyA.length + d.onlyB.length;
          if (total === 0) return null;

          return (
            <section key={bucket} className="space-y-3">
              <h3 className="text-title-sm">{BUCKET_LABEL[bucket]}</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <Column title={`Only ${a.name}`} items={d.onlyA} tone="warning" />
                <Column title="Shared" items={d.shared} tone="outline" />
                <Column title={`Only ${b.name}`} items={d.onlyB} tone="success" />
              </div>
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}
