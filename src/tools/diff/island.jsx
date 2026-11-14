import React, { useDeferredValue, useEffect, useId, useMemo, useState } from 'react';
import { ArrowLeftRight, CircleAlert, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { Ghost } from '@/components/ui/ghost';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useWebMCPTool, textResult } from '@/lib/useWebMCPTool';
import { SplitView, UnifiedView } from './DiffView.jsx';
import { MAX_CHARS, MAX_LINES, bothJson, diffText, prepare } from './lib/diff.js';
import { SAMPLE } from './lib/sample.js';
import { toUnified } from './lib/unified.js';

const DIFF_TEXT_TOOL = {
  name: 'diff_text',
  description:
    'Compare two texts line by line with the Myers algorithm and return the counts of added and removed lines ' +
    'and a unified diff. Can ignore whitespace and case, and can sort keys and re-indent both sides first when ' +
    `both are JSON. Limited to ${MAX_LINES.toLocaleString('en-GB')} lines a side.`,
  inputSchema: {
    type: 'object',
    properties: {
      original: { type: 'string', description: 'The text before' },
      changed: { type: 'string', description: 'The text after' },
      ignoreWhitespace: { type: 'boolean', description: 'Ignore indentation, trailing space and runs of spaces' },
      ignoreCase: { type: 'boolean', description: 'Compare letters without regard to case' },
      normaliseJson: { type: 'boolean', description: 'When both sides parse as JSON, sort keys and re-indent first' },
    },
    required: ['original', 'changed'],
  },
  annotations: { readOnlyHint: true },
  execute: ({ original, changed, ignoreWhitespace = false, ignoreCase = false, normaliseJson = false }) => {
    const prepared = prepare(String(original ?? ''), String(changed ?? ''), { normaliseJson });
    const result = diffText(prepared.left, prepared.right, { ignoreWhitespace, ignoreCase });
    if (!result.ok) return textResult({ error: result.error });
    return textResult({
      identical: result.identical,
      additions: result.additions,
      deletions: result.deletions,
      jsonNormalised: prepared.normalised,
      minimal: !result.approximate,
      unified: toUnified(result),
    });
  },
};

const WIDE = '(min-width: 768px)';
const plural = (count) => (count === 1 ? '1 line' : `${count.toLocaleString('en-GB')} lines`);
const PLAIN = { spellCheck: false, autoCapitalize: 'off', autoCorrect: 'off' };

function useWide() {
  const [wide, setWide] = useState(true);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const list = window.matchMedia(WIDE);
    const sync = () => setWide(list.matches);
    sync();
    list.addEventListener('change', sync);
    return () => list.removeEventListener('change', sync);
  }, []);
  return wide;
}

function Option({ label, hint, checked, onChange }) {
  const id = useId();
  return (
    <div className="flex items-start gap-2.5">
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="mt-0.5" />
      <div className="min-w-0">
        <Label htmlFor={id} className="leading-normal text-on-surface">
          {label}
        </Label>
        {hint ? <p className="text-body-sm text-on-surface-muted">{hint}</p> : null}
      </div>
    </div>
  );
}

function Notes({ result, normalised }) {
  const notes = [];
  if (normalised) notes.push('Both sides were parsed as JSON, their keys sorted and the result re-indented before comparing, so the line numbers are those of the normalised text.');
  if (result.approximate) notes.push('The two texts differ so much that the search for the smallest diff was cut short. What is shown is correct, but a changed region may be larger than it needs to be.');
  if (result.left.crlf !== result.right.crlf) {
    notes.push(`The ${result.left.crlf ? 'original' : 'changed'} text uses Windows (CRLF) line endings and the other does not. Line endings are not compared.`);
  }
  if (notes.length === 0) return null;
  return (
    <ul className="space-y-1 border-b border-outline px-4 py-3">
      {notes.map((note) => (
        <li key={note} className="flex items-start gap-2 text-body-sm text-on-surface-muted">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{note}</span>
        </li>
      ))}
    </ul>
  );
}

