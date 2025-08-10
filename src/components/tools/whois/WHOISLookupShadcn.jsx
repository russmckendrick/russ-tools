import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
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
  MapPin,
  Server,
  Calendar,
  Building,
  Flag,
  Network,
  Shield,
  Clock
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
  const [autocompleteData, setAutocompleteData] = useState([]);

  // Get tool configuration for SEO
  const toolConfig = toolsConfig.find(tool => tool.id === 'whois-lookup');
  const seoData = generateToolSEO(toolConfig);
  
  // Use TLD utilities hook
  let tldHookResult = {};
  try {
    tldHookResult = useTLDs() || {};
  } catch (error) {
    console.error('Error loading TLD utilities:', error);
    tldHookResult = {};
  }
  const { generateSuggestions, isReady: tldReady } = tldHookResult;

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
      domain: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      ip: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      network: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    };
    
    return (
      <Badge className={colors[type?.toLowerCase()] || 'bg-gray-100 text-gray-800'}>
        {type || 'Unknown'}
      </Badge>
    );
  };

  const WHOISInfoDisplay = ({ data }) => {
    if (!data) return null;

    const formatValue = (value) => {
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return value || 'Not available';
    };

    return (
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {getTypeIcon(data.type)}
                Basic Information
              </h3>
              {getTypeBadge(data.type)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Query</p>
                <p className="font-medium font-mono">{data.query}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{data.type || 'Unknown'}</p>
              </div>
              {data.status && (
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">{data.status}</p>
                </div>
              )}
              {data.registrar && (
                <div>
                  <p className="text-sm text-muted-foreground">Registrar</p>
                  <p className="font-medium">{data.registrar}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Registration Dates */}
        {(data.created || data.updated || data.expires) && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Registration Dates
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.created && (
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(data.created)}</p>
                  </div>
                )}
                {data.updated && (
                  <div>
                    <p className="text-sm text-muted-foreground">Updated</p>
                    <p className="font-medium">{formatDate(data.updated)}</p>
                  </div>
                )}
                {data.expires && (
                  <div>
                    <p className="text-sm text-muted-foreground">Expires</p>
                    <p className="font-medium">{formatDate(data.expires)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Name Servers */}
        {data.nameservers && data.nameservers.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Server className="h-4 w-4" />
                Name Servers
              </h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {data.nameservers.map((ns, index) => (
                  <div key={index} className="p-2 bg-muted/50 rounded font-mono text-sm">
                    {ns}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        {(data.registrant || data.admin || data.tech) && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Building className="h-4 w-4" />
                Contact Information
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['registrant', 'admin', 'tech'].map(type => {
                  const contact = data[type];
                  if (!contact) return null;
                  
                  return (
                    <div key={type} className="border-l-2 border-primary pl-4">
                      <h4 className="font-medium capitalize mb-2">{type} Contact</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {Object.entries(contact).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-muted-foreground capitalize">{key}: </span>
                            <span className="font-medium">{formatValue(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Raw WHOIS Data */}
        {data.raw_whois && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Raw WHOIS Data</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(data.raw_whois)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Raw Data
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={data.raw_whois}
                readOnly
                rows={15}
                className="font-mono text-xs bg-muted/50"
              />
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <SEOHead {...seoData} />
      <div className="space-y-6">
        {/* Header */}
        <ToolHeader
          icon={Search}
          title="WHOIS Lookup Tool"
          description="Get detailed registration information for domains and IP addresses"
          iconColor="blue"
          badges={[
            { text: "Domain Lookup", variant: "secondary" },
            { text: "IP Information", variant: "secondary" },
            { text: "Registration Data", variant: "secondary" }
          ]}
          standalone={true}
        />

        {/* Lookup Form */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="query">Domain Name or IP Address</Label>
                <div className="flex gap-2 mt-1">
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
                      <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
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
                  <RotateCcw className="h-5 w-5 animate-spin" />
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
                    <h3 className="text-lg font-semibold">Raw WHOIS Response</h3>
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
                    className="font-mono text-xs"
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
                  <h3 className="text-lg font-semibold">Recent Lookups</h3>
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
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(item.type)}
                      <div>
                        <p className="font-medium font-mono">{item.query}</p>
                        <p className="text-xs text-muted-foreground">
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

export default WHOISLookupShadcn;