import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToolSplit, ToolSplitEmpty } from "@/components/ui/tool-split";
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
import { useParams } from 'react-router-dom';
import SEOHead from '../../common/SEOHead';
import ToolHeader from '../../common/ToolHeader';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';
import { getApiEndpoint, buildApiUrl, apiFetch } from '../../../utils/api/apiUtils';
import WHOISIcon from './WHOISIcon';
import { useTLDs } from '../../../utils';

const WHOISLookupShadcn = () => {
  const [query, setQuery] = useState('');
  const [lookupResults, setLookupResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [_autocompleteData, setAutocompleteData] = useState([]);

  // Get tool configuration for SEO
  const toolConfig = toolsConfig.find(tool => tool.id === 'whois-lookup');
  const seoData = generateToolSEO(toolConfig);
  
  // Use TLD utilities hook. See the note in DNSLookupShadcn: useTLDs handles
  // its own load failures, so the old try/catch around it could only ever
  // corrupt hook order.
  const { generateSuggestions, isReady: tldReady } = useTLDs();

  // Get query from URL parameters
  const { query: urlQuery } = useParams();

  // WHOIS lookup history and caching
  const [lookupHistory, setLookupHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('whois-lookup-history')) || [];
    } catch {
      return [];
    }
  });

  const [whoisCache, setWhoisCache] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('whois-lookup-cache')) || {};
    } catch {
      return {};
    }
  });

  // Cache duration in milliseconds (30 minutes for WHOIS)
  const CACHE_DURATION = 30 * 60 * 1000;

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('whois-lookup-history', JSON.stringify(lookupHistory));
  }, [lookupHistory]);

  useEffect(() => {
    localStorage.setItem('whois-lookup-cache', JSON.stringify(whoisCache));
  }, [whoisCache]);

  // Effect to update autocomplete data when query changes
  useEffect(() => {
    if (tldReady && generateSuggestions) {
      try {
        const suggestions = generateSuggestions(query, 10);
        setAutocompleteData(Array.isArray(suggestions) ? suggestions : []);
      } catch (error) {
        console.error('Error generating suggestions:', error);
        setAutocompleteData([]);
      }
    } else {
      setAutocompleteData([]);
    }
  }, [query, tldReady, generateSuggestions]);

  // Effect to handle URL query parameter
  useEffect(() => {
    if (urlQuery && urlQuery.trim()) {
      const decodedQuery = decodeURIComponent(urlQuery);
      setQuery(decodedQuery);
      performWHOISLookup(decodedQuery);
    }
  }, [urlQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper function to check if cached data is still valid
  const isCacheValid = (cachedData) => {
    if (!cachedData || !cachedData.timestamp) return false;
    return (Date.now() - cachedData.timestamp) < CACHE_DURATION;
  };

  // Helper function to add lookup to history
  const addToHistory = (query, results) => {
    const historyItem = {
      query,
      type: results?.type || 'unknown',
      timestamp: Date.now(),
      status: results?.status || 'Unknown'
    };

    const filteredHistory = lookupHistory.filter(item => item.query !== query);
    const newHistory = [historyItem, ...filteredHistory].slice(0, 100);
    setLookupHistory(newHistory);
  };

  // Helper function to cache WHOIS data
  const cacheWHOISData = (query, data) => {
    const cacheItem = {
      ...data,
      timestamp: Date.now()
    };
    setWhoisCache(prev => ({
      ...prev,
      [query]: cacheItem
    }));
  };

  // Function to perform WHOIS lookup
  const performWHOISLookup = async (queryToLookup) => {
    setLoading(true);
    setError(null);
    setLookupResults(null);

    try {
      const cleanQuery = queryToLookup.trim().toLowerCase();

      // Check cache first
      const cachedData = whoisCache[cleanQuery];
      if (cachedData && isCacheValid(cachedData)) {
        console.log(`📦 Using cached WHOIS data for: ${cleanQuery}`);
        setLookupResults(cachedData);
        addToHistory(cleanQuery, cachedData);
        setLoading(false);
        toast.success('WHOIS Lookup Complete (Cached)', {
          description: `Cached ${cachedData.type} information loaded for ${cleanQuery}`,
        });
        return;
      }

      console.log(`🔍 Performing WHOIS lookup for: ${cleanQuery}`);

      const whoisConfig = getApiEndpoint('whois');
      const apiUrl = buildApiUrl(whoisConfig.url, { query: cleanQuery });

      const response = await apiFetch(apiUrl, {
        headers: {
          ...whoisConfig.headers,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`WHOIS lookup failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      setLookupResults(data);
      cacheWHOISData(cleanQuery, data);
      addToHistory(cleanQuery, data);

      toast.success('WHOIS Lookup Complete', {
        description: `Successfully retrieved ${data.type} information for ${cleanQuery}`,
      });

    } catch (err) {
      console.error('💥 WHOIS Lookup Error:', err);
      const errorMessage = err.message || 'Failed to perform WHOIS lookup';
      setError(errorMessage);
      
      toast.error('WHOIS Lookup Failed', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = () => {
    if (!query.trim()) {
      toast.error('Invalid Input', {
        description: 'Please enter a domain name or IP address',
      });
      return;
    }
    performWHOISLookup(query);
  };

  const handleHistoryItemClick = (historyItem) => {
    setQuery(historyItem.query);
    performWHOISLookup(historyItem.query);
  };

  const clearHistory = () => {
    setLookupHistory([]);
    setWhoisCache({});
    toast.success('History Cleared', {
      description: 'All WHOIS lookup history and cache cleared',
    });
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const exportResults = () => {
    if (!lookupResults) return;
    
    const dataStr = JSON.stringify(lookupResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `whois-lookup-${lookupResults.query}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
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
      <SEOHead {...seoData} />
      <div className="grid gap-4">
        {/* Page furniture, so it sits above the split, not in the control column. */}
        <ToolHeader
          icon={WHOISIcon}
          title="WHOIS Lookup Tool"
          description="Get detailed registration information for domains and IP addresses"
          showTitle={false}
          standalone={true}
        />

        {/* Controls left, output right — DESIGN.md's Layout rule. */}
        <ToolSplit
          controls={
            <>
              <Card>
                <CardContent className="grid gap-4 pt-6">
                  <div className="grid gap-1.5">
                    <Label htmlFor="query">Domain Name or IP Address</Label>
                    <div className="relative">
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
                  </div>
                  <Button
                    onClick={handleLookup}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <RotateCcw className="mr-2 h-4 w-4 animate-spin-ccw" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    Lookup
                  </Button>
                </CardContent>
              </Card>

              {lookupHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <History className="h-4 w-4 shrink-0 text-[var(--cat)]" />
                        <h3 className="truncate text-title-sm">Recent Lookups</h3>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={clearHistory}
                        aria-label="Clear WHOIS lookup history"
                        title="Clear history"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* The row is the button — a history entry only ever
                        repeats its own lookup, and the 320px column has no
                        room for a separate control beside the query. */}
                    <div className="grid gap-1.5">
                      {lookupHistory.slice(0, 10).map((item, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleHistoryItemClick(item)}
                          title={`Repeat lookup for ${item.query}`}
                          className="grid w-full gap-1 rounded-md border border-outline p-2.5 text-left transition-colors hover:border-[var(--cat)] hover:bg-surface-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            {getTypeIcon(item.type)}
                            <span className="truncate font-mono text-data-md">{item.query}</span>
                            <span className="ml-auto shrink-0">{getTypeBadge(item.type)}</span>
                          </div>
                          <span className="pl-6 text-data-sm font-mono text-muted-foreground">
                            {formatDate(item.timestamp)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          }
        >

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

          {!loading && !error && !lookupResults && (
            <ToolSplitEmpty
              icon={<WHOISIcon size={28} />}
              title="No lookup yet"
              hint="Enter a domain or an IP address — registration detail appears here."
            />
          )}
        </ToolSplit>
      </div>
    </TooltipProvider>
  );
};

export default WHOISLookupShadcn;