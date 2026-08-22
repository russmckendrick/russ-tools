import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Globe,
  Search,
  Download,
  Copy,
  Trash2,
  RotateCcw,
  History,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { copyText, downloadFile, apiFetch, buildUrl } from '@/core';
import { useLookupTool } from '@/lib/useLookupTool';
import apiConfig from '@/utils/api/apiConfig.json';

const WHOIS = apiConfig.endpoints.whois;

async function fetchWhois(query, { signal }) {
  const response = await apiFetch(buildUrl(WHOIS.url, { query }), {
    headers: { Accept: 'application/json' },
    timeout: WHOIS.timeout,
    retries: WHOIS.retries,
    signal,
  });

  if (!response.ok) {
    throw new Error(`WHOIS lookup failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

import WHOISInfoDisplay from './components/WHOISInfoDisplay';
import { formatDate, getTypeBadge, getTypeIcon } from './lib/present';
import { Ghost } from '@/components/ui/ghost';

/** The shape of a WHOIS answer, for the ghost above. RFC 2606 names only. */
const GHOST_WHOIS = {
  query: 'example.com',
  type: 'domain',
  normalized: {
    domain: 'example.com',
    status: ['client transfer prohibited'],
    registrar: { name: 'Example Registrar, Inc.', handle: '1234' },
    events: {
      registration: '1995-08-14T04:00:00Z',
      expiration: '2026-08-13T04:00:00Z',
      'last changed': '2026-01-16T18:26:50Z',
    },
    nameservers: [
      { name: 'NS1.EXAMPLE-DNS.COM', ipAddresses: { v4: [], v6: [] } },
      { name: 'NS2.EXAMPLE-DNS.COM', ipAddresses: { v4: [], v6: [] } },
    ],
    entities: [],
  },
  data: { rdap: { status: ['client transfer prohibited'] } },
};

const WhoisLookupTool = () => {
  const {
    query,
    setQuery,
    result: lookupResults,
    loading,
    error,
    lookup,
    history: lookupHistory,
    clearHistory: clearStoredHistory,
  } = useLookupTool({
    toolId: 'whois-lookup',
    fetcher: fetchWhois,
    cacheTTL: 30 * 60 * 1000,
    maxHistory: 100,
    urlParam: 'query',
    legacy: { history: 'whois-lookup-history' },
    historyEntry: (q, data) => ({
      type: data?.type || 'unknown',
      status: data?.status || 'Unknown',
    }),
    onSuccess: (q, data, fromCache) =>
      toast.success(`WHOIS Lookup Complete${fromCache ? ' (Cached)' : ''}`, {
        description: `${fromCache ? 'Cached' : 'Successfully retrieved'} ${data.type} information for ${q}`,
      }),
    onError: (q, err) =>
      toast.error('WHOIS Lookup Failed', {
        description: err.message || 'Failed to perform WHOIS lookup',
      }),
  });

  const handleLookup = () => {
    if (!query.trim()) {
      toast.error('Invalid Input', {
        description: 'Please enter a domain name or IP address',
      });
      return;
    }
    lookup(query);
  };

  const handleHistoryItemClick = (historyItem) => {
    setQuery(historyItem.query);
    lookup(historyItem.query);
  };

  const clearHistory = () => {
    clearStoredHistory();
    toast.success('History Cleared', {
      description: 'All WHOIS lookup history cleared',
    });
  };

  const copyToClipboard = async (text) => {
    if (await copyText(text)) {
      toast.success('Copied to clipboard');
    } else {
      toast.error('Failed to copy to clipboard');
    }
  };

  const exportResults = () => {
    if (!lookupResults) return;
    downloadFile(
      JSON.stringify(lookupResults, null, 2),
      `whois-lookup-${lookupResults.query}-${Date.now()}.json`,
      'application/json'
    );
  };


  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Lookup Form */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="query">Domain Name or IP Address</Label>
                <div className="flex flex-col gap-2 mt-1 sm:flex-row">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="query"
                      placeholder="example.com or 8.8.8.8"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyPress={(event) => event.key === 'Enter' && handleLookup()}
                      className="pl-9"
                    />
                  </div>
                  <Button 
                    onClick={handleLookup}
                    disabled={loading}
                  >
                    {loading ? (
                      <RotateCcw className="mr-2 h-4 w-4 animate-spin-ccw" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    Lookup
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center p-8">
                <div className="flex items-center gap-3">
                  <RotateCcw className="h-5 w-5 animate-spin-ccw" />
                  <span>Performing WHOIS lookup for {query}...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>WHOIS Lookup Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {/*
          Nothing looked up yet: the answer's own shape, drawn from the real
          `WHOISInfoDisplay` under the real tab tray — the tabs live out here in
          the island rather than inside the display, so a ghost of the display
          alone was missing the row above it.

          Deliberately shorter than a real answer, which runs past 1200px for a
          registered domain. The ghost fills the empty region; it does not
          reserve the whole result — a full-height one would make the *empty*
          page longer than the gap it replaces. The lever is the sample: two
          nameservers rather than four, three dates rather than five.
        */}
        {!lookupResults && !loading && !error && (
          <Ghost>
            <Tabs defaultValue="info" className="space-y-4">
              <TabsList>
                <TabsTrigger value="info">Information</TabsTrigger>
                <TabsTrigger value="raw">Raw Data</TabsTrigger>
              </TabsList>
              <TabsContent value="info">
                <WHOISInfoDisplay data={GHOST_WHOIS} />
              </TabsContent>
            </Tabs>
          </Ghost>
        )}

        {lookupResults && !loading && (
          <Tabs defaultValue="info" className="rt-arrive space-y-4">
            <TabsList>
              <TabsTrigger value="info">Information</TabsTrigger>
              <TabsTrigger value="raw">Raw Data</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <WHOISInfoDisplay data={lookupResults} />
            </TabsContent>

            <TabsContent value="raw">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <h3 className="text-title-sm">Raw WHOIS Response</h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(JSON.stringify(lookupResults, null, 2))}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy JSON
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={exportResults}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={JSON.stringify(lookupResults, null, 2)}
                    readOnly
                    rows={20}
                    className="font-mono text-data-sm"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* History */}
        {lookupHistory.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  <h3 className="text-title-sm">Recent Lookups</h3>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearHistory}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear History
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lookupHistory.slice(0, 10).map((item, index) => (
                  <div key={index} className="flex flex-wrap items-center justify-between gap-2 p-3 border rounded-md">
                    <div className="flex min-w-0 items-center gap-3">
                      {getTypeIcon(item.type)}
                      <div className="min-w-0">
                        <p className="text-data-md font-mono">{item.query}</p>
                        <p className="text-data-sm font-mono text-muted-foreground">
                          {formatDate(item.timestamp)} • {item.type}
                        </p>
                      </div>
                      {getTypeBadge(item.type)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleHistoryItemClick(item)}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Repeat
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default WhoisLookupTool;