import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ValueList, ValueRow } from '@/components/ui/value-list';
import { downloadFile } from '@/core';
import { useWebMCPTool, textResult } from '@/lib/useWebMCPTool';
import { MAX_COUNT, clampCount, decodeUuid, formatUuid, generateUuids } from './lib/uuid.js';

const VERSIONS = [
  { value: '4', label: 'Version 4', detail: 'random' },
  { value: '7', label: 'Version 7', detail: 'time-ordered' },
];

const ROW_TYPE = { fontSize: 'clamp(11px, calc((100cqw - 66px) / 22.8), 13px)' };

const GENERATE_UUID_TOOL = {
  name: 'generate_uuid',
  description:
    'Generate UUIDs: version 4 (random) or version 7 (time-ordered, sortable by creation time). ' +
    'Returns 1 to 500 canonical lower-case UUIDs.',
  inputSchema: {
    type: 'object',
    properties: {
      version: { type: 'integer', enum: [4, 7], description: 'UUID version; defaults to 4' },
      count: { type: 'integer', minimum: 1, maximum: MAX_COUNT, description: 'How many; defaults to 1' },
    },
  },
  annotations: { readOnlyHint: true },
  execute: ({ version = 4, count = 1 } = {}) =>
    textResult({ version: Number(version) === 7 ? 7 : 4, uuids: generateUuids(Number(version) === 7 ? 7 : 4, count) }),
};

const DECODE_UUID_TOOL = {
  name: 'decode_uuid',
  description:
    'Decode a UUID or GUID: its version, variant and, for versions 1, 6 and 7, the embedded timestamp. ' +
    'Accepts hyphenated, bare hex, braced and urn:uuid: forms.',
  inputSchema: {
    type: 'object',
    properties: { uuid: { type: 'string', description: 'The UUID or GUID to decode' } },
    required: ['uuid'],
  },
  annotations: { readOnlyHint: true },
  execute: ({ uuid }) => textResult(decodeUuid(uuid) ?? { error: 'Not a UUID: expected 32 hex digits.' }),
};

function Option({ id, label, checked, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="text-on-surface">
        {label}
      </Label>
    </div>
  );
}

