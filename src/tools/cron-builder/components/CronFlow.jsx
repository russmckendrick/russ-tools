import React from 'react';
import { FlowDiagram } from '@/components/ui/tree-diagram';
import { daysMatchEither } from '../lib/schedule.js';

const esc = (text) => String(text).replace(/"/g, '#quot;');

/**
 * The expression as the test cron runs every minute: does the minute match,
 * the hour, the month, the day — and if all do, run.
 *
 * The day is the part people get wrong, so it is the part worth drawing.
 * When both day-of-month and day-of-week are restricted, cron runs if
 * EITHER matches, not both; the two are drawn side by side for that case and
 * in line otherwise. A field that starts with a star (a stepped star too) does not
 * count as restricted, which is the Vixie cron rule `lib/schedule.js` uses
 * for the run times. A field left as `*` matches anything and is drawn
 * quietly.
 *
 * It restates the expression above it and the selectors below.
 *
 * @param {{ fields: {minute: string, hour: string, dayOfMonth: string, month: string, dayOfWeek: string} }} props
 */
export default function CronFlow({ fields }) {
  const gate = (id, name, value) =>
    `  ${id}{{"${name}<br/>${esc(value === '*' ? 'any' : value)}"}}${value === '*' ? ':::muted' : ''}`;
  const either = daysMatchEither(fields.dayOfMonth, fields.dayOfWeek);

  const lines = [
    'flowchart LR',
    '  tick(["every minute"])',
    gate('minute', 'minute', fields.minute),
    gate('hour', 'hour', fields.hour),
    gate('month', 'month', fields.month),
    gate('dom', 'day of month', fields.dayOfMonth),
    gate('dow', 'day of week', fields.dayOfWeek),
    '  run(["run"]):::accent',
    '  tick --> minute --> hour --> month',
  ];
  if (either) {
    lines.push('  month --> dom', '  month --> dow', '  dom -->|"either"| run', '  dow -->|"either"| run');
  } else {
    lines.push('  month --> dom --> dow --> run');
  }

  return (
    <FlowDiagram
      auto
      source={lines.join('\n')}
      label="The checks cron makes each minute before running the job"
      caption={
        either
          ? 'Day of month and day of week are both set, so the job runs when either matches.'
          : 'Every check must match for the job to run.'
      }
    />
  );
}
