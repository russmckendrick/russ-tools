import React from 'react';
import { AlertCircle, CheckCircle2, ExternalLink, Info, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ValidityBar } from '@/components/ui/validity-bar';
import { toFragment, toPem } from '../../cert-decoder/lib/pem.js';
import { validityOf } from '../lib/parse.js';
import { UNVERIFIED } from '../lib/saml.js';
import XmlView from './XmlView.jsx';

const VARIANT = { success: 'success', warning: 'warning', error: 'destructive', info: 'info' };
const ICON = { success: CheckCircle2, warning: TriangleAlert, error: AlertCircle, info: Info };

const SIGNED = {
  both: { variant: 'success', label: 'Response and assertion signed' },
  assertion: { variant: 'success', label: 'Assertion signed' },
  message: { variant: 'warning', label: 'Response signed, assertion not' },
  neither: { variant: 'destructive', label: 'Not signed' },
};

const stamp = (iso) => (iso ? `${iso.slice(0, 19).replace('T', ' ')} UTC` : null);
const shortStamp = (date) => `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;

function Fields({ children }) {
  return <dl className="flex flex-col">{children}</dl>;
}

function Field({ label, children }) {
  if (children === null || children === undefined || children === false || children === '') return null;
  return (
    <div className="grid gap-x-6 gap-y-1 border-b border-rule py-2.5 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[11rem_minmax(0,1fr)]">
      <dt className="text-body-sm text-on-surface-muted">{label}</dt>
      <dd className="min-w-0 font-mono text-data-md text-on-surface [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

function Named({ item }) {
  if (!item) return null;
  if (!item.label) return item.uri;
  return (
    <>
      <span className="font-sans text-body-md">{item.label}</span>
      <span className="block text-data-sm text-on-surface-faint">{item.uri}</span>
    </>
  );
}

function List({ items }) {
  if (!items?.length) return null;
  if (items.length === 1) return items[0];
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

const yesNo = (value) => (value === null || value === undefined ? null : value ? 'Yes' : 'No');

function AssertionFields({ assertion }) {
  const [authn] = assertion.authnStatements;
  const recipients = [...new Set(assertion.confirmations.map((item) => item.recipient).filter(Boolean))];
  const methods = assertion.confirmations.map((item) => item.method).filter(Boolean);
  const { start, end } = validityOf(assertion);

  return (
    <>
      {start && end && (
        <ValidityBar start={start} end={end} startLabel="Not before" endLabel="Not on or after" format={shortStamp} />
      )}
      <Fields>
        <Field label="Issuer">{assertion.issuer}</Field>
        <Field label="Subject (NameID)">
          {assertion.nameId?.encrypted ? 'Encrypted' : assertion.nameId?.value}
        </Field>
        <Field label="NameID format">{assertion.nameId?.format && <Named item={assertion.nameId.format} />}</Field>
        <Field label="Audience">
          {assertion.audiences.length ? (
            <List items={assertion.audiences} />
          ) : (
            <span className="font-sans text-body-sm text-on-surface-faint">No audience restriction</span>
          )}
        </Field>
        <Field label="Recipient">{recipients.length > 0 && <List items={recipients} />}</Field>
        <Field label="Confirmation">{methods.length > 0 && <Named item={methods[0]} />}</Field>
        <Field label="Not before">{stamp(assertion.notBefore)}</Field>
        <Field label="Not on or after">{stamp(end)}</Field>
        <Field label="Authentication context">{authn?.contextClass && <Named item={authn.contextClass} />}</Field>
        <Field label="Authenticated at">{stamp(authn?.authnInstant)}</Field>
        <Field label="Session index">{authn?.sessionIndex}</Field>
        <Field label="Session ends">{stamp(authn?.sessionNotOnOrAfter)}</Field>
        <Field label="Assertion ID">{assertion.id}</Field>
      </Fields>
    </>
  );
}

function RequestFields({ request }) {
  if (!request) return null;
  return (
    <>
      <Field label="Reply to (ACS URL)">{request.assertionConsumerServiceUrl}</Field>
      <Field label="ACS index">{request.assertionConsumerServiceIndex}</Field>
      <Field label="Reply binding">{request.protocolBinding && <Named item={request.protocolBinding} />}</Field>
      <Field label="NameID policy">{request.nameIdPolicy?.format && <Named item={request.nameIdPolicy.format} />}</Field>
      <Field label="Requested context">
        {request.requestedContexts.length > 0 && (
          <List items={request.requestedContexts.map((item, index) => <Named key={index} item={item} />)} />
        )}
      </Field>
      <Field label="Context comparison">{request.comparison}</Field>
      <Field label="Force sign-in">{yesNo(request.forceAuthn)}</Field>
      <Field label="Passive">{yesNo(request.isPassive)}</Field>
      <Field label="Subject (NameID)">{request.nameId?.value}</Field>
      <Field label="Session index">{request.sessionIndexes.length > 0 && <List items={request.sessionIndexes} />}</Field>
    </>
  );
}

function Attributes({ assertion }) {
  if (assertion.attributes.length === 0 && assertion.encryptedAttributes === 0) return null;
  return (
    <Card>
      <CardHeader>
        <h3 className="text-title-sm">Attributes</h3>
        <p className="text-body-sm text-on-surface-muted">
          {assertion.attributes.length} attribute{assertion.attributes.length === 1 ? '' : 's'}, in the order sent.
          {assertion.encryptedAttributes > 0 && ` ${assertion.encryptedAttributes} more are encrypted and cannot be read.`}
        </p>
      </CardHeader>
      {assertion.attributes.length > 0 && (
        <CardContent>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[45%]">Attribute</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assertion.attributes.map((attribute, index) => (
                <TableRow key={`${attribute.name}-${index}`}>
                  <TableCell className="align-top [overflow-wrap:anywhere]">
                    {attribute.label && <span className="block font-sans text-body-md text-on-surface">{attribute.label}</span>}
                    <span className={attribute.label ? 'block text-data-sm text-on-surface-faint' : 'block text-on-surface'}>
                      {attribute.name}
                    </span>
                  </TableCell>
                  <TableCell className="align-top text-on-surface [overflow-wrap:anywhere]">
                    {attribute.values.length ? (
                      <List items={attribute.values} />
                    ) : (
                      <span className="font-sans text-body-sm text-on-surface-faint">No value</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
}

function Algorithm({ item }) {
  if (!item) return <span className="font-sans text-body-sm text-on-surface-faint">Not stated</span>;
  return (
    <>
      <span className="inline-flex flex-wrap items-center gap-2">
        <span className="font-sans text-body-md">{item.label ?? item.uri}</span>
        {item.weak && <Badge variant="warning">weak</Badge>}
      </span>
      {item.label && <span className="block text-data-sm text-on-surface-faint">{item.uri}</span>}
    </>
  );
}

function SignatureFields({ title, signature }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-body-md text-on-surface">{title}</h4>
        <Badge variant={signature ? 'secondary' : 'outline'}>{signature ? 'present' : 'none'}</Badge>
      </div>
      {signature && (
        <Fields>
          <Field label="Signature algorithm">
            <Algorithm item={signature.signatureAlgorithm} />
          </Field>
          <Field label="Digest algorithm">
            {signature.digestAlgorithms.length > 0 ? (
              <List items={signature.digestAlgorithms.map((item, index) => <Algorithm key={index} item={item} />)} />
            ) : (
              <Algorithm item={null} />
            )}
          </Field>
          <Field label="Canonicalisation">
            <Algorithm item={signature.canonicalization} />
          </Field>
          <Field label="Covers">
            {signature.references.map((uri) => uri || '(whole document)').join(', ') || 'No reference'}
          </Field>
          <Field label="Certificate">
            {signature.certificates.length > 0 ? (
              <span className="inline-flex flex-wrap items-center gap-2">
                <span className="font-sans text-body-md">
                  {signature.certificates.length === 1 ? 'Included' : `${signature.certificates.length} included`}
                </span>
                <Button asChild variant="outline" size="sm">
                  <a href={`/cert-decoder#pem=${toFragment(signature.certificates.map((base64) => toPem('certificate', base64)).join('\n'))}`}>
                    <ExternalLink aria-hidden="true" />
                    Decode it
                  </a>
                </Button>
              </span>
            ) : (
              <span className="font-sans text-body-sm text-on-surface-faint">Not included</span>
            )}
          </Field>
        </Fields>
      )}
    </div>
  );
}

