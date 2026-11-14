import React from 'react';
import { Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ValidityBar } from '@/components/ui/validity-bar';
import { roleOf, timestamp } from '../lib/chain.js';
import {
  Absent,
  ExtendedUsageValue,
  Field,
  Fields,
  Hex,
  KeyUsageValue,
  KeyValue,
  Lines,
  Names,
  Note,
  SignatureValue,
  Title,
  Words,
} from './fields.jsx';

const STATE_BADGE = {
  valid: { variant: 'success', label: () => 'Valid' },
  expiring: { variant: 'warning', label: (validity) => `Expires in ${validity.text.replace(' left', '')}` },
  expired: { variant: 'destructive', label: () => 'Expired' },
  'not-yet-valid': { variant: 'warning', label: () => 'Not valid yet' },
};

const DECODED_ELSEWHERE = new Set([
  '2.5.29.14',
  '2.5.29.15',
  '2.5.29.17',
  '2.5.29.19',
  '2.5.29.31',
  '2.5.29.35',
  '2.5.29.37',
  '1.3.6.1.5.5.7.1.1',
]);

function Constraints({ certificate }) {
  const constraints = certificate.basicConstraints;
  if (!constraints) return <Absent />;
  return (
    <>
      <span className="whitespace-nowrap">{constraints.ca ? 'Certificate authority' : 'Not a CA'}</span>
      {constraints.ca && constraints.pathLength !== null && <Note> · path length {constraints.pathLength}</Note>}
      {constraints.critical && <Note> · critical</Note>}
    </>
  );
}

function Endpoints({ certificate }) {
  const rows = [
    ...certificate.ocsp.map((url) => ['OCSP', url]),
    ...certificate.caIssuers.map((url) => ['CA issuers', url]),
    ...certificate.crl.map((url) => ['CRL', url]),
  ];
  if (!rows.length) return <Absent>None listed</Absent>;
  return (
    <Lines
      items={rows.map(([kind, url]) => (
        <>
          <span className="block font-sans text-body-sm text-on-surface-faint sm:mr-2 sm:inline">{kind}</span>
          {url}
        </>
      ))}
    />
  );
}

export default function CertificateCard({ certificate, emphasis = false, onCopy }) {
  const state = STATE_BADGE[certificate.validity.state];
  const others = certificate.extensions.filter((extension) => !DECODED_ELSEWHERE.has(extension.oid) || extension.malformed);

  return (
    <Card emphasis={emphasis}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <Title text={certificate.subject.displayName} />
            <Badge>{roleOf(certificate)}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={state.variant}>{state.label(certificate.validity)}</Badge>
            <Button size="sm" variant="outline" onClick={() => onCopy(certificate)}>
              <Copy aria-hidden="true" />
              Copy PEM
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ValidityBar
          start={certificate.notBefore}
          end={certificate.notAfter}
          format={(date) => date.toISOString().slice(0, 10)}
        />
        <Fields>
          <Field label="Subject">
            <Words text={certificate.subject.dn || 'Empty'} />
          </Field>
          <Field label="Issuer">
            <Words text={certificate.issuer.dn || 'Empty'} />
            {certificate.selfIssued && <Note> · self-signed</Note>}
          </Field>
          <Field label="Alternative names">
            <Names names={certificate.sans} />
          </Field>
          <Field label="Valid from">
            <Words text={timestamp(certificate.notBefore)} />
          </Field>
          <Field label="Valid until">
            <Words text={timestamp(certificate.notAfter)} />
          </Field>
          <Field label="Serial number">
            <Hex value={certificate.serial} />
          </Field>
          <Field label="Public key">
            <KeyValue publicKey={certificate.key} />
          </Field>
          <Field label="Signature algorithm">
            <SignatureValue algorithm={certificate.signatureAlgorithm} />
          </Field>
          <Field label="Key usage">
            <KeyUsageValue usage={certificate.keyUsage} />
          </Field>
          <Field label="Extended key usage">
            <ExtendedUsageValue usages={certificate.extendedKeyUsage} />
          </Field>
          <Field label="Basic constraints">
            <Constraints certificate={certificate} />
          </Field>
          <Field label="SHA-256 fingerprint">
            <Hex value={certificate.fingerprints?.sha256} />
          </Field>
          <Field label="SHA-1 fingerprint">
            <Hex value={certificate.fingerprints?.sha1} />
          </Field>
          {certificate.subjectKeyId && (
            <Field label="Subject key ID">
              <Hex value={certificate.subjectKeyId} />
            </Field>
          )}
          {certificate.authorityKeyId && (
            <Field label="Authority key ID">
              <Hex value={certificate.authorityKeyId} />
            </Field>
          )}
          <Field label="Revocation and issuer URLs">
            <Endpoints certificate={certificate} />
          </Field>
          {others.length > 0 && (
            <Field label="Other extensions">
              <Lines
                items={others.map((extension) => (
                  <>
                    {extension.name}
                    {extension.critical && <Note> · critical</Note>}
                    {extension.malformed && <Note> · could not be read</Note>}
                  </>
                ))}
              />
            </Field>
          )}
        </Fields>
      </CardContent>
    </Card>
  );
}
