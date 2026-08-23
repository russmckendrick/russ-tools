import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { copyText, downloadFile } from '@/core';
import { AlertCircle, Copy, Download, FileDiff, Search, Tags } from 'lucide-react';
import { diffServiceTags, loadServiceTags, searchServiceTags } from './lib/serviceTags.js';

function prefixText(tag) {
  return tag?.prefixes.join('\n') ?? '';
}

export default function AzureServiceTags() {
  const { query: routeQuery } = useParams();
  const initialQuery = routeQuery ? decodeURIComponent(routeQuery) : '';
  const [data, setData] = useState(null);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searchedQuery, setSearchedQuery] = useState(initialQuery);
  const [diff, setDiff] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    loadServiceTags()
      .then((loaded) => {
        if (!active) return;
        setData(loaded);
        if (initialQuery) {
          const matches = searchServiceTags(loaded, initialQuery);
          setResults(matches);
          setSelected(matches[0] ?? null);
        }
      })
      .catch(() => active && setError('The checked-in service-tag dataset could not be loaded.'));
    return () => { active = false; };
  }, [initialQuery]);

  const totals = useMemo(() => {
    if (!data) return { tags: 0, prefixes: 0 };
    return {
      tags: data.tags.length,
      prefixes: data.tags.reduce((sum, tag) => sum + tag.prefixes.length, 0),
    };
  }, [data]);

  const search = () => {
    if (!data || !query.trim()) return;
    const matches = searchServiceTags(data, query);
    setResults(matches);
    setSelected(matches[0] ?? null);
    setSearchedQuery(query.trim());
  };

  const loadPrevious = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !data) return;
    setError('');
    try {
      setDiff(diffServiceTags(data, JSON.parse(await file.text())));
    } catch {
      setDiff(null);
      setError('That file is not a supported Microsoft or russ.tools service-tag JSON snapshot.');
    }
  };

  return <div className="space-y-6">
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="service-tag-query">Service tag, region, system service or IP address</Label>
            <Input id="service-tag-query" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && search()} placeholder="Storage.UKSouth or 20.50.2.4" />
          </div>
          <Button onClick={search} disabled={!data || !query.trim()}><Search aria-hidden="true" /> Search snapshot</Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary">Change {data?.changeNumber ?? '…'}</Badge>
          <Badge variant="secondary">{totals.tags.toLocaleString()} tags</Badge>
          <Badge variant="secondary">{totals.prefixes.toLocaleString()} prefixes</Badge>
          {data?.generatedAt && <Badge variant="secondary">Fetched {data.generatedAt}</Badge>}
        </div>
      </CardContent>
    </Card>

    {error && <Alert variant="destructive"><AlertCircle aria-hidden="true" /><AlertTitle>Dataset error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

    <Tabs defaultValue="lookup" className="space-y-4">
      <TabsList><TabsTrigger value="lookup">Lookup</TabsTrigger><TabsTrigger value="diff">Compare snapshots</TabsTrigger></TabsList>
      <TabsContent value="lookup" className="space-y-4">
        {!results.length && searchedQuery && data && <Alert><Tags aria-hidden="true" /><AlertTitle>No matching tags</AlertTitle><AlertDescription>No published tag matched “{searchedQuery}”. Search by tag name, region, service, or an individual IPv4/IPv6 address.</AlertDescription></Alert>}
        {!!results.length && <div className="grid gap-4 lg:grid-cols-[minmax(15rem,0.75fr)_minmax(0,1.25fr)]">
          <Card>
            <CardHeader><h3 className="text-title-sm">Matches</h3><p className="text-body-sm text-muted-foreground">{results.length} shown, capped at 100</p></CardHeader>
            <CardContent className="max-h-[32rem] space-y-2 overflow-y-auto">
              {results.map((tag) => <Button key={tag.name} variant={selected?.name === tag.name ? 'secondary' : 'ghost'} className="h-auto w-full justify-start whitespace-normal text-left" onClick={() => setSelected(tag)}>{tag.name}</Button>)}
            </CardContent>
          </Card>
          {selected && <Card emphasis>
            <CardHeader className="flex-row flex-wrap items-start justify-between gap-2"><div><h3 className="text-title-sm">{selected.name}</h3><p className="text-body-sm text-muted-foreground">{selected.systemService || 'No system service'}{selected.region ? ` · ${selected.region}` : ' · global'}</p></div><Badge>{selected.prefixes.length} prefixes</Badge></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2"><Badge variant="secondary">Change {selected.changeNumber}</Badge>{selected.networkFeatures?.map((feature) => <Badge key={feature} variant="secondary">{feature}</Badge>)}</div>
              <Textarea readOnly rows={18} value={prefixText(selected)} className="font-mono text-data-sm" aria-label={`${selected.name} address prefixes`} />
              <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => copyText(prefixText(selected))}><Copy aria-hidden="true" /> Copy</Button><Button variant="outline" size="sm" onClick={() => downloadFile(prefixText(selected), `${selected.name}.txt`, 'text/plain')}><Download aria-hidden="true" /> Export</Button></div>
            </CardContent>
          </Card>}
        </div>}
      </TabsContent>
      <TabsContent value="diff" className="space-y-4">
        <Card>
          <CardHeader><h3 className="text-title-sm">Compare with an older snapshot</h3><p className="text-body-sm text-muted-foreground">Load Microsoft’s original JSON or a snapshot exported by this project. Nothing is uploaded.</p></CardHeader>
          <CardContent><Label htmlFor="previous-service-tags">Previous JSON snapshot</Label><Input id="previous-service-tags" type="file" accept="application/json,.json" onChange={loadPrevious} /></CardContent>
        </Card>
        {diff && <Card emphasis>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2"><div><h3 className="text-title-sm">Change {diff.before} → {diff.after}</h3><p className="text-body-sm text-muted-foreground">{diff.changes.length} tags changed</p></div><Button variant="outline" size="sm" onClick={() => downloadFile(JSON.stringify(diff, null, 2), 'azure-service-tags-diff.json', 'application/json')}><FileDiff aria-hidden="true" /> Export diff</Button></CardHeader>
          <CardContent className="space-y-4">{diff.changes.slice(0, 250).map((change) => <div key={change.name} className="rounded-md border border-outline p-3"><p className="font-mono text-data-md">{change.name}</p><div className="mt-2 flex gap-2"><Badge variant="success">+{change.added.length}</Badge><Badge variant="destructive">−{change.removed.length}</Badge></div>{change.added.length > 0 && <p className="mt-2 break-all font-mono text-data-sm text-success">+ {change.added.join(', ')}</p>}{change.removed.length > 0 && <p className="mt-1 break-all font-mono text-data-sm text-danger">− {change.removed.join(', ')}</p>}</div>)}</CardContent>
        </Card>}
      </TabsContent>
    </Tabs>
  </div>;
}
