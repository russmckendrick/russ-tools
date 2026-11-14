import React, { useMemo } from 'react';
import { CircleAlert, Info, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { Ghost } from '@/components/ui/ghost';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ValueList, ValueRow } from '@/components/ui/value-list';
import {
  SAMPLE_URL,
  addParam,
  buildUrl,
  checkUrl,
  describeUrl,
  editParam,
  editPart,
  readUrl,
  removeParam,
  summarise,
} from './lib/url.js';

const PLAIN = { spellCheck: false, autoCapitalize: 'off', autoCorrect: 'off', autoComplete: 'off' };
const noop = () => {};

function Prose({ children }) {
  return String(children)
    .split('`')
    .map((piece, index) =>
      index % 2 === 1 ? (
        <code key={index} className="font-mono text-data-sm text-on-surface [overflow-wrap:anywhere]">
          {piece}
        </code>
      ) : (
        <React.Fragment key={index}>{piece}</React.Fragment>
      )
    );
}

function PartRow({ id, label, value, onChange, placeholder, hint }) {
  return (
    <div className="grid gap-x-4 gap-y-1 py-2 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center">
      <Label htmlFor={id} className="text-body-sm text-on-surface-muted">
        {label}
      </Label>
      <div className="min-w-0">
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          {...PLAIN}
        />
        {hint ? <p className="mt-1 text-body-sm text-on-surface-muted">{hint}</p> : null}
      </div>
    </div>
  );
}

