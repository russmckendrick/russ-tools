import React from 'react';
import { TreeDiagram } from '@/components/ui/tree-diagram';

const DAY = 86_400_000;

/** The common name out of a distinguished name, or the whole thing. */
const commonName = (subject) => /CN=([^,]+)/.exec(subject ?? '')?.[1]?.trim() ?? subject ?? 'Unknown';

/**
 * The certificate chain, top down: each certificate under the one that
 * issued it, ending at the certificate the host presented. Every link says
 * how long it has left, so the one that expires first is the one you see.
 *
 * The order comes from the issuer and subject names rather than from the
 * array, so a chain delivered out of order still draws correctly.
 *
 * @param {{ certs: object[] }} props
 */
export default function CertChain({ certs }) {
  if (!certs?.length) return null;

  const node = (cert, leaf) => {
    const left = cert.notAfter ? Math.floor((cert.notAfter - Date.now()) / DAY) : null;
    return {
      id: `${cert.subject}-${cert.notAfter}`,
      label: commonName(cert.subject),
      sub:
        left === null
          ? undefined
          : left < 0
            ? `expired ${-left} day${left === -1 ? '' : 's'} ago`
            : `${left} day${left === 1 ? '' : 's'} left`,
      tone: left !== null && left < 0 ? 'bad' : left !== null && left < 30 ? 'warn' : leaf ? 'accent' : undefined,
    };
  };

  // Start from the certificate nobody else in the list was issued by, and
  // follow issuer names upward.
  const issued = new Set(certs.map((cert) => cert.issuerSubject));
  const leaf = certs.find((cert) => !issued.has(cert.subject)) ?? certs[0];
  const path = [leaf];
  while (path.length < certs.length) {
    const last = path[path.length - 1];
    const parent = certs.find((cert) => cert.subject === last.issuerSubject && !path.includes(cert));
    if (!parent) break;
    path.push(parent);
  }

  let tree = node(path[0], true);
  for (const cert of path.slice(1)) {
    tree = { ...node(cert, false), children: [{ ...tree, edge: 'issues' }] };
  }

  return (
    <TreeDiagram
      label="The certificate chain, from issuer down to the host certificate"
      caption={`${path.length} certificate${path.length === 1 ? '' : 's'} in the chain.`}
      root={tree}
    />
  );
}
