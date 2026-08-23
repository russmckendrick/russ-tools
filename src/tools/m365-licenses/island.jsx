import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ghost } from '@/components/ui/ghost';
import { Search, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { copyText, createToolStorage } from '@/core';
import { useWebMCPTool, textResult } from '@/lib/useWebMCPTool';
import { SkuDetail } from './components/SkuDetail';
import { PlanDetail } from './components/PlanDetail';
import {
  loadLicenses,
  findSku,
  searchSkus,
  searchServicePlans,
  expandSku,
  planDetail,
  detectQueryKind,
} from './lib/licenses.js';

const storage = createToolStorage('m365-licenses');
const HISTORY_KEY = 'history';
const MAX_HISTORY = 8;

const LOOKUP_TOOL = {
  name: 'lookup_m365_license',
  description:
    'Look up a Microsoft 365 licence SKU by GUID, part number (e.g. SPE_E3) or product name, ' +
    'returning the product name and the service plans it includes. Given a service plan name ' +
    'or id instead, returns the plan and every SKU that includes it.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'A SKU GUID, SKU part number, product name, service plan name (e.g. INTUNE_A) or service plan id.',
      },
    },
    required: ['query'],
  },
  annotations: { readOnlyHint: true },
  execute: async ({ query }) => {
    try {
      const data = await loadLicenses();

      const sku = findSku(data, query);
      if (sku) {
        const { plans } = expandSku(data, sku);
        return textResult({
          kind: 'sku',
          name: sku.name,
          partNumber: sku.partNumber,
          skuId: sku.guid,
          servicePlans: plans.map((p) => ({ name: p.name, friendly: p.friendly, id: p.id })),
        });
      }

      const plan = planDetail(data, query);
      if (plan) {
        return textResult({
          kind: 'servicePlan',
          name: plan.plan.name,
          friendly: plan.plan.friendly,
          servicePlanId: plan.plan.id,
          includedIn: plan.skus.map((s) => ({ name: s.name, partNumber: s.partNumber, skuId: s.guid })),
        });
      }

      const near = searchSkus(data, query, 5).map((s) => s.partNumber || s.name);
      return textResult({ error: 'No exact match.', didYouMean: near });
    } catch {
      return textResult({ error: 'The licensing reference could not be loaded.' });
    }
  },
};

/**
 * The ghost's sample. Shaped by hand rather than taken from the dataset,
 * because the dataset arrives asynchronously and the ghost's whole job is to
 * stand in before it does.
 */
const GHOST_SKU = {
  guid: '05e9a617-0261-4cee-bb44-138d3ef5d965',
  partNumber: 'SPE_E3',
  name: 'Microsoft 365 E3',
  plans: [],
};
const GHOST_PLANS = [
  { id: 'c1ec4a95-1f05-45b3-a911-aa3fa01094f5', name: 'INTUNE_A', friendly: 'Microsoft Intune' },
  {
    id: '43de0ff5-c92c-492b-9116-175376d08c38',
    name: 'OFFICESUBSCRIPTION',
    friendly: 'Microsoft 365 Apps for enterprise',
  },
  { id: '7547a3fe-08ee-4ccb-b430-5077c5041653', name: 'YAMMER_ENTERPRISE', friendly: 'Viva Engage Core' },
];

