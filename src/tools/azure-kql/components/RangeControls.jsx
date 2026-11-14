import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { MAX_ROWS } from '../lib/build.js';
import { TIME_PRESETS, spanLabel } from '../lib/time.js';

const stamp = (date) => date.toISOString().slice(0, 16);

function choose(value, onTime) {
  if (value === 'portal') return onTime({ kind: 'portal' });
  if (value === 'custom') {
    const now = new Date();
    return onTime({ kind: 'absolute', from: stamp(new Date(now.getTime() - 86400000)), to: stamp(now) });
  }
  return onTime({ kind: 'relative', span: value });
}

export default function RangeControls({ time, limit, showLimit, onTime, onLimit }) {
  const value = time.kind === 'relative' ? time.span : time.kind === 'absolute' ? 'custom' : 'portal';
  const spans = TIME_PRESETS.includes(value) || time.kind !== 'relative' ? TIME_PRESETS : [value, ...TIME_PRESETS];

  return (
    <>
      <div className={cn('flex min-w-0 flex-col gap-1.5', !showLimit && 'col-span-2 sm:col-span-1')}>
        <Label htmlFor="kql-time">Time range</Label>
        <Select value={value} onValueChange={(next) => next && choose(next, onTime)}>
          <SelectTrigger id="kql-time">
            <SelectValue />
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
      {showLimit && (
        <div className="flex min-w-0 flex-col gap-1.5">
          <Label htmlFor="kql-limit">Rows</Label>
          <Input
            id="kql-limit"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_ROWS}
            value={limit}
            onChange={(event) => onLimit(event.target.value)}
          />
        </div>
      )}
      {time.kind === 'absolute' && (
        <div className="col-span-full grid gap-3 sm:grid-cols-2">
          {[
            ['from', 'From (UTC)'],
            ['to', 'To (UTC)'],
          ].map(([key, label]) => (
            <div key={key} className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor={`kql-time-${key}`}>{label}</Label>
              <Input
                id={`kql-time-${key}`}
                type="datetime-local"
                value={time[key] ?? ''}
                onChange={(event) => onTime({ ...time, [key]: event.target.value })}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
