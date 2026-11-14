import React, { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Copy, FileUp, FlaskConical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Ghost } from '@/components/ui/ghost';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { copyText } from '@/core';
import { textResult, useWebMCPTool } from '@/lib/useWebMCPTool';
import { cn } from '@/lib/utils';
import Results, { Findings } from './components/Results.jsx';
import SAMPLE from './fixtures/chain.pem?raw';
import { decodeAll, decodeSync, toPlain } from './lib/decode.js';
import { MAX_PEM_LENGTH, bytesToText, fromFragment, splitPem, toPem } from './lib/pem.js';

const DECODE_CERTIFICATE_TOOL = {
  name: 'decode_certificate',
  description:
    'Decode PEM X.509 certificates, a certificate chain or a PKCS#10 certificate signing request locally. ' +
    'Returns subject, issuer, alternative names, validity, key and signature algorithms, usages, fingerprints ' +
    'and revocation URLs, with a chain ordered leaf to root and broken links or expiry flagged. ' +
    'Signatures are not verified and private keys are ignored.',
  inputSchema: {
    type: 'object',
    properties: {
      pem: {
        type: 'string',
        description: 'One or more PEM blocks: CERTIFICATE or CERTIFICATE REQUEST',
      },
    },
    required: ['pem'],
  },
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  execute: async ({ pem }) => {
    try {
      return textResult(toPlain(await decodeAll(String(pem ?? ''))));
    } catch (error) {
      return textResult({ error: error.message });
    }
  },
};

const GHOST_PRINT = Array.from({ length: 32 }, () => '00').join(':');
const GHOST_RESULT = (() => {
  const leaf = toPem('certificate', splitPem(SAMPLE)[0].base64);
  const result = decodeSync(leaf, Date.parse('2027-06-01T00:00:00Z'));
  return {
    ...result,
    certificates: result.certificates.map((certificate) => ({
      ...certificate,
      fingerprints: { sha256: GHOST_PRINT, sha1: GHOST_PRINT.slice(0, 59) },
    })),
  };
})();

const MAX_FILE_BYTES = 1024 * 1024;

const fromLocation = () =>
  typeof window !== 'undefined' && window.location.hash.startsWith('#pem=')
    ? fromFragment(window.location.hash.slice(5))
    : '';

export default function CertDecoder() {
  useWebMCPTool(DECODE_CERTIFICATE_TOOL);
  const [text, setText] = useState(fromLocation);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!text.trim()) {
      setResult(null);
      return undefined;
    }
    let live = true;
    decodeAll(text).then((next) => live && setResult(next));
    return () => {
      live = false;
    };
  }, [text]);

  const readFiles = async (files) => {
    const parts = await Promise.all(
      files.map(async (file) => bytesToText(new Uint8Array(await file.arrayBuffer())))
    );
    const joined = parts.join('\n');
    if (joined.length > MAX_PEM_LENGTH) {
      toast.error('That file is too large to be a certificate');
      return;
    }
    setText(joined);
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    noClick: true,
    noKeyboard: true,
    maxSize: MAX_FILE_BYTES,
    onDropAccepted: readFiles,
    onDropRejected: () => toast.error('Files over 1 MB are not read'),
  });

  const copyPem = async (item) => {
    if (await copyText(toPem(item.kind, item.base64))) toast.success('PEM copied', { description: item.subject.displayName });
    else toast.error('Failed to copy');
  };

  const copyJson = async () => {
    if (await copyText(JSON.stringify(toPlain(result), null, 2))) toast.success('Decoded JSON copied');
    else toast.error('Failed to copy');
  };

  const decoded = result && (result.certificates.length > 0 || result.requests.length > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <div className="min-w-0">
              <h3 className="text-title-sm">Certificate, chain or CSR</h3>
              <p className="text-body-sm text-on-surface-muted">
                Decoded in this browser. Nothing is uploaded, and private keys are ignored.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setText(SAMPLE)}>
                <FlaskConical aria-hidden="true" />
                Load sample
              </Button>
              <Button variant="outline" size="sm" onClick={open}>
                <FileUp aria-hidden="true" />
                Open file
              </Button>
              <Button variant="outline" size="sm" onClick={() => setText('')} disabled={!text}>
                <Trash2 aria-hidden="true" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div {...getRootProps()} className="flex flex-col gap-2">
            <input {...getInputProps()} aria-label="Certificate or CSR file" />
            <Label htmlFor="cert-decoder-pem">PEM text</Label>
            <Textarea
              id="cert-decoder-pem"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={9}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              className={cn('text-data-sm', isDragActive && 'border-primary bg-surface-inset')}
              placeholder={'-----BEGIN CERTIFICATE-----\nMIIF…\n-----END CERTIFICATE-----'}
            />
            <p className="text-body-sm text-on-surface-faint">
              {isDragActive
                ? 'Drop the file to decode it.'
                : 'Paste one or more PEM blocks, or drop a .pem, .crt, .cer, .der or .csr file here.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {result?.problems.length > 0 && (
        <div className="flex flex-col gap-3">
          <Findings findings={result.problems} />
        </div>
      )}

      {!text.trim() && (
        <Ghost>
          <Results result={GHOST_RESULT} onCopy={() => {}} />
        </Ghost>
      )}

      {decoded && (
        <div className="rt-arrive flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <p className="text-body-sm text-on-surface-muted">
              {summary(result)}
            </p>
            <Button variant="outline" size="sm" onClick={copyJson}>
              <Copy aria-hidden="true" />
              Copy as JSON
            </Button>
          </div>
          <Results result={result} onCopy={copyPem} />
        </div>
      )}
    </div>
  );
}

function summary({ certificates, requests }) {
  const count = (items, word) => `${items.length} ${word}${items.length === 1 ? '' : 's'}`;
  return [
    certificates.length && count(certificates, 'certificate'),
    requests.length && count(requests, 'signing request'),
  ]
    .filter(Boolean)
    .join(' and ') + ' decoded';
}
