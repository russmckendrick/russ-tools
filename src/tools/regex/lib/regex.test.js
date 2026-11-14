import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  MAX_MATCHES,
  MAX_TEXT,
  captureGroups,
  describeResult,
  normaliseFlags,
  runRegex,
  segments,
  toggleFlag,
} from './regex.js';
import { PATTERNS, STARTER, sampleFor } from './library.js';
import { createRunner } from './runner.js';
import { MAX_LINK_LENGTH, decodeState, encodeState } from './share.js';

const values = (result) => result.matches.map((match) => match.value);
const CAPTURED =
  '#config=eJyrVipTsjLUUSpQslLSsLfJTq20i4kp19a01YiJSdHWVNJRSgPKpGcCGSVARqKtYUxeUpKtkRFQoAgooGKkVAsAYF0ROA';

describe('flags', () => {
  it('keeps known flags once each, in a fixed order', () => {
    expect(normaliseFlags('mgig')).toBe('gim');
    expect(normaliseFlags('gdx')).toBe('g');
    expect(normaliseFlags(undefined)).toBe('');
  });

  it('toggles a flag, and u and v displace each other', () => {
    expect(toggleFlag('g', 'i')).toBe('gi');
    expect(toggleFlag('gi', 'g')).toBe('i');
    expect(toggleFlag('gu', 'v')).toBe('gv');
    expect(toggleFlag('gv', 'u')).toBe('gu');
  });
});

describe('captureGroups', () => {
  it('numbers capturing groups and carries their names', () => {
    expect(captureGroups('(a)(?<year>\\d{4})(?:x)(?=y)(?<!z)(?<=w)(b)')).toEqual([null, 'year', null]);
  });

  it('ignores parentheses that are escaped or inside a class', () => {
    expect(captureGroups('\\((a)[(]\\[(b)')).toEqual([null, null]);
    expect(captureGroups('[[(]--[x]](a)', true)).toEqual([null]);
  });
});

describe('runRegex', () => {
  it('lists every match with its range when global', () => {
    const result = runRegex({ pattern: '\\d+', flags: 'g', text: 'a1 b22 c333' });
    expect(result.ok).toBe(true);
    expect(result.matches.map(({ index, end, value }) => [index, end, value])).toEqual([
      [1, 2, '1'],
      [4, 6, '22'],
      [8, 11, '333'],
    ]);
    expect(result.total).toBe(3);
  });

  it('stops at the first match without the g flag, as JavaScript does', () => {
    const result = runRegex({ pattern: '\\d+', flags: '', text: 'a1 b22' });
    expect(values(result)).toEqual(['1']);
    expect(describeResult(result)).toBe('1 match: without the g flag the search stops at the first.');
  });

  it('reports numbered and named groups with their ranges', () => {
    const result = runRegex({ pattern: '(?<key>\\w+)=(\\d+)?', flags: 'g', text: 'a=1 bb=' });
    expect(result.groups).toEqual([
      { number: 1, name: 'key' },
      { number: 2, name: null },
    ]);
    expect(result.matches[0].groups).toEqual([
      { number: 1, name: 'key', value: 'a', start: 0, end: 1 },
      { number: 2, name: null, value: '1', start: 2, end: 3 },
    ]);
    expect(result.matches[1].groups[1]).toEqual({ number: 2, name: null, value: null, start: null, end: null });
  });

  it('knows the groups of a pattern that matched nothing', () => {
    const result = runRegex({ pattern: '(?<a>x)(y)', flags: 'g', text: 'zzz' });
    expect(result.total).toBe(0);
    expect(result.groups).toEqual([
      { number: 1, name: 'a' },
      { number: 2, name: null },
    ]);
    expect(describeResult(result)).toBe('No match.');
  });

  it('walks past empty matches instead of looping for ever', () => {
    const result = runRegex({ pattern: 'x*', flags: 'g', text: 'ab' });
    expect(result.matches.map((match) => match.index)).toEqual([0, 1, 2]);
    expect(describeResult(result)).toBe('3 matches: all empty, so there is nothing to highlight.');
    expect(runRegex({ pattern: '', flags: 'gu', text: '😀' }).empty).toBe(true);
    expect(runRegex({ pattern: '(?:)', flags: 'gu', text: '😀' }).matches.map((match) => match.index)).toEqual([0, 2]);
  });

  it('honours the i, m, s and y flags', () => {
    expect(values(runRegex({ pattern: 'a', flags: 'gi', text: 'aA' }))).toEqual(['a', 'A']);
    expect(values(runRegex({ pattern: '^b$', flags: 'gm', text: 'a\nb\nc' }))).toEqual(['b']);
    expect(values(runRegex({ pattern: 'a.b', flags: 's', text: 'a\nb' }))).toEqual(['a\nb']);
    expect(values(runRegex({ pattern: 'b', flags: 'y', text: 'ab' }))).toEqual([]);
    expect(values(runRegex({ pattern: 'a', flags: 'gy', text: 'aab a' }))).toEqual(['a', 'a']);
  });

  it('explains a pattern that does not compile, without the engine preamble', () => {
    const result = runRegex({ pattern: '(a', flags: 'g', text: 'a' });
    expect(result.ok).toBe(false);
    expect(result.error).not.toMatch(/^Invalid regular expression: \//);
    expect(result.error.length).toBeGreaterThan(3);
  });

  it('caps the matches it lists but still counts them all', () => {
    const result = runRegex({ pattern: 'a', flags: 'g', text: 'a'.repeat(MAX_MATCHES + 50) });
    expect(result.matches).toHaveLength(MAX_MATCHES);
    expect(result.total).toBe(MAX_MATCHES + 50);
    expect(result.truncated).toBe(true);
  });

  it('refuses text over the limit with a message', () => {
    const result = runRegex({ pattern: 'a', flags: 'g', text: 'a'.repeat(MAX_TEXT + 1) });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/The limit is 100,000/);
  });

  it('replaces with numbered and named references', () => {
    const result = runRegex({
      pattern: '(?<first>\\w+) (\\w+)',
      flags: 'g',
      text: 'hello world, good day',
      replacement: '$2 $<first>!',
    });
    expect(result.replaced).toBe('world hello!, day good!');
    expect(runRegex({ pattern: 'o', flags: '', text: 'foo', replacement: '0' }).replaced).toBe('f0o');
    expect(runRegex({ pattern: 'o', flags: 'g', text: 'foo' }).replaced).toBeNull();
  });
});

