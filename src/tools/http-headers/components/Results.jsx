import React from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, CornerDownRight, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CopyButton } from '@/components/ui/copy-button';
import { Stat, StatStrip } from '@/components/ui/stat-strip';
import { toPlain } from '../lib/analyse.js';

const STATUS = {
  pass: { variant: 'success', label: 'Pass' },
  warn: { variant: 'warning', label: 'Warning' },
  fail: { variant: 'destructive', label: 'Fail' },
  info: { variant: 'secondary', label: 'Note' },
};

const FINDING_ALERT = {
  pass: { variant: 'success', Icon: CheckCircle2 },
  warn: { variant: 'warning', Icon: TriangleAlert },
  fail: { variant: 'destructive', Icon: AlertCircle },
};

const GROUPS = [
  { title: 'Security headers', note: 'Transport, content and framing protections.', groups: ['transport', 'content'] },
  {
    title: 'Cross-origin isolation',
    note: 'Optional. A missing header here is noted, not counted against the site.',
    groups: ['isolation'],
  },
  { title: 'Information disclosure', note: 'Headers that tell a visitor what the site runs on.', groups: ['disclosure'] },
];

const codeVariant = (status) => {
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'secondary';
  return 'warning';
};

function StatusBadge({ status }) {
  const { variant, label } = STATUS[status];
  return <Badge variant={variant}>{label}</Badge>;
}

const LONG_VALUE = 280;

function Value({ value }) {
  const [open, setOpen] = React.useState(false);
  if (!value) return <p className="text-body-sm text-on-surface-faint">Not set</p>;

  const long = value.length > LONG_VALUE;
  return (
    <div className="flex flex-col items-start gap-1">
      <p className="w-full rounded-sm bg-surface-inset px-3 py-2 font-mono text-data-sm text-on-surface [overflow-wrap:anywhere]">
        {long && !open ? `${value.slice(0, LONG_VALUE)}…` : value}
      </p>
      {long && (
        <Button variant="ghost" size="sm" onClick={() => setOpen(!open)} aria-expanded={open}>
          <ChevronDown className={open ? 'rotate-180' : undefined} aria-hidden="true" />
          {open ? 'Show less' : `Show all ${value.length.toLocaleString()} characters`}
        </Button>
      )}
    </div>
  );
}

function CheckRow({ check }) {
  const labelled = check.sources.length > 1;
  return (
    <li className="flex flex-col gap-2 border-b border-rule py-4 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h4 className="min-w-0 font-mono text-data-md text-on-surface [overflow-wrap:anywhere]">{check.name}</h4>
        <StatusBadge status={check.status} />
      </div>
      <p className="text-body-sm text-on-surface-muted">{check.purpose}</p>
      {check.sources.map((source) => (
        <div key={source.name} className="flex flex-col gap-1">
          {labelled && <p className="text-body-sm text-on-surface-faint">{source.name}</p>}
          <Value value={source.value} />
        </div>
      ))}
      <p className="text-body-md text-on-surface">{check.finding}</p>
    </li>
  );
}