const M365LicensesTool = () => {
  useWebMCPTool(LOOKUP_TOOL);

  const { query: routeQuery } = useParams();
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [mode, setMode] = useState('sku');
  const [query, setQuery] = useState(routeQuery ? decodeURIComponent(routeQuery) : '');
  const [history, setHistory] = useState(() => storage.get(HISTORY_KEY, { fallback: [] }));

  useEffect(() => {
    let live = true;
    loadLicenses().then(
      (loaded) => live && setData(loaded),
      () => live && setLoadError('The licensing reference could not be loaded.')
    );
    return () => {
      live = false;
    };
  }, []);

  // A deep-linked service plan should open on the plan tab, not sit on the SKU
  // tab showing nothing.
  useEffect(() => {
    if (!data || !routeQuery) return;
    const q = decodeURIComponent(routeQuery);
    if (!findSku(data, q) && planDetail(data, q)) setMode('plan');
  }, [data, routeQuery]);

  const remember = useCallback((term) => {
    setHistory((prev) => {
      const next = [term, ...prev.filter((t) => t !== term)].slice(0, MAX_HISTORY);
      storage.set(HISTORY_KEY, next);
      return next;
    });
  }, []);

  const onCopy = useCallback(async (value, label) => {
    await copyText(value);
    toast.success(`${label} copied`);
  }, []);

  const selectSku = useCallback(
    (term) => {
      setMode('sku');
      setQuery(term);
      remember(term);
    },
    [remember]
  );

  const selectPlan = useCallback(
    (term) => {
      setMode('plan');
      setQuery(term);
      remember(term);
    },
    [remember]
  );

  const trimmed = query.trim();

  const skuView = useMemo(() => {
    if (!data || !trimmed) return null;
    const exact = findSku(data, trimmed);
    if (exact) return { exact: expandSku(data, exact) };
    return { matches: searchSkus(data, trimmed, 40) };
  }, [data, trimmed]);

  const planView = useMemo(() => {
    if (!data || !trimmed) return null;
    const exact = planDetail(data, trimmed);
    if (exact) return { exact };
    return { matches: searchServicePlans(data, trimmed, 40) };
  }, [data, trimmed]);

  const kind = detectQueryKind(trimmed);

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
                onBlur={() => trimmed && remember(trimmed)}
                placeholder={
                  mode === 'sku'
                    ? 'SKU GUID, part number (SPE_E3) or product name'
                    : 'Service plan name (INTUNE_A), friendly name or plan ID'
                }
                aria-label={mode === 'sku' ? 'Search licence SKUs' : 'Search service plans'}
                className="pl-9"
              />
            </div>
            {trimmed && (
              <Button variant="outline" onClick={() => setQuery('')}>
                <X aria-hidden="true" />
                Clear
              </Button>
            )}
          </div>

          {history.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-label-caps text-muted-foreground">Recent</span>
              {history.map((term) => (
                <Button key={term} variant="outline" size="sm" onClick={() => setQuery(term)}>
                  {term}
                </Button>
              ))}
            </div>
          )}

          {data && (
            <p className="text-body-sm text-muted-foreground">
              {data.skus.length} SKUs and {data.servicePlans.length} service plans, from
              Microsoft&apos;s published licensing reference of {data.generatedAt}. Everything runs
              in this tab.
            </p>
          )}
        </CardContent>
      </Card>

      {loadError && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Reference data unavailable</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}

      <Tabs value={mode} onValueChange={setMode} className="space-y-4">
        <TabsList>
          <TabsTrigger value="sku">By SKU</TabsTrigger>
          <TabsTrigger value="plan">By service plan</TabsTrigger>
        </TabsList>

        <TabsContent value="sku" className="space-y-4">
          {!data && !loadError && (
            <Ghost>
              <SkuDetail sku={GHOST_SKU} plans={GHOST_PLANS} onCopy={() => {}} onPlanSelect={() => {}} />
            </Ghost>
          )}

          {data && !trimmed && (
            <Alert>
              <AlertTitle>Search for a licence</AlertTitle>
              <AlertDescription>
                Paste a SKU GUID from Graph or PowerShell, or type a part number such as
                <code className="font-mono text-data-sm"> SPE_E3</code>.
              </AlertDescription>
            </Alert>
          )}

          {skuView?.exact && (
            <SkuDetail
              sku={skuView.exact.sku}
              plans={skuView.exact.plans}
              onCopy={onCopy}
              onPlanSelect={selectPlan}
            />
          )}

          {skuView?.matches && (
            <MatchList
              items={skuView.matches}
              keyOf={(s) => s.guid}
              primary={(s) => s.name}
              secondary={(s) => s.partNumber}
              onSelect={(s) => selectSku(s.partNumber || s.guid)}
              emptyHint={
                kind === 'guid'
                  ? 'No SKU carries that GUID. It may be a service plan ID — try the service plan tab.'
                  : 'No SKU matched. Try a part number such as SPE_E3, or part of a product name.'
              }
            />
          )}
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          {!data && !loadError && (
            <Ghost>
              <PlanDetail
                plan={GHOST_PLANS[0]}
                skus={[GHOST_SKU]}
                onCopy={() => {}}
                onSkuSelect={() => {}}
              />
            </Ghost>
          )}

          {data && !trimmed && (
            <Alert>
              <AlertTitle>Search for a service plan</AlertTitle>
              <AlertDescription>
                Type a plan name such as <code className="font-mono text-data-sm">INTUNE_A</code> to see every
                SKU that includes it.
              </AlertDescription>
            </Alert>
          )}

          {planView?.exact && (
            <PlanDetail
              plan={planView.exact.plan}
              skus={planView.exact.skus}
              onCopy={onCopy}
              onSkuSelect={selectSku}
            />
          )}

          {planView?.matches && (
            <MatchList
              items={planView.matches}
              keyOf={(p) => p.id}
              primary={(p) => p.friendly || p.name}
              secondary={(p) => p.name}
              onSelect={(p) => selectPlan(p.name || p.id)}
              emptyHint="No service plan matched. Try part of a friendly name, such as Intune."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * The near-miss list both tabs fall back to when a query is not an exact hit.
 * One component because the two lists differ only in which field is the title.
 */
function MatchList({ items, keyOf, primary, secondary, onSelect, emptyHint }) {
  if (items.length === 0) {
    return (
      <Alert>
        <AlertCircle aria-hidden="true" />
        <AlertTitle>No match</AlertTitle>
        <AlertDescription>{emptyHint}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-2 pt-6">
        <p className="text-body-sm text-muted-foreground">
          {items.length} {items.length === 1 ? 'match' : 'matches'} — select one to open it.
        </p>
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={keyOf(item)}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="flex w-full flex-wrap items-center justify-between gap-2 py-2 text-left hover:text-primary-text"
              >
                <span>{primary(item)}</span>
                <Badge variant="outline">{secondary(item)}</Badge>
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default M365LicensesTool;
