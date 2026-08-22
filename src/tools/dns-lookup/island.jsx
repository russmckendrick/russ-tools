import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Ghost } from "@/components/ui/ghost";
import { AlertCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, buildUrl } from '@/core';
import { useLookupTool } from '@/lib/useLookupTool';
import apiConfig from '@/utils/api/apiConfig.json';
import DNSLookupForm from './components/DNSLookupForm';
import DNSResultsDisplay from './components/DNSResultsDisplay';
import DNSHistoryDisplay from './components/DNSHistoryDisplay';

const DNS = apiConfig.endpoints.dns;

// The two providers with a public DoH JSON API. OpenDNS and "Browser
// Default" used to be offered and both silently queried Google — removed
// rather than relabelled (BEHAVIOR_CHANGES.md).
const DNS_URLS = {
  google: DNS.google,
  cloudflare: DNS.cloudflare,
};

async function fetchDns(domain, { signal, context }) {
  const url = buildUrl(DNS_URLS[context.provider] ?? DNS_URLS.google, {
    name: domain,
    type: context.recordType,
  });

  const response = await apiFetch(url, {
    headers: { Accept: 'application/dns-json' },
    timeout: DNS.timeout,
    retries: DNS.retries,
    signal,
  });

  if (!response.ok) {
    throw new Error(`DNS lookup failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  data.timestamp = Date.now();
  return data;
}

/**
 * The shape of a DNS answer, for the ghost above.
 *
 * CNAME rather than A on purpose: `DNSRecordDisplay` renders a react-router
 * `<Link>` for values that parse as IP addresses. Not for want of a Router —
 * `ToolIsland` mounts one for every tool — but because a link is a focusable
 * anchor that `ToolIsland`'s click capture would navigate on, and a ghost must
 * contain nothing anyone can reach. Two records, because that is what a
 * typical answer looks like and the ghost should be the typical size.
 */
const GHOST_RESULTS = {
  Status: 0,
  TC: false,
  RA: true,
  Question: [{ name: 'example.com.', type: 5 }],
  Answer: [
    { name: 'example.com.', type: 5, TTL: 300, data: 'edge.example-cdn.net.' },
    { name: 'edge.example-cdn.net.', type: 5, TTL: 300, data: 'origin.example-cdn.net.' },
  ],
};

const DnsLookupTool = () => {
  const [recordType, setRecordType] = React.useState('A');
  const [dnsProvider, setDnsProvider] = React.useState('google');

  const {
    query: domain,
    setQuery: setDomain,
    result: lookupResults,
    loading,
    error,
    lookup,
    history: lookupHistory,
    clearHistory: clearStoredHistory,
  } = useLookupTool({
    toolId: 'dns-lookup',
    fetcher: fetchDns,
    cacheTTL: 5 * 60 * 1000,
    maxHistory: 50,
    urlParam: 'domain',
    // History items carry recordType/provider (historyEntry below), so the
    // same key function works for a fresh context and a stored item.
    cacheKey: (q, ctx) => `${q}-${ctx.recordType ?? recordType}-${ctx.provider ?? dnsProvider}`,
    historyKey: (q, ctx) => `${q}-${ctx.recordType ?? ''}-${ctx.provider ?? ''}`,
    historyEntry: (q, data, ctx) => ({
      domain: q,
      recordType: ctx.recordType,
      provider: ctx.provider,
      recordCount: data?.Answer ? data.Answer.length : 0,
    }),
    onSuccess: (q, data, fromCache) => {
      const recordCount = data.Answer ? data.Answer.length : 0;
      toast.success(`DNS Lookup Complete${fromCache ? ' (Cached)' : ''}`, {
        description: fromCache
          ? `Cached records loaded for ${q}`
          : `Found ${recordCount} record${recordCount !== 1 ? 's' : ''} for ${q}`,
      });
    },
    onError: (q, err) =>
      toast.error('DNS Lookup Failed', {
        description: err.message || 'Failed to perform DNS lookup',
      }),
  });

  const performDNSLookup = (domainToLookup, recordTypeToUse, providerToUse) =>
    lookup(domainToLookup, { recordType: recordTypeToUse, provider: providerToUse });

  const handleLookup = () => {
    if (!domain.trim()) {
      toast.error('Invalid Input', {
        description: 'Please enter a domain name',
      });
      return;
    }
    performDNSLookup(domain, recordType, dnsProvider);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleLookup();
    }
  };

  const handleHistoryItemClick = (historyItem) => {
    // Old history can name a provider that no longer exists (opendns/auto).
    const provider = historyItem.provider in DNS_URLS ? historyItem.provider : 'google';
    setDomain(historyItem.domain);
    setRecordType(historyItem.recordType);
    setDnsProvider(provider);
    performDNSLookup(historyItem.domain, historyItem.recordType, provider);
  };

  const clearHistory = () => {
    clearStoredHistory();
    toast.success('History Cleared', {
      description: 'All DNS lookup history cleared',
    });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Lookup Form */}
        <DNSLookupForm
          domain={domain}
          setDomain={setDomain}
          recordType={recordType}
          setRecordType={setRecordType}
          dnsProvider={dnsProvider}
          setDnsProvider={setDnsProvider}
          loading={loading}
          onLookup={handleLookup}
          onKeyPress={handleKeyPress}
        />

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center p-8 border rounded-md">
            <div className="flex items-center gap-3">
              <RotateCcw className="h-5 w-5 animate-spin-ccw" />
              <span>Performing DNS lookup for {domain}...</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>DNS Lookup Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/*
          Nothing looked up yet: draw the answer's own shape rather than leave
          a screenful of empty page under the form. This is the real
          `DNSResultsDisplay` — tab bar, query card, records card — rendered
          with a sample response and redacted by `.rt-ghosted`, so it cannot
          drift from the panel that replaces it.
        */}
        {!lookupResults && !loading && !error && (
          <Ghost>
            <DNSResultsDisplay results={GHOST_RESULTS} domain="example.com" recordType="CNAME" />
          </Ghost>
        )}

        {/* Results */}
        {lookupResults && !loading && (
          <div className="rt-arrive">
            <DNSResultsDisplay
              results={lookupResults}
              domain={domain}
              recordType={recordType}
            />
          </div>
        )}

        {/* History */}
        <DNSHistoryDisplay
          lookupHistory={lookupHistory}
          onHistoryItemClick={handleHistoryItemClick}
          onClearHistory={clearHistory}
        />
      </div>
    </TooltipProvider>
  );
};

export default DnsLookupTool;
