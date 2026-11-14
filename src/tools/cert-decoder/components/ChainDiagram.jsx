import React from 'react';
import { TreeDiagram } from '@/components/ui/tree-diagram';

const BROKEN = {
  'issuer-mismatch': 'not issued by the certificate above',
  'key-mismatch': 'signed by a different key',
  'after-root': 'not part of this chain',
};

const TONE = { expired: 'bad', 'not-yet-valid': 'warn', expiring: 'warn' };

export default function ChainDiagram({ certificates, links }) {
  if (certificates.length < 2) return null;

  const node = (certificate, index) => {
    const link = links[index];
    const broken = link && !link.ok;
    const expired = certificate.validity.state === 'expired';
    return {
      id: `certificate-${index}`,
      label: certificate.subject.displayName,
      sub: broken && !expired ? BROKEN[link.reason] : certificate.validity.text,
      tone: broken ? 'bad' : (TONE[certificate.validity.state] ?? (index === 0 ? 'accent' : undefined)),
      edge: link ? (link.ok ? 'issues' : 'does not issue') : undefined,
    };
  };

  let tree = null;
  certificates.forEach((certificate, index) => {
    tree = { ...node(certificate, index), children: tree ? [tree] : undefined };
  });

  const count = certificates.length;
  return (
    <TreeDiagram
      label="The certificate chain, from the top issuer down to the leaf certificate"
      caption={`${count} certificates, top issuer first. Links are matched by name and key identifier; signatures are not verified.`}
      root={tree}
    />
  );
}
