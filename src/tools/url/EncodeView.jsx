import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ghost } from '@/components/ui/ghost';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ValueList, ValueRow } from '@/components/ui/value-list';
import { decodeForms, encodeForms } from './lib/encoding.js';
import { hostnameIn } from './lib/punycode.js';

const GHOST_TEXT = 'name=Zoë Müller&team=R&D';
const CANNOT_ENCODE = 'Cannot be encoded: the text holds half of a surrogate pair.';

function Encoded({ text }) {
  const forms = useMemo(() => encodeForms(text), [text]);
  const row = (form) => (form.ok ? { value: form.value, copyValue: form.value } : { value: CANNOT_ENCODE, mono: false });
  return (
    <Card emphasis>
      <CardHeader>
        <CardTitle>Encoded</CardTitle>
        <CardDescription>The same text three ways. Which one is right depends on where it is going.</CardDescription>
      </CardHeader>
      <CardContent className="py-2">
        <ValueList>
          <ValueRow
            label="encodeURIComponent"
            {...row(forms.component)}
            note="For one value: a query parameter or a single path segment. Escapes / ? & = and #."
          />
          <ValueRow
            label="encodeURI"
            {...row(forms.uri)}
            note="For a whole URL: leaves : / ? # & = + and the other separators as they are."
          />
          <ValueRow
            label="Form encoding"
            {...row(forms.form)}
            note="As encodeURIComponent, with a space written as +. What an HTML form puts in a query."
          />
        </ValueList>
      </CardContent>
    </Card>
  );
}

function Decoded({ text }) {
  const forms = useMemo(() => decodeForms(text), [text]);
  const problems = [
    forms.malformed ? 'a % that does not start an escape' : null,
    forms.invalid.length > 0 ? `escapes that are not UTF-8 (${[...new Set(forms.invalid)].join(', ')})` : null,
  ].filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Decoded</CardTitle>
        <CardDescription>
          {problems.length > 0
            ? `This text has ${problems.join(' and ')}. decodeURIComponent throws on it, so it is decoded as far as it can be and the rest is left as written.`
            : forms.changed || text.includes('+')
              ? 'Read as percent-encoded text.'
              : 'Nothing to decode: there are no percent escapes here.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="py-2">
        <ValueList>
          <ValueRow
            label="decodeURIComponent"
            value={forms.component.value}
            copyValue={forms.component.value}
            note="Decodes every escape."
          />
          {forms.uri.ok ? (
            <ValueRow
              label="decodeURI"
              value={forms.uri.value}
              copyValue={forms.uri.value}
              note="Leaves the escapes of separators such as %2F, %3F and %26 in place, so a URL keeps its shape."
            />
          ) : null}
          <ValueRow
            label="Form decoding"
            value={forms.form.value}
            copyValue={forms.form.value}
            note="Decodes every escape and reads + as a space."
          />
        </ValueList>
      </CardContent>
    </Card>
  );
}

export function EncodeView({ text, onChange }) {
  const host = useMemo(() => hostnameIn(text), [text]);
  const empty = text.length === 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-2">
          <Label htmlFor="url-text">Text</Label>
          <Textarea
            id="url-text"
            value={text}
            onChange={(event) => onChange(event.target.value)}
            rows={4}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder="Text to encode, or percent-encoded text to decode"
          />
          <p className="text-body-sm text-on-surface-muted">
            Both directions are shown at once, as you type. A hostname with letters outside ASCII, or one starting
            xn--, also gets its punycode and Unicode forms.
          </p>
        </CardContent>
      </Card>

      {empty ? (
        <Ghost>
          <Encoded text={GHOST_TEXT} />
        </Ghost>
      ) : (
        <>
          {host ? (
            <Card>
              <CardHeader>
                <CardTitle>Hostname</CardTitle>
                <CardDescription>An internationalised name has two spellings that mean the same host.</CardDescription>
              </CardHeader>
              <CardContent className="py-2">
                <ValueList>
                  <ValueRow
                    label="ASCII (punycode)"
                    value={host.ascii}
                    copyValue={host.ascii}
                    note="What DNS, certificates and most configuration files need."
                  />
                  <ValueRow label="Unicode" value={host.unicode} copyValue={host.unicode} note="What a browser shows." />
                </ValueList>
              </CardContent>
            </Card>
          ) : null}
          <Encoded text={text} />
          <Decoded text={text} />
        </>
      )}
    </div>
  );
}
