import { describe, expect, it } from 'vitest';
import { looksLikeCron, normaliseCronNames, validateCronExpression } from './cron.js';

/**
 * `validateCronExpression` was module-private inside `island.jsx` and had no
 * cover at all. It is extracted verbatim, so this suite pins the behaviour it
 * already had — quirks included — rather than the behaviour it ought to have.
 * The quirks are called out below; fixing them is a behaviour change and
 * belongs in its own PR.
 */

describe('validateCronExpression', () => {
  it.each([
    ['* * * * *', 'every field a wildcard'],
    ['*/15 * * * *', 'a step'],
    ['0 9 * * 1', 'literals'],
    ['0,15,30,45 * * * *', 'a list'],
    ['0 9-17 * * *', 'a range'],
    ['0 0 L * *', 'L for the last day of the month'],
    ['59 23 31 12 7', 'every field at its maximum'],
  ])('accepts %s (%s)', (expression) => {
    expect(validateCronExpression(expression)).toEqual({ valid: true });
  });

  it.each([
    ['* * * *', 'CRON expression must have exactly 5 fields'],
    ['* * * * * *', 'CRON expression must have exactly 5 fields'],
    ['', 'CRON expression must have exactly 5 fields'],
    ['60 * * * *', 'Invalid minute value (0-59)'],
    ['* 24 * * *', 'Invalid hour value (0-23)'],
    ['* * 32 * *', 'Invalid day of month value (1-31 or L)'],
    ['* * * 13 *', 'Invalid month value (1-12 or JAN-DEC)'],
    ['* * * * 8', 'Invalid day of week value (0-7 or SUN-SAT)'],
  ])('rejects %s', (expression, error) => {
    expect(validateCronExpression(expression)).toEqual({ valid: false, error });
  });

  it('tolerates extra whitespace between fields', () => {
    expect(validateCronExpression('  0   9  *  *  1  ')).toEqual({ valid: true });
  });

  /**
   * Known quirks, pinned so a refactor cannot change them by accident. All
   * three come from `parseInt` accepting a trailing tail.
   */
  describe('inherited quirks', () => {
    it('accepts a numeric field with a trailing tail', () => {
      expect(validateCronExpression('5x * * * *').valid).toBe(true);
    });

    it('accepts L only for day of month, not day of week', () => {
      expect(validateCronExpression('* * L * *').valid).toBe(true);
      expect(validateCronExpression('* * * * L').valid).toBe(false);
    });

    it('bounds-checks a step base but not the step itself', () => {
      expect(validateCronExpression('*/99 * * * *').valid).toBe(true);
    });
  });
});

describe('month and weekday names', () => {
  it.each([
    ['0 9 * * MON-FRI', '0 9 * * 1-5'],
    ['0 0 1 JAN,jul *', '0 0 1 1,7 *'],
    ['*/5 * * Dec sun', '*/5 * * 12 0'],
    ['0 0 L * *', '0 0 L * *'],
  ])('reads %s as %s', (expression, numeric) => {
    expect(normaliseCronNames(expression)).toBe(numeric);
    expect(validateCronExpression(expression)).toEqual({ valid: true });
  });

  it('leaves names alone outside the month and weekday fields', () => {
    expect(validateCronExpression('MON * * * *').valid).toBe(false);
    expect(validateCronExpression('* * JAN * *').valid).toBe(false);
  });

  it('rejects a word that is not a name', () => {
    expect(validateCronExpression('* * * FOO *').valid).toBe(false);
    expect(validateCronExpression('* * * * FUN').valid).toBe(false);
  });

  it('keeps names out of the paste sniffer', () => {
    expect(looksLikeCron('0 9 * * MON-FRI')).toBe(false);
  });
});

/**
 * The sniffing gate the paste dispatcher uses. `validateCronExpression` alone
 * is too generous because of the `parseInt` quirk above — `5x 9 * * 1` would
 * validate — so the alphabet check is what actually keeps prose out.
 */
describe('looksLikeCron', () => {
  it.each(['* * * * *', '*/15 * * * *', '0 9 * * 1', '0,15 8-17 L * 5'])('accepts %s', (expression) => {
    expect(looksLikeCron(expression)).toBe(true);
  });

  it.each([
    ['the quick brown fox jumps', 'five words'],
    ['5x 9 * * 1', 'the parseInt tail that validateCronExpression lets through'],
    ['example.com', 'a domain'],
    ['SGVsbG8gd29ybGQ=', 'base64'],
    ['* * * *', 'four fields'],
    ['', 'empty'],
  ])('rejects %s (%s)', (expression) => {
    expect(looksLikeCron(expression)).toBe(false);
  });

  it('returns false for a non-string', () => {
    expect(looksLikeCron(null)).toBe(false);
  });
});
