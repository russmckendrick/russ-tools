import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AlertCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import SEOHead from '../../common/SEOHead';
import ToolHeader from '../../common/ToolHeader';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';
import { getApiEndpoint, buildApiUrl, apiFetch } from '../../../utils/api/apiUtils';
import DNSIcon from './DNSIcon';
import DNSLookupForm from './components/DNSLookupForm';
import DNSResultsDisplay from './components/DNSResultsDisplay';
import DNSHistoryDisplay from './components/DNSHistoryDisplay';
import { useTLDs } from '../../../utils';

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
        console.error('Error generating suggestions:', error);
        setAutocompleteData([]);
      }
    } else {
      setAutocompleteData([]);
    }
  }, [domain, tldReady, generateSubdomainSuggestions]);

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
      recordCount: results?.Answer ? results.Answer.length : 0
    };

    const filteredHistory = lookupHistory.filter(
      item => !(item.domain === domain && item.recordType === recordType && item.provider === provider)
    );
    const newHistory = [historyItem, ...filteredHistory].slice(0, 50);
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

  // Function to perform DNS lookup
  const performDNSLookup = async (domainToLookup, recordTypeToUse, providerToUse) => {
    setLoading(true);
    setError(null);
    setLookupResults(null);

    try {
      const cleanDomain = domainToLookup.trim().toLowerCase();
      const cacheKey = `${cleanDomain}-${recordTypeToUse}-${providerToUse}`;

      // Check cache first
      const cachedData = dnsCache[cacheKey];
      if (cachedData && isCacheValid(cachedData)) {
        console.log(`📦 Using cached DNS data for: ${cleanDomain} (${recordTypeToUse})`);
        setLookupResults(cachedData);
        addToHistory(cleanDomain, recordTypeToUse, providerToUse, cachedData);
        setLoading(false);
        toast.success('DNS Lookup Complete (Cached)', {
          description: `Cached ${recordTypeToUse} records loaded for ${cleanDomain}`,
        });
        return;
      }

      console.log(`🔍 Performing DNS lookup for: ${cleanDomain} (${recordTypeToUse})`);

      const dnsConfig = getApiEndpoint('dns');
      const apiUrl = buildApiUrl(dnsConfig.url, {
        name: cleanDomain,
        type: recordTypeToUse,
        provider: providerToUse
      });

      const response = await apiFetch(apiUrl, {
        headers: {
          ...dnsConfig.headers,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`DNS lookup failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Add timestamp to results
      data.timestamp = Date.now();
      
      setLookupResults(data);
      cacheDNSData(cleanDomain, recordTypeToUse, providerToUse, data);
      addToHistory(cleanDomain, recordTypeToUse, providerToUse, data);

      const recordCount = data.Answer ? data.Answer.length : 0;
      toast.success('DNS Lookup Complete', {
        description: `Found ${recordCount} ${recordTypeToUse} record${recordCount !== 1 ? 's' : ''} for ${cleanDomain}`,
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

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleLookup();
    }
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

        {/* Results */}
        {lookupResults && !loading && (
          <DNSResultsDisplay 
            results={lookupResults}
            domain={domain}
            recordType={recordType}
          />
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

export default DNSLookupShadcn;