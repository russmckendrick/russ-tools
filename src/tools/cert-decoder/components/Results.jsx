import React from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import CertificateCard from './CertificateCard.jsx';
import ChainDiagram from './ChainDiagram.jsx';
import RequestCard from './RequestCard.jsx';

const VARIANT = { success: 'success', warning: 'warning', error: 'destructive', info: 'info' };
const ICON = { success: CheckCircle2, warning: TriangleAlert, error: AlertCircle, info: Info };
const CHAIN_STATE = {
  success: 'links up',
  info: 'links up',
  warning: 'needs attention',
  error: 'has a fault',
};

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

export default function Results({ result, onCopy }) {
  const { certificates, requests, chain } = result;
  const isChain = certificates.length > 1;

  return (
    <div className="flex flex-col gap-4">
      {isChain && (
        <Card emphasis>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <div className="min-w-0">
                <h3 className="text-title-sm">Certificate chain</h3>
                <p className="text-body-sm text-on-surface-muted">
                  {certificates.length} certificates, ordered leaf to root
                </p>
              </div>
              <Badge variant={VARIANT[chain.status]}>{CHAIN_STATE[chain.status]}</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ChainDiagram certificates={certificates} links={chain.links} />
            <Findings findings={chain.findings} />
          </CardContent>
        </Card>
      )}
      {!isChain && <Findings findings={chain.findings} />}
      {certificates.map((certificate, index) => (
        <CertificateCard
          key={certificate.base64}
          certificate={certificate}
          emphasis={!isChain && index === 0}
          onCopy={onCopy}
        />
      ))}
      {requests.map((request, index) => (
        <RequestCard
          key={request.base64}
          request={request}
          emphasis={!certificates.length && index === 0}
          onCopy={onCopy}
        />
      ))}
    </div>
  );
}
