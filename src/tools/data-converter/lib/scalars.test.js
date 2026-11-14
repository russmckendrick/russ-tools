import { describe, expect, it } from 'vitest';
import { describeValue, inferScalar, isScalar, scalarToText, toPlainData } from './scalars.js';

describe('inferScalar', () => {
  it.each([
    ['42', 42],
    ['-7', -7],
    ['0', 0],
    ['3.14', 3.14],
    ['-0.5', -0.5],
    ['true', true],
    ['false', false],
  ])('reads %j as %j', (text, value) => {
    expect(inferScalar(text)).toBe(value);
  });

  it.each(['007', '1.50', '1e3', '+1', '-0', '.5', '5.', 'True', 'null', '', ' 42', '12345678901234567890', '0x1f', 'NaN', 'Infinity'])(
    'leaves %j as text',
    (text) => {
      expect(inferScalar(text)).toBe(text);
    },
  );

  it('only infers what prints back identically', () => {
    for (const text of ['42', '-7', '3.14', '007', '1.50', 'true', 'x']) {
      expect(String(inferScalar(text))).toBe(text);
    }
  });
});

describe('scalarToText and isScalar', () => {
  it('writes each scalar as text', () => {
    expect(scalarToText(null)).toBe('');
    expect(scalarToText(undefined)).toBe('');
    expect(scalarToText(8080n)).toBe('8080');
    expect(scalarToText(false)).toBe('false');
    expect(scalarToText(1.5)).toBe('1.5');
    expect(scalarToText(new Date('2024-01-02T03:04:05Z'))).toBe('2024-01-02T03:04:05.000Z');
  });

  it('counts dates as scalars and containers as not', () => {
    expect(isScalar(new Date())).toBe(true);
    expect(isScalar(1n)).toBe(true);
    expect(isScalar(null)).toBe(true);
    expect(isScalar({})).toBe(false);
    expect(isScalar([])).toBe(false);
  });

  it('names a value for an error message', () => {
    expect([null, [], {}, 'x', 1, true].map(describeValue)).toEqual([
      'null',
      'a list',
      'an object',
      'a piece of text',
      'a number',
      'a boolean',
    ]);
  });
});

describe('toPlainData', () => {
  it('turns BigInt into a number when that is exact, and into text when it is not', () => {
    const plain = toPlainData({ port: 8080n, list: [1n, { deep: -2n }], huge: 12345678901234567890n });
    expect(plain).toEqual({ port: 8080, list: [1, { deep: -2 }], huge: '12345678901234567890' });
    expect(() => JSON.stringify(plain)).not.toThrow();
  });

  it('leaves dates and other values alone', () => {
    const when = new Date('2024-01-02T03:04:05Z');
    expect(toPlainData({ when, n: 1.5, s: 'x', b: true, z: null })).toEqual({ when, n: 1.5, s: 'x', b: true, z: null });
    expect(toPlainData({ when }).when).toBe(when);
  });
});
