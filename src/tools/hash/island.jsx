import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { AlertCircle, CircleCheck, CircleX, FileDigit, Upload, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useWebMCPTool, textResult } from '@/lib/useWebMCPTool';
import { cn } from '@/lib/utils';
import { MAX_FILE_BYTES, compareDigest, formatBytes, hashFile, hashText, utf8 } from './lib/hash.js';

const HASH_TEXT_TOOL = {
  name: 'hash_text',
  description:
    'Compute MD5, SHA-1, SHA-256, SHA-384 and SHA-512 digests of UTF-8 text, as hex and Base64. ' +
    'Pass a key to get HMAC digests instead. MD5 is not suitable for security.',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'The text to hash' },
      key: { type: 'string', description: 'Optional HMAC key, read as UTF-8 text' },
    },
    required: ['text'],
  },
  annotations: { readOnlyHint: true },
  execute: async ({ text, key = '' }) => {
    try {
      const digests = await hashText(String(text ?? ''), key);
      return textResult({
        mode: key ? 'hmac' : 'hash',
        digests: Object.fromEntries(digests.map(({ id, hex, base64 }) => [id, { hex, base64 }])),
      });
    } catch (error) {
      return textResult({ error: error.message });
    }
  },
};

const ENCODINGS = [
  { id: 'hex', label: 'Hex' },
  { id: 'base64', label: 'Base64' },
];

