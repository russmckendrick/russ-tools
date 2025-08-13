import React, { useEffect } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Globe,
  Search,
  AlertCircle,
  Clock,
  History,
  Trash2,
  RotateCcw,
  X
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import SEOHead from '../../common/SEOHead';
import toolsConfig from '@/utils/toolsConfig.json';
import { generateToolSEO } from '@/utils/seoUtils';
import { useTLDs } from '../../../utils';

import { useSSLChecker } from './hooks/useSSLChecker';
import SSLResultsDisplay from './components/SSLResultsDisplay';
import SSLCheckerIcon from './SSLCheckerIcon';

const SSLCheckerShadcn = () => {
  // Get tool configuration for SEO
  const toolConfig = toolsConfig.find(tool => tool.id === 'ssl-checker');
  const seoData = generateToolSEO(toolConfig);

  // Get domain from URL parameters
  const { domain: urlDomain } = useParams();

  // Use TLD utilities hook for domain autocomplete (with error handling)
  const tldHookResult = useTLDs() || {};
  const { generateSubdomainSuggestions, isReady: tldReady } = tldHookResult;

  // Use SSL checker hook for all logic
  const {
    domain,
    setDomain,
    certificateData,
    loading,
    error,
    validationError,
    domainHistory,
    handleDomainSubmit,
    handleRecheck,
    removeDomainFromHistory,
    clearHistory,
    hasHistory
  } = useSSLChecker();

  // Effect to update autocomplete data when domain changes
  useEffect(() => {
    if (tldReady && generateSubdomainSuggestions) {
      try {
        generateSubdomainSuggestions(domain, 10);
        // Note: Autocomplete functionality disabled for now
      } catch {
        // Silently handle suggestion generation error
      }
    }
  }, [domain, tldReady, generateSubdomainSuggestions]);

  // Effect to handle URL domain parameter
  useEffect(() => {
    if (urlDomain && urlDomain.trim()) {
      setDomain(urlDomain.trim());
      handleDomainSubmit(urlDomain.trim());
    }
  }, [urlDomain, setDomain, handleDomainSubmit]);

  // Handle form submission
  const onSubmit = (e) => {
    e.preventDefault();
    handleDomainSubmit();
  };

  return (
    <TooltipProvider>
      <SEOHead {...seoData} />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
            <SSLCheckerIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">SSL Certificate Checker</h1>
            <p className="text-muted-foreground">
              Analyze SSL/TLS certificates and security configuration for any domain
            </p>
          </div>
        </div>

        {/* SSL Check Form */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Check SSL Certificate</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="domain">Domain Name</Label>
                <div className="flex gap-2 mt-1">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="domain"
                      type="text"
                      placeholder="example.com"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <RotateCcw className="mr-2 h-4 w-4 animate-spin-ccw" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    Check SSL
                  </Button>
                </div>
                {validationError && (
                  <Alert className="mt-2" variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center p-8">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex items-center gap-3">
                    <RotateCcw className="h-5 w-5 animate-spin-ccw" />
                    <span>Analyzing SSL certificate for {domain}...</span>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-md">
                    This may take up to 2 minutes as we perform comprehensive SSL Labs analysis. 
                    Please wait while we analyze the certificate configuration.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && !loading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* SSL Results */}
        {certificateData && !loading && (
          <SSLResultsDisplay data={certificateData} />
        )}

        {/* Recent SSL Checks History */}
        {hasHistory && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Recent SSL Checks</h3>
                </div>
                <Button variant="outline" size="sm" onClick={clearHistory}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear History
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {domainHistory.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{item.domain}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.hasWarnings ? "destructive" : "default"}>
                        {item.grade}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRecheck(item.domain)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Recheck
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDomainFromHistory(item.domain)}
                      >
                        <X className="h-4 w-4" />
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

export default SSLCheckerShadcn;