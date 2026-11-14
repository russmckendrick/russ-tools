import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWebMCPTool, textResult } from '@/lib/useWebMCPTool';
import { RegionsView } from './components/RegionsView.jsx';
import { VmSizesView } from './components/VmSizesView.jsx';
import { findRegion, loadRegions, pairOf, searchRegions } from './lib/regions.js';
import { decodeSizeName, findSize, loadVmSizes, looksLikeVmSize, searchSizes, seriesOf } from './lib/vmSizes.js';

const REGION_TOOL = {
  name: 'lookup_azure_region',
  description:
    'Look up Azure public-cloud regions from a dated snapshot of Microsoft’s regions list: programmatic name, ' +
    'display name, geography, paired region, availability-zone support and physical location. Pass a region ' +
    'name (uksouth, "UK South") for one region, or a search term or geography to list matches. ' +
    'Sovereign clouds are not covered.',
  inputSchema: {
    type: 'object',
    properties: {
      region: { type: 'string', description: 'Programmatic or display name, e.g. uksouth or "West Europe"' },
      search: { type: 'string', description: 'Free text over name, geography, area and city, e.g. "germany"' },
      zonesOnly: { type: 'boolean', description: 'Only regions with availability zones' },
    },
  },
  annotations: { readOnlyHint: true },
  execute: async ({ region, search, zonesOnly } = {}) => {
    try {
      const data = await loadRegions();
      const describe = (entry) => {
        const pair = pairOf(data.regions, entry);
        return {
          name: entry.name,
          displayName: entry.displayName,
          geography: entry.geography,
          area: entry.area,
          physicalLocation: entry.location,
          availabilityZones: entry.zones,
          pairedRegion: pair.kind === 'listed' ? pair.region.name : pair.kind === 'unlisted' ? pair.displayName : null,
          restrictedAccess: entry.restricted,
        };
      };
      if (region) {
        const found = findRegion(data.regions, region);
        if (!found) return textResult({ error: `No public-cloud region named "${region}".`, snapshot: data.generatedAt });
        return textResult({ snapshot: data.generatedAt, region: describe(found) });
      }
      const matches = searchRegions(data.regions, { query: search ?? '', zonesOnly: Boolean(zonesOnly) });
      return textResult({ snapshot: data.generatedAt, count: matches.length, regions: matches.map(describe) });
    } catch {
      return textResult({ error: 'The region dataset could not be loaded.' });
    }
  },
};

const SIZE_TOOL = {
  name: 'lookup_azure_vm_size',
  description:
    'Decode an Azure VM size name (Standard_D4s_v5) into family, vCPUs, feature letters and version, and return ' +
    'its published vCPUs, memory, temporary storage, data-disk limit, accelerated networking and premium ' +
    'storage support. Or list sizes by family and minimum vCPUs and memory. From a dated snapshot of ' +
    'Microsoft’s series articles: regional availability and prices are not included.',
  inputSchema: {
    type: 'object',
    properties: {
      size: { type: 'string', description: 'A size name, tier optional, e.g. Standard_D4s_v5 or E8ds_v5' },
      family: { type: 'string', description: 'Family prefix to list, e.g. D, E, NC' },
      minVcpus: { type: 'number', description: 'Minimum vCPUs' },
      minMemoryGiB: { type: 'number', description: 'Minimum memory in GiB' },
    },
  },
  annotations: { readOnlyHint: true },
  execute: async ({ size, family, minVcpus, minMemoryGiB } = {}) => {
    try {
      const data = await loadVmSizes();
      const describe = (entry) => {
        const series = seriesOf(data.series, entry);
        return {
          ...entry,
          series: series?.title ?? entry.series,
          premiumStorage: series?.features.premiumStorage ?? null,
          acceleratedNetworking: series?.features.acceleratedNetworking ?? null,
          reference: series?.url ?? null,
        };
      };
      if (size) {
        const found = findSize(data.sizes, size);
        const decoded = decodeSizeName(size, data, found);
        if (!found && !decoded) return textResult({ error: `"${size}" is not a VM size name.` });
        return textResult({
          snapshot: data.generatedAt,
          published: found ? describe(found) : null,
          note: found ? undefined : 'Not in the published series tables; decoded from the name only.',
          nameParts: decoded?.parts.map(({ part, value, meaning }) => ({ part, value, meaning })) ?? null,
        });
      }
      const matches = searchSizes(data, {
        family: family ?? '',
        minVcpus: Number(minVcpus) || 0,
        minMemoryGiB: Number(minMemoryGiB) || 0,
      });
      return textResult({
        snapshot: data.generatedAt,
        count: matches.length,
        sizes: matches.slice(0, 50).map(describe),
        truncated: matches.length > 50,
      });
    } catch {
      return textResult({ error: 'The VM size dataset could not be loaded.' });
    }
  },
};

export default function AzureRegions() {
  useWebMCPTool(REGION_TOOL);
  useWebMCPTool(SIZE_TOOL);

  const { query: routeQuery } = useParams();
  const initial = routeQuery ? decodeURIComponent(routeQuery) : '';
  const opensOnSizes = looksLikeVmSize(initial);

  const [tab, setTab] = useState(opensOnSizes ? 'sizes' : 'regions');
  const [sizesOpened, setSizesOpened] = useState(opensOnSizes);
  const [regionData, setRegionData] = useState(null);
  const [sizeData, setSizeData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    loadRegions().then(
      (loaded) => live && setRegionData(loaded),
      () => live && setError(true)
    );
    return () => {
      live = false;
    };
  }, []);

  const onSizesLoaded = useCallback((loaded) => setSizeData(loaded), []);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Regions fetched {regionData?.generatedAt ?? '…'}</Badge>
          <Badge variant="secondary">
            {sizeData ? `VM sizes fetched ${sizeData.generatedAt}` : 'VM sizes load when opened'}
          </Badge>
        </div>
        <p className="text-body-sm text-on-surface-muted">
          A snapshot of Microsoft’s published regions list and VM size articles, searched in this tab. Which sizes a
          region offers, and prices, come from a signed-in Azure API and are not here.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Regions unavailable</AlertTitle>
          <AlertDescription>The checked-in region dataset could not be loaded.</AlertDescription>
        </Alert>
      )}

      <Tabs
        value={tab}
        onValueChange={(next) => {
          setTab(next);
          if (next === 'sizes') setSizesOpened(true);
        }}
      >
        <TabsList>
          <TabsTrigger value="regions">Regions</TabsTrigger>
          <TabsTrigger value="sizes">VM sizes</TabsTrigger>
        </TabsList>
        <TabsContent value="regions" forceMount hidden={tab !== 'regions'}>
          {regionData ? (
            <RegionsView data={regionData} initialQuery={opensOnSizes ? '' : initial} />
          ) : (
            !error && <p className="text-body-sm text-on-surface-muted">Loading the regions list…</p>
          )}
        </TabsContent>
        <TabsContent value="sizes" forceMount hidden={tab !== 'sizes'}>
          {sizesOpened && <VmSizesView initialQuery={opensOnSizes ? initial : ''} onLoaded={onSizesLoaded} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
