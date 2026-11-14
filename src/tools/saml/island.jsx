import React, { useMemo, useState } from 'react';
import { AlertCircle, ChevronRight, FlaskConical, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { Ghost } from '@/components/ui/ghost';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { textResult, useWebMCPTool } from '@/lib/useWebMCPTool';
import SAMPLE_CERTIFICATE from '../cert-decoder/fixtures/leaf.pem?raw';
import { splitPem } from '../cert-decoder/lib/pem.js';
import Results from './components/Results.jsx';
import { toPlain } from './lib/parse.js';
import { sampleResponse } from './lib/sample.js';
import { readSaml, readSamlPlain } from './lib/saml.js';

const DECODE_SAML_TOOL = {
  name: 'decode_saml',
  description:
    'Decode a SAML 2.0 response, request or assertion locally, without uploading it. Accepts raw XML, base64 ' +
    '(POST binding), base64 over DEFLATE (redirect binding), URL-encoded values, or a whole redirect URL or form ' +
    'body. Returns issuer, subject and NameID format, audience, destination and recipient, validity window, ' +
    'authentication context, every attribute, signature and digest algorithms, which of the response and the ' +
    'assertion is signed, findings (expired, missing audience, SHA-1, unsigned) and the re-indented XML. ' +
    'Signatures are reported, not cryptographically verified.',
  inputSchema: {
    type: 'object',
    properties: {
      saml: { type: 'string', description: 'The SAMLResponse or SAMLRequest value, the XML, or the URL carrying it' },
    },
    required: ['saml'],
  },
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  execute: async ({ saml }) => {
    try {
      return textResult(readSamlPlain(String(saml ?? '')));
    } catch (error) {
      return textResult({ error: error.message });
    }
  },
};

const certificate = splitPem(SAMPLE_CERTIFICATE)[0]?.base64;
const sample = () => sampleResponse({ certificate });

const GHOST_READ = (() => {
  const read = readSaml(sample());
  const [assertion] = read.result.assertions;
  return {
    ...read,
    lines: read.lines.slice(0, 6),
    result: {
      ...read.result,
      findings: [],
      assertions: [{ ...assertion, attributes: assertion.attributes.slice(0, 3) }],
    },
  };
})();

export default function SamlDecoder() {
  useWebMCPTool(DECODE_SAML_TOOL);
  const [text, setText] = useState('');

  const read = useMemo(() => {
    try {
      return readSaml(text);
    } catch (error) {
      return { error: error.message || 'That could not be read' };
    }
  }, [text]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <div className="min-w-0">
              <h3 className="text-title-sm">SAML response, request or assertion</h3>
              <p className="text-body-sm text-on-surface-muted">Decoded in this browser. Nothing is uploaded or saved.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setText(sample())}>
                <FlaskConical aria-hidden="true" />
                Load sample
              </Button>
              <Button variant="outline" size="sm" onClick={() => setText('')} disabled={!text}>
                <Trash2 aria-hidden="true" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Label htmlFor="saml-input">SAML message</Label>
            <Textarea
              id="saml-input"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={8}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              className="text-data-sm [overflow-wrap:anywhere]"
              placeholder="PHNhbWxwOlJlc3BvbnNlIC4uLg== or <samlp:Response …>"
            />
            <p className="text-body-sm text-on-surface-faint">
              Paste the SAMLResponse or SAMLRequest value from a browser trace, the whole redirect URL or form
              body, or the XML. Base64, DEFLATE and URL encoding are detected.
            </p>
            {read?.steps && (
              <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-body-sm text-on-surface-muted" aria-live="polite">
                <span>Read as</span>
                {read.steps.map((step, index) => (
                  <React.Fragment key={step}>
                    {index > 0 && <ChevronRight className="h-3 w-3 text-on-surface-faint" aria-hidden="true" />}
                    <Badge variant="secondary">{step}</Badge>
                  </React.Fragment>
                ))}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {read?.error && (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>That could not be decoded</AlertTitle>
          <AlertDescription>{read.error}</AlertDescription>
        </Alert>
      )}

      {!read && (
        <Ghost>
          <Results read={GHOST_READ} />
        </Ghost>
      )}

      {read?.result && (
        <div className="rt-arrive flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <p className="text-body-sm text-on-surface-muted">
              {read.result.kind ? `SAML ${read.result.kind.toLowerCase()} decoded` : 'XML decoded'}
            </p>
            <CopyButton value={() => JSON.stringify(toPlain(read.result), null, 2)} variant="outline" size="sm">
              Copy as JSON
            </CopyButton>
          </div>
          <Results read={read} />
        </div>
      )}
    </div>
  );
}
