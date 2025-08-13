import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  ExternalLink,
  History,
  AlertCircle,
  Server
} from 'lucide-react';
import { toast } from 'sonner';
import { useParams, Link } from 'react-router-dom';
import SEOHead from '../../common/SEOHead';
import ToolHeader from '../../common/ToolHeader';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';
import { getApiEndpoint, buildApiUrl, apiFetch } from '../../../utils/api/apiUtils';
import DNSIcon from './DNSIcon';
import { useTLDs } from '../../../utils';

const DNS_RECORD_TYPES = [
  { value: 'A', label: 'A Record (IPv4)' },
  { value: 'AAAA', label: 'AAAA Record (IPv6)' },
  { value: 'MX', label: 'MX Record (Mail Exchange)' },
  { value: 'TXT', label: 'TXT Record (Text)' },
  { value: 'CNAME', label: 'CNAME Record (Alias)' },
  { value: 'NS', label: 'NS Record (Name Server)' },
  { value: 'SOA', label: 'SOA Record (Start of Authority)' },
  { value: 'PTR', label: 'PTR Record (Reverse DNS)' },
  { value: 'SRV', label: 'SRV Record (Service)' },
  { value: 'CAA', label: 'CAA Record (Certificate Authority)' }
];

const DNS_PROVIDERS = [
  { value: 'google', label: 'Google DNS (8.8.8.8)', server: '8.8.8.8' },
  { value: 'cloudflare', label: 'Cloudflare DNS (1.1.1.1)', server: '1.1.1.1' },
  { value: 'opendns', label: 'OpenDNS (208.67.222.222)', server: '208.67.222.222' },
  { value: 'auto', label: 'Browser Default', server: 'auto' }
];

