import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { loadAzureRegionData } from '@/utils/azure/region-parser';
import { distinct, findRegion, searchRegions } from '../lib/regions.js';
import { RegionDetail } from './RegionDetail.jsx';
import { RegionMap } from './RegionMap.jsx';

const ALL = 'all';

export function RegionsView({ data, initialQuery = '' }) {
  const regions = data.regions;
  const [query, setQuery] = useState(initialQuery);
  const [area, setArea] = useState(ALL);
  const [geography, setGeography] = useState(ALL);
  const [zonesOnly, setZonesOnly] = useState(false);
  const [selectedName, setSelectedName] = useState(() => findRegion(regions, initialQuery)?.name ?? null);
  const [codes, setCodes] = useState(null);
  const detailRef = useRef(null);

  useEffect(() => {
    let live = true;
    loadAzureRegionData().then(
      (loaded) => live && setCodes(loaded),
      () => live && setCodes(null)
    );
    return () => {
      live = false;
    };
  }, []);

  const areas = useMemo(() => distinct(regions, 'area'), [regions]);
  const geographies = useMemo(
    () => distinct(area === ALL ? regions : regions.filter((region) => region.area === area), 'geography'),
    [regions, area]
  );

  const matches = useMemo(
    () =>
      searchRegions(regions, {
        query,
        area: area === ALL ? '' : area,
        geography: geography === ALL ? '' : geography,
        zonesOnly,
      }),
    [regions, query, area, geography, zonesOnly]
  );

  const selected = selectedName ? regions.find((region) => region.name === selectedName) ?? null : null;

  const select = (name) => {
    setSelectedName(name);
    requestAnimationFrame(() => detailRef.current?.scrollIntoView({ block: 'nearest' }));
  };

  const filtered = query || area !== ALL || geography !== ALL || zonesOnly;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="region-query">Region name, geography or city</Label>
            <Input
              id="region-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="uksouth, West Europe or London"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="region-area">Area</Label>
            <Select
              value={area}
              onValueChange={(next) => {
                setArea(next);
                setGeography(ALL);
              }}
            >
              <SelectTrigger id="region-area">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All areas</SelectItem>
                {areas.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="region-geography">Geography</Label>
            <Select value={geography} onValueChange={setGeography}>
              <SelectTrigger id="region-geography">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All geographies</SelectItem>
                {geographies.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex min-h-9 items-center gap-2">
            <Switch id="region-zones" checked={zonesOnly} onCheckedChange={setZonesOnly} />
            <Label htmlFor="region-zones">Zones only</Label>
          </div>
        </CardContent>
      </Card>

      <RegionMap regions={regions} matches={matches} selectedName={selectedName} onSelect={select} />

      <div ref={detailRef} className="scroll-mt-4">
        {selected && <RegionDetail region={selected} regions={regions} codes={codes} onSelect={select} />}
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-body-sm text-on-surface-muted" role="status">
              {matches.length} of {regions.length} regions{selected ? '' : '. Select one for its pair and codes.'}
            </p>
            {filtered && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery('');
                  setArea(ALL);
                  setGeography(ALL);
                  setZonesOnly(false);
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
          {matches.length === 0 ? (
            <p className="text-body-md">
              No public-cloud region matches. Sovereign-cloud regions (US Government, China) are not in this list.
            </p>
          ) : (
            <Table aria-label="Azure regions">
              <TableHeader>
                <TableRow>
                  <TableHead>Region</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Geography</TableHead>
                  <TableHead>Paired with</TableHead>
                  <TableHead>Zones</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((region) => (
                  <TableRow key={region.name} data-state={region.name === selectedName ? 'selected' : undefined}>
                    <TableCell className="whitespace-nowrap font-sans text-body-sm">
                      <button
                        type="button"
                        className="rt-tap text-left text-primary-text underline-offset-2 hover:underline"
                        aria-pressed={region.name === selectedName}
                        onClick={() => select(region.name)}
                      >
                        {region.displayName}
                      </button>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        {region.name}
                        <CopyButton value={region.name} label={`Copy ${region.name}`} className="h-7 w-7" />
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-sans text-body-sm">{region.geography}</TableCell>
                    <TableCell className="whitespace-nowrap font-sans text-body-sm">
                      {region.pairedDisplayName ?? <span className="text-on-surface-faint">None</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {region.zones ?? <span className="text-on-surface-faint">None</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-sans text-body-sm">{region.location ?? ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
