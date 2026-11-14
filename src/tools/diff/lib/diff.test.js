import { describe, it, expect } from 'vitest';
import { diffIds, editDistance } from './myers.js';
import {
  MAX_CHARS,
  MAX_LINES,
  bothJson,
  diffText,
  intraLine,
  normaliseJson,
  prepare,
  splitLines,
} from './diff.js';
import { MAX_ROWS, splitRows, unifiedRows } from './rows.js';
import { toUnified } from './unified.js';

function random(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function lcsLength(a, b) {
  const row = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = 0;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j];
      row[j] = a[i - 1] === b[j - 1] ? diagonal + 1 : Math.max(row[j], row[j - 1]);
      diagonal = above;
    }
  }
  return row[b.length];
}

function rebuild(blocks, a, b) {
  const left = [];
  const right = [];
  let aAt = 0;
  let bAt = 0;
  for (const block of blocks) {
    expect(block.aStart).toBe(aAt);
    expect(block.bStart).toBe(bAt);
    if (block.equal) {
      expect(block.aEnd - block.aStart).toBe(block.bEnd - block.bStart);
      for (let i = 0; i < block.aEnd - block.aStart; i++) {
        expect(a[block.aStart + i]).toBe(b[block.bStart + i]);
      }
    }
    for (let i = block.aStart; i < block.aEnd; i++) left.push(a[i]);
    for (let j = block.bStart; j < block.bEnd; j++) right.push(b[j]);
    aAt = block.aEnd;
    bAt = block.bEnd;
  }
  expect(left).toEqual([...a]);
  expect(right).toEqual([...b]);
}

describe('diffIds (Myers)', () => {
  it('handles the empty and the identical cases', () => {
    expect(diffIds([], []).blocks).toEqual([]);
    expect(diffIds([1, 2], [1, 2]).blocks).toEqual([{ equal: true, aStart: 0, aEnd: 2, bStart: 0, bEnd: 2 }]);
    expect(diffIds([], [1]).blocks).toEqual([{ equal: false, aStart: 0, aEnd: 0, bStart: 0, bEnd: 1 }]);
    expect(diffIds([1], []).blocks).toEqual([{ equal: false, aStart: 0, aEnd: 1, bStart: 0, bEnd: 0 }]);
  });

  it('finds the textbook edit script for ABCABBA and CBABAC', () => {
    const a = [...'ABCABBA'];
    const b = [...'CBABAC'];
    const { blocks, approximate } = diffIds(a, b);
    rebuild(blocks, a, b);
    expect(approximate).toBe(false);
    expect(editDistance(blocks)).toBe(5);
  });

  it('is a valid and shortest edit script on 400 random pairs', () => {
    const next = random(20261114);
    for (let round = 0; round < 400; round++) {
      const alphabet = 2 + Math.floor(next() * 6);
      const make = () => Array.from({ length: Math.floor(next() * 40) }, () => Math.floor(next() * alphabet));
      const a = make();
      const b = make();
      const { blocks, approximate } = diffIds(a, b);
      rebuild(blocks, a, b);
      expect(approximate).toBe(false);
      expect(editDistance(blocks)).toBe(a.length + b.length - 2 * lcsLength(a, b));
    }
  });

  it('stays shortest on long sequences with scattered edits', () => {
    const next = random(7);
    const a = Array.from({ length: 3000 }, (_, i) => i);
    const b = a.filter(() => next() > 0.03).flatMap((value) => (next() > 0.97 ? [value, -value - 1] : [value]));
    const { blocks, approximate } = diffIds(a, b);
    rebuild(blocks, a, b);
    expect(approximate).toBe(false);
    expect(editDistance(blocks)).toBe(a.length + b.length - 2 * lcsLength(a, b));
  });

  it('gives up on a minimal script past its budget, and still returns a valid one', () => {
    const a = Array.from({ length: 400 }, (_, i) => i);
    const b = Array.from({ length: 400 }, (_, i) => 1000 + i);
    const { blocks, approximate } = diffIds(a, b, 50);
    rebuild(blocks, a, b);
    expect(approximate).toBe(true);
    expect(blocks).toEqual([{ equal: false, aStart: 0, aEnd: 400, bStart: 0, bEnd: 400 }]);
  });

  it('finishes quickly on two large texts with nothing in common', () => {
    const a = Int32Array.from({ length: 20000 }, (_, i) => i);
    const b = Int32Array.from({ length: 20000 }, (_, i) => 50000 + i);
    const started = performance.now();
    const { approximate } = diffIds(a, b);
    expect(approximate).toBe(true);
    expect(performance.now() - started).toBeLessThan(3000);
  });
});

