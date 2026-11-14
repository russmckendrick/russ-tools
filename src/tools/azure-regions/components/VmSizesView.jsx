import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  decodeSizeName,
  findSize,
  loadVmSizes,
  looksLikeVmSize,
  searchSizes,
  seriesOf,
  sizeFamilies,
  tempStorageLabel,
} from '../lib/vmSizes.js';
import { SizeDetail } from './SizeDetail.jsx';

const ALL = 'all';
const PAGE = 50;
const dash = <span className="text-on-surface-faint">–</span>;
const figure = (value) => (value == null ? dash : value.toLocaleString('en'));
const wholeNumber = (text) => {
  const value = Number.parseFloat(text);
  return Number.isFinite(value) && value > 0 ? value : 0;
};

export function VmSizesView({ initialQuery = '', onLoaded }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [family, setFamily] = useState(ALL);
  const [minVcpus, setMinVcpus] = useState('');
  const [minMemory, setMinMemory] = useState('');
  const [selectedName, setSelectedName] = useState(null);
  const [shown, setShown] = useState(PAGE);
  const detailRef = useRef(null);

  useEffect(() => {
    let live = true;
    loadVmSizes().then(
      (loaded) => {
        if (!live) return;
        setData(loaded);
        onLoaded?.(loaded);
      },
      () => live && setError(true)
    );
    return () => {
      live = false;
    };
  }, [onLoaded]);

  const families = useMemo(() => (data ? sizeFamilies(data.sizes) : []), [data]);
  const matches = useMemo(
    () =>
      data
        ? searchSizes(data, {
            query,
            family: family === ALL ? '' : family,
            minVcpus: wholeNumber(minVcpus),
            minMemoryGiB: wholeNumber(minMemory),
          })
        : [],
    [data, query, family, minVcpus, minMemory]
  );

  useEffect(() => setShown(PAGE), [query, family, minVcpus, minMemory]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle aria-hidden="true" />
        <AlertTitle>VM sizes unavailable</AlertTitle>
        <AlertDescription>The checked-in VM size dataset could not be loaded.</AlertDescription>
      </Alert>
    );
  }

  // A typed name is decoded even when the tables do not carry it: the name
  // itself says most of what people come to look up.
  const typed = query.trim();
  const target = selectedName ?? (looksLikeVmSize(typed) && decodeSizeName(typed) ? typed : null);
  const targetSize = data && target ? findSize(data.sizes, target) : null;
  const filtered = query || family !== ALL || minVcpus || minMemory;

  const select = (name) => {
    setSelectedName(name);
    requestAnimationFrame(() => detailRef.current?.scrollIntoView({ block: 'nearest' }));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_8rem_8rem] lg:items-end">
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="size-query">Size or series name</Label>
            <Input
              id="size-query"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelectedName(null);
              }}
              placeholder="Standard_D4s_v5"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="size-family">Family</Label>
            <Select value={family} onValueChange={setFamily}>
              <SelectTrigger id="size-family">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All families</SelectItem>
                {families.map((entry) => (
                  <SelectItem key={entry.family} value={entry.family}>
                    {entry.family} ({entry.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="size-vcpus">Min vCPUs</Label>
            <Input
              id="size-vcpus"
              type="number"
              inputMode="numeric"
              min="0"
              value={minVcpus}
              onChange={(event) => setMinVcpus(event.target.value)}
              placeholder="Any"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="size-memory">Min memory (GiB)</Label>
            <Input
              id="size-memory"
              type="number"
              inputMode="decimal"
              min="0"
              value={minMemory}
              onChange={(event) => setMinMemory(event.target.value)}
              placeholder="Any"
            />
          </div>
        </CardContent>
      </Card>

      <div ref={detailRef} className="scroll-mt-4">
        {data && target && <SizeDetail name={target} size={targetSize} data={data} />}
      </div>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-body-sm text-on-surface-muted" role="status">
              {data
                ? `${matches.length.toLocaleString('en')} of ${data.sizes.length.toLocaleString('en')} sizes. Select one to decode its name.`
                : 'Loading the published sizes…'}
            </p>
            {filtered && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery('');
                  setFamily(ALL);
                  setMinVcpus('');
                  setMinMemory('');
                  setSelectedName(null);
                }}
              >
                Clear filters
              </Button>
            )}
          </div>

          {data && matches.length === 0 && (
            <p className="text-body-md">
              No published size matches. The tables cover the sizes Microsoft documents per series, so a size that
              exists only in a region’s SKU list will not be here.
            </p>
          )}

          {matches.length > 0 && (
            <Table aria-label="Azure VM sizes">
              <TableHeader>
                <TableRow>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">vCPUs</TableHead>
                  <TableHead className="text-right">Memory GiB</TableHead>
                  <TableHead>Temp storage</TableHead>
                  <TableHead className="text-right">Data disks</TableHead>
                  <TableHead>Accel. net</TableHead>
                  <TableHead>Premium SSD</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.slice(0, shown).map((size) => {
                  const series = seriesOf(data.series, size);
                  return (
                    <TableRow key={size.name} data-state={size.name === targetSize?.name ? 'selected' : undefined}>
                      <TableCell className="whitespace-nowrap">
                        <button
                          type="button"
                          className="rt-tap text-left text-primary-text underline-offset-2 hover:underline"
                          aria-pressed={size.name === targetSize?.name}
                          onClick={() => select(size.name)}
                        >
                          {size.name}
                        </button>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">{figure(size.vcpus)}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">{figure(size.memoryGiB)}</TableCell>
                      <TableCell className="whitespace-nowrap">{tempStorageLabel(size) ?? dash}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">{figure(size.dataDisks)}</TableCell>
                      <TableCell className="whitespace-nowrap font-sans text-body-sm">
                        {series?.features.acceleratedNetworking ?? dash}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-sans text-body-sm">
                        {series?.features.premiumStorage ?? dash}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {matches.length > shown && (
            <Button variant="outline" onClick={() => setShown((count) => count + PAGE)}>
              Show {Math.min(PAGE, matches.length - shown)} more
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
