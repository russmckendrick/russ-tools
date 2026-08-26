import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, ExternalLink, Inbox, Info, MailCheck, Route, Search, ShieldCheck, TriangleAlert } from 'lucide-react';
import { analyseEmailDns } from './lib/analyse.js';
import { PROVIDER_ICONS } from './lib/providerIcons.js';

const VARIANT = { success: 'success', warning: 'warning', error: 'destructive', info: 'info' };
const ICON = { success: CheckCircle2, warning: TriangleAlert, error: AlertCircle, info: Info };
const PROVIDER_TYPE = {
  mailbox: { label: 'Mailbox provider', Icon: Inbox },
  gateway: { label: 'Security gateway', Icon: ShieldCheck },
  routing: { label: 'Forwarding service', Icon: Route },
};

function ProviderMark({ provider, TypeIcon }) {
  const BrandIcon = PROVIDER_ICONS[provider.id];
  if (!BrandIcon) return <TypeIcon className="h-5 w-5" aria-hidden="true" />;
  return <BrandIcon className="h-5 w-5" aria-hidden="true" />;
}

function ProviderRow({ provider }) {
  const { label, Icon: TypeIcon } = PROVIDER_TYPE[provider.type] ?? PROVIDER_TYPE.mailbox;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border-2 border-rule bg-surface-inset p-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border-2 border-rule bg-surface-raised">
          <ProviderMark provider={provider} TypeIcon={TypeIcon} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-body-lg">{provider.name}</p>
            {provider.via === 'spf' && <Badge variant="outline">via SPF</Badge>}
          </div>
          <p className="mt-0.5 text-label-caps uppercase text-on-surface-faint">{label}</p>
          {provider.hosts?.length > 0 && (
            <p className="mt-1 break-all font-mono text-data-sm text-muted-foreground">{provider.hosts.join(' · ')}</p>
          )}
        </div>
      </div>
      <a
        href={provider.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-1 text-body-sm text-primary-text hover:underline"
      >
        {new URL(provider.url).hostname.replace(/^www\./, '')}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </div>
  );
}

export default function EmailDnsAnalyser() {
  const { domain: routeDomain } = useParams();
  const [domain, setDomain] = useState(routeDomain ? decodeURIComponent(routeDomain) : '');
  const [selector, setSelector] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  const run = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError('');
    try {
      setResult(await analyseEmailDns(domain, selector, { signal: controller.signal }));
    } catch (err) {
      if (!controller.signal.aborted) {
        setResult(null);
        setError(err.message || 'The mail DNS checks could not be completed.');
      }
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  };

  useEffect(() => {
    if (!routeDomain) return undefined;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    let active = true;
    setLoading(true);
    analyseEmailDns(decodeURIComponent(routeDomain), '', { signal: controller.signal })
      .then((analysis) => active && setResult(analysis))
      .catch((err) => active && !controller.signal.aborted && setError(err.message || 'The mail DNS checks could not be completed.'))
      .finally(() => active && abortRef.current === controller && setLoading(false));
    return () => { active = false; controller.abort(); };
  }, [routeDomain]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
            <div>
              <Label htmlFor="mail-domain">Mail domain</Label>
              <Input id="mail-domain" value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="example.com" />
            </div>
            <div>
              <Label htmlFor="dkim-selector">DKIM selector (optional)</Label>
              <Input id="dkim-selector" value={selector} onChange={(event) => setSelector(event.target.value)} placeholder="selector1" />
            </div>
            <div className="flex items-end">
              <Button onClick={run} disabled={loading || !domain.trim()}>
                {loading ? <Search className="animate-pulse" aria-hidden="true" /> : <MailCheck aria-hidden="true" />}
                {loading ? 'Checking…' : 'Analyse mail DNS'}
              </Button>
            </div>
          </div>
          <p className="text-body-sm text-muted-foreground">Queries use Google Public DNS over HTTPS. Only the names being checked leave this browser.</p>
        </CardContent>
      </Card>

      {error && <Alert variant="destructive"><AlertCircle aria-hidden="true" /><AlertTitle>Analysis failed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

      {!result && !loading && !error && <Alert><AlertTitle>One domain, six checks</AlertTitle><AlertDescription>Inspect mail routing, SPF, DMARC, an optional DKIM selector, MTA-STS and SMTP TLS reporting together.</AlertDescription></Alert>}

      {result && (
        <Tabs defaultValue="findings" className="space-y-4 rt-arrive">
          <TabsList><TabsTrigger value="findings">Findings</TabsTrigger><TabsTrigger value="raw">Raw DNS</TabsTrigger></TabsList>
          <TabsContent value="findings" className="space-y-4">
            <Card emphasis>
              <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
                <div><h3 className="text-title-sm">{result.domain}</h3><p className="text-body-sm text-muted-foreground">Mail DNS assessment</p></div>
                <div className="flex flex-wrap gap-2">
                  {(result.providers ?? []).map((provider) => <Badge key={provider.id} variant="secondary">{provider.name}{provider.via === 'spf' ? ' (via SPF)' : ''}</Badge>)}
                  {Object.entries(result.counts).map(([severity, count]) => <Badge key={severity} variant={VARIANT[severity]}>{count} {severity}</Badge>)}
                </div>
              </CardHeader>
            </Card>
            {result.sections.map((section) => (
              <Card key={section.id}>
                <CardHeader><h3 className="text-title-sm">{section.title}</h3></CardHeader>
                <CardContent className="space-y-3">
                  {section.id === 'mx' && (result.providers ?? []).map((provider) => (
                    <ProviderRow key={provider.id} provider={provider} />
                  ))}
                  {section.findings.map((item, index) => {
                    const FindingIcon = ICON[item.severity];
                    return <Alert key={`${item.title}-${index}`} variant={VARIANT[item.severity]}><FindingIcon aria-hidden="true" /><AlertTitle>{item.title}</AlertTitle><AlertDescription><p>{item.detail}</p>{item.evidence && <code className="mt-1 block break-all font-mono text-data-sm">{item.evidence}</code>}</AlertDescription></Alert>;
                  })}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="raw"><Card><CardContent className="pt-4"><Textarea readOnly rows={26} value={JSON.stringify(result.raw, null, 2)} className="font-mono text-data-sm" /></CardContent></Card></TabsContent>
        </Tabs>
      )}
    </div>
  );
}
