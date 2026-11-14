import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CircleAlert, TimerOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToolAction } from '@/components/ui/tool-actions';
import { useWebMCPTool, textResult } from '@/lib/useWebMCPTool';
import { HighlightArea } from './HighlightArea.jsx';
import { MatchTable } from './MatchTable.jsx';
import { PATTERNS, PATTERNS_BY_ID, STARTER, sampleFor } from './lib/library.js';
import { FLAGS, MAX_TEXT, describeResult, toggleFlag } from './lib/regex.js';
import { createRunner } from './lib/runner.js';
import { MAX_LINK_LENGTH, decodeState, encodeState } from './lib/share.js';

let toolRunner = null;

const TEST_REGEX_TOOL = {
  name: 'test_regex',
  description:
    'Run an ECMAScript (JavaScript) regular expression against text and return every match with its numbered ' +
    'and named groups and their index ranges, plus the replaced text when a replacement is given. Matching is ' +
    'stopped after one second, so a pattern that backtracks catastrophically returns a timeout.',
  inputSchema: {
    type: 'object',
    properties: {
      pattern: { type: 'string', description: 'The pattern source, without the surrounding slashes' },
      flags: { type: 'string', description: 'Any of g, i, m, s, u, v, y. Defaults to g' },
      text: { type: 'string', description: 'The text to search' },
      replacement: { type: 'string', description: 'Optional replacement, using $1, $<name> and $&' },
    },
    required: ['pattern', 'text'],
  },
  annotations: { readOnlyHint: true },
  execute: async ({ pattern, flags = 'g', text, replacement }) => {
    toolRunner ??= createRunner();
    const result = await toolRunner.run({
      pattern: String(pattern ?? ''),
      flags: String(flags ?? ''),
      text: String(text ?? ''),
      replacement: typeof replacement === 'string' ? replacement : null,
    });
    if (result.timedOut) return textResult({ error: 'Stopped after one second: the pattern takes too long on this text.' });
    if (!result.ok) return textResult({ error: result.error ?? 'The pattern could not be run.' });
    return textResult({
      flavour: 'ECMAScript',
      flags: result.flags,
      total: result.total,
      truncated: result.truncated,
      matches: result.matches,
      replaced: result.replaced,
    });
  },
};

const EMPTY = [];
const FRESH = { pattern: STARTER.pattern, flags: STARTER.flags, text: STARTER.text, replacement: STARTER.replacement };

function initialState() {
  if (typeof window === 'undefined') return { state: FRESH, shared: false };
  const shared = decodeState(window.location.hash);
  return shared ? { state: shared, shared: true } : { state: FRESH, shared: false };
}

function FlagToggles({ flags, onToggle }) {
  return (
    <div role="group" aria-label="Flags" className="flex flex-wrap gap-2">
      {FLAGS.map((flag) => {
        const on = flags.includes(flag.id);
        return (
          <Button
            key={flag.id}
            type="button"
            size="sm"
            variant={on ? 'default' : 'outline'}
            aria-pressed={on}
            title={flag.hint}
            onClick={() => onToggle(flag.id)}
          >
            <span className="font-mono text-data-md">{flag.id}</span>
            <span>{flag.name}</span>
          </Button>
        );
      })}
    </div>
  );
}