function Generator() {
  const [version, setVersion] = useState('4');
  const [countText, setCountText] = useState('1');
  const [uppercase, setUppercase] = useState(false);
  const [braces, setBraces] = useState(false);
  const [noHyphens, setNoHyphens] = useState(false);
  const [uuids, setUuids] = useState(() => generateUuids(4, 1));

  const regenerate = (nextVersion = version, nextCount = countText) =>
    setUuids(generateUuids(Number(nextVersion), clampCount(nextCount)));

  const changeVersion = (next) => {
    setVersion(next);
    regenerate(next, countText);
  };

  const changeCount = (next) => {
    const digits = next.replace(/\D/g, '').slice(0, 3);
    setCountText(digits);
    if (digits) regenerate(version, digits);
  };

  const settleCount = () => {
    const settled = String(clampCount(countText));
    if (settled !== countText) {
      setCountText(settled);
      regenerate(version, settled);
    }
  };

  const formatted = useMemo(
    () => uuids.map((uuid) => formatUuid(uuid, { uppercase, braces, hyphens: !noHyphens })),
    [uuids, uppercase, braces, noHyphens]
  );
  const all = formatted.join('\n');
  const chosen = VERSIONS.find((item) => item.value === version);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,16rem)_8rem]">
            <div className="space-y-2">
              <Label htmlFor="uuid-version">Version</Label>
              <Select value={version} onValueChange={changeVersion}>
                <SelectTrigger id="uuid-version">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VERSIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label} ({item.detail})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="uuid-count">How many</Label>
              <Input
                id="uuid-count"
                inputMode="numeric"
                value={countText}
                onChange={(event) => changeCount(event.target.value)}
                onBlur={settleCount}
                aria-describedby="uuid-count-hint"
              />
            </div>
          </div>
          <p id="uuid-count-hint" className="text-body-sm text-on-surface-muted">
            1 to {MAX_COUNT} at a time.{' '}
            {version === '7'
              ? 'Version 7 leads with the time it was made, so a batch sorts in the order it was generated.'
              : 'Version 4 is 122 random bits from the browser’s cryptographic source.'}
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <Option id="uuid-uppercase" label="Uppercase" checked={uppercase} onChange={setUppercase} />
            <Option id="uuid-braces" label="Braces" checked={braces} onChange={setBraces} />
            <Option id="uuid-no-hyphens" label="No hyphens" checked={noHyphens} onChange={setNoHyphens} />
          </div>
        </CardContent>
      </Card>

      <Card emphasis>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div>
            <CardTitle>
              {formatted.length} UUID{formatted.length === 1 ? '' : 's'}
            </CardTitle>
            <CardDescription>
              {chosen.label}, {chosen.detail}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => regenerate()}>
              <RefreshCw aria-hidden="true" /> Regenerate
            </Button>
            <CopyButton value={all} variant="outline" size="sm">
              Copy all
            </CopyButton>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => downloadFile(`${all}\n`, `uuids-v${version}.txt`, 'text/plain')}
            >
              <Download aria-hidden="true" /> Download
            </Button>
          </div>
        </CardHeader>
        <ol
          aria-label="Generated UUIDs"
          className="@container max-h-[26rem] divide-y divide-outline overflow-y-auto"
        >
          {formatted.map((uuid, index) => (
            <li key={uuids[index]} className="flex items-center justify-between gap-2 py-1 pl-4 pr-2">
              <span
                className="min-w-0 overflow-x-auto whitespace-nowrap font-mono text-data-md text-on-surface [scrollbar-width:none]"
                style={ROW_TYPE}
              >
                {uuid}
              </span>
              <CopyButton value={uuid} label={`Copy ${uuid}`} className="h-8 w-8 shrink-0" />
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function Decoder({ value, onChange }) {
  const decoded = useMemo(() => decodeUuid(value), [value]);
  const entered = value.trim().length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-2">
          <Label htmlFor="uuid-decode">UUID or GUID</Label>
          <Input
            id="uuid-decode"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            placeholder="017f22e2-79b0-7cc3-98c4-dc0c0c07398f"
            aria-invalid={entered && !decoded}
            aria-describedby="uuid-decode-hint"
          />
          <p
            id="uuid-decode-hint"
            role="status"
            className={entered && !decoded ? 'text-body-sm text-danger' : 'text-body-sm text-on-surface-muted'}
          >
            {entered && !decoded
              ? 'Not a UUID: it needs 32 hex digits, with or without the four hyphens.'
              : 'Hyphenated, bare hex, braced and urn:uuid: forms are all read, in either case.'}
          </p>
        </CardContent>
      </Card>

      {decoded ? (
        <Card emphasis>
          <CardHeader>
            <CardTitle>
              {decoded.special ?? (decoded.version === null ? 'No version' : `Version ${decoded.version}`)}
            </CardTitle>
            <CardDescription>{decoded.special ? decoded.versionName : decoded.canonical}</CardDescription>
          </CardHeader>
          <CardContent className="py-2">
            <ValueList>
              {decoded.variant ? (
                <>
                  <ValueRow
                    label="Version"
                    value={decoded.version === null ? 'None' : String(decoded.version)}
                    note={decoded.versionName}
                  />
                  <ValueRow
                    label="Variant"
                    value={decoded.variant.label}
                    note={`Variant bits ${decoded.variant.bits}. The version field only has meaning in the RFC 9562 variant.`}
                  />
                </>
              ) : null}
              {decoded.timestampMs !== null ? (
                <ValueRow
                  label="Made at (UTC)"
                  value={decoded.timestampIso}
                  copyValue={decoded.timestampIso}
                  note={`${decoded.timestampMs} milliseconds since the Unix epoch.`}
                >
                  <Button asChild variant="outline" size="sm">
                    <a href={`/timestamp/${decoded.timestampIso}`}>Convert</a>
                  </Button>
                </ValueRow>
              ) : null}
              {decoded.clockSequence !== null ? (
                <ValueRow label="Clock sequence" value={String(decoded.clockSequence)} />
              ) : null}
              {decoded.node ? <ValueRow label="Node" value={decoded.node} note={decoded.nodeKind} /> : null}
              <ValueRow label="Canonical" value={decoded.canonical} copyValue={decoded.canonical} />
              <ValueRow label="Uppercase" value={decoded.uppercase} copyValue={decoded.uppercase} />
              <ValueRow label="Braced" value={decoded.braced} copyValue={decoded.braced} />
              <ValueRow label="No hyphens" value={decoded.bare} copyValue={decoded.bare} />
              <ValueRow label="URN" value={decoded.urn} copyValue={decoded.urn} />
            </ValueList>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

const UuidTool = () => {
  useWebMCPTool(GENERATE_UUID_TOOL);
  useWebMCPTool(DECODE_UUID_TOOL);
  const { value: linked } = useParams();
  const [mode, setMode] = useState(linked ? 'decode' : 'generate');
  const [pasted, setPasted] = useState(linked ?? '');

  return (
    <Tabs value={mode} onValueChange={setMode} className="space-y-4">
      <TabsList>
        <TabsTrigger value="generate">Generate</TabsTrigger>
        <TabsTrigger value="decode">Decode</TabsTrigger>
      </TabsList>
      <TabsContent value="generate" forceMount hidden={mode !== 'generate'}>
        <Generator />
      </TabsContent>
      <TabsContent value="decode">
        <Decoder value={pasted} onChange={setPasted} />
      </TabsContent>
    </Tabs>
  );
};

export default UuidTool;
