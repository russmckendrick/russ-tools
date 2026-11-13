import * as React from 'react';
import { cn } from '@/lib/utils';

const DAY = 86_400_000;

/** "3 days", "5 hours", "12 minutes" — the largest unit that is at least one. */
function span(ms) {
  const abs = Math.abs(ms);
  const pick = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'}`;
  if (abs >= DAY) return pick(Math.floor(abs / DAY), 'day');
  if (abs >= 3_600_000) return pick(Math.floor(abs / 3_600_000), 'hour');
  return pick(Math.max(1, Math.floor(abs / 60_000)), 'minute');
}

/**
 * A lifetime drawn as a line: where it starts, where it ends, and where now
 * falls between them. Used for a certificate's validity and a token's.
 *
 * The state is carried by words as well as colour — "Expired 3 days ago" —
 * so the bar is never the only thing saying so.
 *
 * @param {object} props
 * @param {Date|number|string} props.start
 * @param {Date|number|string} props.end
 * @param {number} [props.now]
 * @param {string} [props.startLabel]
 * @param {string} [props.endLabel]
 * @param {(d: Date) => string} [props.format]
 */
export function ValidityBar({
  start,
  end,
  now = Date.now(),
  startLabel = 'Valid from',
  endLabel = 'Valid until',
  format = (d) => d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
  className,
}) {
  const from = new Date(start);
  const to = new Date(end);
  const a = from.getTime();
  const b = to.getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return null;

  const elapsed = Math.min(1, Math.max(0, (now - a) / (b - a)));
  const expired = now > b;
  const early = now < a;
  const nearEnd = !expired && !early && elapsed > 0.9;

  const tone = expired ? 'error' : early || nearEnd ? 'warning' : 'success';
  const status = expired
    ? `Expired ${span(now - b)} ago`
    : early
      ? `Starts in ${span(a - now)}`
      : `${span(b - now)} left`;

  const fill = { error: 'bg-error', warning: 'bg-warning', success: 'bg-primary' }[tone];
  const ink = { error: 'text-error', warning: 'text-warning', success: 'text-primary-text' }[tone];

  return (
    <div className={cn('flex flex-col gap-2', className)} data-viz>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn('text-body-sm', ink)}>{status}</span>
        <span className="font-mono text-data-sm text-on-surface-faint">
          {Math.round(elapsed * 100)}% elapsed
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-surface-inset" aria-hidden="true">
        <div
          data-viz-fill
          className={cn('rt-grow h-full rounded-full', fill)}
          style={{ width: `${elapsed * 100}%` }}
        />
        {!expired && !early && (
          <div
            data-viz-fill
            className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-on-surface"
            style={{ left: `${elapsed * 100}%` }}
          />
        )}
      </div>
      <div className="flex justify-between gap-3 text-body-sm text-on-surface-faint">
        <span>
          {startLabel} <span className="font-mono text-data-sm text-on-surface">{format(from)}</span>
        </span>
        <span className="text-right">
          {endLabel} <span className="font-mono text-data-sm text-on-surface">{format(to)}</span>
        </span>
      </div>
    </div>
  );
}
