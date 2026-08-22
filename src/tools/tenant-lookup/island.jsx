import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Search,
  Building,
  Globe,
  AlertCircle,
  History,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { ApiError, apiFetch, buildUrl, createToolStorage } from '@/core';
import { useLookupTool } from '@/lib/useLookupTool';
import apiConfig from '@/utils/api/apiConfig.json';
import TenantInfoDisplay from './components/TenantInfoDisplay';
import { Ghost } from '@/components/ui/ghost';
import DNSAnalysisDisplay from './components/DNSAnalysisDisplay';
import ServiceVerificationDisplay from './components/ServiceVerificationDisplay';
import APIResultsDisplay from './components/APIResultsDisplay';
import RawDataDisplay from './components/RawDataDisplay';
import { getTenantTypeColor } from './lib/tenantType';

const TENANT = apiConfig.endpoints.tenant;

/** An email address means its domain; anything else is already a domain. */
function extractDomain(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (trimmed.includes('@')) {
    const parts = trimmed.split('@');
    return parts[parts.length - 1].toLowerCase();
  }
  return trimmed.toLowerCase();
}

async function fetchTenant(domain, { signal }) {
  const response = await apiFetch(buildUrl(TENANT.url, { domain }), {
    headers: { Accept: 'application/json' },
    timeout: TENANT.timeout,
    retries: TENANT.retries,
    signal,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Tenant lookup failed');
  }
  return data;
}

/**
 * The shape of a tenant record, for the ghost above — and the ghost's size,
 * which is the same thing. `TenantInfoDisplay` renders a row per field it is
 * given, so a sample carrying every optional key (auth and token URLs, the
 * federation brand, the discovery method) drew a 726px panel where a typical
 * answer is 448px. These are the fields a lookup reliably returns; the rest
 * are dropped precisely because the ghost fills the empty region rather than
 * reserving the largest result anyone might get.
 */
const GHOST_TENANT = {
  // RFC 2606 reserved, and deliberately not the `contoso.com` the field's own
  // placeholder suggests: the ghost's text is real text in the real DOM, so a
  // sample echoing a value the tool also uses collides with anything that
  // looks for it — a `getByText` in the island's own tests did exactly that,
  // and find-in-page would too.
  domain: 'example.com',
  displayName: 'Example Organisation',
  tenantId: '00000000-0000-0000-0000-000000000000',
  defaultDomainName: 'example.onmicrosoft.com',
  tenantType: 'Managed',
  isCloudOnly: true,
};

const TenantLookupTool = () => {
  const {
    query: domain,
    setQuery: setDomain,
    result,
    setResult,
    loading,
    error,
    lookup,
  } = useLookupTool({
    toolId: 'tenant-lookup',
    fetcher: fetchTenant,
    maxHistory: 0, // the list below is explicit user saves, not a history
    urlParam: 'domain',
    normalize: extractDomain,
    onSuccess: (q) =>
      toast.success('Tenant Lookup Complete', {
        description: `Found tenant information for ${q}`,
      }),
    onError: (q, err) => {
      const transport = err instanceof ApiError && err.isTransport;
      toast.error(transport ? 'Network Error' : 'Tenant Lookup Failed', {
        description: transport
          ? 'Unable to connect to tenant lookup service'
          : err.message || 'Unable to find tenant information',
      });
    },
  });

  // Explicit saves, in their own slot — reads the pre-port key forward.
  const storage = useMemo(() => createToolStorage('tenant-lookup'), []);
  const [savedLookups, setSavedLookups] = useState(() =>
    storage.get('saved', { fallback: [], legacy: 'tenant-lookup-saved' })
  );

  const persistSaved = (next) => {
    setSavedLookups(next);
    storage.set('saved', next);
  };

  const handleLookup = (inputDomain = domain) => {
    if (!extractDomain(inputDomain)) {
      toast.error('Invalid Input', {
        description: 'Please enter a domain name or email address',
      });
      return;
    }
    lookup(inputDomain);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleLookup();
    }
  };

  const handleSaveLookup = () => {
    if (!result) return;

    const savedLookup = {
      id: Date.now().toString(),
      domain: result.domain,
      tenantId: result.tenantId,
      displayName: result.displayName,
      savedAt: Date.now(),
      fullResult: result
    };

    persistSaved([savedLookup, ...savedLookups]);

    toast.success('Lookup Saved', {
      description: `Tenant information for ${result.domain} has been saved`,
    });
  };

  const handleLoadLookup = (savedLookup) => {
    setResult(savedLookup.fullResult);
    setDomain(savedLookup.domain);

    toast.success('Lookup Loaded', {
      description: `Loaded saved tenant information for ${savedLookup.domain}`,
    });
  };

  const handleDeleteLookup = (id) => {
    persistSaved(savedLookups.filter(lookup => lookup.id !== id));

    toast.success('Lookup Deleted', {
      description: 'Saved tenant lookup has been removed',
    });
  };

  const handleClearAllSaved = () => {
    persistSaved([]);

    toast.success('All Lookups Cleared', {
      description: 'All saved tenant lookups have been removed',
    });
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Lookup Form */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="domain">Domain or Email Address</Label>
                <div className="flex flex-col gap-2 mt-1 sm:flex-row">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="domain"
                      placeholder="contoso.com or user@company.com"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    onClick={() => handleLookup()}
                    disabled={loading}
                  >
                    {loading ? (
                      <RotateCcw className="mr-2 h-4 w-4 animate-spin-ccw" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    Lookup Tenant
                  </Button>
                </div>
                <p className="text-body-sm text-muted-foreground mt-1">
                  Enter a domain name (contoso.com) or email address (user@contoso.com)
                </p>
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
                  <span>Looking up tenant information for {domain}...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Tenant Lookup Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/*
          Nothing looked up yet: the answer's own shape, drawn from the real
          `TenantInfoDisplay` under a real tab tray and redacted by
          `.rt-ghosted`.

          Two tabs, because those are the two every lookup returns. The DNS,
          verification and API tabs are each conditional on what came back, so
          drawing five would promise tabs a real answer often does not have.
        */}
        {!result && !loading && !error && (
          <Ghost>
            <Tabs defaultValue="tenant" className="space-y-4">
              <TabsList>
                <TabsTrigger value="tenant">Tenant Info</TabsTrigger>
                <TabsTrigger value="raw">Raw Data</TabsTrigger>
              </TabsList>
              <TabsContent value="tenant">
                <TenantInfoDisplay data={GHOST_TENANT} onSave={() => {}} />
              </TabsContent>
            </Tabs>
          </Ghost>
        )}

        {/* Results */}
        {result && !loading && (
          <Tabs defaultValue="tenant" className="rt-arrive space-y-4">
            <TabsList>
              <TabsTrigger value="tenant">Tenant Info</TabsTrigger>
              {result.dnsInfo && (
                <TabsTrigger value="dns">DNS Analysis</TabsTrigger>
              )}
              {result.dnsInfo?.txtRecords && (
                <TabsTrigger value="verification">Service Verification</TabsTrigger>
              )}
              {result.apiResults && (
                <TabsTrigger value="api">API Results</TabsTrigger>
              )}
              <TabsTrigger value="raw">Raw Data</TabsTrigger>
            </TabsList>

            <TabsContent value="tenant">
              <TenantInfoDisplay data={result} onSave={handleSaveLookup} />
            </TabsContent>

            {result.dnsInfo && (
              <TabsContent value="dns">
                <DNSAnalysisDisplay dnsInfo={result.dnsInfo} />
              </TabsContent>
            )}

            {result.dnsInfo?.txtRecords && (
              <TabsContent value="verification">
                <ServiceVerificationDisplay txtRecords={result.dnsInfo.txtRecords} />
              </TabsContent>
            )}

            {result.apiResults && (
              <TabsContent value="api">
                <APIResultsDisplay apiResults={result.apiResults} />
              </TabsContent>
            )}

            <TabsContent value="raw">
              <RawDataDisplay data={result} />
            </TabsContent>
          </Tabs>
        )}

        {/* Saved Lookups */}
        {savedLookups.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  <h3 className="text-title-sm">Saved Lookups</h3>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearAllSaved}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {savedLookups.map((savedLookup) => (
                  <div key={savedLookup.id} className="flex flex-wrap items-center justify-between gap-2 p-3 border rounded-md">
                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                      <Building className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="font-medium">{savedLookup.domain}</p>
                        <p className="text-body-sm text-muted-foreground">
                          {savedLookup.displayName || 'No display name'}
                        </p>
                        <p className="text-body-sm text-muted-foreground">
                          Saved: {formatTimestamp(savedLookup.savedAt)}
                        </p>
                      </div>
                      <Badge className={getTenantTypeColor(savedLookup.fullResult?.tenantType)}>
                        {savedLookup.fullResult?.tenantType || 'Unknown'}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLoadLookup(savedLookup)}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteLookup(savedLookup.id)}
                        aria-label={`Delete saved lookup for ${savedLookup.domain}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

export default TenantLookupTool;