function CookieFlags({ cookie }) {
  const flags = [
    cookie.secure ? ['secondary', 'Secure'] : ['destructive', 'No Secure'],
    cookie.httpOnly ? ['secondary', 'HttpOnly'] : ['warning', 'No HttpOnly'],
    cookie.sameSite ? ['secondary', `SameSite=${cookie.sameSite}`] : ['warning', 'No SameSite'],
    cookie.path && ['outline', `Path=${cookie.path}`],
    cookie.domain && ['outline', `Domain=${cookie.domain}`],
    ['outline', cookie.persistent ? 'Persistent' : 'Session'],
    cookie.partitioned && ['outline', 'Partitioned'],
  ].filter(Boolean);

  return (
    <ul className="flex flex-wrap gap-1.5">
      {flags.map(([variant, label]) => (
        <li key={label} className="min-w-0">
          <Badge variant={variant} className="max-w-full whitespace-normal [overflow-wrap:anywhere]">
            {label}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

export function Chain({ hops, findings = [] }) {
  const redirects = Math.max(0, hops.length - 1);
  return (
    <Card>
      <CardHeader>
        <h3 className="text-title-sm">Redirect chain</h3>
        <p className="text-body-sm text-on-surface-muted">
          {hops.length === 0
            ? 'No request was made.'
            : redirects === 0
              ? 'Answered directly, with no redirect.'
              : `${redirects} redirect${redirects === 1 ? '' : 's'}, each checked before it was followed.`}
        </p>
      </CardHeader>
      {(hops.length > 0 || findings.length > 0) && (
        <CardContent className="flex flex-col gap-3">
          <ol className="flex flex-col">
            {hops.map((hop, index) => (
              <li
                key={`${hop.url}-${index}`}
                className="flex flex-col gap-1.5 border-b border-rule py-3 first:pt-0 last:border-b-0 last:pb-0"
              >
                <div className="flex items-start gap-3">
                  <Badge variant={codeVariant(hop.status)}>{hop.status}</Badge>
                  <span className="min-w-0 font-mono text-data-md text-on-surface [overflow-wrap:anywhere]">{hop.url}</span>
                </div>
                {hop.location && (
                  <div className="flex items-start gap-2 text-on-surface-muted">
                    <CornerDownRight className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 font-mono text-data-sm [overflow-wrap:anywhere]">
                      <span className="font-sans text-body-sm text-on-surface-faint">Location </span>
                      {hop.location}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ol>
          {findings.map((finding) => {
            const { variant, Icon } = FINDING_ALERT[finding.status];
            return (
              <Alert key={finding.text} variant={variant}>
                <Icon aria-hidden="true" />
                <AlertDescription>{finding.text}</AlertDescription>
              </Alert>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}

function AllHeaders({ headers, truncated }) {
  const [open, setOpen] = React.useState(false);
  const entries = Object.entries(headers);
  if (entries.length === 0) return null;

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <div className="min-w-0">
              <h3 className="text-title-sm">All response headers</h3>
              <p className="text-body-sm text-on-surface-muted">
                {entries.length} header{entries.length === 1 ? '' : 's'}, as sent. Set-Cookie is left out.
              </p>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                <ChevronDown className={open ? 'rotate-180' : undefined} aria-hidden="true" />
                {open ? 'Hide' : 'Show'}
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <dl className="flex flex-col">
              {entries.map(([name, value]) => (
                <div
                  key={name}
                  className="grid gap-x-6 gap-y-1 border-b border-rule py-2.5 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[15rem_minmax(0,1fr)]"
                >
                  <dt className="min-w-0 font-mono text-data-sm text-on-surface-muted [overflow-wrap:anywhere]">{name}</dt>
                  <dd className="min-w-0 font-mono text-data-sm text-on-surface [overflow-wrap:anywhere]">
                    {value}
                    {truncated.includes(name) && (
                      <span className="font-sans text-body-sm text-on-surface-faint"> (cut at 16,384 characters)</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default function Results({ report }) {
  const { counts } = report;

  return (
    <div className="flex flex-col gap-4">
      <Card emphasis>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <div className="min-w-0">
              <h3 className="font-mono text-data-lg text-on-surface [overflow-wrap:anywhere]">{report.finalUrl}</h3>
              <p className="text-body-sm text-on-surface-muted">
                Final response, read with {report.method}. Checks are counted, not graded.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={codeVariant(report.status)}>HTTP {report.status}</Badge>
              <CopyButton value={() => JSON.stringify(toPlain(report), null, 2)} variant="outline" size="sm">
                Copy as JSON
              </CopyButton>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <StatStrip compact className="grid-cols-2 gap-x-6 sm:grid-cols-4">
            <Stat label="Passed" value={counts.pass} />
            <Stat label="Warnings" value={counts.warn} />
            <Stat label="Failed" value={counts.fail} />
            <Stat label="Notes" value={counts.info} />
          </StatStrip>
        </CardContent>
      </Card>

      <Chain hops={report.hops} findings={report.chainFindings} />

      {GROUPS.map((group) => {
        const checks = report.checks.filter((check) => group.groups.includes(check.group));
        if (checks.length === 0) return null;
        return (
          <Card key={group.title}>
            <CardHeader>
              <h3 className="text-title-sm">{group.title}</h3>
              <p className="text-body-sm text-on-surface-muted">{group.note}</p>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col">
                {checks.map((check) => (
                  <CheckRow key={check.id} check={check} />
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader>
          <h3 className="text-title-sm">Cookies</h3>
          <p className="text-body-sm text-on-surface-muted">
            {report.cookies.length === 0
              ? 'This response set no cookies.'
              : 'Names and flags only. The values are dropped on the server and never reach this page.'}
          </p>
        </CardHeader>
        {report.cookies.length > 0 && (
          <CardContent>
            <ul className="flex flex-col">
              {report.cookies.map((cookie, index) => (
                <li
                  key={`${cookie.name}-${index}`}
                  className="flex flex-col gap-2 border-b border-rule py-4 first:pt-0 last:border-b-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <h4 className="min-w-0 font-mono text-data-md text-on-surface [overflow-wrap:anywhere]">
                      {cookie.name || '(no name)'}
                    </h4>
                    <StatusBadge status={cookie.status} />
                  </div>
                  <CookieFlags cookie={cookie} />
                  <p className="text-body-md text-on-surface">{cookie.finding}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>

      <AllHeaders headers={report.headers} truncated={report.truncatedHeaders} />
    </div>
  );
}