function DigestRow({ digest, hmac, matched }) {
  const name = hmac ? `HMAC-${digest.label}` : digest.label;
  return (
    <section
      aria-label={name}
      data-matched={matched ? '' : undefined}
      className={cn(
        'grid gap-x-6 gap-y-2 px-4 py-3 md:grid-cols-[10rem_minmax(0,1fr)]',
        matched && 'bg-success-subtle'
      )}
    >
      <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-start md:pt-1.5">
        <h4 className="font-mono text-data-md text-on-surface">{name}</h4>
        {digest.insecure ? <Badge variant="warning">Not for security</Badge> : null}
        {matched ? (
          <Badge variant="success">
            <CircleCheck aria-hidden="true" /> Match
          </Badge>
        ) : null}
      </div>
      <dl className="min-w-0">
        {ENCODINGS.map((encoding) => (
          <div key={encoding.id} className="flex items-center gap-3">
            <dt className="w-12 shrink-0 text-label-caps-sm uppercase text-on-surface-muted">
              {encoding.label}
            </dt>
            <dd className="flex min-w-0 flex-1 items-center justify-between gap-2">
              <span className="min-w-0 font-mono text-data-md text-on-surface [overflow-wrap:anywhere]">
                {digest[encoding.id]}
              </span>
              <CopyButton
                value={digest[encoding.id]}
                label={`Copy ${name} as ${encoding.label}`}
                className="h-8 w-8 shrink-0"
              />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const HashTool = () => {
  useWebMCPTool(HASH_TEXT_TOOL);
  const { input } = useParams();
  const [text, setText] = useState(input ?? '');
  const [file, setFile] = useState(null);
  const [key, setKey] = useState('');
  const [expected, setExpected] = useState('');
  const [digests, setDigests] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const live = () => !controller.signal.aborted;
    const run = async () => {
      try {
        const next = file
          ? await hashFile(file, {
              key,
              signal: controller.signal,
              onProgress: (fraction) => live() && setProgress(fraction),
            })
          : await hashText(text, key);
        if (!live() || !next) return;
        setDigests(next);
        setError(null);
      } catch (failure) {
        if (!live()) return;
        setDigests(null);
        setError(failure.message);
      } finally {
        if (live()) setProgress(null);
      }
    };
    const timer = setTimeout(run, file ? 150 : 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [text, file, key]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    multiple: false,
    noClick: true,
    noKeyboard: true,
    onDrop: (accepted) => {
      if (accepted.length === 0) return;
      setDigests(null);
      setError(null);
      setProgress(0);
      setFile(accepted[0]);
    },
  });

  const clearFile = () => {
    setDigests(null);
    setError(null);
    setFile(null);
  };

  const hmac = key.length > 0;
  const verdict = useMemo(() => compareDigest(expected, digests), [expected, digests]);
  const textBytes = useMemo(() => utf8(text).length, [text]);
  const source = file ? `${file.name}, ${formatBytes(file.size)}` : `UTF-8 text, ${formatBytes(textBytes)}`;
  const hashing = progress !== null;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <div
            {...getRootProps()}
            className={cn(
              'space-y-3 rounded-md',
              isDragActive && 'outline-dashed outline-2 outline-offset-4 outline-primary-text'
            )}
          >
            <input {...getInputProps()} aria-label="Choose a file to hash" />
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <Label htmlFor="hash-input">{file ? 'File' : 'Text'}</Label>
              <Button type="button" variant="outline" size="sm" onClick={open}>
                <Upload aria-hidden="true" /> {file ? 'Choose another file' : 'Choose a file'}
              </Button>
            </div>
            {file ? (
              <div className="flex items-center justify-between gap-3 rounded-md border border-outline-strong bg-surface-inset px-3 py-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <FileDigit aria-hidden="true" className="size-4 shrink-0 text-on-surface-muted" />
                  <div className="min-w-0">
                    <p className="font-mono text-data-md text-on-surface [overflow-wrap:anywhere]">{file.name}</p>
                    <p className="text-body-sm text-on-surface-muted">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={clearFile}
                  aria-label="Remove the file and hash text instead"
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <Textarea
                id="hash-input"
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={5}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                placeholder="Type or paste text, or drop a file anywhere in this panel"
              />
            )}
            {hashing ? (
              <div className="space-y-1.5" role="status">
                <Progress value={Math.round(progress * 100)} aria-label="Reading the file" />
                <p className="text-body-sm text-on-surface-muted">
                  Reading {Math.round(progress * 100)}% of {formatBytes(file?.size ?? 0)}
                </p>
              </div>
            ) : (
              <p className="text-body-sm text-on-surface-muted">
                {file
                  ? 'The file is read here in the browser and is not uploaded.'
                  : `Hashed as you type. Drop a file here to hash it instead, up to ${formatBytes(MAX_FILE_BYTES)}.`}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hash-key">HMAC key (optional)</Label>
              <Input
                id="hash-key"
                value={key}
                onChange={(event) => setKey(event.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                placeholder="Leave empty for a plain hash"
              />
              <p className="text-body-sm text-on-surface-muted">
                {hmac ? 'Keyed: every digest below is an HMAC. The key is read as UTF-8 text.' : 'A key switches every digest to HMAC.'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hash-expected">Compare against</Label>
              <Input
                id="hash-expected"
                value={expected}
                onChange={(event) => setExpected(event.target.value)}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                placeholder="Paste an expected digest, hex or Base64"
              />
              <p
                role="status"
                className={cn(
                  'flex items-start gap-1.5 text-body-sm',
                  verdict.status === 'match' && 'text-success',
                  verdict.status === 'none' && 'text-danger',
                  verdict.status === 'empty' && 'text-on-surface-muted'
                )}
              >
                {verdict.status === 'match' ? (
                  <>
                    <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    <span>
                      Match: it is the {hmac ? 'HMAC-' : ''}
                      {verdict.label} digest, in {verdict.encoding}.
                    </span>
                  </>
                ) : verdict.status === 'none' ? (
                  <>
                    <CircleX aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    <span>No match. {verdict.hint}</span>
                  </>
                ) : (
                  <span>Checked against all five digests, in either encoding.</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Could not hash this input</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {digests ? (
        <Card emphasis aria-busy={hashing}>
          <CardHeader>
            <CardTitle>{hmac ? 'HMAC digests' : 'Digests'}</CardTitle>
            <CardDescription className="[overflow-wrap:anywhere]">{source}</CardDescription>
          </CardHeader>
          <div className="divide-y divide-outline">
            {digests.map((digest) => (
              <DigestRow
                key={digest.id}
                digest={digest}
                hmac={hmac}
                matched={verdict.status === 'match' && verdict.id === digest.id}
              />
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
};

export default HashTool;
