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
import { AlertCircle, CheckCircle2, GlobeLock, Info, Search, TriangleAlert } from 'lucide-react';
import { inspectDnssec } from './lib/dnssec.js';

const VARIANT = { success: 'success', warning: 'warning', error: 'destructive', info: 'info' };
const ICON = { success: CheckCircle2, warning: TriangleAlert, error: AlertCircle, info: Info };

export default function DnssecChecker() {
  const { domain: routeDomain } = useParams();
  const [domain, setDomain] = useState(routeDomain ? decodeURIComponent(routeDomain) : '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setLoading(true);
    setError('');
    try { setResult(await inspectDnssec(domain)); }
    catch (err) { setResult(null); setError(err.message || 'The DNSSEC checks could not be completed.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!routeDomain) return undefined;
    let active = true;
    setLoading(true);
    inspectDnssec(decodeURIComponent(routeDomain))
      .then((analysis) => active && setResult(analysis))
      .catch((err) => active && setError(err.message || 'The DNSSEC checks could not be completed.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [routeDomain]);

  return (
    <div className="space-y-6">
      <Card><CardContent className="pt-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><div className="flex-1"><Label htmlFor="dnssec-domain">Delegated domain</Label><Input id="dnssec-domain" value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="example.com" /></div><Button onClick={run} disabled={loading || !domain.trim()}>{loading ? <Search className="animate-pulse" aria-hidden="true" /> : <GlobeLock aria-hidden="true" />}{loading ? 'Checking…' : 'Check DNSSEC'}</Button></div><p className="mt-3 text-body-sm text-muted-foreground">Checks the recursive validation result, DS/DNSKEY digest link, NS addresses and SOA presence.</p></CardContent></Card>
      {error && <Alert variant="destructive"><AlertCircle aria-hidden="true" /><AlertTitle>Check failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {!result && !loading && !error && <Alert><AlertTitle>What this proves</AlertTitle><AlertDescription>The digest comparison proves whether a published DNSKEY matches a parent DS record. It does not probe each authoritative server directly.</AlertDescription></Alert>}
      {result && <Tabs defaultValue="findings" className="space-y-4 rt-arrive"><TabsList><TabsTrigger value="findings">Findings</TabsTrigger><TabsTrigger value="keys">Keys</TabsTrigger><TabsTrigger value="delegation">Delegation</TabsTrigger><TabsTrigger value="raw">Raw</TabsTrigger></TabsList>
        <TabsContent value="findings" className="space-y-3"><Card emphasis><CardHeader className="flex-row items-center justify-between gap-2"><div><h3 className="text-title-sm">{result.domain}</h3><p className="text-body-sm text-muted-foreground">DNSSEC and delegation report</p></div><Badge variant={VARIANT[result.status]}>{result.status}</Badge></CardHeader></Card>{result.findings.map((item, index) => { const FindingIcon = ICON[item.severity]; return <Alert key={`${item.title}-${index}`} variant={VARIANT[item.severity]}><FindingIcon aria-hidden="true" /><AlertTitle>{item.title}</AlertTitle><AlertDescription>{item.detail}</AlertDescription></Alert>; })}</TabsContent>
        <TabsContent value="keys" className="space-y-4"><Card><CardHeader><h3 className="text-title-sm">DNSKEY records</h3></CardHeader><CardContent className="space-y-2">{result.keys.length ? result.keys.map((key) => <div key={`${key.keyTag}-${key.publicKey}`} className="rounded-md border-2 border-rule bg-surface-inset p-3"><p className="font-mono text-data-md">tag {key.keyTag} · flags {key.flags} · algorithm {key.algorithm}</p><p className="mt-1 break-all font-mono text-data-sm text-muted-foreground">{key.publicKey}</p></div>) : <p className="text-body-sm text-muted-foreground">No DNSKEY records.</p>}</CardContent></Card><Card><CardHeader><h3 className="text-title-sm">DS records</h3></CardHeader><CardContent className="space-y-2">{result.dsRecords.length ? result.dsRecords.map((ds) => <p key={`${ds.keyTag}-${ds.digest}`} className="break-all rounded-md border-2 border-rule bg-surface-inset p-3 font-mono text-data-sm">{ds.keyTag} {ds.algorithm} {ds.digestType} {ds.digest}</p>) : <p className="text-body-sm text-muted-foreground">No DS records.</p>}</CardContent></Card></TabsContent>
        <TabsContent value="delegation"><Card><CardHeader><h3 className="text-title-sm">Name servers</h3></CardHeader><CardContent className="space-y-3">{result.delegation.nameServers.map((server) => <div key={server.name}><p className="font-mono text-data-md">{server.name}</p><p className="font-mono text-data-sm text-muted-foreground">{server.addresses.join(', ') || 'No address returned'}</p></div>)}</CardContent></Card></TabsContent>
        <TabsContent value="raw"><Card><CardContent className="pt-4"><Textarea readOnly rows={26} value={JSON.stringify(result.raw, null, 2)} className="font-mono text-data-sm" /></CardContent></Card></TabsContent>
      </Tabs>}
    </div>
  );
}