function Result({ result, normalised, view, onView, collapse, wide }) {
  const split = wide && view === 'split';
  return (
    <Card emphasis>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Differences</CardTitle>
          {result.identical ? (
            <Badge variant="success">Identical</Badge>
          ) : (
            <>
              <Badge variant="success">
                <span aria-hidden="true">+{result.additions.toLocaleString('en-GB')}</span>
                <span className="sr-only">{plural(result.additions)} added</span>
              </Badge>
              <Badge variant="destructive">
                <span aria-hidden="true">-{result.deletions.toLocaleString('en-GB')}</span>
                <span className="sr-only">{plural(result.deletions)} removed</span>
              </Badge>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Tabs value={split ? 'split' : 'unified'} onValueChange={onView} className="hidden md:block">
            <TabsList className="w-auto shadow-none">
              <TabsTrigger value="unified">Unified</TabsTrigger>
              <TabsTrigger value="split">Side by side</TabsTrigger>
            </TabsList>
          </Tabs>
          <CopyButton value={() => toUnified(result)} variant="outline" size="sm" disabled={result.identical}>
            Copy as unified diff
          </CopyButton>
        </div>
      </CardHeader>
      <Notes result={result} normalised={normalised} />
      {result.identical ? (
        <p className="px-4 py-4 text-body-sm text-on-surface-muted">
          {result.left.count === 0
            ? 'Both sides are empty.'
            : `No differences in ${plural(result.left.count)} with these options.`}
        </p>
      ) : split ? (
        <SplitView result={result} collapse={collapse} />
      ) : (
        <UnifiedView result={result} collapse={collapse} />
      )}
    </Card>
  );
}

const GHOST = diffText(SAMPLE.left, SAMPLE.right);

const DiffTool = () => {
  useWebMCPTool(DIFF_TEXT_TOOL);
  const [left, setLeft] = useState(SAMPLE.left);
  const [right, setRight] = useState(SAMPLE.right);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [normaliseJson, setNormaliseJson] = useState(true);
  const [collapse, setCollapse] = useState(true);
  const [view, setView] = useState('unified');
  const wide = useWide();

  const leftNow = useDeferredValue(left);
  const rightNow = useDeferredValue(right);
  const tooLong = leftNow.length > MAX_CHARS || rightNow.length > MAX_CHARS;
  const jsonOffered = useMemo(() => !tooLong && bothJson(leftNow, rightNow), [leftNow, rightNow, tooLong]);
  const prepared = useMemo(
    () => prepare(leftNow, rightNow, { normaliseJson: normaliseJson && jsonOffered }),
    [leftNow, rightNow, normaliseJson, jsonOffered]
  );
  const result = useMemo(
    () => diffText(prepared.left, prepared.right, { ignoreWhitespace, ignoreCase }),
    [prepared, ignoreWhitespace, ignoreCase]
  );
  const empty = left === '' && right === '';

  const swap = () => {
    setLeft(right);
    setRight(left);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="diff-left">Original</Label>
              <Textarea
                id="diff-left"
                value={left}
                onChange={(event) => setLeft(event.target.value)}
                rows={10}
                placeholder="Paste the text as it was"
                className="whitespace-pre"
                {...PLAIN}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diff-right">Changed</Label>
              <Textarea
                id="diff-right"
                value={right}
                onChange={(event) => setRight(event.target.value)}
                rows={10}
                placeholder="Paste the text as it is now"
                className="whitespace-pre"
                {...PLAIN}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={swap}>
              <ArrowLeftRight aria-hidden="true" /> Swap sides
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setLeft(SAMPLE.left);
                setRight(SAMPLE.right);
              }}
            >
              Load the sample
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={empty}
              onClick={() => {
                setLeft('');
                setRight('');
              }}
            >
              Clear both
            </Button>
          </div>
          <div className="grid gap-x-8 gap-y-3 border-t border-outline pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <Option
              label="Ignore whitespace"
              hint="Indentation, trailing space and the width of gaps."
              checked={ignoreWhitespace}
              onChange={setIgnoreWhitespace}
            />
            <Option label="Ignore case" hint="A and a compare as equal." checked={ignoreCase} onChange={setIgnoreCase} />
            <Option
              label="Collapse unchanged lines"
              hint="Keep three lines round each change."
              checked={collapse}
              onChange={setCollapse}
            />
            {jsonOffered ? (
              <Option
                label="Normalise JSON before diffing"
                hint="Both sides are JSON: sort keys and re-indent, so only real changes show."
                checked={normaliseJson}
                onChange={setNormaliseJson}
              />
            ) : null}
          </div>
        </CardContent>
      </Card>

      {!result.ok ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Too large to compare here</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      ) : empty ? (
        <Ghost>
          <Result result={GHOST} normalised={false} view="unified" onView={() => {}} collapse wide={false} />
        </Ghost>
      ) : (
        <Result
          result={result}
          normalised={prepared.normalised}
          view={view}
          onView={setView}
          collapse={collapse}
          wide={wide}
        />
      )}
    </div>
  );
};

export default DiffTool;