describe('splitLines', () => {
  it('splits on any line ending and records the final newline', () => {
    expect(splitLines('a\nb\n')).toEqual({ lines: ['a', 'b'], eol: true, crlf: false });
    expect(splitLines('a\r\nb')).toEqual({ lines: ['a', 'b'], eol: false, crlf: true });
    expect(splitLines('a\n\nb')).toEqual({ lines: ['a', '', 'b'], eol: false, crlf: false });
    expect(splitLines('')).toEqual({ lines: [], eol: true, crlf: false });
  });
});

const OLD = ['port = 8080', 'host = localhost', 'debug = true', 'workers = 4', 'timeout = 30', 'log = info', 'tls = off', 'name = api'].join('\n');
const NEW = ['port = 8443', 'host = localhost', 'workers = 4', 'timeout = 30', 'log = info', 'tls = on', 'cert = /etc/tls/api.pem', 'name = api'].join('\n');

describe('diffText', () => {
  it('counts additions and deletions by line', () => {
    const result = diffText(OLD, NEW);
    expect(result.ok).toBe(true);
    expect([result.additions, result.deletions, result.identical]).toEqual([3, 3, false]);
    expect(result.blocks.map((block) => block.type)).toEqual(['change', 'equal', 'change', 'equal', 'change', 'equal']);
  });

  it('marks the words that changed inside a changed line', () => {
    const [first] = diffText(OLD, NEW).blocks;
    expect(first.removed[0].parts).toEqual([
      { text: 'port = ', changed: false },
      { text: '8080', changed: true },
    ]);
    expect(first.added[0].parts).toEqual([
      { text: 'port = ', changed: false },
      { text: '8443', changed: true },
    ]);
  });

  it('says two equal texts are identical', () => {
    const result = diffText('a\nb\n', 'a\nb\n');
    expect(result.identical).toBe(true);
    expect(result.blocks).toHaveLength(1);
    expect(toUnified(result)).toBe('');
  });

  it('ignores whitespace when asked: indentation, trailing space and runs', () => {
    const left = 'key:   value\n\tname: api  \n';
    const right = 'key: value\n    name: api\n';
    expect(diffText(left, right).identical).toBe(false);
    expect(diffText(left, right, { ignoreWhitespace: true }).identical).toBe(true);
    expect(diffText('a b', 'ab', { ignoreWhitespace: true }).identical).toBe(false);
  });

  it('ignores case when asked', () => {
    expect(diffText('Host: API\n', 'host: api\n').identical).toBe(false);
    expect(diffText('Host: API\n', 'host: api\n', { ignoreCase: true }).identical).toBe(true);
  });

  it('does not compare line endings, and reports which side uses CRLF', () => {
    const result = diffText('a\r\nb\r\n', 'a\nb\n');
    expect(result.identical).toBe(true);
    expect([result.left.crlf, result.right.crlf]).toEqual([true, false]);
  });

  it('treats a missing final newline as a change to the last line', () => {
    const result = diffText('a\nb\n', 'a\nb');
    expect(result.eolDiffers).toBe(true);
    expect([result.additions, result.deletions]).toEqual([1, 1]);
    expect(toUnified(result)).toBe(
      ['--- original', '+++ changed', '@@ -1,2 +1,2 @@', ' a', '-b', '+b', '\\ No newline at end of file', ''].join('\n')
    );
    expect(diffText('a\nb\n', 'a\nb', { ignoreWhitespace: true }).identical).toBe(true);
    expect(diffText('a\nb', 'a\nb').identical).toBe(true);
  });

  it('does not match a last line with no newline against the same text mid-file', () => {
    const result = diffText('x\ndelta', 'delta\nx\n');
    expect(result.blocks.flatMap((block) => (block.type === 'equal' ? block.lines.map((line) => line.left) : []))).toEqual(['x']);
    const removed = result.blocks.flatMap((block) => block.removed ?? []);
    expect(removed.map((line) => [line.text, line.eolNote])).toEqual([['delta', true]]);
  });

  it('lines up a changed line with its counterpart when a line was added beside it', () => {
    const result = diffText('tls = off\norigins = a\n', 'tls = on\ncert = /etc/tls/app.pem\norigins = a, b\n');
    const [block] = result.blocks;
    expect(block.pairs.map((pair) => [pair.removed?.text ?? null, pair.added?.text ?? null])).toEqual([
      ['tls = off', 'tls = on'],
      [null, 'cert = /etc/tls/app.pem'],
      ['origins = a', 'origins = a, b'],
    ]);
    expect(block.added[2].parts).toEqual([
      { text: 'origins = a', changed: false },
      { text: ', b', changed: true },
    ]);
  });

  it('puts unrelated removed and added lines on the same rows', () => {
    const [block] = diffText('listen 80;\nroot /srv;\n', 'ssl_certificate /etc/tls/api.pem;\n').blocks;
    expect(block.pairs.map((pair) => [pair.removed?.text ?? null, pair.added?.text ?? null])).toEqual([
      ['listen 80;', 'ssl_certificate /etc/tls/api.pem;'],
      ['root /srv;', null],
    ]);
    expect(block.removed[0].parts).toBeNull();
  });

  it('refuses input over the size limits with a message, and compares nothing', () => {
    const tooLong = diffText('x'.repeat(MAX_CHARS + 1), 'y');
    expect(tooLong.ok).toBe(false);
    expect(tooLong.error).toMatch(/original text is 1,000,001 characters/);
    const tooMany = diffText('a', 'b\n'.repeat(MAX_LINES + 1));
    expect(tooMany.ok).toBe(false);
    expect(tooMany.error).toMatch(/changed text has 20,001 lines/);
  });

  it('flags a diff that is valid but not minimal', () => {
    const left = Array.from({ length: 4000 }, (_, i) => `left ${i}`).join('\n');
    const right = Array.from({ length: 4000 }, (_, i) => `right ${i}`).join('\n');
    const result = diffText(left, right);
    expect(result.approximate).toBe(true);
    expect([result.additions, result.deletions]).toEqual([4000, 4000]);
  });
});

