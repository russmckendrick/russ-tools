import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * A ruled row of headline figures: the three or four values a result is
 * usually read for, set large in mono above the full table.
 *
 * It is a description list, so a screen reader hears "Usable hosts, 1,022"
 * rather than two unrelated strings. The row closes with the ink rule that
 * heads every section on the index.
 *
 * `compact` drops the value to `data-lg` for results whose figures are long —
 * an IPv6 network does not fit a quarter of the row at `data-xl`.
 */
export function StatStrip({ className, compact = false, children, ...props }) {
  return (
    <dl
      data-compact={compact ? '' : undefined}
      className={cn(
        'group grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-x-8 border-b border-on-surface',
        className
      )}
      {...props}
    >
      {children}
    </dl>
  );
}

export function Stat({ label, value, accent = false, className }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1 py-4', className)}>
      <dt className="text-body-sm text-on-surface-faint">{label}</dt>
      <dd
        className={cn(
          'min-w-0 break-words font-mono text-data-xl group-data-[compact]:text-data-lg',
          accent ? 'text-primary-text' : 'text-on-surface'
        )}
      >
        {value}
      </dd>
    </div>
  );
}