const DNSLookupShadcn = () => {
  const [domain, setDomain] = useState('');
  const [recordType, setRecordType] = useState('A');
  const [dnsProvider, setDnsProvider] = useState('google');
  const [lookupResults, setLookupResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autocompleteData, setAutocompleteData] = useState([]);

  // Get tool configuration for SEO
  const toolConfig = toolsConfig.find(tool => tool.id === 'dns-lookup');
  const seoData = generateToolSEO(toolConfig);
  
  // Use TLD utilities hook for domain autocomplete (with error handling)
  let tldHookResult = {};
  try {
    tldHookResult = useTLDs() || {};
  } catch (error) {
    console.error('Error loading TLD utilities:', error);
    tldHookResult = {};
  }
  const { generateSubdomainSuggestions, isReady: tldReady } = tldHookResult;

  // Get domain from URL parameters
  const { domain: urlDomain } = useParams();

  // DNS lookup history and caching
  const [lookupHistory, setLookupHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dns-lookup-history')) || [];
    } catch {
      return [];
    }
  });

  const [dnsCache, setDnsCache] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dns-lookup-cache')) || {};
    } catch {
      return {};
    }
  });

  // Cache duration in milliseconds (5 minutes for DNS)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('dns-lookup-history', JSON.stringify(lookupHistory));
  }, [lookupHistory]);

  useEffect(() => {
    localStorage.setItem('dns-lookup-cache', JSON.stringify(dnsCache));
  }, [dnsCache]);

  // Effect to update autocomplete data when domain changes
  useEffect(() => {
    if (tldReady && generateSubdomainSuggestions) {
      try {
        const suggestions = generateSubdomainSuggestions(domain, 10);
        setAutocompleteData(Array.isArray(suggestions) ? suggestions : []);
      } catch (error) {
        console.error('Error generating domain suggestions:', error);
        setAutocompleteData([]);
      }
    } else {
      setAutocompleteData([]);
    }
  }, [domain, tldReady]);

  // Effect to handle URL domain parameter
  useEffect(() => {
    if (urlDomain && urlDomain.trim()) {
      const decodedDomain = decodeURIComponent(urlDomain);
      setDomain(decodedDomain);
      performDNSLookup(decodedDomain, recordType, dnsProvider);
    }
  }, [urlDomain]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper function to check if cached data is still valid
  const isCacheValid = (cachedData) => {
    if (!cachedData || !cachedData.timestamp) return false;
    return (Date.now() - cachedData.timestamp) < CACHE_DURATION;
  };

  // Helper function to add lookup to history
  const addToHistory = (domain, recordType, provider, results) => {
    const historyItem = {
      domain,
      recordType,
      provider,
      timestamp: Date.now(),
      recordCount: results?.answer?.length || 0,
      status: results?.status || 'Success'
    };

    const filteredHistory = lookupHistory.filter(
      item => !(item.domain === domain && item.recordType === recordType && item.provider === provider)
    );
    const newHistory = [historyItem, ...filteredHistory].slice(0, 100);
    setLookupHistory(newHistory);
  };

  // Helper function to cache DNS data
  const cacheDNSData = (domain, recordType, provider, data) => {
    const cacheKey = `${domain}-${recordType}-${provider}`;
    const cacheItem = {
      ...data,
      timestamp: Date.now()
    };
    setDnsCache(prev => ({
      ...prev,
      [cacheKey]: cacheItem
    }));
  };

  // Function to perform DNS lookup using DNS over HTTPS
  const performDNSLookup = async (domainToLookup, type, provider) => {
    setLoading(true);
    setError(null);
    setLookupResults(null);

    try {
      const cleanDomain = domainToLookup.trim().toLowerCase();
      const cacheKey = `${cleanDomain}-${type}-${provider}`;

      // Check cache first
      const cachedData = dnsCache[cacheKey];
      if (cachedData && isCacheValid(cachedData)) {
        console.log(`📦 Using cached DNS data for: ${cleanDomain}`);
        setLookupResults(cachedData);
        addToHistory(cleanDomain, type, provider, cachedData);
        setLoading(false);
        return;
      }

      console.log(`🔍 Performing DNS lookup for: ${cleanDomain} (${type}) via ${provider}`);

      let dnsConfig;
      let dohUrl;

      // Set up DNS over HTTPS URL based on provider
      switch (provider) {
        case 'google':
          dnsConfig = getApiEndpoint('dns', 'google');
          dohUrl = dnsConfig.url;
          break;
        case 'cloudflare':
          dnsConfig = getApiEndpoint('dns', 'cloudflare');
          dohUrl = dnsConfig.url;
          break;
        case 'opendns':
          // OpenDNS doesn't have a public DoH JSON API, fallback to Google
          dnsConfig = getApiEndpoint('dns', 'opendns');
          dohUrl = dnsConfig.url;
          console.log('📝 OpenDNS DoH not available, using Google DNS as fallback');
          break;
        default:
          dnsConfig = getApiEndpoint('dns', 'google');
          dohUrl = dnsConfig.url;
      }

      const apiUrl = buildApiUrl(dohUrl, {
        name: cleanDomain,
        type: type,
        cd: false, // Don't check DNSSEC
        ct: 'application/dns-json'
      });

      const response = await apiFetch(apiUrl, {
        headers: {
          ...dnsConfig.headers,
          'Accept': 'application/dns-json'
        }
      });

      if (!response.ok) {
        // Try fallback to Google DNS if other providers fail
        if (provider !== 'google') {
          console.log(`⚠️ ${provider} failed, falling back to Google DNS`);
          const fallbackConfig = getApiEndpoint('dns', 'google');
          const fallbackUrl = buildApiUrl(fallbackConfig.url, {
            name: cleanDomain,
            type: type,
            cd: false,
            ct: 'application/dns-json'
          });
          const fallbackResponse = await apiFetch(fallbackUrl, {
            headers: {
              ...fallbackConfig.headers,
              'Accept': 'application/dns-json'
            }
          });
          
          if (!fallbackResponse.ok) {
            throw new Error(`DNS lookup failed: ${response.status} ${response.statusText}`);
          }
          
          const fallbackData = await fallbackResponse.json();
          
          // Process fallback results but indicate the original provider failed
          const processedResults = {
            ...fallbackData,
            domain: cleanDomain,
            recordType: type,
            provider: `${provider} (fallback: google)`,
            timestamp: Date.now(),
            status: fallbackData.Status === 0 ? 'Success' : 'Error',
            statusCode: fallbackData.Status,
            query: {
              name: cleanDomain,
              type: type,
              provider: provider
            }
          };

          setLookupResults(processedResults);
          cacheDNSData(cleanDomain, type, provider, processedResults);
          addToHistory(cleanDomain, type, provider, processedResults);

          toast.success('DNS Lookup Complete (Fallback)', {
            description: `${provider} failed, used Google DNS. Found ${fallbackData.Answer?.length || 0} records`,
          });
          
          return;
        }
        
        throw new Error(`DNS lookup failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Process and enhance the response data
      const processedResults = {
        ...data,
        domain: cleanDomain,
        recordType: type,
        provider: provider,
        timestamp: Date.now(),
        status: data.Status === 0 ? 'Success' : 'Error',
        statusCode: data.Status,
        query: {
          name: cleanDomain,
          type: type,
          provider: provider
        }
      };

      setLookupResults(processedResults);
      cacheDNSData(cleanDomain, type, provider, processedResults);
      addToHistory(cleanDomain, type, provider, processedResults);

      toast.success('DNS Lookup Complete', {
        description: `Found ${data.Answer?.length || 0} records for ${cleanDomain}`,
      });

    } catch (err) {
      console.error('💥 DNS Lookup Error:', err);
      const errorMessage = err.message || 'Failed to perform DNS lookup';
      setError(errorMessage);
      
      toast.error('DNS Lookup Failed', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = () => {
    if (!domain.trim()) {
      toast.error('Invalid Input', {
        description: 'Please enter a domain name',
      });
      return;
    }
    performDNSLookup(domain, recordType, dnsProvider);
  };

  const handleHistoryItemClick = (historyItem) => {
    setDomain(historyItem.domain);
    setRecordType(historyItem.recordType);
    setDnsProvider(historyItem.provider);
    performDNSLookup(historyItem.domain, historyItem.recordType, historyItem.provider);
  };

  const clearHistory = () => {
    setLookupHistory([]);
    setDnsCache({});
    toast.success('History Cleared', {
      description: 'All DNS lookup history and cache cleared',
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
    link.download = `dns-lookup-${lookupResults.domain}-${lookupResults.recordType}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper function to detect if a string is an IP address
  const isIPAddress = (str) => {
    // IPv4 regex
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    // IPv6 regex (simplified)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
    return ipv4Regex.test(str) || ipv6Regex.test(str);
  };

  const formatDNSRecord = (record) => {
    switch (record.type) {
      case 1: // A
        return `${record.name} → ${record.data}`;
      case 28: // AAAA
        return `${record.name} → ${record.data}`;
      case 5: // CNAME
        return `${record.name} → ${record.data}`;
      case 15: // MX
        return `${record.name} → ${record.data} (Priority: ${record.priority || 'N/A'})`;
      case 16: // TXT
        return `${record.name} → "${record.data}"`;
      case 2: // NS
        return `${record.name} → ${record.data}`;
      case 6: // SOA
        return `${record.name} → ${record.data}`;
      case 12: // PTR
        return `${record.name} → ${record.data}`;
      case 33: // SRV
        return `${record.name} → ${record.data}`;
      case 257: // CAA
        return `${record.name} → ${record.data}`;
      default:
        return `${record.name} → ${record.data}`;
    }
  };

  // Component to render DNS record with WHOIS link for IP addresses
  const DNSRecordDisplay = ({ record }) => {
    const recordText = formatDNSRecord(record);
    const isIP = isIPAddress(record.data);
    
    return (
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
        <div className="font-mono text-sm flex-1 break-all">
          {recordText}
        </div>
        <div className="flex gap-2 ml-2 flex-shrink-0">
          {isIP && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                >
                  <Link to={`/whois-lookup/${record.data}`}>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>WHOIS lookup for {record.data}</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(recordText)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy record</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <SEOHead {...seoData} />
      <div className="space-y-6">
        {/* Header */}
        <ToolHeader
          icon={DNSIcon}
          title="DNS Lookup Tool"
          description="Perform DNS queries for various record types using different DNS providers"
          iconColor="indigo"
          showTitle={false}
          standalone={true}
        />

        {/* Lookup Form */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="domain">Domain Name</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="domain"
                    placeholder="example.com or mail.example.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    onKeyPress={(event) => event.key === 'Enter' && handleLookup()}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="record-type">Record Type</Label>
                <Select value={recordType} onValueChange={setRecordType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DNS_RECORD_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dns-provider">DNS Provider</Label>
                <Select value={dnsProvider} onValueChange={setDnsProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DNS_PROVIDERS.map(provider => (
                      <SelectItem key={provider.value} value={provider.value}>
                        {provider.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>&nbsp;</Label>
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>DNS Lookup Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {lookupResults && (
          <Tabs defaultValue="results" className="space-y-4">
            <TabsList>
              <TabsTrigger value="results">DNS Records</TabsTrigger>
              <TabsTrigger value="details">Query Details</TabsTrigger>
              <TabsTrigger value="raw">Raw Response</TabsTrigger>
            </TabsList>

            <TabsContent value="results">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">DNS Records</h3>
                    <div className="flex gap-2">
                      <Badge variant={lookupResults.status === 'Success' ? 'default' : 'destructive'}>
                        {lookupResults.status}
                      </Badge>
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
                  {lookupResults.Answer && lookupResults.Answer.length > 0 ? (
                    <div className="space-y-2">
                      {lookupResults.Answer.map((record, index) => (
                        <DNSRecordDisplay key={index} record={record} />
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>No Records Found</AlertTitle>
                      <AlertDescription>
                        No DNS records of type {recordType} found for {lookupResults.domain}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Query Details</h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Domain</p>
                      <p className="font-medium">{lookupResults.domain}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Record Type</p>
                      <p className="font-medium">{lookupResults.recordType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">DNS Provider</p>
                      <p className="font-medium">{DNS_PROVIDERS.find(p => p.value === lookupResults.provider)?.label}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status Code</p>
                      <p className="font-medium">{lookupResults.statusCode}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Query Time</p>
                      <p className="font-medium">{new Date(lookupResults.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="raw">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Raw DNS Response</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(JSON.stringify(lookupResults, null, 2))}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy JSON
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={JSON.stringify(lookupResults, null, 2)}
                    readOnly
                    rows={15}
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
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{item.domain}</p>
                        <Badge variant="outline" size="sm">{item.recordType}</Badge>
                        <Badge variant="secondary" size="sm">{item.provider}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString()} • {item.recordCount} records
                      </p>
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

export default DNSLookupShadcn;