function Parts({ parts, url, credentials, onPart, onParam, onAdd, onRemove }) {
  return (
    <Card emphasis>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div>
          <CardTitle>Parts</CardTitle>
          <CardDescription>Shown decoded. Edit any of them and the URL above is rebuilt.</CardDescription>
        </div>
        <CopyButton value={url} variant="outline" size="sm">
          Copy URL
        </CopyButton>
      </CardHeader>
      <CardContent className="py-2">
        <div className="divide-y divide-outline">
          <PartRow id="url-scheme" label="Scheme" value={parts.scheme} onChange={(text) => onPart('scheme', text)} />
          {credentials ? (
            <>
              <PartRow
                id="url-username"
                label="User name"
                value={parts.username.text}
                onChange={(text) => onPart('username', text)}
              />
              <PartRow
                id="url-password"
                label="Password"
                value={parts.password.text}
                onChange={(text) => onPart('password', text)}
              />
            </>
          ) : null}
          <PartRow id="url-host" label="Host" value={parts.host} onChange={(text) => onPart('host', text)} />
          <PartRow
            id="url-port"
            label="Port"
            value={parts.port}
            onChange={(text) => onPart('port', text)}
            placeholder="Default for the scheme"
          />
          <PartRow
            id="url-path"
            label="Path"
            value={parts.path.text}
            onChange={(text) => onPart('path', text)}
            hint={
              /%(?:2F|3F|23|25)/i.test(parts.path.text)
                ? 'An escaped slash, question mark, hash or percent sign stays escaped here, because decoding it would change where the path ends.'
                : null
            }
          />
          <div className="py-3">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <h4 className="text-body-sm text-on-surface-muted">
                Query parameters <span className="font-mono text-data-sm">{parts.params.length}</span>
              </h4>
              <Button type="button" variant="outline" size="sm" onClick={onAdd}>
                <Plus aria-hidden="true" /> Add parameter
              </Button>
            </div>
            {parts.params.length > 0 ? (
              <ol className="mt-2 space-y-3 sm:space-y-2">
                {parts.params.map((param, index) => (
                  <li
                    key={param.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto]"
                  >
                    <Input
                      value={param.key}
                      onChange={(event) => onParam(param.id, 'key', event.target.value)}
                      aria-label={`Name of parameter ${index + 1}`}
                      placeholder="name"
                      {...PLAIN}
                    />
                    <Input
                      value={param.value}
                      onChange={(event) => onParam(param.id, 'value', event.target.value)}
                      aria-label={`Value of parameter ${index + 1}`}
                      placeholder={param.hasEquals ? 'empty value' : 'no value'}
                      className="col-start-1 row-start-2 sm:col-start-2 sm:row-start-1"
                      {...PLAIN}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="col-start-2 row-start-1 sm:col-start-3"
                      onClick={() => onRemove(param.id)}
                      aria-label={`Remove parameter ${index + 1}`}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-body-sm text-on-surface-muted">This URL has no query string.</p>
            )}
          </div>
          <PartRow
            id="url-fragment"
            label="Fragment"
            value={parts.fragment.text}
            onChange={(text) => onPart('fragment', text)}
            placeholder="None"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Checks({ checks }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Checks</CardTitle>
        <CardDescription>
          {checks.length === 0
            ? 'Nothing commonly wrong was found.'
            : 'What is commonly wrong with a URL, looked for by pattern and by name.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="py-2">
        {checks.length === 0 ? (
          <p className="py-2 text-body-sm text-on-surface-muted">
            No embedded credentials, double-encoding, unencoded characters or secret-looking parameter names. These
            checks read the text of the URL only: they do not say where it leads or whether it is safe to open.
          </p>
        ) : (
          <ul className="divide-y divide-outline">
            {checks.map((check) => (
              <li key={check.id} className="grid gap-x-4 gap-y-1 py-3 sm:grid-cols-[6.5rem_minmax(0,1fr)]">
                <div>
                  {check.level === 'warning' ? (
                    <Badge variant="warning">
                      <CircleAlert aria-hidden="true" /> Check
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <Info aria-hidden="true" /> Note
                    </Badge>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-body-md text-on-surface">{check.title}</h4>
                  <p className="text-body-sm text-on-surface-muted">
                    <Prose>{check.detail}</Prose>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function Forms({ url, description }) {
  if (!description.valid) return null;
  const changed = description.href !== url;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Other forms</CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <ValueList>
          <ValueRow
            label="As a browser sends it"
            value={description.href}
            copyValue={description.href}
            note={
              changed
                ? 'Differs from the URL above: a browser lower-cases the scheme and host, drops a default port and encodes what is not already encoded.'
                : 'The same as the URL above.'
            }
          />
          {description.origin ? (
            <ValueRow label="Origin" value={description.origin} copyValue={description.origin} />
          ) : null}
          {description.international ? (
            <>
              <ValueRow
                label="Host in ASCII"
                value={description.asciiHost}
                copyValue={description.asciiHost}
                note="The punycode form, which is what DNS and certificates use."
              />
              <ValueRow label="Host in Unicode" value={description.unicodeHost} copyValue={description.unicodeHost} />
            </>
          ) : null}
        </ValueList>
      </CardContent>
    </Card>
  );
}

const GHOST = readUrl(SAMPLE_URL);

export function ParseView({ state, onChange }) {
  const { text, result, parts, credentials } = state;
  const url = text.trim();
  const description = useMemo(() => (parts ? describeUrl(url) : { valid: false }), [parts, url]);
  const checks = useMemo(() => (parts ? checkUrl(parts) : []), [parts]);
  const failed = !result.ok && !result.empty;

  const apply = (next) => onChange({ ...state, parts: next, text: buildUrl(next) });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <Label htmlFor="url-input">URL</Label>
            <Button type="button" variant="outline" size="sm" onClick={() => onChange(readUrl(SAMPLE_URL))}>
              Load a sample
            </Button>
          </div>
          <Textarea
            id="url-input"
            value={text}
            onChange={(event) => onChange(readUrl(event.target.value))}
            rows={3}
            placeholder="https://example.com/path?name=value#section"
            aria-invalid={failed}
            aria-describedby="url-note"
            className="[overflow-wrap:anywhere]"
            {...PLAIN}
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p
              id="url-note"
              role="status"
              className={failed ? 'text-body-sm text-danger' : 'text-body-sm text-on-surface-muted'}
            >
              {parts
                ? summarise(parts, description)
                : failed
                  ? result.error
                  : 'Paste a URL to split it into its parts. It is read in this browser and goes nowhere.'}
            </p>
            {result.suggestion ? (
              <Button type="button" variant="outline" size="sm" onClick={() => onChange(readUrl(result.suggestion))}>
                Read it with https://
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {parts ? (
        <>
          <Parts
            parts={parts}
            url={url}
            credentials={credentials}
            onPart={(name, value) => apply(editPart(parts, name, value))}
            onParam={(id, name, value) => apply(editParam(parts, id, name, value))}
            onAdd={() => apply(addParam(parts))}
            onRemove={(id) => apply(removeParam(parts, id))}
          />
          <Checks checks={checks} />
          <Forms url={url} description={description} />
        </>
      ) : (
        <Ghost>
          <Parts
            parts={GHOST.parts}
            url={SAMPLE_URL}
            credentials={false}
            onPart={noop}
            onParam={noop}
            onAdd={noop}
            onRemove={noop}
          />
        </Ghost>
      )}
    </div>
  );
}
