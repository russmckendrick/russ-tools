import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Copy, Download, ShieldCheck, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { compareDnsResponses, copyText, dnsRcodeName, downloadJSON } from '@/core';
import DNSRecordDisplay from './DNSRecordDisplay';

function QueryPanel({ query }) {
  const answers = query.Answer ?? [];
  const authority = query.Authority ?? [];
  const status = dnsRcodeName(query.Status);

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-title-sm">{query.queryType} query</h3>
          <p className="text-body-sm text-muted-foreground">{query.providerLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={query.Status === 0 ? 'success' : 'destructive'}>{status}</Badge>
          {query.AD && (
            <Badge variant="success">
              <ShieldCheck aria-hidden="true" /> DNSSEC validated
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {answers.length > 0 ? (
          <div className="space-y-2">
            {answers.map((record, index) => (
              <DNSRecordDisplay key={`${record.name}-${record.type}-${record.data}-${index}`} record={record} />
            ))}
          </div>
        ) : (
          <p className="text-body-sm text-muted-foreground">
            {query.Status === 0
              ? 'The name exists, but this record set is empty.'
              : `The resolver returned ${status}.`}
          </p>
        )}

        {authority.length > 0 && (
          <details>
            <summary className="cursor-pointer text-body-sm text-primary-text">
              Authority section ({authority.length})
            </summary>
            <div className="mt-3 space-y-2">
              {authority.map((record, index) => (
                <DNSRecordDisplay key={`${record.name}-${record.type}-${index}`} record={record} />
              ))}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

function Comparisons({ queries }) {
  const types = [...new Set(queries.map((query) => query.queryType))];
  const rows = types
    .map((type) => {
      const google = queries.find((query) => query.provider === 'google' && query.queryType === type);
      const cloudflare = queries.find((query) => query.provider === 'cloudflare' && query.queryType === type);
      return google && cloudflare ? { type, ...compareDnsResponses(google, cloudflare) } : null;
    })
    .filter(Boolean);

  if (rows.length === 0) {
    return (
      <Alert>
        <AlertTitle>Comparison needs both resolvers</AlertTitle>
        <AlertDescription>Choose Compare Google + Cloudflare and run the lookup again.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <Alert key={row.type} variant={row.equal ? 'success' : 'warning'}>
          {row.equal ? <CheckCircle2 aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />}
          <AlertTitle>{row.type}: {row.equal ? 'same answer set' : 'resolver answers differ'}</AlertTitle>
          {!row.equal && (
            <AlertDescription>
              {!row.rcodeEqual && <p>Response code: Google {row.leftRcode}; Cloudflare {row.rightRcode}.</p>}
              {row.onlyLeft.length > 0 && <p>Only Google: {row.onlyLeft.join(', ')}</p>}
              {row.onlyRight.length > 0 && <p>Only Cloudflare: {row.onlyRight.join(', ')}</p>}
            </AlertDescription>
          )}
        </Alert>
      ))}
    </div>
  );
}

export default function DNSResultsDisplay({ results, domain, recordType }) {
  const queries = results?.version === 2 ? results.queries : [];
  if (queries.length === 0) return null;

  const recordCount = queries.reduce((sum, query) => sum + (query.Answer?.length ?? 0), 0);
  const validated = queries.filter((query) => query.AD).length;

  const exportResults = () => {
    downloadJSON(results, `dns-${domain}-${(recordType || 'a').toLowerCase()}.json`);
    toast.success('DNS results downloaded');
  };

  return (
    <Tabs defaultValue="records" className="space-y-4">
      <TabsList>
        <TabsTrigger value="records">Records</TabsTrigger>
        <TabsTrigger value="compare">Compare</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="raw">Raw</TabsTrigger>
      </TabsList>

      <TabsContent value="records" className="space-y-4">
        <Card emphasis>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-title-sm">{domain}</h3>
              <p className="text-body-sm text-muted-foreground">
                {queries.length} queries · {recordCount} answer-section records
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {validated > 0 && <Badge variant="success">{validated} DNSSEC validated</Badge>}
              <Button variant="outline" size="sm" onClick={exportResults}>
                <Download aria-hidden="true" /> Export
              </Button>
            </div>
          </CardHeader>
          {results.failures?.length > 0 && (
            <CardContent>
              <Alert variant="warning">
                <TriangleAlert aria-hidden="true" />
                <AlertTitle>Some queries failed</AlertTitle>
                <AlertDescription>{results.failures.join(' · ')}</AlertDescription>
              </Alert>
            </CardContent>
          )}
        </Card>

        {queries.map((query) => (
          <QueryPanel key={`${query.provider}-${query.queryType}`} query={query} />
        ))}
      </TabsContent>

      <TabsContent value="compare">
        <Comparisons queries={queries} />
      </TabsContent>

      <TabsContent value="details" className="space-y-3">
        {queries.map((query) => (
          <Card key={`${query.provider}-${query.queryType}`}>
            <CardContent className="grid gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-4">
              <div><p className="text-label-caps text-muted-foreground">Resolver</p><p>{query.providerLabel}</p></div>
              <div><p className="text-label-caps text-muted-foreground">Type</p><p className="font-mono text-data-md">{query.queryType}</p></div>
              <div><p className="text-label-caps text-muted-foreground">Response</p><p>{dnsRcodeName(query.Status)}</p></div>
              <div><p className="text-label-caps text-muted-foreground">Flags</p><p className="font-mono text-data-md">{['RD', 'RA', query.AD && 'AD', query.CD && 'CD', query.TC && 'TC'].filter(Boolean).join(' ')}</p></div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="raw">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2">
            <h3 className="text-title-sm">Resolver responses</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await copyText(JSON.stringify(results, null, 2));
                toast.success('Raw response copied');
              }}
            >
              <Copy aria-hidden="true" /> Copy
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              rows={22}
              value={JSON.stringify(results, null, 2)}
              className="font-mono text-data-sm"
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
