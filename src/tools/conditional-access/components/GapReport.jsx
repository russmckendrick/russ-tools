import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

const SEVERITY = {
  high: { label: 'High', tone: 'destructive' },
  medium: { label: 'Medium', tone: 'warning' },
  info: { label: 'Info', tone: 'outline' },
};

/**
 * The checklist results.
 *
 * The caveat sits above the findings rather than in a footnote, because the
 * difference between "your tenant has no legacy-auth block" and "nothing in
 * the JSON you pasted blocks legacy auth" is the whole of what this tool can
 * honestly claim. A reader who takes the first meaning away from a clean run
 * has been misled by the presentation, not by the checks.
 */
export function GapReport({ findings, policyCount }) {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertTitle>What this is</AlertTitle>
        <AlertDescription>
          A heuristic review of the {policyCount} {policyCount === 1 ? 'policy' : 'policies'} you
          pasted — not a tenant assessment. It cannot see policies you did not paste, who holds
          which role, or whether a named group is empty. Findings are prompts to check something,
          not verdicts.
        </AlertDescription>
      </Alert>

      {findings.length === 0 ? (
        <Alert>
          <CheckCircle2 aria-hidden="true" />
          <AlertTitle>No gaps found in what was pasted</AlertTitle>
          <AlertDescription>
            None of the checks fired. That is a statement about these policies only — if this is a
            subset of the tenant, the rest is still unreviewed.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardContent className="divide-y divide-border pt-6">
            {findings.map((f) => {
              const sev = SEVERITY[f.severity] ?? SEVERITY.info;
              return (
                <article key={f.id} className="space-y-2 py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <Badge variant={sev.tone}>{sev.label}</Badge>
                    <h3 className="text-title-sm">{f.title}</h3>
                  </div>
                  <p className="text-body-sm text-muted-foreground">{f.detail}</p>
                  {f.policies.length > 0 && (
                    <p className="text-body-sm">
                      <span className="text-muted-foreground">Affects: </span>
                      {f.policies.join(', ')}
                    </p>
                  )}
                </article>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
