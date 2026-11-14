import * as React from 'react';

import { cn } from '@/lib/utils';
import { CopyButton } from './copy-button';

export function ValueList({ className, ...props }) {
  return <dl className={cn('divide-y divide-outline', className)} {...props} />;
}

export function ValueRow({ label, value, copyValue, note, mono = true, className, children }) {
  const hasCopy = copyValue !== undefined;
  const hasActions = hasCopy || Boolean(children);
  return (
    <div
      className={cn(
        'relative grid gap-x-4 gap-y-0.5 py-2 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center',
        className
      )}
    >
      <dt
        className={cn(
          'text-body-sm text-on-surface-muted',
          hasActions && 'flex min-h-8 items-center pr-28 sm:block sm:min-h-0 sm:pr-0'
        )}
      >
        {label}
      </dt>
      <dd className="min-w-0 sm:flex sm:items-center sm:justify-between sm:gap-3">
        <span className="block min-w-0">
          <span
            className={cn(
              'block text-on-surface [overflow-wrap:anywhere]',
              mono ? 'font-mono text-data-md' : 'text-body-md'
            )}
          >
            {value}
          </span>
          {note ? <span className="mt-0.5 block text-body-sm text-on-surface-muted">{note}</span> : null}
        </span>
        {hasActions ? (
          <span className="absolute right-0 top-2 flex items-center gap-1 sm:static sm:shrink-0">
            {children}
            {hasCopy ? <CopyButton value={copyValue} label={`Copy ${label}`} className="h-8 w-8" /> : null}
          </span>
        ) : null}
      </dd>
    </div>
  );
}
