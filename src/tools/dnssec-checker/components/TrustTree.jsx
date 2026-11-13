import React from 'react';
import { TreeDiagram } from '@/components/ui/tree-diagram';

const TONE = { success: 'ok', warning: 'warn', error: 'bad', info: 'muted' };
const STATE = {
  success: 'chain verified',
  warning: 'needs attention',
  error: 'chain broken',
  info: 'unsigned',
};
const MAX_SERVERS = 6;

/**
 * The delegation as a tree: the parent zone and the DS records it publishes,
 * the zone itself, and under it the keys it signs with and the servers it is
 * delegated to. A key the parent's DS record matches is the link that makes
 * the chain, so that is the one drawn in the accent.
 *
 * It restates the report's own data — the findings below say why — so it
 * adds no claim the checks did not make.
 *
 * @param {{ result: object }} props the output of `inspectDnssec`
 */
export default function TrustTree({ result }) {
  const parent = result.domain.split('.').slice(1).join('.') || '. (root)';
  const matched = new Set(result.matches.map((match) => match.keyTag));
  const servers = result.delegation.nameServers;

  const keys = result.keys.map((key) => ({
    id: `key-${key.keyTag}-${key.algorithm}`,
    label: `${key.flags === 257 ? 'KSK' : 'ZSK'} ${key.keyTag}`,
    sub: matched.has(key.keyTag) ? 'matches parent DS' : `algorithm ${key.algorithm}`,
    tone: matched.has(key.keyTag) ? 'ok' : undefined,
    edge: 'signs with',
  }));

  const shown = servers.slice(0, MAX_SERVERS).map((server) => ({
    id: `ns-${server.name}`,
    label: server.name,
    sub: server.addresses[0] ?? 'no address',
    tone: server.addresses.length ? undefined : 'bad',
    edge: 'served by',
  }));
  if (servers.length > MAX_SERVERS) {
    shown.push({ id: 'ns-more', label: `+${servers.length - MAX_SERVERS} more`, tone: 'muted', edge: 'served by' });
  }

  return (
    <TreeDiagram
      label={`The DNSSEC chain and delegation for ${result.domain}`}
      caption="Parent zone, then the zone, then its keys and name servers."
      root={{
        id: 'parent',
        label: parent,
        sub: `${result.dsRecords.length} DS record${result.dsRecords.length === 1 ? '' : 's'}`,
        tone: result.dsRecords.length ? 'ok' : 'muted',
        children: [
          {
            id: 'zone',
            label: result.domain,
            sub: STATE[result.status],
            edge: result.dsRecords.length ? 'delegates with DS' : 'delegates',
            tone: result.status === 'success' ? 'accent' : TONE[result.status],
            children: [...keys, ...shown],
          },
        ],
      }}
    />
  );
}
