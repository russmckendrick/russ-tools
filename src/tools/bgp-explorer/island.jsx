import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Route, Search } from 'lucide-react';
import { lookupRouting } from './lib/ripestat.js';

function value(value) {
  if (value === null || value === undefined || value === '') return 'Not reported';
  return String(value);
}

export default function BgpExplorer() {
  const { resource: routeResource } = useParams();
  const [resource, setResource] = useState(routeResource ? decodeURIComponent(routeResource) : '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setLoading(true); setError('');
    try { setResult(await lookupRouting(resource)); }
    catch (err) { setResult(null); setError(err.message || 'The routing lookup could not be completed.'); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    if (!routeResource) return undefined;
    let active = true;
    setLoading(true);
    lookupRouting(decodeURIComponent(routeResource))
      .then((lookup) => active && setResult(lookup))
      .catch((err) => active && setError(err.message || 'The routing lookup could not be completed.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [routeResource]);

  return <div className="space-y-6">
    <Card><CardContent className="pt-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex-1"><Label htmlFor="routing-resource">IP address, prefix or ASN</Label><Input id="routing-resource" value={resource} onChange={(event) => setResource(event.target.value)} placeholder="193.0.0.0/21 or AS3333" /></div><Button onClick={run} disabled={loading || !resource.trim()}>{loading ? <Search className="animate-pulse" aria-hidden="true" /> : <Route aria-hidden="true" />}{loading ? 'Looking up…' : 'Explore routing'}</Button></div><p className="mt-3 text-body-sm text-muted-foreground">Live routing visibility and RPKI data comes from the RIPEstat Data API.</p></CardContent></Card>
    {error && <Alert variant="destructive"><AlertCircle aria-hidden="true" /><AlertTitle>Routing lookup failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
    {!result && !loading && !error && <Alert><AlertTitle>Registration is not routing</AlertTitle><AlertDescription>WHOIS says who received an allocation. This tool shows which AS currently originates it, how visible it is and whether the prefix/origin pair is covered by RPKI.</AlertDescription></Alert>}
    {result && <Tabs defaultValue="overview" className="space-y-4 rt-arrive"><TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="prefixes">Prefixes</TabsTrigger><TabsTrigger value="raw">Raw</TabsTrigger></TabsList>
      <TabsContent value="overview" className="space-y-4"><Card emphasis><CardHeader className="flex-row flex-wrap items-center justify-between gap-2"><div><h3 className="text-title-sm">{result.resource}</h3><p className="text-body-sm text-muted-foreground">{result.holder || 'Holder not reported'}</p></div><div className="flex flex-wrap gap-2">{result.announced !== undefined && <Badge variant={result.announced ? 'success' : 'warning'}>{result.announced ? 'announced' : 'not announced'}</Badge>}{result.rpki?.map((validation) => <Badge key={validation.origin} variant={validation.status === 'valid' ? 'success' : validation.status === 'unknown' ? 'warning' : 'destructive'}>AS{validation.origin} RPKI {validation.status.replace('_', ' ')}</Badge>)}</div></CardHeader></Card>
      <Card><CardHeader><h3 className="text-title-sm">Observed routing state</h3></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><div><p className="text-label-caps text-muted-foreground">Origin AS</p><p className="font-mono text-data-md">{value(result.origins?.map((origin) => `AS${origin.asn ?? origin}`).join(', ') || result.routing.origins.map((origin) => `AS${origin.origin}`).join(', '))}</p></div><div><p className="text-label-caps text-muted-foreground">First seen</p><p>{value(result.routing.firstSeen)}</p></div><div><p className="text-label-caps text-muted-foreground">Last seen</p><p>{value(result.routing.lastSeen)}</p></div>{Object.entries(result.routing.visibility).map(([family, visibility]) => <div key={family}><p className="text-label-caps text-muted-foreground">{family} visibility</p><p className="font-mono text-data-md">{value(visibility.ris_peers_seeing)} / {value(visibility.total_ris_peers)} RIS peers</p></div>)}</CardContent></Card></TabsContent>
      <TabsContent value="prefixes" className="space-y-4"><Card><CardHeader><h3 className="text-title-sm">Related prefixes</h3></CardHeader><CardContent>{result.kind === 'asn' ? <div className="grid gap-2 sm:grid-cols-2">{result.prefixes.map((prefix) => <p key={prefix.prefix ?? prefix} className="font-mono text-data-sm">{prefix.prefix ?? prefix}</p>)}</div> : <div className="space-y-4"><div><p className="text-label-caps text-muted-foreground">Less specific</p><p className="font-mono text-data-sm">{result.routing.lessSpecifics.map((item) => item.prefix).join(', ') || 'None reported'}</p></div><div><p className="text-label-caps text-muted-foreground">More specific</p><p className="font-mono text-data-sm">{result.routing.moreSpecifics.map((item) => item.prefix).join(', ') || 'None reported'}</p></div></div>}</CardContent></Card></TabsContent>
      <TabsContent value="raw"><Card><CardContent className="pt-4"><Textarea readOnly rows={28} value={JSON.stringify(result.raw, null, 2)} className="font-mono text-data-sm" /></CardContent></Card></TabsContent>
    </Tabs>}
  </div>;
}
