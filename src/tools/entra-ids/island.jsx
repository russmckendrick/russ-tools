import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, Search, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWebMCPTool, textResult } from '@/lib/useWebMCPTool';
import { ResultList } from './components/ResultList.jsx';
import {
  KINDS,
  KIND_LABEL,
  buildEntries,
  classifyQuery,
  countByKind,
  describeMatch,
  loadEntraIds,
  searchEntries,
  toPlain,
} from './lib/entraIds.js';

const PAGE = 40;
const ALL = 'all';
const TAB_LABEL = { all: 'All', application: 'Apps', permission: 'Permissions', role: 'Roles', error: 'Errors' };

/** Names to offer as examples, shown only if the snapshot still carries them. */
const EXAMPLES = ['Microsoft Graph', 'User.Read', 'Global Administrator', 'AADSTS50076'];

const LOOKUP_TOOL = {
  name: 'lookup_entra_id',
  description:
    'Identify a Microsoft Entra identifier from a dated snapshot of Microsoft’s documentation: a first-party ' +
    'application (client) ID, a Microsoft Graph permission ID (delegated scope, application role or ' +
    'resource-specific consent, with display text, admin-consent requirement and what it grants), a built-in ' +
    'directory role template ID, or an AADSTS sign-in error code. Accepts a GUID, an AADSTS code or a name. ' +
    'The application list is only what Microsoft tabulates in its docs, so a miss does not mean an ID is not Microsoft’s.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'A GUID, an AADSTS code, or a name such as User.Read' },
      kind: { type: 'string', enum: [...KINDS], description: 'Restrict to one kind of identifier' },
    },
    required: ['query'],
  },
  annotations: { readOnlyHint: true },
  execute: async ({ query, kind } = {}) => {
    try {
      const data = await loadEntraIds();
      const matches = searchEntries(buildEntries(data), query ?? '', { kind: KINDS.includes(kind) ? kind : '' });
      if (!String(query ?? '').trim()) return textResult({ error: 'Provide a GUID, an AADSTS code or a name.' });
      return textResult({
        snapshot: data.generatedAt,
        query,
        total: matches.length,
        matches: matches.slice(0, 10).map((match) => toPlain(match, data.sources)),
        note: matches.length ? undefined : 'Not in the snapshot. It may be tenant-specific or simply not documented.',
      });
    } catch {
      return textResult({ error: 'The Entra identifier dataset could not be loaded.' });
    }
  },
};