describe('segments', () => {
  it('cuts the text into matched and unmatched runs', () => {
    const text = 'a1 b22';
    const { matches } = runRegex({ pattern: '\\d+', flags: 'g', text });
    expect(segments(text, matches)).toEqual([
      { text: 'a', match: null },
      { text: '1', match: 0 },
      { text: ' b', match: null },
      { text: '22', match: 1 },
    ]);
  });

  it('leaves empty matches out and returns the whole text when nothing matched', () => {
    const { matches } = runRegex({ pattern: 'x*', flags: 'g', text: 'ab' });
    expect(segments('ab', matches)).toEqual([{ text: 'ab', match: null }]);
    expect(segments('', [])).toEqual([]);
  });
});

describe('the pattern library', () => {
  it('has the eight patterns this audience asks for', () => {
    expect(PATTERNS.map((entry) => entry.id)).toEqual(['ipv4', 'ipv6', 'cidr', 'mac', 'guid', 'fqdn', 'email', 'iso8601']);
  });

  describe.each(PATTERNS.map((entry) => [entry.name, entry]))('%s', (_name, entry) => {
    it.each(entry.good)('accepts %s', (sample) => {
      expect(values(runRegex({ pattern: entry.pattern, flags: entry.flags, text: sample }))).toEqual([sample]);
    });

    it.each(entry.bad)('rejects %s', (sample) => {
      expect(values(runRegex({ pattern: entry.pattern, flags: entry.flags, text: sample }))).toEqual([]);
    });

    it('picks exactly the good lines out of its mixed sample', () => {
      const result = runRegex({ pattern: entry.pattern, flags: entry.flags, text: sampleFor(entry) });
      expect(values(result)).toEqual(entry.good);
    });
  });

  it('opens on a sample that matches three of its four lines and names its groups', () => {
    const result = runRegex(STARTER);
    expect(result.total).toBe(3);
    expect(result.groups.map((group) => group.name)).toEqual(['ip', 'user', 'time', 'method', 'path', 'status']);
    expect(result.replaced.split('\n')[0]).toMatch(/^200 GET \/api\/v1\/subnets\?cidr=10\.0\.0\.0\/22 from 203\.0\.113\.7/);
  });
});

