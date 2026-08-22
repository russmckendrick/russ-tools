import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Globe,
  Search,
  Info,
  Download,
  Copy,
  Trash2,
  RotateCcw,
  History,
  AlertCircle,
  Server,
  Calendar,
  Building,
  Network,
  Shield
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

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'domain':
        return <Globe className="h-4 w-4" />;
      case 'ip':
        return <Server className="h-4 w-4" />;
      case 'network':
        return <Network className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type) => {
    const colors = {
      domain: 'bg-info-subtle text-info',
      ip: 'bg-success-subtle text-success',
      network: 'bg-[color-mix(in_oklab,var(--cat)_13%,transparent)] text-[var(--cat)]'
    };

    return (
      <Badge className={colors[type?.toLowerCase()] || 'bg-surface-inset text-on-surface'}>
        {type || 'Unknown'}
      </Badge>
    );
  };

  const WHOISInfoDisplay = ({ data }) => {
    if (!data) return null;

    const formatDateFromISO = (isoString) => {
      if (!isoString) return 'Not available';
      try {
        return new Date(isoString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return isoString;
      }
    };

    // Extract data from normalized structure if available
    const normalized = data.normalized || {};
    const rdap = data.data?.rdap || {};

    return (
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-title-sm flex items-center gap-2">
                {getTypeIcon(data.type)}
                Basic Information
              </h3>
              {getTypeBadge(data.type)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-body-sm text-muted-foreground">Query</p>
                <p className="text-data-md font-mono">{data.query}</p>
              </div>
              <div>
                <p className="text-body-sm text-muted-foreground">Type</p>
                <p className="font-medium">{data.type || 'Unknown'}</p>
              </div>
              {(normalized.status || rdap.status) && (
                <div>
                  <p className="text-body-sm text-muted-foreground">Status</p>
                  <div className="space-y-1">
                    {(normalized.status || rdap.status)?.map((status, index) => (
                      <Badge key={index} variant="outline" className="mr-1 mb-1">
                        {status}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {normalized.registrar?.name && (
                <div>
                  <p className="text-body-sm text-muted-foreground">Registrar</p>
                  <p className="font-medium">{normalized.registrar.name}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Registration Dates */}
        {normalized.events && (
          <Card>
            <CardHeader>
              <h3 className="text-title-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Registration Dates
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {normalized.events.registration && (
                  <div>
                    <p className="text-body-sm text-muted-foreground">Registration</p>
                    <p className="text-data-md font-mono">{formatDateFromISO(normalized.events.registration)}</p>
                  </div>
                )}
                {normalized.events['last changed'] && (
                  <div>
                    <p className="text-body-sm text-muted-foreground">Last Changed</p>
                    <p className="text-data-md font-mono">{formatDateFromISO(normalized.events['last changed'])}</p>
                  </div>
                )}
                {normalized.events.expiration && (
                  <div>
                    <p className="text-body-sm text-muted-foreground">Expiration</p>
                    <p className="text-data-md font-mono">{formatDateFromISO(normalized.events.expiration)}</p>
                  </div>
                )}
                {normalized.events['last update of RDAP database'] && (
                  <div className="md:col-span-3">
                    <p className="text-body-sm text-muted-foreground">Last RDAP Update</p>
                    <p className="text-data-md font-mono">{formatDateFromISO(normalized.events['last update of RDAP database'])}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Name Servers */}
        {normalized.nameservers && normalized.nameservers.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-title-sm flex items-center gap-2">
                <Server className="h-4 w-4" />
                Name Servers
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {normalized.nameservers.map((ns, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded border">
                    <p className="text-data-md font-mono">{ns.name}</p>
                    {ns.status && (
                      <div className="mt-1">
                        {ns.status.map((status, statusIndex) => (
                          <Badge key={statusIndex} variant="secondary" className="text-data-sm font-mono mr-1">
                            {status}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* DNSSEC Information */}
        {rdap.secureDNS && (
          <Card>
            <CardHeader>
              <h3 className="text-title-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                DNSSEC Information
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <p className="text-body-sm text-muted-foreground">Delegation Signed:</p>
                  <Badge variant={rdap.secureDNS.delegationSigned ? "default" : "secondary"}>
                    {rdap.secureDNS.delegationSigned ? "Yes" : "No"}
                  </Badge>
                </div>
                {rdap.secureDNS.maxSigLife && (
                  <div>
                    <p className="text-body-sm text-muted-foreground">Max Signature Life</p>
                    <p className="text-data-md font-mono">{rdap.secureDNS.maxSigLife} day(s)</p>
                  </div>
                )}
                {rdap.secureDNS.dsData && rdap.secureDNS.dsData.length > 0 && (
                  <div>
                    <p className="text-body-sm text-muted-foreground mb-2">DS Records</p>
                    <div className="space-y-2">
                      {rdap.secureDNS.dsData.map((ds, index) => (
                        <div key={index} className="p-2 bg-muted/50 rounded font-mono text-data-sm border">
                          <div className="grid grid-cols-2 gap-2">
                            <div>Key Tag: {ds.keyTag}</div>
                            <div>Algorithm: {ds.algorithm}</div>
                            <div>Digest Type: {ds.digestType}</div>
                            <div className="col-span-2">Digest: {ds.digest}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registrar Information */}
        {normalized.entities?.registrar && normalized.entities.registrar.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-title-sm flex items-center gap-2">
                <Building className="h-4 w-4" />
                Registrar Information
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {normalized.entities.registrar.map((registrar, index) => {
                  const vcard = registrar.vcardArray?.[1] || [];
                  const name = vcard.find(([prop]) => prop === 'fn')?.[3];
                  const email = vcard.find(([prop]) => prop === 'email')?.[3];
                  const abuseEntity = registrar.entities?.[0];
                  const abuseVcard = abuseEntity?.vcardArray?.[1] || [];
                  const abuseEmail = abuseVcard.find(([prop]) => prop === 'email')?.[3];
                  
                  return (
                    <div key={index} className="border-l-2 border-primary pl-4">
                      <h4 className="font-medium mb-2">{name || 'Registrar'}</h4>
                      <div className="space-y-2 text-body-sm">
                        {registrar.publicIds?.map((id, idIndex) => (
                          <div key={idIndex}>
                            <span className="text-muted-foreground">{id.type}: </span>
                            <span className="font-medium">{id.identifier}</span>
                          </div>
                        ))}
                        {email && (
                          <div>
                            <span className="text-muted-foreground">Contact: </span>
                            <span className="font-medium">{email}</span>
                          </div>
                        )}
                        {abuseEmail && (
                          <div>
                            <span className="text-muted-foreground">Abuse Contact: </span>
                            <span className="font-medium">{abuseEmail}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Sources */}
        {data.sources && data.sources.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-title-sm flex items-center gap-2">
                <Network className="h-4 w-4" />
                Data Sources
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.sources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div>
                      <p className="text-data-md font-mono">{source.name.toUpperCase()}</p>
                      <p className="text-data-sm font-mono text-muted-foreground">{source.service}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={source.status === 'success' ? 'default' : 'destructive'}>
                        {source.status}
                      </Badge>
                      <p className="text-data-sm font-mono text-muted-foreground mt-1">
                        {formatDate(source.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
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
        {lookupResults && !loading && (
          <Tabs defaultValue="info" className="space-y-4">
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