describe('intraLine', () => {
  it('leaves unrelated lines unmarked rather than speckling them', () => {
    expect(intraLine('listen 80;', 'ssl_certificate /etc/tls/api.pem;')).toBeNull();
  });

  it('keeps punctuation and words apart', () => {
    expect(intraLine('"tls": false,', '"tls": true,').right).toEqual([
      { text: '"tls": ', changed: false },
      { text: 'true', changed: true },
      { text: ',', changed: false },
    ]);
  });

  it('does not mark whitespace when whitespace is ignored', () => {
    const parts = intraLine('a  =  1', 'a = 2', { ignoreWhitespace: true });
    expect(parts.left).toEqual([
      { text: 'a  =  ', changed: false },
      { text: '1', changed: true },
    ]);
  });
});

describe('JSON normalising', () => {
  const left = '{"b":1,"a":{"d":[3,{"z":1,"y":2}],"c":true}}';
  const right = '{\n  "a": { "c": true, "d": [3, { "y": 2, "z": 1 }] },\n  "b": 1\n}';

  it('sorts keys at every depth and keeps array order', () => {
    expect(normaliseJson(left)).toBe(
      '{\n  "a": {\n    "c": true,\n    "d": [\n      3,\n      {\n        "y": 2,\n        "z": 1\n      }\n    ]\n  },\n  "b": 1\n}\n'
    );
    expect(normaliseJson('[2,1]')).toBe('[\n  2,\n  1\n]\n');
  });

  it('is offered only when both sides are JSON documents', () => {
    expect(bothJson(left, right)).toBe(true);
    expect(bothJson(left, 'port = 1')).toBe(false);
    expect(bothJson('42', '43')).toBe(false);
    expect(bothJson('', '')).toBe(false);
  });

  it('makes reordered and reformatted JSON compare as identical', () => {
    expect(diffText(left, right).identical).toBe(false);
    const prepared = prepare(left, right, { normaliseJson: true });
    expect(prepared.normalised).toBe(true);
    expect(diffText(prepared.left, prepared.right).identical).toBe(true);
    expect(prepare(left, 'nope', { normaliseJson: true }).normalised).toBe(false);
  });
});

