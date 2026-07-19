import React, { useEffect } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToolSplit, ToolSplitEmpty } from "@/components/ui/tool-split";
import {
  Globe,
  Search,
  AlertCircle,
  Clock,
  History,
  Trash2,
  RotateCcw,
  X,
  Award
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import SEOHead from '../../common/SEOHead';
import toolsConfig from '@/utils/toolsConfig.json';
import { generateToolSEO } from '@/utils/seoUtils';
import { useTLDs } from '../../../utils';
import { useShell } from '@/bridge/ShellContext';

import { useSSLChecker } from './hooks/useSSLChecker';
import SSLResultsDisplay from './components/SSLResultsDisplay';
import SSLCheckerIcon from './SSLCheckerIcon';
import { getGradeInfo } from './utils/sslUtils';

const SSLCheckerShadcn = () => {
  // Get tool configuration for SEO
  const toolConfig = toolsConfig.find(tool => tool.id === 'ssl-checker');
  const seoData = generateToolSEO(toolConfig);

  // Get domain from URL parameters
  const { domain: urlDomain } = useParams();

  // Under the Astro shell ToolLayout already renders the icon, h1 and
  // description from the manifest; this component's own header would be a
  // second h1 on the page.
  const shell = useShell();

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

  // Grade badge component to match main results
  const getGradeBadge = (grade) => {
    if (!grade || grade === '-') return null;
    
    const gradeInfo = getGradeInfo(grade);
    
    return (
      <Badge 
        variant="outline" 
        className={`${gradeInfo.color} border-0 text-body-sm font-semibold px-2 py-1`}
      >
        <Award className="w-3 h-3 mr-1" />
        {grade}
      </Badge>
    );
  };

  return (
    <TooltipProvider>
      <SEOHead {...seoData} />
      <div className="grid gap-4">
        {/* Page furniture, so it sits above the split, not in the control column. */}
        {!shell && (
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[color-mix(in_oklab,var(--cat,var(--color-primary))_13%,transparent)] rounded-xl">
              <SSLCheckerIcon className="w-8 h-8 text-[var(--cat,var(--color-primary))]" />
            </div>
            <div>
              <h1 className="text-headline-md">SSL Certificate Checker</h1>
              <p className="text-muted-foreground">
                Analyze SSL/TLS certificates and security configuration for any domain
              </p>
            </div>
          </div>
        )}

        {/* Controls left, output right — DESIGN.md's Layout rule. */}
        <ToolSplit
          controls={
            <>
              <Card>
                <CardHeader>
                  <h2 className="text-title-sm">Check SSL Certificate</h2>
                </CardHeader>
                <CardContent>
                  <form onSubmit={onSubmit} className="grid gap-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="domain">Domain Name</Label>
                      <div className="relative">
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
                    </div>
                    {validationError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{validationError}</AlertDescription>
                      </Alert>
                    )}
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <RotateCcw className="mr-2 h-4 w-4 animate-spin-ccw" />
                      ) : (
                        <Search className="mr-2 h-4 w-4" />
                      )}
                      Check SSL
                    </Button>
                  </form>
                </CardContent>
              </Card>


              {hasHistory && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <History className="h-4 w-4 shrink-0 text-[var(--cat)]" />
                        <h3 className="truncate text-title-sm">Recent Checks</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearHistory}
                        aria-label="Clear SSL check history"
                        title="Clear history"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* The row rechecks; the × stays a sibling rather than a
                        nested button, which is invalid HTML. */}
                    <div className="grid gap-1.5">
                      {domainHistory.map((item, index) => (
                        <div key={index} className="flex items-stretch gap-1">
                          <button
                            type="button"
                            onClick={() => handleRecheck(item.domain)}
                            title={`Recheck ${item.domain}`}
                            className="grid min-w-0 flex-1 gap-1 rounded-md border border-outline p-2.5 text-left transition-colors hover:border-[var(--cat)] hover:bg-surface-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="truncate text-data-md font-mono">{item.domain}</span>
                              <span className="ml-auto shrink-0">{getGradeBadge(item.grade)}</span>
                            </div>
                            <span className="flex items-center gap-1.5 text-data-sm font-mono text-muted-foreground">
                              <Clock className="h-3 w-3 shrink-0" />
                              {new Date(item.timestamp).toLocaleDateString()}
                            </span>
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeDomainFromHistory(item.domain)}
                            aria-label={`Remove ${item.domain} from history`}
                            title="Remove"
                          >
                            <X className="h-4 w-4" />
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
          {loading && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center p-8">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex items-center gap-3">
                      <RotateCcw className="h-5 w-5 animate-spin-ccw" />
                      <span>Analyzing SSL certificate for {domain}...</span>
                    </div>
                    <p className="text-body-sm text-muted-foreground max-w-md">
                      This may take up to 2 minutes as we perform comprehensive SSL Labs analysis.
                      Please wait while we analyze the certificate configuration.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {error && !loading && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {certificateData && !loading && <SSLResultsDisplay data={certificateData} />}
          {!loading && !error && !certificateData && (
            <ToolSplitEmpty
              icon={<SSLCheckerIcon className="h-7 w-7" />}
              title="No certificate checked yet"
              hint="Enter a domain — the certificate, protocols and grade appear here."
            />
          )}
        </ToolSplit>
      </div>
    </TooltipProvider>
  );
};

export default SSLCheckerShadcn;