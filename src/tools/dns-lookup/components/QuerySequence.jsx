import React from 'react';
import { register } from 'pele/core';
import sequence from 'pele/diagrams/sequence';
import { FlowDiagram } from '@/components/ui/tree-diagram';

register(sequence);

/** Mermaid sequence text ends a message at a newline and reads `;` as one. */
const text = (value) => String(value).replace(/[;#\n]/g, ' ').trim();

const RCODE = { 0: 'NOERROR', 2: 'SERVFAIL', 3: 'NXDOMAIN', 5: 'REFUSED' };

/**
 * The lookup as the conversation it was: this browser asking each resolver,
 * and what each one said back — the response code, how many records, and
 * whether the resolver vouched for the answer with the AD flag.
 *
 * With two resolvers it is the comparison at a glance: two questions, two
 * answers, side by side in time.
 *
 * @param {object} props
 * @param {object[]} props.queries the v2 result's `queries`
 * @param {string} props.domain
 */
export default function QuerySequence({ queries, domain }) {
  if (!queries?.length) return null;

  const lines = ['sequenceDiagram', '  participant B as This browser'];
  queries.forEach((query, i) => {
    lines.push(`  participant R${i} as ${text(query.providerLabel ?? query.provider ?? 'Resolver')}`);
  });
  queries.forEach((query, i) => {
    const count = query.Answer?.length ?? 0;
    const code = RCODE[query.Status] ?? `RCODE ${query.Status ?? '?'}`;
    lines.push(`  B->>R${i}: ${text(query.queryType ?? 'A')} ${text(domain)}?`);
    lines.push(
      `  R${i}-->>B: ${code}, ${count} record${count === 1 ? '' : 's'}${query.AD ? ', validated' : ''}`
    );
  });

  return (
    <FlowDiagram
      source={lines.join('\n')}
      label={`The DNS queries sent for ${domain} and the answers returned`}
    />
  );
}
