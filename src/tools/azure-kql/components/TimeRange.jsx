import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TIME_PRESETS, spanLabel } from '../lib/time.js';

const QUICK = ['1h', '24h', '7d', '30d'];
const stamp = (date) => date.toISOString().slice(0, 16);

function choose(value, onTime) {
  if (value === 'portal') return onTime({ kind: 'portal' });
  if (value === 'custom') {
    const now = new Date();
    return onTime({ kind: 'absolute', from: stamp(new Date(now.getTime() - 86400000)), to: stamp(now) });
  }
  return onTime({ kind: 'relative', span: value });
}

export default function TimeRange({ time, onTime }) {
  const value = time.kind === 'relative' ? time.span : time.kind === 'absolute' ? 'custom' : 'portal';
  const quick = QUICK.includes(value);
  const others = TIME_PRESETS.filter((span) => !QUICK.includes(span));
  const spans = quick || others.includes(value) || time.kind !== 'relative' ? others : [value, ...others];

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label id="kql-time-label">Time range</Label>
      <div id="kql-time" role="group" aria-labelledby="kql-time-label" className="flex flex-wrap items-center gap-1.5">
        {QUICK.map((span) => (
          <Button
            key={span}
            type="button"
            variant={value === span ? 'default' : 'outline'}
            className="h-9 px-3"
            aria-pressed={value === span}
            aria-label={spanLabel(span)}
            onClick={() => onTime({ kind: 'relative', span })}
          >
            {span}
          </Button>
        ))}
        <Select value={quick ? '' : value} onValueChange={(next) => next && choose(next, onTime)}>
          <SelectTrigger aria-label="Other time ranges" className="w-auto min-w-[6.5rem] flex-1 sm:flex-none">
            <SelectValue placeholder="Other" />
          </SelectTrigger>
          <SelectContent>
            {spans.map((span) => (
              <SelectItem key={span} value={span}>
                {spanLabel(span)}
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom range (UTC)</SelectItem>
            <SelectItem value="portal">Set in the portal</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {time.kind === 'absolute' && (
        <div className="kql-row-in mt-1.5 grid gap-2 sm:grid-cols-2">
          {[
            ['from', 'From (UTC)'],
            ['to', 'To (UTC)'],
          ].map(([key, label]) => (
            <Input
              key={key}
              type="datetime-local"
              aria-label={label}
              title={label}
              value={time[key] ?? ''}
              onChange={(event) => onTime({ ...time, [key]: event.target.value })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