describe('toUnified', () => {
  it('writes the format patch reads', () => {
    expect(toUnified(diffText(`${OLD}\n`, `${NEW}\n`))).toBe(
      [
        '--- original',
        '+++ changed',
        '@@ -1,8 +1,8 @@',
        '-port = 8080',
        '+port = 8443',
        ' host = localhost',
        '-debug = true',
        ' workers = 4',
        ' timeout = 30',
        ' log = info',
        '-tls = off',
        '+tls = on',
        '+cert = /etc/tls/api.pem',
        ' name = api',
        '',
      ].join('\n')
    );
  });

  it('starts a new hunk when changes are more than two contexts apart', () => {
    const lines = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`);
    const edited = lines.map((line, i) => (i === 2 || i === 24 ? `${line}!` : line));
    const text = toUnified(diffText(`${lines.join('\n')}\n`, `${edited.join('\n')}\n`));
    expect(text.match(/^@@.*@@$/gm)).toEqual(['@@ -1,6 +1,6 @@', '@@ -22,7 +22,7 @@']);
  });

  it('writes the empty-side ranges the way diff does', () => {
    expect(toUnified(diffText('', 'a\nb\n'))).toBe('--- original\n+++ changed\n@@ -0,0 +1,2 @@\n+a\n+b\n');
    expect(toUnified(diffText('a\n', ''))).toBe('--- original\n+++ changed\n@@ -1 +0,0 @@\n-a\n');
  });
});

describe('rows for the two views', () => {
  const lines = Array.from({ length: 40 }, (_, i) => `line ${i + 1}`);
  const edited = lines.map((line, i) => (i === 20 ? 'changed' : line));
  const result = diffText(lines.join('\n'), edited.join('\n'));

  it('collapses unchanged runs to a count, keeping context round each change', () => {
    const { rows } = unifiedRows(result);
    expect(rows.map((row) => row.kind)).toEqual([
      'gap', 'equal', 'equal', 'equal', 'removed', 'added', 'equal', 'equal', 'equal', 'gap',
    ]);
    expect(rows[0].count).toBe(17);
    expect(rows[9].count).toBe(16);
    expect(rows[4]).toMatchObject({ l: 21, r: null, text: 'line 21' });
    expect(rows[5]).toMatchObject({ l: null, r: 21, text: 'changed' });
  });

  it('does not collapse a run too short to be worth a row of its own', () => {
    const short = Array.from({ length: 12 }, (_, i) => `line ${i + 1}`);
    const kinds = (changedAt) =>
      unifiedRows(diffText(short.join('\n'), short.map((line, i) => (i === changedAt ? 'x' : line)).join('\n'))).rows.map(
        (row) => row.kind
      );
    expect(kinds(6).filter((kind) => kind === 'gap')).toEqual([]);
    expect(kinds(11).filter((kind) => kind === 'gap')).toEqual(['gap']);
  });

  it('shows every line when context is off', () => {
    expect(unifiedRows(result, null).rows).toHaveLength(41);
    expect(splitRows(result, null).rows).toHaveLength(40);
  });

  it('pairs removed and added lines side by side and pads the shorter side', () => {
    const { rows } = splitRows(diffText('a\nb\nc\n', 'a\nx\n'));
    expect(rows.map((row) => [row.left?.text ?? null, row.right?.text ?? null])).toEqual([
      ['a', 'a'],
      ['b', 'x'],
      ['c', null],
    ]);
  });

  it('caps what it hands to the page and says how much was held back', () => {
    const left = Array.from({ length: 2500 }, (_, i) => `a${i}`).join('\n');
    const right = Array.from({ length: 2500 }, (_, i) => `b${i}`).join('\n');
    const { rows, hidden } = unifiedRows(diffText(left, right));
    expect(rows).toHaveLength(MAX_ROWS);
    expect(hidden).toBe(2000);
  });

  it('notes a missing final newline only where the two sides differ on it', () => {
    const kinds = unifiedRows(diffText('a\n', 'a')).rows.map((row) => row.kind);
    expect(kinds).toEqual(['removed', 'added', 'note']);
    expect(unifiedRows(diffText('a', 'b')).rows.map((row) => row.kind)).toEqual(['removed', 'added']);
  });
});
