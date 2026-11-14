import React from 'react';
import { AlertCircle, Clock, History, Link2, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Ghost } from '@/components/ui/ghost';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLookupTool } from '@/lib/useLookupTool';
import { textResult, useWebMCPTool } from '@/lib/useWebMCPTool';
import Results, { Chain } from './components/Results.jsx';
import { analyse, toPlain } from './lib/analyse.js';
import { fetchHeaders } from './lib/headersApi.js';
import { cleanTarget, displayHost, validateTarget } from './lib/target.js';

const CHECK_HEADERS_TOOL = {
  name: 'check_http_security_headers',
  description:
    "Fetch a public http(s) URL from the russ.tools server and report its security response headers: " +
    'the redirect chain, then Strict-Transport-Security, Content-Security-Policy, X-Content-Type-Options, ' +
    'X-Frame-Options and frame-ancestors, Referrer-Policy, Permissions-Policy, the Cross-Origin-* policies, ' +
    'Server and X-Powered-By, and the flags (never the values) of any cookies set. Each check is pass, warn, ' +
    'fail or info with a specific finding. There is no overall grade. Private, loopback and internal addresses ' +
    'are refused, as are ports other than 80 and 443.',
  inputSchema: {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'A public hostname or http(s) URL, for example example.com' },
    },
    required: ['url'],
  },
  annotations: { readOnlyHint: true, openWorldHint: true, untrustedContentHint: true },
  execute: async ({ url }) => {
    const target = cleanTarget(url);
    const invalid = validateTarget(target);
    if (invalid) return textResult({ error: invalid });
    try {
      return textResult(toPlain(analyse(await fetchHeaders(target))));
    } catch (error) {
      return textResult({ error: error.message, code: error.code, redirects: error.chain });
    }
  },
};

const GHOST_REPORT = (() => {
  const report = analyse({
    requestedUrl: 'https://example.com/',
    finalUrl: 'https://www.example.com/',
    status: 200,
    method: 'HEAD',
    chain: [
      { url: 'https://example.com/', status: 301, method: 'HEAD', location: 'https://www.example.com/' },
      { url: 'https://www.example.com/', status: 200, method: 'HEAD' },
    ],
    headers: {
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
      'content-security-policy': "default-src 'self'",
      'x-content-type-options': 'nosniff',
    },
    cookies: [],
  });
  return { ...report, checks: report.checks.slice(0, 3), headers: {} };
})();

const COUNT_BADGES = [
  ['pass', 'success', 'passed'],
  ['warn', 'warning', 'warnings'],
  ['fail', 'destructive', 'failed'],
];

export default function HttpHeadersTool() {
  useWebMCPTool(CHECK_HEADERS_TOOL);
  const [validationError, setValidationError] = React.useState('');
  const [stoppedChain, setStoppedChain] = React.useState([]);

  const {
    query,
    setQuery,
    result,
    loading,
    error,
    lookup,
    history,
    clearHistory,
    removeFromHistory,
  } = useLookupTool({
    toolId: 'http-headers',
    fetcher: (target, { signal }) => fetchHeaders(target, { signal }),
    cacheTTL: 5 * 60 * 1000,
    maxHistory: 30,
    urlParam: 'domain',
    normalize: cleanTarget,
    historyEntry: (_target, data) => {
      const { counts } = analyse(data);
      return { finalUrl: data.finalUrl, pass: counts.pass, warn: counts.warn, fail: counts.fail };
    },
    onSuccess: (target, _data, fromCache) => {
      setStoppedChain([]);
      if (fromCache) toast.info('Showing the last result', { description: `${displayHost(target)} was checked in the last five minutes.` });
    },
    onError: (_target, failure) => setStoppedChain(failure.chain ?? []),
  });

  const report = React.useMemo(() => (result ? analyse(result) : null), [result]);

  const check = (raw = query) => {
    const target = cleanTarget(raw);
    const invalid = validateTarget(target);
    setValidationError(invalid);
    if (invalid) return;
    setStoppedChain([]);
    setQuery(target);
    lookup(target);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    check();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-3" noValidate>
            <div>
              <Label htmlFor="http-headers-target">URL or hostname</Label>
              <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-faint" />
                  <Input
                    id="http-headers-target"
                    type="text"
                    inputMode="url"
                    placeholder="example.com"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-invalid={validationError ? true : undefined}
                    aria-describedby="http-headers-note"
                    className="pl-9"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <RotateCcw className="mr-2 h-4 w-4 animate-spin-ccw" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Check headers
                </Button>
              </div>
            </div>
            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}
            <p id="http-headers-note" className="text-body-sm text-on-surface-faint">
              The address you enter is sent to this site&apos;s server, which requests it and reads the response
              headers. A browser cannot read another site&apos;s headers itself. The page body is never read, and
              private or internal addresses are refused.
            </p>
          </form>
        </CardContent>
      </Card>

      {error && !loading && (
        <>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>The check did not finish</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          {stoppedChain.length > 0 && <Chain hops={stoppedChain} />}
        </>
      )}

      {(loading || (!report && !error)) && (
        <Ghost
          loading={loading}
          label={`Requesting ${displayHost(query)} and reading its headers…`}
          hint="Up to eight seconds, across at most five redirects."
        >
          <Results report={GHOST_REPORT} />
        </Ghost>
      )}

      {report && !loading && (
        <div className="rt-arrive">
          <Results report={report} />
        </div>
      )}

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5" aria-hidden="true" />
                <h3 className="text-title-sm">Recent checks</h3>
              </div>
              <Button variant="outline" size="sm" onClick={clearHistory}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear history
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col">
              {history.map((item) => (
                <li
                  key={item.query}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-rule py-3 first:pt-0 last:border-b-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="font-mono text-data-md text-on-surface [overflow-wrap:anywhere]">{item.query}</span>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-data-sm text-on-surface-muted">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {COUNT_BADGES.filter(([key]) => item[key] > 0).map(([key, variant, word]) => (
                      <Badge key={key} variant={variant}>
                        {item[key]} {word}
                      </Badge>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => check(item.query)}>
                      <RotateCcw className="mr-1 h-4 w-4" />
                      Recheck
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromHistory(item.query)}
                      aria-label={`Remove ${item.query} from history`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
