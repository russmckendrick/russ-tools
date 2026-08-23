import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Combine, Copy, Download, TriangleAlert } from 'lucide-react';
import { copyText, downloadFile } from '@/core';
import { gapRanges, intersectRanges, normalizeCidrs, overlapPairs, parseCidrList, renderRanges, subtractRanges } from './lib/cidr.js';

const SAMPLE = '10.0.0.0/25\n10.0.0.128/26\n10.0.0.192 - 10.0.0.255\n2001:db8::/49\n2001:db8:0:8000::/49';

export default function CidrWorkbench() {
  const { input } = useParams();
  const [mode, setMode] = useState('normalize');
  const [left, setLeft] = useState(input ? decodeURIComponent(input) : SAMPLE);
  const [right, setRight] = useState('10.0.0.64/26');
  const result = useMemo(() => {
    const a = parseCidrList(left);
    const b = parseCidrList(right);
    if (mode === 'normalize') return { cidrs: normalizeCidrs(left).cidrs, errors: a.errors, overlaps: overlapPairs(a.ranges) };
    if (mode === 'subtract') return { cidrs: renderRanges(subtractRanges(a.ranges, b.ranges)), errors: [...a.errors, ...b.errors], overlaps: [] };
    if (mode === 'intersect') return { cidrs: renderRanges(intersectRanges(a.ranges, b.ranges)), errors: [...a.errors, ...b.errors], overlaps: [] };
    return { cidrs: renderRanges(gapRanges(a.ranges)), errors: a.errors, overlaps: overlapPairs(a.ranges) };
  }, [left, right, mode]);
  const output = result.cidrs.join('\n');

  return (
    <div className="space-y-6">
      <Tabs value={mode} onValueChange={setMode} className="space-y-4">
        <TabsList><TabsTrigger value="normalize">Normalize</TabsTrigger><TabsTrigger value="subtract">Subtract</TabsTrigger><TabsTrigger value="intersect">Intersect</TabsTrigger><TabsTrigger value="gaps">Gaps</TabsTrigger></TabsList>
        <Card><CardContent className="space-y-4 pt-6"><div className={`grid gap-4 ${mode === 'subtract' || mode === 'intersect' ? 'lg:grid-cols-2' : ''}`}><div><p className="mb-2 text-label-caps text-muted-foreground">{mode === 'subtract' ? 'Starting set' : 'Addresses, ranges or CIDRs'}</p><Textarea value={left} onChange={(event) => setLeft(event.target.value)} rows={13} className="font-mono text-data-sm" aria-label="Primary CIDR set" /></div>{(mode === 'subtract' || mode === 'intersect') && <div><p className="mb-2 text-label-caps text-muted-foreground">{mode === 'subtract' ? 'Remove this set' : 'Compare with this set'}</p><Textarea value={right} onChange={(event) => setRight(event.target.value)} rows={13} className="font-mono text-data-sm" aria-label="Secondary CIDR set" /></div>}</div><p className="text-body-sm text-muted-foreground">One item per line. Accepts IPv4, IPv6, CIDR notation and explicit start-end ranges. Blank lines and # comments are ignored.</p></CardContent></Card>
        <TabsContent value={mode} className="space-y-4">
          {result.errors.length > 0 && <Alert variant="destructive"><AlertCircle aria-hidden="true" /><AlertTitle>{result.errors.length} input line{result.errors.length === 1 ? '' : 's'} could not be read</AlertTitle><AlertDescription>{result.errors.map((error) => `Line ${error.line}: ${error.message}`).join(' · ')}</AlertDescription></Alert>}
          {result.overlaps.length > 0 && <Alert variant="warning"><TriangleAlert aria-hidden="true" /><AlertTitle>{result.overlaps.length} overlap{result.overlaps.length === 1 ? '' : 's'} found</AlertTitle><AlertDescription>{result.overlaps.map(([a, b]) => `${a} overlaps ${b}`).join(' · ')}</AlertDescription></Alert>}
          <Card emphasis><CardHeader className="flex-row flex-wrap items-center justify-between gap-2"><div><h3 className="text-title-sm">Result</h3><p className="text-body-sm text-muted-foreground">{result.cidrs.length} minimal CIDR block{result.cidrs.length === 1 ? '' : 's'}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => copyText(output)} disabled={!output}><Copy aria-hidden="true" /> Copy</Button><Button variant="outline" size="sm" onClick={() => downloadFile(output, 'cidr-result.txt', 'text/plain')} disabled={!output}><Download aria-hidden="true" /> Export</Button></div></CardHeader><CardContent>{output ? <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-data-md">{output}</pre> : <div className="flex items-center gap-2 text-body-sm text-muted-foreground"><Combine aria-hidden="true" /> No CIDR blocks in the result.</div>}</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