describe('createRunner', () => {
  afterEach(() => vi.useRealTimers());

  function fakeWorker({ answer = true } = {}) {
    const worker = {
      terminated: false,
      posted: [],
      postMessage(message) {
        worker.posted.push(message);
        if (answer) queueMicrotask(() => worker.onmessage({ data: { id: message.id, result: runRegex(message.request) } }));
      },
      terminate() {
        worker.terminated = true;
      },
    };
    queueMicrotask(() => worker.onmessage?.({ data: { ready: true } }));
    return worker;
  }

  it('runs a job in the worker and hands back its result', async () => {
    const workers = [];
    const runner = createRunner({ createWorker: () => workers[workers.push(fakeWorker()) - 1] });
    const result = await runner.run({ pattern: 'a', flags: 'g', text: 'aa' });
    expect(result.total).toBe(2);
    expect(workers).toHaveLength(1);
    await runner.run({ pattern: 'b', flags: 'g', text: 'b' });
    expect(workers).toHaveLength(1);
    runner.dispose();
    expect(workers[0].terminated).toBe(true);
  });

  it('terminates a worker that does not answer in time and reports a timeout', async () => {
    vi.useFakeTimers();
    const workers = [];
    const runner = createRunner({
      timeoutMs: 1000,
      createWorker: () => workers[workers.push(fakeWorker({ answer: false })) - 1],
    });
    const pending = runner.run({ pattern: '(a+)+$', flags: '', text: `${'a'.repeat(40)}!` });
    await vi.advanceTimersByTimeAsync(999);
    expect(workers[0].terminated).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    expect(await pending).toEqual({ ok: false, timedOut: true, timeoutMs: 1000 });
    expect(workers[0].terminated).toBe(true);

    const next = runner.run({ pattern: 'a', flags: 'g', text: 'a' });
    expect(workers).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1001);
    expect((await next).timedOut).toBe(true);
  });

  it('does not start the clock until the worker has loaded', async () => {
    vi.useFakeTimers();
    const worker = { posted: [], postMessage: (message) => worker.posted.push(message), terminate: vi.fn() };
    const runner = createRunner({ timeoutMs: 1000, bootMs: 5000, createWorker: () => worker });
    const pending = runner.run({ pattern: 'a', flags: '', text: 'a' });
    await vi.advanceTimersByTimeAsync(3000);
    expect(worker.terminate).not.toHaveBeenCalled();
    worker.onmessage({ data: { ready: true } });
    worker.onmessage({ data: { id: worker.posted[0].id, result: { ok: true, total: 1 } } });
    expect(await pending).toEqual({ ok: true, total: 1 });
  });

  it('gives up on a worker that never loads', async () => {
    vi.useFakeTimers();
    const worker = { postMessage: () => {}, terminate: vi.fn() };
    const runner = createRunner({ bootMs: 5000, createWorker: () => worker });
    const pending = runner.run({ pattern: 'a', flags: '', text: 'a' });
    await vi.advanceTimersByTimeAsync(5001);
    expect((await pending).error).toMatch(/did not start/);
    expect(worker.terminate).toHaveBeenCalled();
  });

  it('abandons the job in flight when a newer one arrives', async () => {
    const workers = [];
    const runner = createRunner({
      createWorker: () => workers[workers.push(fakeWorker({ answer: workers.length > 0 })) - 1],
    });
    const first = runner.run({ pattern: 'slow', flags: '', text: '' });
    const second = runner.run({ pattern: 'a', flags: 'g', text: 'a' });
    expect(await first).toEqual({ ok: false, superseded: true });
    expect(workers[0].terminated).toBe(true);
    expect((await second).total).toBe(1);
  });

  it('runs in place, and says so, where there are no workers at all', async () => {
    const runner = createRunner({ createWorker: () => null });
    const result = await runner.run({ pattern: 'a', flags: 'g', text: 'aa' });
    expect(result.total).toBe(2);
    expect(result.unprotected).toBe(true);
  });

  it('reports a worker that fails instead of hanging', async () => {
    const worker = { postMessage: () => queueMicrotask(() => worker.onerror(new Error('boom'))), terminate: vi.fn() };
    const runner = createRunner({ createWorker: () => worker });
    const result = await runner.run({ pattern: 'a', flags: '', text: 'a' });
    expect(result.error).toMatch(/could not run/);
  });
});

describe('share links', () => {
  it('round-trips a pattern, flags, text and replacement through the hash', () => {
    const state = { pattern: STARTER.pattern, flags: 'mg', text: STARTER.text, replacement: '$1' };
    const hash = encodeState(state);
    expect(hash).toMatch(/^#config=[A-Za-z0-9_-]+$/);
    expect(hash.length).toBeLessThan(MAX_LINK_LENGTH);
    expect(decodeState(hash)).toEqual({ ...state, flags: 'gm' });
  });

  it('still reads a link captured when the tool shipped', () => {
    expect(decodeState(CAPTURED)).toEqual({
      pattern: '(?<key>\\w+)=(\\d+)',
      flags: 'gi',
      text: 'a=1\nbb=22',
      replacement: '$2',
    });
  });

  it('ignores a hash that is not one of its links', () => {
    expect(decodeState('')).toBeNull();
    expect(decodeState('#security')).toBeNull();
    expect(decodeState('#config=not-a-link')).toBeNull();
    expect(decodeState(encodeState({ pattern: 1, flags: '', text: '' }))).toBeNull();
  });
});
