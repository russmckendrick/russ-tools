import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardPaste, Trash2, FileJson, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { readText } from '@/core';
import { PolicyCard } from './components/PolicyCard';
import { GapReport } from './components/GapReport';
import { parsePolicies, policyKey } from './lib/parse.js';
import { explain, loadWellKnown } from './lib/explain.js';
import { findGaps, summarise } from './lib/gaps.js';
import { SAMPLE } from './lib/sample.js';

const ConditionalAccessTool = () => {
  const [input, setInput] = useState('');
  const [wk, setWk] = useState(null);

  useEffect(() => {
    let live = true;
    // A failed load is not fatal: policies still explain, GUIDs just stay
    // GUIDs. So there is no error state for this — only a degraded one.
    loadWellKnown().then(
      (loaded) => live && setWk(loaded),
      () => live && setWk({})
    );
    return () => {
      live = false;
    };
  }, []);

  const parsed = useMemo(() => (input.trim() ? parsePolicies(input) : null), [input]);

  // Memoised so it is a stable reference: a fresh [] on every render would
  // re-explain every policy and re-run every check on each keystroke.
  const policies = useMemo(() => (parsed?.ok ? parsed.policies : []), [parsed]);

  const explained = useMemo(
    () => (wk ? policies.map((p) => explain(p, wk)) : []),
    [policies, wk]
  );

  const findings = useMemo(() => (wk ? findGaps(policies, wk) : []), [policies, wk]);
  const counts = useMemo(() => summarise(findings), [findings]);

  const onPaste = useCallback(async () => {
    const text = await readText();
    if (text) {
      setInput(text);
      toast.success('Pasted from clipboard');
    } else {
      toast.error('Nothing readable on the clipboard');
    }
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Paste a Conditional Access policy, an array of them, or a Graph response: { "value": [ ... ] }'
            aria-label="Conditional Access policy JSON"
            rows={10}
            className="font-mono text-data-sm"
          />

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onPaste}>
              <ClipboardPaste aria-hidden="true" />
              Paste
            </Button>
            <Button variant="outline" onClick={() => setInput(JSON.stringify(SAMPLE, null, 2))}>
              <FileJson aria-hidden="true" />
              Load sample
            </Button>
            {input && (
              <Button variant="outline" onClick={() => setInput('')}>
                <Trash2 aria-hidden="true" />
                Clear
              </Button>
            )}
          </div>

          <p className="text-body-sm text-muted-foreground">
            Everything runs in this tab. Nothing is uploaded, and nothing is kept — close the page
            and it is gone.
          </p>
        </CardContent>
      </Card>

      {parsed && !parsed.ok && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Could not read that</AlertTitle>
          <AlertDescription>{parsed.error}</AlertDescription>
        </Alert>
      )}

      {!input.trim() && (
        <Alert>
          <AlertTitle>Where to get the JSON</AlertTitle>
          <AlertDescription>
            From Graph Explorer, run{' '}
            <code className="font-mono text-data-sm">
              GET /identity/conditionalAccess/policies
            </code>{' '}
            and paste the whole response. From PowerShell, use{' '}
            <code className="font-mono text-data-sm">
              Get-MgIdentityConditionalAccessPolicy | ConvertTo-Json -Depth 10
            </code>
            . Or select <strong>Load sample</strong> to see how it reads.
          </AlertDescription>
        </Alert>
      )}

      {parsed?.ok && (
        <Tabs defaultValue="policies" className="space-y-4">
          <TabsList>
            <TabsTrigger value="policies">
              Policies
              <Badge variant="outline" className="ml-2">
                {policies.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="gaps">
              Gaps
              <Badge variant={counts.high > 0 ? 'destructive' : 'outline'} className="ml-2">
                {findings.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="policies" className="space-y-4">
            <p className="text-body-sm text-muted-foreground">
              Read as a {parsed.shape}. {policies.length}{' '}
              {policies.length === 1 ? 'policy' : 'policies'}.
            </p>
            {explained.map((p, i) => (
              <PolicyCard key={policyKey(policies[i], i)} policy={p} />
            ))}
          </TabsContent>

          <TabsContent value="gaps">
            <GapReport findings={findings} policyCount={policies.length} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ConditionalAccessTool;