export function Findings({ findings }) {
  return findings.map((finding, index) => {
    const FindingIcon = ICON[finding.severity];
    return (
      <Alert key={`${finding.code}-${index}`} variant={VARIANT[finding.severity]}>
        <FindingIcon aria-hidden="true" />
        <AlertTitle>{finding.title}</AlertTitle>
        <AlertDescription>{finding.detail}</AlertDescription>
      </Alert>
    );
  });
}

export default function Results({ read }) {
  const { result, binding, lines, xml } = read;
  const [first, ...others] = result.assertions;
  const isRequest = Boolean(result.request);
  const carriesAssertion = result.assertions.length > 0;
  const signed = SIGNED[result.signed];
  const messageLabel = result.kind === 'Assertion' ? null : isRequest ? 'Request signature' : 'Response signature';

  return (
    <div className="flex flex-col gap-4">
      <Card emphasis>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <h3 className="min-w-0 text-title-sm">{result.kind ? `SAML ${result.kind.toLowerCase()}` : 'XML document'}</h3>
            <div className="flex flex-wrap items-center gap-2">
              {result.status && (
                <Badge variant={result.status.success ? 'success' : 'destructive'}>
                  {result.status.code?.label ?? 'No status'}
                </Badge>
              )}
              {carriesAssertion && <Badge variant={signed.variant}>{signed.label}</Badge>}
              {!carriesAssertion && result.kind && (
                <Badge variant="secondary">
                  {result.signature ? 'Signed in the XML' : binding?.signed ? 'Signed in the query string' : 'Not signed'}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {first && <AssertionFields assertion={first} />}
          <Fields>
            {!first && <Field label="Issuer">{result.issuer}</Field>}
            <Field label="Destination">{result.destination}</Field>
            <RequestFields request={result.request} />
            <Field label="In response to">{result.inResponseTo}</Field>
            <Field label="Issued at">{stamp(result.issueInstant)}</Field>
            {result.kind !== 'Assertion' && <Field label="Message ID">{result.id}</Field>}
            <Field label="Relay state">{binding?.relayState}</Field>
            <Field label="Status detail">
              {result.status && !result.status.success && (result.status.message ?? result.status.subCode?.label)}
            </Field>
          </Fields>
        </CardContent>
      </Card>

      <Findings findings={result.findings} />

      {first && <Attributes assertion={first} />}

      {others.map((assertion, index) => (
        <React.Fragment key={assertion.id ?? index}>
          <Card>
            <CardHeader>
              <h3 className="text-title-sm">Assertion {index + 2}</h3>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <AssertionFields assertion={assertion} />
            </CardContent>
          </Card>
          <Attributes assertion={assertion} />
        </React.Fragment>
      ))}

      {result.kind && (
        <Card>
          <CardHeader>
            <h3 className="text-title-sm">Signatures</h3>
            <p className="text-body-sm text-on-surface-muted">{UNVERIFIED}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {messageLabel && <SignatureFields title={messageLabel} signature={result.signature} />}
            {result.assertions.map((assertion, index) => (
              <SignatureFields
                key={assertion.id ?? index}
                title={result.assertions.length > 1 ? `Assertion ${index + 1} signature` : 'Assertion signature'}
                signature={assertion.signature}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <div className="min-w-0">
              <h3 className="text-title-sm">XML</h3>
              <p className="text-body-sm text-on-surface-muted">Re-indented for reading. The bytes that were signed are not these.</p>
            </div>
            <CopyButton value={xml} variant="outline" size="sm">
              Copy XML
            </CopyButton>
          </div>
        </CardHeader>
        <CardContent>
          <XmlView lines={lines} />
        </CardContent>
      </Card>
    </div>
  );
}