const RegexTool = () => {
  useWebMCPTool(TEST_REGEX_TOOL);
  const [initial] = useState(initialState);
  const [state, setState] = useState(initial.state);
  const [touched, setTouched] = useState(initial.shared);
  const [view, setView] = useState(initial.shared && initial.state.replacement ? 'replace' : 'matches');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [linkable, setLinkable] = useState(true);
  const runner = useRef(null);

  const { pattern, flags, text, replacement } = state;
  const tooLong = text.length > MAX_TEXT;

  const update = (patch) => {
    setState((current) => ({ ...current, ...patch }));
    setTouched(true);
  };

  useEffect(() => {
    runner.current = createRunner();
    return () => runner.current.dispose();
  }, []);

  useEffect(() => {
    let live = true;
    setBusy(true);
    runner.current.run({ pattern, flags, text, replacement }).then((next) => {
      if (!live || next.superseded) return;
      setResult(next);
      setBusy(false);
    });
    return () => {
      live = false;
    };
  }, [pattern, flags, text, replacement]);

  useEffect(() => {
    if (!touched) return undefined;
    const timer = setTimeout(() => {
      const hash = encodeState({ pattern, flags, text, replacement });
      const fits = hash.length <= MAX_LINK_LENGTH;
      setLinkable(fits);
      window.history.replaceState(window.history.state, '', fits ? hash : window.location.pathname);
    }, 300);
    return () => clearTimeout(timer);
  }, [touched, pattern, flags, text, replacement]);

  const shareUrl = () => {
    const hash = encodeState({ pattern, flags, text, replacement });
    return `${window.location.origin}${window.location.pathname}${hash}`;
  };

  const load = (id) => {
    if (id === STARTER.id) {
      update(FRESH);
      return;
    }
    const entry = PATTERNS_BY_ID[id];
    update({ pattern: entry.pattern, flags: entry.flags, text: sampleFor(entry), replacement: '' });
  };

  const loaded = useMemo(
    () => [STARTER, ...PATTERNS].find((entry) => entry.pattern === pattern) ?? null,
    [pattern]
  );
  const good = result?.ok && !result.empty ? result : null;
  const matches = good && !tooLong ? good.matches : EMPTY;
  const failed = result && !result.ok && !result.timedOut;
  const status = tooLong
    ? `The test text is ${text.length.toLocaleString('en-GB')} characters. The limit is ${MAX_TEXT.toLocaleString('en-GB')}, so nothing is matched.`
    : failed
      ? result.error
      : result?.timedOut
        ? ''
        : pattern === ''
          ? 'Enter a pattern to see what it matches.'
          : describeResult(result);

  return (
    <div className="space-y-6">
      <ToolAction>
        <CopyButton value={shareUrl} variant="outline" size="sm" disabled={!linkable}>
          Copy link
        </CopyButton>
      </ToolAction>

      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_16rem]">
            <div className="space-y-2">
              <Label htmlFor="regex-pattern">Pattern</Label>
              <Input
                id="regex-pattern"
                value={pattern}
                onChange={(event) => update({ pattern: event.target.value })}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                placeholder="\d{1,3}(?:\.\d{1,3}){3}"
                aria-invalid={Boolean(failed)}
                aria-describedby="regex-flavour"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regex-library">Load a pattern</Label>
              <Select value={loaded?.id ?? ''} onValueChange={load}>
                <SelectTrigger id="regex-library">
                  <SelectValue placeholder="Your own pattern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={STARTER.id}>{STARTER.name}</SelectItem>
                  {PATTERNS.map((entry) => (
                    <SelectItem key={entry.id} value={entry.id}>
                      {entry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <FlagToggles flags={flags} onToggle={(flag) => update({ flags: toggleFlag(flags, flag) })} />
          <p id="regex-flavour" className="text-body-sm text-on-surface-muted">
            {loaded?.note ? `${loaded.note} ` : ''}
            This runs on the browser&apos;s own RegExp, so the flavour is ECMAScript (JavaScript). PCRE, .NET, Python
            and Go differ: there are no possessive quantifiers, atomic groups, conditionals, POSIX classes or \A and
            \Z here.
          </p>
        </CardContent>
      </Card>

      <Card aria-busy={busy}>
        <CardContent className="space-y-2">
          <Label htmlFor="regex-text">Test text</Label>
          <HighlightArea
            id="regex-text"
            value={text}
            onChange={(value) => update({ text: value })}
            matches={matches}
            placeholder="Text to search"
            aria-describedby="regex-status"
          />
          <p
            id="regex-status"
            role="status"
            className={failed || tooLong ? 'text-body-sm text-danger' : 'text-body-sm text-on-surface-muted'}
          >
            {status}
          </p>
          {!linkable ? (
            <p className="text-body-sm text-on-surface-muted">
              This is too much text to carry in a link, so the address bar is not updated and Copy link is off.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {result?.timedOut ? (
        <Alert variant="warning">
          <TimerOff aria-hidden="true" />
          <AlertTitle>Stopped after 1 second</AlertTitle>
          <AlertDescription>
            The pattern takes too long on this text, which usually means catastrophic backtracking: a repeated group
            whose contents can also repeat, such as (a+)+ or (\w+\s?)*, facing text that almost matches. Matching ran
            in a background worker, so it was stopped there and this page was never blocked.
          </AlertDescription>
        </Alert>
      ) : null}

      {failed && !tooLong ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>The pattern does not compile</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      ) : null}

      {good && !tooLong ? (
        <Card emphasis>
          <Tabs value={view} onValueChange={setView}>
            <CardHeader className="pb-0">
              <TabsList className="shadow-none">
                <TabsTrigger value="matches">
                  Matches <span className="font-mono text-data-sm">{good.total.toLocaleString('en-GB')}</span>
                </TabsTrigger>
                <TabsTrigger value="replace">Replace</TabsTrigger>
              </TabsList>
            </CardHeader>
            <TabsContent value="matches" className="mt-0">
              {good.total === 0 ? (
                <p className="px-4 py-4 text-body-sm text-on-surface-muted">
                  Nothing in the test text matches this pattern with these flags.
                </p>
              ) : (
                <MatchTable result={good} />
              )}
            </TabsContent>
            <TabsContent value="replace" className="mt-0">
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="regex-replacement">Replace each match with</Label>
                  <Input
                    id="regex-replacement"
                    value={replacement}
                    onChange={(event) => update({ replacement: event.target.value })}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    autoComplete="off"
                    placeholder="$1 or $<name>"
                  />
                  <p className="text-body-sm text-on-surface-muted">
                    $1 is the first group, $&lt;name&gt; a named group, $&amp; the whole match and $$ a dollar sign.
                    {flags.includes('g') ? '' : ' Without the g flag only the first match is replaced.'}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-body-sm text-on-surface-muted">Result</h4>
                    <CopyButton value={good.replaced ?? ''} variant="outline" size="sm">
                      Copy result
                    </CopyButton>
                  </div>
                  <pre
                    aria-label="Replaced text"
                    className="max-h-[26rem] overflow-auto whitespace-pre-wrap rounded-md border border-outline bg-surface-inset px-[11px] py-2 font-mono text-data-md text-on-surface [overflow-wrap:anywhere]"
                  >
                    {good.replaced}
                  </pre>
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      ) : null}
    </div>
  );
};

export default RegexTool;
