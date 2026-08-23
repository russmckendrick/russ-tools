import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { list } from '../lib/explain.js';

/** One labelled row of the who/what/when/then breakdown. */
function Row({ label, children }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:gap-4">
      <dt className="text-label-caps text-muted-foreground">{label}</dt>
      <dd className="text-body-sm">{children}</dd>
    </div>
  );
}

/** Include/exclude read as one sentence — the exclusion is usually the
 * interesting half, so it is never dropped even when the include is empty. */
function Scope({ include, exclude, emptyInclude }) {
  return (
    <>
      {include.length > 0 ? list(include) : emptyInclude}
      {exclude.length > 0 && (
        <>
          {', except '}
          <span className="text-primary-text">{list(exclude)}</span>
        </>
      )}
    </>
  );
}

/**
 * One policy, as the four questions it answers.
 *
 * State is a badge rather than a line of prose because it changes what
 * everything below it means: a report-only policy describes something that
 * never actually happens to anyone.
 */
export function PolicyCard({ policy }) {
  const { name, id, state, who, what, when, then } = policy;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle>{name}</CardTitle>
          <Badge variant={state.tone}>{state.label}</Badge>
        </div>
        {state.note && <p className="text-body-sm text-muted-foreground">{state.note}</p>}
        {id && <code className="font-mono text-data-sm text-muted-foreground break-all">{id}</code>}
      </CardHeader>

      <CardContent>
        <dl className="space-y-3">
          <Row label="Who">
            <Scope include={who.include} exclude={who.exclude} emptyInclude="No users targeted" />
          </Row>

          <Row label="What">
            <Scope
              include={what.include}
              exclude={what.exclude}
              emptyInclude={what.userActions.length > 0 ? '' : 'No applications targeted'}
            />
            {what.userActions.length > 0 && (
              <div>User actions: {list(what.userActions)}</div>
            )}
            {what.authContexts.length > 0 && (
              <div>Authentication contexts: {list(what.authContexts)}</div>
            )}
          </Row>

          <Row label="When">
            {when.length === 0 ? (
              'Always — no conditions narrow this policy'
            ) : (
              <ul className="space-y-1">
                {when.map((c) => (
                  <li key={c.label}>
                    <span className="text-muted-foreground">{c.label}: </span>
                    <span className={c.legacy ? 'text-primary-text' : undefined}>{c.value}</span>
                    {c.legacy && ' (legacy authentication)'}
                  </li>
                ))}
              </ul>
            )}
          </Row>

          <Row label="Then">
            {then.grant.blocks ? (
              <strong>Block access</strong>
            ) : then.grant.controls.length > 0 || then.grant.authStrength ? (
              <>
                Require{' '}
                <strong>
                  {list([...then.grant.controls, then.grant.authStrength].filter(Boolean))}
                </strong>
                {then.grant.controls.length > 1 && (
                  <span className="text-muted-foreground">
                    {then.grant.operator === 'AND'
                      ? ' — all of them'
                      : ' — any one of them is enough'}
                  </span>
                )}
              </>
            ) : (
              'No grant control — access is not gated by this policy'
            )}

            {then.session.length > 0 && (
              <ul className="mt-1 space-y-1">
                {then.session.map((s) => (
                  <li key={s} className="text-muted-foreground">
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </Row>
        </dl>
      </CardContent>
    </Card>
  );
}
