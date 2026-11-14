import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ValueList, ValueRow } from '@/components/ui/value-list';
import { useWebMCPTool, textResult } from '@/lib/useWebMCPTool';
import {
  UNITS,
  convertTimestamp,
  groupTimeZones,
  isValidTimeZone,
  listTimeZones,
  localTimeZone,
  parseTimestamp,
} from './lib/timestamp.js';

const CONVERT_TIMESTAMP_TOOL = {
  name: 'convert_timestamp',
  description:
    'Convert a Unix timestamp (seconds or milliseconds, detected by magnitude) or an ISO 8601 date into ' +
    'UTC, ISO 8601, RFC 2822, relative time and both epoch forms, in a given IANA time zone.',
  inputSchema: {
    type: 'object',
    properties: {
      value: { type: 'string', description: 'Epoch seconds, epoch milliseconds or an ISO 8601 date' },
      timeZone: { type: 'string', description: 'IANA time zone such as Europe/London; defaults to UTC' },
    },
    required: ['value'],
  },
  annotations: { readOnlyHint: true },
  execute: ({ value, timeZone = 'UTC' }) => {
    if (!isValidTimeZone(timeZone)) return textResult({ error: `Unknown time zone: ${timeZone}` });
    const parsed = parseTimestamp(String(value ?? ''), { timeZone });
    if (!parsed.ok) return textResult({ error: parsed.error || 'No value given.' });
    return textResult({ readAs: parsed.note, ...convertTimestamp(parsed.ms, { timeZone, locale: 'en-GB' }) });
  },
};

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

function NowCell({ label, value, read }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 py-2 md:py-0">
      <div className="min-w-0">
        <dt className="text-body-sm text-on-surface-muted">{label}</dt>
        <dd className="font-mono text-data-lg text-on-surface [overflow-wrap:anywhere]">{value}</dd>
      </div>
      <CopyButton value={read} label={`Copy the current ${label}`} className="h-8 w-8 shrink-0" />
    </div>
  );
}

function Readout({ controls, parsed, timeZone, onUseNow }) {
  const now = useNow();
  const live = !parsed.ok;
  const ms = live ? now : parsed.ms;
  const out = useMemo(() => convertTimestamp(ms, { timeZone, now }), [ms, timeZone, now]);
  const seconds = String(Math.floor(now / 1000));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <CardTitle>Now</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => onUseNow(seconds)}>
            Convert this moment
          </Button>
        </CardHeader>
        <CardContent>
          <dl className="grid divide-y divide-outline md:grid-cols-[1fr_1fr_1.5fr] md:gap-x-8 md:divide-y-0">
            <NowCell label="Epoch seconds" value={seconds} read={() => String(Math.floor(Date.now() / 1000))} />
            <NowCell label="Epoch milliseconds" value={String(now)} read={() => String(Date.now())} />
            <NowCell
              label="ISO 8601"
              value={`${new Date(now).toISOString().slice(0, 19)}Z`}
              read={() => new Date().toISOString()}
            />
          </dl>
        </CardContent>
      </Card>

      {controls}

      <Card emphasis>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div>
            <CardTitle>{live ? 'Current time' : 'Result'}</CardTitle>
            <CardDescription>
              {live ? 'Enter a value above to convert it instead.' : `${out.isoUtc}, ${out.relative}`}
            </CardDescription>
          </div>
          {live ? <Badge variant="success">Live</Badge> : null}
        </CardHeader>
        <CardContent className="py-2">
          <ValueList>
            <ValueRow
              label="Local time"
              value={out.zoned}
              copyValue={out.zoned}
              note={`${timeZone}, UTC${out.offset}`}
              mono={false}
            />
            <ValueRow label="UTC" value={out.utc} copyValue={out.utc} mono={false} />
            <ValueRow label="ISO 8601" value={out.isoUtc} copyValue={out.isoUtc} />
            <ValueRow label="ISO 8601 with offset" value={out.isoOffset} copyValue={out.isoOffset} />
            <ValueRow label="RFC 2822" value={out.rfc2822} copyValue={out.rfc2822} />
            <ValueRow label="Relative" value={out.relative} copyValue={out.relative} mono={false} />
            <ValueRow label="Epoch seconds" value={out.seconds} copyValue={out.seconds} />
            <ValueRow label="Epoch milliseconds" value={out.milliseconds} copyValue={out.milliseconds} />
          </ValueList>
        </CardContent>
      </Card>
    </div>
  );
}

const TimestampTool = () => {
  useWebMCPTool(CONVERT_TIMESTAMP_TOOL);
  const { value: linked } = useParams();
  const [input, setInput] = useState(linked ?? '');
  const [unit, setUnit] = useState('auto');
  const [home] = useState(localTimeZone);
  const [timeZone, setTimeZone] = useState(home);

  const zoneGroups = useMemo(() => {
    const pinned = [...new Set([home, 'UTC'])];
    const rest = listTimeZones().filter((zone) => !pinned.includes(zone));
    return [{ region: 'This device and UTC', zones: pinned }, ...groupTimeZones(rest)];
  }, [home]);

  const parsed = useMemo(() => parseTimestamp(input, { unit, timeZone }), [input, unit, timeZone]);
  const failed = !parsed.ok && !parsed.empty;

  const controls = useMemo(
    () => (
      <Card>
        <CardContent className="space-y-3">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_11rem_15rem]">
            <div className="space-y-2">
              <Label htmlFor="timestamp-input">Timestamp or date</Label>
              <Input
                id="timestamp-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                placeholder="1794651210 or 2026-11-14T10:13:30Z"
                aria-invalid={failed}
                aria-describedby="timestamp-note"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timestamp-unit">Number is in</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger id="timestamp-unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timestamp-zone">Time zone</Label>
              <Select value={timeZone} onValueChange={setTimeZone}>
                <SelectTrigger id="timestamp-zone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {zoneGroups.map((group) => (
                    <SelectGroup key={group.region}>
                      <SelectLabel>{group.region}</SelectLabel>
                      {group.zones.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p
            id="timestamp-note"
            role="status"
            className={failed ? 'text-body-sm text-danger' : 'text-body-sm text-on-surface-muted'}
          >
            {parsed.ok
              ? parsed.note
              : failed
                ? parsed.error
                : 'Epoch seconds or milliseconds, an ISO 8601 date or an RFC 2822 date. Left empty, the result follows the clock.'}
          </p>
        </CardContent>
      </Card>
    ),
    [input, unit, timeZone, zoneGroups, parsed, failed]
  );

  return <Readout controls={controls} parsed={parsed} timeZone={timeZone} onUseNow={setInput} />;
};

export default TimestampTool;
