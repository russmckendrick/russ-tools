import React, { useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { copyText, downloadFile } from '@/core';
import { CheckCircle2, Copy, Download, FileDiff, FlaskConical } from 'lucide-react';
import { diffZones, lintZone } from './lib/zone.js';

const SAMPLE = `$ORIGIN example.com.
$TTL 3600
@ IN SOA ns1.example.com. hostmaster.example.com. (
  2026082301 3600 900 1209600 300
)
@ IN NS ns1.example.com.
ns1 IN A 192.0.2.1
www IN A 192.0.2.20
@ IN MX 10 mail.example.com.
mail IN A 192.0.2.25`;

function FindingList({ result }) {
  if (!result.findings.length) return <Alert><CheckCircle2 aria-hidden="true" /><AlertTitle>No structural issues found</AlertTitle><AlertDescription>{result.records.length} records parsed. This checks the file locally; it does not load the zone into an authoritative DNS server.</AlertDescription></Alert>;
  return <div className="space-y-2">{result.findings.map((item, index) => <div key={`${item.code}-${item.line}-${index}`} className="rounded-md border border-outline bg-surface-raised p-3"><div className="flex flex-wrap items-center gap-2"><Badge variant={item.severity === 'error' ? 'destructive' : item.severity === 'warning' ? 'warning' : 'info'}>{item.severity}</Badge><p className="font-mono text-data-sm">{item.code}</p>{item.line && <Badge variant="secondary">line {item.line}</Badge>}</div><p className="mt-2 text-body-sm">{item.message}</p></div>)}</div>;
}

function DiffRecords({ records, kind }) {
  if (!records.length) return <p className="text-body-sm text-muted-foreground">None</p>;
  return <div className="space-y-1">{records.map((record) => <p key={record} className={`break-all font-mono text-data-sm ${kind === 'added' ? 'text-success' : 'text-danger'}`}>{kind === 'added' ? '+' : '−'} {record}</p>)}</div>;
}

export default function ZoneFileLinter() {
  const [zone, setZone] = useState('');
  const [before, setBefore] = useState('');
  const [after, setAfter] = useState('');
  const [diff, setDiff] = useState(null);
  const result = useMemo(() => zone.trim() ? lintZone(zone) : null, [zone]);

  return <div className="space-y-6">
    <Alert><FlaskConical aria-hidden="true" /><AlertTitle>Static BIND-file analysis</AlertTitle><AlertDescription>The parser supports common resource records, $ORIGIN, $TTL, comments, multiline SOA records and inherited owners. It flags unsupported directives instead of expanding them.</AlertDescription></Alert>
    <Tabs defaultValue="lint" className="space-y-4">
      <TabsList><TabsTrigger value="lint">Lint and normalize</TabsTrigger><TabsTrigger value="diff">Compare zones</TabsTrigger></TabsList>
      <TabsContent value="lint" className="space-y-4">
        <Card>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2"><div><h3 className="text-title-sm">Zone file</h3><p className="text-body-sm text-muted-foreground">Paste a BIND-style master file. Analysis updates locally as you type.</p></div><Button variant="outline" size="sm" onClick={() => setZone(SAMPLE)}>Use example</Button></CardHeader>
          <CardContent><Label htmlFor="zone-source">BIND zone source</Label><Textarea id="zone-source" value={zone} onChange={(event) => setZone(event.target.value)} rows={18} className="font-mono text-data-sm" placeholder="$ORIGIN example.com.&#10;@ IN SOA …" /></CardContent>
        </Card>
        {result && <>
          <Card emphasis><CardHeader className="flex-row flex-wrap items-center justify-between gap-2"><div><h3 className="text-title-sm">Findings</h3><p className="text-body-sm text-muted-foreground">{result.records.length} records · {result.counts.error} errors · {result.counts.warning} warnings</p></div><div className="flex gap-2"><Badge variant={result.counts.error ? 'destructive' : 'success'}>{result.counts.error ? 'needs attention' : 'structurally sound'}</Badge></div></CardHeader><CardContent><FindingList result={result} /></CardContent></Card>
          <Card><CardHeader className="flex-row flex-wrap items-center justify-between gap-2"><div><h3 className="text-title-sm">Normalized records</h3><p className="text-body-sm text-muted-foreground">Owners and supported target names are made absolute, TTLs are seconds, and records are sorted.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={result.counts.error > 0} onClick={() => copyText(result.normalized)}><Copy aria-hidden="true" /> Copy</Button><Button variant="outline" size="sm" disabled={result.counts.error > 0} onClick={() => downloadFile(result.normalized, 'normalized.zone', 'text/plain')}><Download aria-hidden="true" /> Export</Button></div></CardHeader><CardContent><Textarea readOnly rows={16} value={result.normalized} className="font-mono text-data-sm" /></CardContent></Card>
        </>}
      </TabsContent>
      <TabsContent value="diff" className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card><CardHeader><h3 className="text-title-sm">Before</h3></CardHeader><CardContent><Label htmlFor="zone-before">Previous zone</Label><Textarea id="zone-before" value={before} onChange={(event) => { setBefore(event.target.value); setDiff(null); }} rows={18} className="font-mono text-data-sm" /></CardContent></Card>
          <Card><CardHeader><h3 className="text-title-sm">After</h3></CardHeader><CardContent><Label htmlFor="zone-after">Proposed zone</Label><Textarea id="zone-after" value={after} onChange={(event) => { setAfter(event.target.value); setDiff(null); }} rows={18} className="font-mono text-data-sm" /></CardContent></Card>
        </div>
        <Button onClick={() => setDiff(diffZones(before, after))} disabled={!before.trim() && !after.trim()}><FileDiff aria-hidden="true" /> Compare normalized records</Button>
        {diff && <Card emphasis><CardHeader className="flex-row flex-wrap items-center justify-between gap-2"><div><h3 className="text-title-sm">Zone diff</h3><p className="text-body-sm text-muted-foreground">{diff.added.length} added · {diff.removed.length} removed</p></div><Button variant="outline" size="sm" disabled={diff.before.counts.error > 0 || diff.after.counts.error > 0} onClick={() => downloadFile(JSON.stringify({ added: diff.added, removed: diff.removed }, null, 2), 'zone-diff.json', 'application/json')}><Download aria-hidden="true" /> Export</Button></CardHeader><CardContent className="grid gap-6 lg:grid-cols-2"><div><p className="mb-2 text-label-caps text-success">Added</p><DiffRecords records={diff.added} kind="added" /></div><div><p className="mb-2 text-label-caps text-danger">Removed</p><DiffRecords records={diff.removed} kind="removed" /></div></CardContent></Card>}
      </TabsContent>
    </Tabs>
  </div>;
}
