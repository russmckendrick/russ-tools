import React from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Globe,
  Search,
  AlertCircle,
  Clock,
  History,
  ShieldCheck,
  Trash2,
  RotateCcw,
  X,
  Award
} from 'lucide-react';
import { toast } from 'sonner';
import { useLookupTool } from '@/lib/useLookupTool';
import { performSSLCheck } from './lib/sslApi';
import { validateDomain, cleanDomain, isSSLDataComplete, getGradeInfo } from './lib/sslUtils';
import SSLResultsDisplay from './components/SSLResultsDisplay';

const SslCheckerTool = () => {
  const [validationError, setValidationError] = React.useState('');

  const {
    query: domain,
    setQuery: setDomain,
    result: certificateData,
    loading,
    error,
    lookup,
    history: domainHistory,
    clearHistory: clearStoredHistory,
    removeFromHistory,
  } = useLookupTool({
    toolId: 'ssl-checker',
    fetcher: (q, { signal }) => performSSLCheck(q, { signal }),
    cacheTTL: 5 * 60 * 1000,
    maxHistory: 50,
    urlParam: 'domain',
    normalize: cleanDomain,
    legacy: { history: 'ssl-checker-history' },
    // A partial assessment must not be served again for five minutes.
    cacheable: isSSLDataComplete,
    historyEntry: (q, data) => ({
      domain: q,
      grade: data.endpoints?.[0]?.grade || 'Unknown',
      hasWarnings: data.endpoints?.[0]?.hasWarnings || false,
    }),
    onSuccess: (q, data, fromCache) =>
      toast.success(fromCache ? 'Loaded from cache' : 'SSL Check Complete', {
        description: fromCache
          ? `SSL data for ${q} loaded from cache`
          : `SSL certificate analysis completed for ${q}`,
      }),
    onError: (q, err) =>
      toast.error('SSL Check Failed', {
        description: err.message || 'Failed to analyze SSL certificate',
      }),
  });

  const handleDomainSubmit = (domainToCheck = domain) => {
    if (!domainToCheck) return;

    const cleaned = cleanDomain(domainToCheck);
    const validation = validateDomain(cleaned);

    if (validation) {
      setValidationError(validation);
      return;
    }

    setValidationError('');
    lookup(cleaned);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleDomainSubmit();
  };

  const clearHistory = () => {
    clearStoredHistory();
    toast.success('History cleared');
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
      <div className="space-y-6">
        {/* SSL Check Form */}
        <Card>
          <CardHeader>
            <h2 className="text-title-sm">Check SSL Certificate</h2>
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
                  <p className="text-body-sm text-muted-foreground max-w-md">
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

        {/* Connectivity-only result: the analysis pipeline was unreachable and
            the browser probe proved HTTPS works. Nothing more is claimed —
            this replaces a fallback that fabricated a grade and certificate. */}
        {certificateData?.connectivityOnly && !loading && (
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Analysis unavailable — HTTPS connectivity verified</AlertTitle>
            <AlertDescription>
              {certificateData.host} accepted a secure connection, so it presents a working
              certificate — but the SSL Labs analysis service could not be reached, and no
              grade or configuration details are available. Try again later for the full report.
            </AlertDescription>
          </Alert>
        )}

        {/* SSL Results */}
        {certificateData && !certificateData.connectivityOnly && !loading && (
          <SSLResultsDisplay data={certificateData} />
        )}

        {/* Recent SSL Checks History */}
        {domainHistory.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  <h3 className="text-title-sm">Recent SSL Checks</h3>
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
                        <span className="text-data-md font-mono">{item.domain}</span>
                        <div className="flex items-center gap-2 text-data-sm font-mono text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getGradeBadge(item.grade)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDomainSubmit(item.domain)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Recheck
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromHistory((entry) => (entry.query ?? entry.domain) === item.domain)}
                        aria-label={`Remove ${item.domain} from history`}
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

export default SslCheckerTool;
