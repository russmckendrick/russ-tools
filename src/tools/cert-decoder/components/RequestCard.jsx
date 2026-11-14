import React from 'react';
import { Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  ExtendedUsageValue,
  Field,
  Fields,
  KeyUsageValue,
  KeyValue,
  Names,
  SignatureValue,
  Title,
  Words,
} from './fields.jsx';

export default function RequestCard({ request, emphasis = false, onCopy }) {
  return (
    <Card emphasis={emphasis}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <Title text={request.subject.displayName} />
            <Badge>Signing request</Badge>
          </div>
          <Button size="sm" variant="outline" onClick={() => onCopy(request)}>
            <Copy aria-hidden="true" />
            Copy PEM
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Fields>
          <Field label="Subject">
            <Words text={request.subject.dn || 'Empty'} />
          </Field>
          <Field label="Requested names">
            <Names names={request.sans} />
          </Field>
          <Field label="Public key">
            <KeyValue publicKey={request.key} />
          </Field>
          <Field label="Signature algorithm">
            <SignatureValue algorithm={request.signatureAlgorithm} />
          </Field>
          {request.keyUsage && (
            <Field label="Requested key usage">
              <KeyUsageValue usage={request.keyUsage} />
            </Field>
          )}
          {request.extendedKeyUsage.length > 0 && (
            <Field label="Requested extended usage">
              <ExtendedUsageValue usages={request.extendedKeyUsage} />
            </Field>
          )}
        </Fields>
      </CardContent>
    </Card>
  );
}
