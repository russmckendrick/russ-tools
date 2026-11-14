import React, { useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWebMCPTool, textResult } from '@/lib/useWebMCPTool';
import { EncodeView } from './EncodeView.jsx';
import { ParseView } from './ParseView.jsx';
import { decodeForms, encodeForms } from './lib/encoding.js';
import { buildUrl, checkUrl, describeUrl, parseUrl, readUrl, toPlain } from './lib/url.js';

const PARSE_URL_TOOL = {
  name: 'parse_url',
  description:
    'Split a URL into scheme, credentials, host, port, path, query parameters and fragment, all decoded, and ' +
    'list what is commonly wrong with it: embedded credentials, double-encoding, unencoded characters and ' +
    'query names that look like secrets (matched by name only, values are not inspected).',
  inputSchema: {
    type: 'object',
    properties: { url: { type: 'string', description: 'An absolute URL, scheme included' } },
    required: ['url'],
  },
  annotations: { readOnlyHint: true },
  execute: ({ url }) => {
    const result = parseUrl(String(url ?? ''));
    if (!result.ok) return textResult({ error: result.error ?? 'No URL given.' });
    const description = describeUrl(buildUrl(result.parts));
    return textResult({
      parts: toPlain(result.parts),
      checks: checkUrl(result.parts).map(({ level, title, detail }) => ({ level, title, detail })),
      valid: description.valid,
      asBrowserSendsIt: description.href ?? null,
      asciiHost: description.asciiHost ?? null,
      unicodeHost: description.unicodeHost ?? null,
    });
  },
};

const ENCODE_URL_TEXT_TOOL = {
  name: 'url_encode_decode',
  description:
    'Percent-encode or decode text. Encoding returns the encodeURIComponent, encodeURI and form-encoded ' +
    '(+ for space) results; decoding returns the decodeURIComponent, decodeURI and form-decoded results.',
  inputSchema: {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'The text to encode or decode' },
      operation: { type: 'string', enum: ['encode', 'decode'], description: 'Defaults to encode' },
    },
    required: ['text'],
  },
  annotations: { readOnlyHint: true },
  execute: ({ text, operation = 'encode' }) => {
    const value = String(text ?? '');
    const forms = operation === 'decode' ? decodeForms(value) : encodeForms(value);
    return textResult({
      operation: operation === 'decode' ? 'decode' : 'encode',
      component: forms.component.value,
      uri: forms.uri.value,
      form: forms.form.value,
      strict: forms.component.ok,
    });
  },
};

function fromFragment() {
  if (typeof window === 'undefined') return '';
  const match = /^#url=(.+)$/s.exec(window.location.hash);
  if (!match) return '';
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function fromPath(pathname, fallback) {
  const match = /^\/url\/(.+)$/s.exec(pathname);
  if (!match) return fallback;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return fallback ?? match[1];
  }
}

const UrlTool = () => {
  useWebMCPTool(PARSE_URL_TOOL);
  useWebMCPTool(ENCODE_URL_TEXT_TOOL);
  const { input } = useParams();
  const { pathname } = useLocation();
  const [linked] = useState(() => fromPath(pathname, input) ?? fromFragment());
  const [linkedIsUrl] = useState(() => !linked || parseUrl(linked).ok);
  const [mode, setMode] = useState(linkedIsUrl ? 'parse' : 'encode');
  const [state, setState] = useState(() => readUrl(linkedIsUrl ? linked : ''));
  const [text, setText] = useState(linkedIsUrl ? '' : linked);

  return (
    <Tabs value={mode} onValueChange={setMode} className="space-y-4">
      <TabsList>
        <TabsTrigger value="parse">Parse</TabsTrigger>
        <TabsTrigger value="encode">Encode and decode</TabsTrigger>
      </TabsList>
      <TabsContent value="parse">
        <ParseView state={state} onChange={setState} />
      </TabsContent>
      <TabsContent value="encode">
        <EncodeView text={text} onChange={setText} />
      </TabsContent>
    </Tabs>
  );
};

export default UrlTool;
