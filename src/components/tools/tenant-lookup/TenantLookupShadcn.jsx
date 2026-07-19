import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToolSplit, ToolSplitEmpty } from "@/components/ui/tool-split";
import {
  Search,
  Building,
  Globe,
  AlertCircle,
  History,
  Trash2,
  RotateCcw,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';
import { getApiEndpoint, buildApiUrl, apiFetch } from '../../../utils/api/apiUtils';
import TenantLookupIcon from './TenantLookupIcon';
import HelpSystemShadcn from './components/HelpSystemShadcn';
import TenantInfoDisplay from './components/TenantInfoDisplay';
import DNSAnalysisDisplay from './components/DNSAnalysisDisplay';
import ServiceVerificationDisplay from './components/ServiceVerificationDisplay';
import APIResultsDisplay from './components/APIResultsDisplay';
import RawDataDisplay from './components/RawDataDisplay';
import SEOHead from '../../common/SEOHead';
import ToolHeader from '../../common/ToolHeader';
import { generateToolSEO } from '../../../utils/seoUtils';
import toolsConfig from '../../../utils/toolsConfig.json';

const TenantLookupShadcn = () => {
  // Get tool configuration for SEO
  const toolConfig = toolsConfig.find(tool => tool.id === 'tenant-lookup');
  const seoData = generateToolSEO(toolConfig);

  const { domain: urlDomain } = useParams();
  const [domain, setDomain] = useState(urlDomain || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  
  // Saved lookups storage
  const [savedLookups, setSavedLookups] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tenant-lookup-saved')) || [];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever savedLookups changes
  useEffect(() => {
    localStorage.setItem('tenant-lookup-saved', JSON.stringify(savedLookups));
  }, [savedLookups]);

  // Auto-lookup if domain is provided in URL
  useEffect(() => {
    if (urlDomain && urlDomain.trim()) {
      setDomain(urlDomain);
      handleLookup(urlDomain);
    }
  }, [urlDomain]);

  const extractDomain = (input) => {
    if (!input || typeof input !== 'string') return '';
    
    const trimmed = input.trim();
    
    // If it contains @, treat as email and extract domain
    if (trimmed.includes('@')) {
      const parts = trimmed.split('@');
      return parts[parts.length - 1].toLowerCase();
    }
    
    // Otherwise return as-is (assuming it's already a domain)
    return trimmed.toLowerCase();
  };

  const handleLookup = async (inputDomain = domain) => {
    const cleanDomain = extractDomain(inputDomain);
    
    if (!cleanDomain.trim()) {
      setError('Please enter a domain name or email address');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const tenantConfig = getApiEndpoint('tenant');
      const apiUrl = buildApiUrl(tenantConfig.url, { domain: cleanDomain });
      
      const response = await apiFetch(apiUrl, {
        method: 'GET',
        headers: {
          ...tenantConfig.headers,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          setResult(data);
          toast.success('Tenant Lookup Complete', {
            description: `Found tenant information for ${cleanDomain}`,
          });
        } else {
          setError(data.error || 'Tenant lookup failed');
          toast.error('Tenant Lookup Failed', {
            description: data.error || 'Unable to find tenant information',
          });
        }
      } else {
        setError(`Request failed with status ${response.status}`);
        toast.error('Lookup Request Failed', {
          description: `Server returned status ${response.status}`,
        });
      }
    } catch (err) {
      console.error('Tenant lookup error:', err);
      
      // Provide more helpful error messages for common issues
      if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
        setError('Unable to connect to the tenant lookup service. This may be due to CORS restrictions or network connectivity issues.');
      } else if (err.message.includes('CORS')) {
        setError('Cross-origin request blocked. The tenant lookup service may need to be configured to allow requests from this domain.');
      } else {
        setError(`Network error: ${err.message}`);
      }
      
      toast.error('Network Error', {
        description: 'Unable to connect to tenant lookup service',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleLookup();
    }
  };

  // Save current lookup result
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
    
    setSavedLookups(prev => [savedLookup, ...prev]);
    
    toast.success('Lookup Saved', {
      description: `Tenant information for ${result.domain} has been saved`,
    });
  };

  // Load saved lookup
  const handleLoadLookup = (savedLookup) => {
    setResult(savedLookup.fullResult);
    setDomain(savedLookup.domain);
    setError(null);
    
    toast.success('Lookup Loaded', {
      description: `Loaded saved tenant information for ${savedLookup.domain}`,
    });
  };

  // Delete saved lookup
  const handleDeleteLookup = (id) => {
    setSavedLookups(prev => prev.filter(lookup => lookup.id !== id));
    
    toast.success('Lookup Deleted', {
      description: 'Saved tenant lookup has been removed',
    });
  };

  // Clear all saved lookups
  const handleClearAllSaved = () => {
    setSavedLookups([]);
    
    toast.success('All Lookups Cleared', {
      description: 'All saved tenant lookups have been removed',
    });
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTenantTypeColor = (tenantType) => {
    // A tenant kind, not a verdict on it — the category hue for the known
    // kinds, neutral for anything unrecognised.
    switch (tenantType) {
      case 'AAD':
      case 'B2C':
      case 'AADB2C':
        return 'bg-[color-mix(in_oklab,var(--cat)_13%,transparent)] text-[var(--cat)]';
      default:
        return 'bg-surface-inset text-on-surface-muted';
    }
  };


  return (
    <TooltipProvider>
      <SEOHead {...seoData} />
      <div className="grid gap-4">
        {/* Page furniture, so it sits above the split, not in the control column. */}
        <ToolHeader
          icon={TenantLookupIcon}
          title="Microsoft Tenant Lookup"
          description="Discover Microsoft 365 and Azure AD tenant information from domain names or email addresses"
          showTitle={false}
          standalone={true}
          actions={[
            {
              text: "Help",
              icon: HelpCircle,
              onClick: () => setShowHelp(true),
              variant: "outline",
              size: "sm"
            }
          ]}
        />

        {/* Controls left, output right — DESIGN.md's Layout rule. */}
        <ToolSplit
          controls={
            <>
              <Card>
                <CardContent className="grid gap-4 pt-6">
                  <div className="grid gap-1.5">
                    <Label htmlFor="domain">Domain or Email Address</Label>
                    <div className="relative">
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
                  </div>
                  <Button
                    onClick={() => handleLookup()}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <RotateCcw className="mr-2 h-4 w-4 animate-spin-ccw" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    Lookup Tenant
                  </Button>
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

        {/* Results */}
        {result && !loading && (
          <Tabs defaultValue="tenant" className="space-y-4">
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

              {savedLookups.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <History className="h-4 w-4 shrink-0 text-[var(--cat)]" />
                        <h3 className="truncate text-title-sm">Saved Lookups</h3>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleClearAllSaved}
                        aria-label="Clear all saved lookups"
                        title="Clear all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* The row loads the lookup; delete stays a sibling
                        rather than a nested button, which is invalid HTML. */}
                    <div className="grid gap-1.5">
                      {savedLookups.map((savedLookup) => (
                        <div key={savedLookup.id} className="flex items-stretch gap-1">
                          <button
                            type="button"
                            onClick={() => handleLoadLookup(savedLookup)}
                            title={`Load ${savedLookup.domain}`}
                            className="grid min-w-0 flex-1 gap-1 rounded-md border border-outline p-2.5 text-left transition-colors hover:border-[var(--cat)] hover:bg-surface-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <Building className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <span className="truncate font-medium">{savedLookup.domain}</span>
                              <Badge
                                className={`ml-auto shrink-0 ${getTenantTypeColor(savedLookup.fullResult?.tenantType)}`}
                              >
                                {savedLookup.fullResult?.tenantType || 'Unknown'}
                              </Badge>
                            </div>
                            <span className="truncate pl-6 text-body-sm text-muted-foreground">
                              {savedLookup.displayName || formatTimestamp(savedLookup.savedAt)}
                            </span>
                          </button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteLookup(savedLookup.id)}
                            aria-label={`Delete saved lookup for ${savedLookup.domain}`}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          }
        >

          {!loading && !error && !result && (
            <ToolSplitEmpty
              icon={<TenantLookupIcon size={28} />}
              title="No tenant looked up yet"
              hint="Enter a domain or an email address — the tenant detail appears here."
            />
          )}
        </ToolSplit>

        <HelpSystemShadcn 
          opened={showHelp} 
          onClose={() => setShowHelp(false)} 
        />
      </div>
    </TooltipProvider>
  );
};

export default TenantLookupShadcn;