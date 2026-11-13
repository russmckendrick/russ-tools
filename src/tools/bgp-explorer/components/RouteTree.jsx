import React from 'react';
import { TreeDiagram } from '@/components/ui/tree-diagram';

const MAX_CHILDREN = 6;
const RPKI_TONE = { valid: 'ok', unknown: 'warn' };

/** Keep a long list drawable: the first few, then a count of the rest. */
function capped(nodes, noun) {
  if (nodes.length <= MAX_CHILDREN) return nodes;
  return [
    ...nodes.slice(0, MAX_CHILDREN),
    { id: `more-${noun}`, label: `+${nodes.length - MAX_CHILDREN} more`, sub: noun, tone: 'muted' },
  ];
}

/**
 * Where a route sits: the covering prefix above it, the prefix itself, and
 * beneath it the AS that originates it — with its RPKI state — and any more
 * specific announcements. For an ASN it is the AS and the prefixes it
 * originates.
 *
 * Every node restates a field of the lookup; the tabs carry the full lists
 * this caps.
 *
 * @param {{ result: object }} props the output of `lookupRouting`
 */
export default function RouteTree({ result }) {
  if (result.kind === 'asn') {
    const prefixes = (result.prefixes ?? []).map((item) => item.prefix ?? item);
    return (
      <TreeDiagram
        label={`${result.resource} and the prefixes it originates`}
        caption={`${prefixes.length} originated prefix${prefixes.length === 1 ? '' : 'es'}.`}
        root={{
          id: 'asn',
          label: result.resource,
          sub: result.holder || undefined,
          tone: 'accent',
          children: capped(prefixes.map((prefix) => ({ id: prefix, label: prefix, edge: 'originates' })), 'prefixes'),
        }}
      />
    );
  }

  const rpki = new Map((result.rpki ?? []).map((item) => [String(item.origin), item.status]));
  const origins = (result.origins?.length ? result.origins : result.routing.origins).map((origin) =>
    String(origin.asn ?? origin.origin ?? origin)
  );

  const originNodes = origins.map((asn) => {
    const status = rpki.get(asn);
    return {
      id: `as-${asn}`,
      label: `AS${asn}`,
      sub: status ? `RPKI ${status}` : 'origin',
      tone: status ? (RPKI_TONE[status] ?? 'bad') : undefined,
      edge: 'originated by',
    };
  });
  const specifics = result.routing.moreSpecifics.map((item) => ({
    id: `more-${item.prefix}`,
    label: item.prefix,
    sub: 'more specific',
    tone: 'muted',
    edge: 'contains',
  }));

  const self = {
    id: 'resource',
    label: result.resource,
    sub: result.announced ? 'announced' : 'not announced',
    tone: result.announced ? 'accent' : 'warn',
    children: [...originNodes, ...capped(specifics, 'more specific')],
  };
  const covering = result.routing.lessSpecifics[0]?.prefix;

  return (
    <TreeDiagram
      label={`Routing for ${result.resource}`}
      caption="Covering prefix, then this prefix, then its origin and any more specific routes."
      root={
        covering && covering !== result.resource
          ? { id: 'covering', label: covering, sub: 'less specific', tone: 'muted', children: [{ ...self, edge: 'covers' }] }
          : self
      }
    />
  );
}
