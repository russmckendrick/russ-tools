import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { formatUntil, formatUtc, nextRuns, nextRunsOnLocalClock } from '../lib/schedule.js';

const TICK_MS = 15000;

const CLOCKS = [
  { value: 'utc', label: 'UTC' },
  { value: 'local', label: 'This device' },
];

const localZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local time';
  } catch {
    return 'local time';
  }
};

export default function UpcomingRuns({ expression, clock, onClockChange }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const result = useMemo(
    () => (clock === 'local' ? nextRunsOnLocalClock : nextRuns)(expression, now),
    [expression, now, clock],
  );
  const zone = useMemo(localZone, []);

  return (
    <section className="space-y-3 border-t border-outline pt-4" aria-label="Upcoming run times" data-upcoming-runs>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3 className="text-label-caps uppercase text-on-surface-faint">Next runs</h3>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-body-sm text-muted-foreground">Scheduler clock</span>
          {CLOCKS.map((option) => (
            <Button
              key={option.value}
              variant={clock === option.value ? 'secondary' : 'outline'}
              size="sm"
              aria-pressed={clock === option.value}
              onClick={() => onClockChange(option.value)}
              className={clock === option.value ? 'bg-surface-inset text-on-surface' : 'border-outline text-on-surface-muted'}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {!result.ok ? (
        <p className="text-body-sm text-muted-foreground">
          Run times cannot be worked out for this expression: {result.error}.
        </p>
      ) : result.runs.length === 0 ? (
        <p className="text-body-sm text-warning" data-never-runs>
          Never runs. No date in the next five years matches this expression.
        </p>
      ) : (
        <>
          <p className="text-body-sm text-on-surface">
            First run <span className="font-medium">{formatUntil(result.runs[0].getTime() - now.getTime())}</span>
          </p>
          <ol className="divide-y divide-outline border-y border-outline">
            {result.runs.map((run, index) => (
              <li
                key={run.getTime()}
                className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-baseline gap-x-3 gap-y-0.5 py-2 font-mono text-data-md sm:grid-cols-[1.25rem_auto_minmax(0,1fr)] sm:gap-x-6"
              >
                <span className="text-on-surface-faint">{index + 1}</span>
                <time dateTime={run.toISOString()} className="whitespace-nowrap text-on-surface">
                  {format(run, 'EEE d MMM yyyy, HH:mm')}
                </time>
                <span className="col-start-2 whitespace-nowrap text-on-surface-muted sm:col-start-3">
                  {formatUtc(run)}
                </span>
              </li>
            ))}
          </ol>
          {result.exhausted && (
            <p className="text-body-sm text-muted-foreground">No further runs in the next five years.</p>
          )}
        </>
      )}

      <p className="text-body-sm text-muted-foreground">
        {clock === 'local'
          ? `Worked out as if the scheduler keeps this device's time (${zone}).`
          : 'Worked out as if the scheduler keeps UTC, which most servers and hosted schedulers do.'}{' '}
        The first column is your local time ({zone}).
      </p>
    </section>
  );
}
