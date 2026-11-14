import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ValueList, ValueRow } from '@/components/ui/value-list';
import { pairOf, zoneLabel } from '../lib/regions.js';

function PairValue({ pair }) {
  if (pair.kind === 'none') return 'No paired region';
  if (pair.kind === 'unlisted') return pair.displayName;
  return `${pair.region.displayName} (${pair.region.name})`;
}

export function RegionDetail({ region, regions, codes, onSelect }) {
  const pair = pairOf(regions, region);
  const shortCode = codes?.regionAbbreviations?.[region.name];
  const geoCode = codes?.geoCodes?.[region.name];

  return (
    <Card emphasis>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-title-sm">{region.displayName}</h3>
          <p className="text-body-sm text-on-surface-muted">
            {region.geography}
            {region.area ? ` · ${region.area}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {region.zones ? <Badge variant="success">{zoneLabel(region)}</Badge> : <Badge variant="secondary">No zones</Badge>}
          {region.restricted && <Badge variant="warning">Restricted access</Badge>}
          {region.preview && <Badge variant="info">Preview</Badge>}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ValueList>
          <ValueRow label="Programmatic name" value={region.name} copyValue={region.name} />
          <ValueRow label="Display name" value={region.displayName} copyValue={region.displayName} mono={false} />
          <ValueRow label="Geography" value={region.geography} mono={false} />
          <ValueRow label="Physical location" value={region.location ?? 'Not published'} mono={false} />
          <ValueRow label="Availability zones" value={zoneLabel(region)} mono={false} />
          <ValueRow
            label="Paired region"
            value={<PairValue pair={pair} />}
            mono={false}
            copyValue={pair.kind === 'listed' ? pair.region.name : undefined}
            note={
              pair.kind === 'unlisted'
                ? 'Named as the pair, but not a region in the public list.'
                : pair.kind === 'none'
                  ? 'Resilience here comes from availability zones or a region you choose.'
                  : undefined
            }
          >
            {pair.kind === 'listed' && (
              <Button variant="outline" size="sm" onClick={() => onSelect(pair.region.name)}>
                Open
              </Button>
            )}
          </ValueRow>
          <ValueRow
            label="Naming short code"
            value={shortCode ?? 'None listed'}
            copyValue={shortCode}
            mono={Boolean(shortCode)}
            note={
              shortCode
                ? 'The abbreviation the Azure Naming tool on this site uses. A convention, not a Microsoft identifier.'
                : 'The naming tool’s region list has no abbreviation for this region yet.'
            }
          />
          {geoCode && (
            <ValueRow
              label="Geo code"
              value={geoCode}
              copyValue={geoCode}
              note="From the same regions file, which records it as the region’s geo code."
            />
          )}
        </ValueList>
        {region.restricted && (
          <p className="mt-3 text-body-sm text-on-surface-muted">
            Microsoft restricts access to this region to specific scenarios, such as disaster recovery within
            the geography.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