function NoMatch({ query }) {
  const parsed = classifyQuery(query);
  if (parsed.type !== 'guid') {
    return (
      <Alert>
        <AlertCircle aria-hidden="true" />
        <AlertTitle>No match</AlertTitle>
        <AlertDescription>
          Nothing in the snapshot matches “{query.trim()}”. Try fewer words, or switch the filter back to All.
        </AlertDescription>
      </Alert>
    );
  }
  const links = [
    ['Azure RBAC role', `/azure-rbac/${parsed.guid}`],
    ['Microsoft 365 licence or service plan', `/m365-licenses/${parsed.guid}`],
    ['UUID version and timestamp', `/uuid/${parsed.guid}`],
  ];
  return (
    <Alert>
      <AlertCircle aria-hidden="true" />
      <AlertTitle>Not a published Entra identifier</AlertTitle>
      <AlertDescription>
        <p>
          This GUID is not an application, Graph permission or directory role ID in the snapshot. It may be an object
          ID from your own tenant, a Microsoft application that is not in Microsoft’s documented lists, or another
          kind of identifier:
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {links.map(([label, href]) => (
            <li key={href}>
              <a className="text-primary-text underline underline-offset-2" href={href}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

export default function EntraIds() {
  useWebMCPTool(LOOKUP_TOOL);

  const { query: routeQuery } = useParams();
  const initial = routeQuery ? decodeURIComponent(routeQuery) : '';
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState(initial);
  const [kind, setKind] = useState(ALL);
  const [shown, setShown] = useState(PAGE);
  const [openKey, setOpenKey] = useState(undefined);

  useEffect(() => {
    let live = true;
    loadEntraIds().then(
      (loaded) => live && setData(loaded),
      () => live && setError(true)
    );
    return () => {
      live = false;
    };
  }, []);

  const entries = useMemo(() => (data ? buildEntries(data) : []), [data]);
  const counts = useMemo(() => countByKind(entries), [entries]);
  const matches = useMemo(
    () => searchEntries(entries, query, { kind: kind === ALL ? '' : kind }),
    [entries, query, kind]
  );
  const examples = useMemo(
    () => EXAMPLES.filter((name) => entries.some((entry) => entry.title === name)),
    [entries]
  );

  useEffect(() => {
    setShown(PAGE);
    setOpenKey(undefined);
  }, [query, kind]);

  // An exact identifier is an answer, so it opens. A name search is a list.
  const exact = matches.length > 0 && (matches[0].matched === 'id' || matches[0].matched === 'code');
  const identified = exact && classifyQuery(query).type === 'guid';
  const autoOpen = exact || matches.length === 1 ? `${matches[0]?.entry.key}:${matches[0]?.id ?? ''}` : null;
  const effectiveOpen = openKey === undefined ? autoOpen : openKey;
  const typed = query.trim();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-1.5">
            <Label htmlFor="entra-query">GUID, name or AADSTS code</Label>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-faint"
                  aria-hidden="true"
                />
                <Input
                  id="entra-query"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="GUID, User.Read or AADSTS50076"
                  autoComplete="off"
                  spellCheck={false}
                  className="pl-9"
                />
              </div>
              {query && (
                <Button variant="outline" size="icon" aria-label="Clear" onClick={() => setQuery('')}>
                  <X aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>

          {examples.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-label-caps uppercase text-on-surface-faint">Try</span>
              {examples.map((name) => (
                <Button key={name} variant="outline" size="sm" onClick={() => setQuery(name)}>
                  {name}
                </Button>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Fetched {data?.generatedAt ?? '…'}</Badge>
              {data &&
                KINDS.map((name) => (
                  <Badge key={name} variant="secondary">
                    {counts[name].toLocaleString('en')} {TAB_LABEL[name].toLowerCase()}
                  </Badge>
                ))}
            </div>
            <p className="text-body-sm text-on-surface-muted">
              A snapshot of identifiers Microsoft publishes in its documentation, searched in this tab. Applications
              are the first-party IDs Microsoft lists, not every Microsoft app, and nothing here knows about your
              tenant’s own objects.
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Identifiers unavailable</AlertTitle>
          <AlertDescription>The checked-in Entra identifier dataset could not be loaded.</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <Tabs value={kind} onValueChange={setKind}>
          <TabsList aria-label="Kind of identifier">
            {[ALL, ...KINDS].map((name) => (
              <TabsTrigger key={name} value={name}>
                {TAB_LABEL[name]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {!data && !error && <p className="text-body-sm text-on-surface-muted">Loading the identifier snapshot…</p>}

        {data && identified && (
          <p className="text-body-md" role="status">
            <span className="whitespace-nowrap font-mono text-data-md">{typed}</span> is the{' '}
            {describeMatch(matches[0]).replace(/^([A-Z])/, (letter) => letter.toLowerCase())}
            {matches.length > 1 ? `, and matches ${matches.length - 1} more` : ''}.
          </p>
        )}

        {data && !identified && matches.length > 0 && (
          <p className="text-body-sm text-on-surface-muted" role="status">
            {typed
              ? `${matches.length.toLocaleString('en')} ${matches.length === 1 ? 'match' : 'matches'}`
              : `${matches.length.toLocaleString('en')} ${kind === ALL ? 'identifiers' : `${KIND_LABEL[kind].toLowerCase()}s`}`}
            . Select one for its IDs and description.
          </p>
        )}

        {data && typed && matches.length === 0 && <NoMatch query={query} />}

        {matches.length > 0 && (
          <ResultList
            matches={matches.slice(0, shown)}
            openKey={effectiveOpen}
            onToggle={setOpenKey}
            sources={data.sources}
          />
        )}

        {matches.length > shown && (
          <Button variant="outline" onClick={() => setShown((count) => count + PAGE)}>
            Show {Math.min(PAGE, matches.length - shown)} more
          </Button>
        )}
      </div>
    </div>
  );
}
