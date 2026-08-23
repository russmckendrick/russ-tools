import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ghost } from '@/components/ui/ghost';
import { Search, X, AlertCircle, Star } from 'lucide-react';
import { toast } from 'sonner';
import { copyText, downloadJSON, createToolStorage, safeFilename } from '@/core';
import { useWebMCPTool, textResult } from '@/lib/useWebMCPTool';
import { RoleDetail } from './components/RoleDetail';
import { RoleDiff } from './components/RoleDiff';
import {
  loadRoles,
  searchRoles,
  matchAction,
  leastPrivilege,
  findRole,
  toCustomRoleJson,
} from './lib/rbac.js';

const storage = createToolStorage('azure-rbac');
const FAVORITES_KEY = 'favorites';

const FIND_ROLE_TOOL = {
  name: 'find_azure_role',
  description:
    'Find the Azure built-in RBAC roles that grant a given action, least-privilege first. ' +
    'Accepts a concrete action (Microsoft.Storage/storageAccounts/read) or a wildcard pattern ' +
    '(Microsoft.Compute/*/read). Wildcards and NotActions are honoured, so a role that excludes ' +
    'the action is not returned. Also accepts a role name to return that role definition.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'An Azure action or wildcard pattern, e.g. Microsoft.Storage/*/read',
      },
      role: {
        type: 'string',
        description: 'A built-in role name or role definition GUID, e.g. Storage Blob Data Reader',
      },
    },
  },
  annotations: { readOnlyHint: true },
  execute: async ({ action, role }) => {
    try {
      const { roles, catalogueSize } = await loadRoles().then((d) => ({
        roles: d.roles,
        catalogueSize: d.catalogueSize,
      }));

      if (role) {
        const found = findRole(roles, role) ?? searchRoles(roles, role, 1)[0];
        if (!found) return textResult({ error: `No built-in role matching "${role}".` });
        return textResult({
          kind: 'role',
          name: found.name,
          id: found.id,
          description: found.description,
          category: found.category,
          grantsOperations: found.breadth,
          ofCatalogued: catalogueSize,
          actions: found.actions,
          notActions: found.notActions,
          dataActions: found.dataActions,
          notDataActions: found.notDataActions,
        });
      }

      if (!action) return textResult({ error: 'Provide either an action or a role.' });

      const hits = matchAction(roles, action);
      if (hits.length === 0) return textResult({ action, matches: [], note: 'No built-in role grants this.' });

      const narrowest = leastPrivilege(hits);
      return textResult({
        kind: 'actionSearch',
        action,
        leastPrivilege: { name: narrowest.name, id: narrowest.id, grantsOperations: narrowest.breadth },
        matches: hits.slice(0, 25).map((h) => ({
          name: h.role.name,
          id: h.role.id,
          via: h.via,
          bucket: h.bucket,
          grantsOperations: h.breadth,
        })),
        totalMatches: hits.length,
      });
    } catch {
      return textResult({ error: 'The role definitions could not be loaded.' });
    }
  },
};

/** Sample for the ghost — the real Reader definition, so the panel it stands
 * in for is the panel that arrives. */
const GHOST_ROLE = {
  id: 'acdd72a7-3385-48ef-bd42-f606fba81ae7',
  name: 'Reader',
  description: 'View all resources, but does not allow you to make any changes.',
  category: 'general',
  breadth: 957,
  actions: ['*/read'],
  notActions: [],
  dataActions: [],
  notDataActions: [],
};

const AzureRbacTool = () => {
  useWebMCPTool(FIND_ROLE_TOOL);

  const { role: routeRole } = useParams();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [mode, setMode] = useState('role');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');
  const [favorites, setFavorites] = useState(() => storage.get(FAVORITES_KEY, { fallback: [] }));

  useEffect(() => {
    let live = true;
    loadRoles().then(
      (loaded) => live && setData(loaded),
      () => live && setLoadError('The role definitions could not be loaded.')
    );
    return () => {
      live = false;
    };
  }, []);

  // A deep link names a role, so open it rather than leaving a search box for
  // someone who already said what they wanted.
  useEffect(() => {
    if (!data || !routeRole) return;
    const found = findRole(data.roles, decodeURIComponent(routeRole));
    if (found) setSelectedId(found.id);
  }, [data, routeRole]);

  // Memoised so it is a stable reference: a fresh [] each render would
  // invalidate every useMemo below on every keystroke.
  const roles = useMemo(() => data?.roles ?? [], [data]);
  const selected = useMemo(
    () => (selectedId ? roles.find((r) => r.id === selectedId) ?? null : null),
    [roles, selectedId]
  );

  const nameMatches = useMemo(
    () => (mode === 'role' && query.trim() ? searchRoles(roles, query) : []),
    [roles, query, mode]
  );

  const actionMatches = useMemo(
    () => (mode === 'action' && query.trim() ? matchAction(roles, query.trim()) : []),
    [roles, query, mode]
  );

  const narrowest = leastPrivilege(actionMatches);

  const onCopy = useCallback(async (value, label) => {
    await copyText(value);
    toast.success(`${label} copied`);
  }, []);

  const onExport = useCallback((role) => {
    downloadJSON(toCustomRoleJson(role, `${role.name} (custom)`, []), `${safeFilename(role.name)}-custom-role.json`);
    toast.success('Custom role definition downloaded');
  }, []);

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      storage.set(FAVORITES_KEY, next);
      return next;
    });
  }, []);

  const favoriteRoles = useMemo(
    () => favorites.map((id) => roles.find((r) => r.id === id)).filter(Boolean),
    [favorites, roles]
  );

  const roleA = compareA ? roles.find((r) => r.id === compareA) : null;
  const roleB = compareB ? roles.find((r) => r.id === compareB) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  mode === 'role'
                    ? 'Role name, description or definition GUID'
                    : 'Microsoft.Storage/*/read'
                }
                aria-label={mode === 'role' ? 'Search roles by name' : 'Search roles by action'}
                className="pl-9"
              />
            </div>
            {query && (
              <Button variant="outline" onClick={() => setQuery('')}>
                <X aria-hidden="true" />
                Clear
              </Button>
            )}
          </div>

          {favoriteRoles.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-label-caps text-muted-foreground">Saved</span>
              {favoriteRoles.map((r) => (
                <Button
                  key={r.id}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMode('role');
                    setSelectedId(r.id);
                  }}
                >
                  {r.name}
                </Button>
              ))}
            </div>
          )}

          {data && (
            <p className="text-body-sm text-muted-foreground">
              {roles.length} built-in roles, from Microsoft&apos;s published reference of{' '}
              {data.generatedAt}. Everything runs in this tab.
            </p>
          )}
        </CardContent>
      </Card>

      {loadError && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Role definitions unavailable</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      <Tabs
        value={mode}
        onValueChange={(next) => {
          setMode(next);
          setQuery('');
        }}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="role">By role</TabsTrigger>
          <TabsTrigger value="action">By action</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
        </TabsList>

        <TabsContent value="role" className="space-y-4">
          {!data && !loadError && (
            <Ghost>
              <RoleDetail role={GHOST_ROLE} catalogueSize={2553} onCopy={() => {}} onExport={() => {}} />
            </Ghost>
          )}

          {data && !query && !selected && (
            <Alert>
              <AlertTitle>Search for a role</AlertTitle>
              <AlertDescription>
                Type a name such as <code className="font-mono text-data-sm">Storage Blob Data Reader</code>, or
                switch to <strong>By action</strong> to work backwards from an operation.
              </AlertDescription>
            </Alert>
          )}

          {nameMatches.length > 0 && (
            <RoleList
              roles={nameMatches}
              favorites={favorites}
              onSelect={setSelectedId}
              onFavorite={toggleFavorite}
              catalogueSize={data?.catalogueSize}
            />
          )}

          {data && query && nameMatches.length === 0 && (
            <Alert>
              <AlertCircle aria-hidden="true" />
              <AlertTitle>No role matched</AlertTitle>
              <AlertDescription>
                Nothing matches “{query}”. Try a shorter term, or search by action instead.
              </AlertDescription>
            </Alert>
          )}

          {selected && (
            <RoleDetail
              role={selected}
              catalogueSize={data?.catalogueSize}
              onCopy={onCopy}
              onExport={onExport}
            />
          )}
        </TabsContent>

        <TabsContent value="action" className="space-y-4">
          {data && !query && (
            <Alert>
              <AlertTitle>Search by the operation you need</AlertTitle>
              <AlertDescription>
                Enter an action such as{' '}
                <code className="font-mono text-data-sm">
                  Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read
                </code>
                , or a pattern with wildcards. Roles that exclude the action through NotActions are
                left out.
              </AlertDescription>
            </Alert>
          )}

          {narrowest && (
            <Alert>
              <AlertTitle>Least privilege: {narrowest.name}</AlertTitle>
              <AlertDescription>
                Of {actionMatches.length} roles granting this, {narrowest.name} grants the fewest
                catalogued operations ({narrowest.breadth} of {data?.catalogueSize}). Ranked by
                breadth, not a formal proof of minimality — check the permissions before assigning.
              </AlertDescription>
            </Alert>
          )}

          {actionMatches.length > 0 && (
            <RoleList
              roles={actionMatches.map((h) => h.role)}
              via={Object.fromEntries(actionMatches.map((h) => [h.role.id, h.via]))}
              favorites={favorites}
              onSelect={(id) => {
                setMode('role');
                setSelectedId(id);
              }}
              onFavorite={toggleFavorite}
              catalogueSize={data?.catalogueSize}
            />
          )}

          {data && query && actionMatches.length === 0 && (
            <Alert>
              <AlertCircle aria-hidden="true" />
              <AlertTitle>No built-in role grants this</AlertTitle>
              <AlertDescription>
                Nothing in the catalogue grants “{query}”. Check the action spelling, or widen it
                with a wildcard. A custom role may be the answer.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="compare" className="space-y-4">
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
              <RolePicker label="First role" roles={roles} value={compareA} onChange={setCompareA} />
              <RolePicker label="Second role" roles={roles} value={compareB} onChange={setCompareB} />
            </CardContent>
          </Card>

          {roleA && roleB && roleA.id !== roleB.id ? (
            <RoleDiff a={roleA} b={roleB} />
          ) : (
            <Alert>
              <AlertTitle>Pick two roles</AlertTitle>
              <AlertDescription>
                Choose two different roles to see what each grants that the other does not.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

/** A searchable role picker. The list is 504 long, so it is capped and the
 * label says so rather than silently truncating. */
function RolePicker({ label, roles, value, onChange }) {
  const sorted = useMemo(() => [...roles].sort((a, b) => a.name.localeCompare(b.name)), [roles]);

  return (
    <div className="space-y-2">
      <span className="text-label-caps text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label}>
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          {sorted.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** The result list both search modes share. `via` names the patterns that
 * caused an action match, which is the difference between "this role appears"
 * and "this role appears because of `*`". */
function RoleList({ roles, via, favorites, onSelect, onFavorite, catalogueSize }) {
  return (
    <Card>
      <CardContent className="space-y-2 pt-6">
        <p className="text-body-sm text-muted-foreground">
          {roles.length} {roles.length === 1 ? 'role' : 'roles'}
          {via ? ', least privilege first' : ''} — select one to open it.
        </p>
        <ul className="divide-y divide-border">
          {roles.map((role) => (
            <li key={role.id} className="flex items-start justify-between gap-3 py-2">
              <button
                type="button"
                onClick={() => onSelect(role.id)}
                className="flex-1 text-left hover:text-primary-text"
              >
                <span className="flex flex-wrap items-baseline gap-2">
                  <span>{role.name}</span>
                  <Badge variant="outline">
                    {role.breadth}
                    {catalogueSize ? `/${catalogueSize}` : ''} ops
                  </Badge>
                </span>
                {via?.[role.id]?.length > 0 && (
                  <span className="mt-1 block font-mono text-data-sm text-muted-foreground break-all">
                    via {via[role.id].join(', ')}
                  </span>
                )}
              </button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={favorites.includes(role.id) ? `Unsave ${role.name}` : `Save ${role.name}`}
                aria-pressed={favorites.includes(role.id)}
                onClick={() => onFavorite(role.id)}
              >
                <Star aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default AzureRbacTool;
