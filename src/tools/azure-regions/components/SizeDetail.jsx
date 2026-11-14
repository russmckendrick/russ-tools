import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ValueList, ValueRow } from '@/components/ui/value-list';
import { decodeSizeName, seriesOf, tempStorageLabel } from '../lib/vmSizes.js';

const NOT_PUBLISHED = 'Not published';
const number = (value, unit = '') => (value == null ? NOT_PUBLISHED : `${value.toLocaleString('en')}${unit}`);

export function SizeDetail({ name, size, data }) {
  const decoded = decodeSizeName(name, data, size);
  const series = size ? seriesOf(data.series, size) : null;
  if (!decoded && !size) return null;

  return (
    <Card emphasis>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="whitespace-nowrap font-mono text-data-lg">{size?.name ?? name}</h3>
          <p className="text-body-sm text-on-surface-muted">
            {series ? series.title : 'Decoded from the name. This size is not in the published tables.'}
          </p>
        </div>
        {size && (
          <div className="flex flex-wrap gap-2">
            {size.vcpus != null && <Badge>{size.vcpus} vCPU</Badge>}
            {size.memoryGiB != null && <Badge variant="secondary">{size.memoryGiB.toLocaleString('en')} GiB</Badge>}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        {decoded && (
          <section aria-label="Name decoded">
            <h4 className="text-label-caps uppercase text-on-surface-faint">Name decoded</h4>
            <ValueList>
              {decoded.parts.map((part, index) => (
                <ValueRow
                  key={`${part.part}-${index}`}
                  label={part.part}
                  value={part.value}
                  note={
                    part.meaning ??
                    (part.listed ? undefined : 'Not listed in Microsoft’s naming convention, so not interpreted here.')
                  }
                />
              ))}
            </ValueList>
          </section>
        )}

        {size && (
          <section aria-label="Published specification">
            <h4 className="text-label-caps uppercase text-on-surface-faint">Published specification</h4>
            <ValueList>
              <ValueRow label="Size name" value={size.name} copyValue={size.name} />
              <ValueRow label="vCPUs" value={number(size.vcpus)} />
              <ValueRow label="Memory" value={number(size.memoryGiB, ' GiB')} />
              <ValueRow
                label="Temporary storage"
                value={tempStorageLabel(size) ?? 'None published'}
                note={tempStorageLabel(size) ? undefined : 'The series article lists no local temporary disk for this size.'}
              />
              <ValueRow label="Max data disks" value={number(size.dataDisks)} />
              <ValueRow label="Max NICs" value={number(size.nics)} />
              <ValueRow label="Network bandwidth" value={number(size.bandwidthMbps, ' Mbps')} />
              <ValueRow
                label="Premium storage"
                value={series?.features.premiumStorage ?? NOT_PUBLISHED}
                mono={false}
                note="Stated for the series."
              />
              <ValueRow
                label="Accelerated networking"
                value={series?.features.acceleratedNetworking ?? NOT_PUBLISHED}
                mono={false}
                note="Stated for the series."
              />
              {series?.features.ephemeralOsDisk && (
                <ValueRow label="Ephemeral OS disk" value={series.features.ephemeralOsDisk} mono={false} />
              )}
              {series?.features.nestedVirtualization && (
                <ValueRow label="Nested virtualisation" value={series.features.nestedVirtualization} mono={false} />
              )}
            </ValueList>
            {series && (
              <p className="mt-3 text-body-sm">
                <a
                  className="inline-flex items-center gap-1 text-primary-text underline underline-offset-2"
                  href={series.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {series.title} on Microsoft Learn
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              </p>
            )}
          </section>
        )}
      </CardContent>
    </Card>
  );
}
