import { describe, expect, it } from 'vitest';
import {
  daysMatchEither,
  formatUntil,
  formatUtc,
  nextRuns,
  nextRunsOnLocalClock,
  parseCronSchedule,
} from './schedule.js';

const at = (iso) => new Date(`${iso}:00Z`);
const iso = (date) => date.toISOString().slice(0, 16);
const runs = (expression, from, options) => nextRuns(expression, at(from), options).runs.map(iso);

describe('nextRuns', () => {
  it('returns the next five minutes for every-minute, starting after the from-date', () => {
    expect(runs('* * * * *', '2026-11-14T10:00')).toEqual([
      '2026-11-14T10:01',
      '2026-11-14T10:02',
      '2026-11-14T10:03',
      '2026-11-14T10:04',
      '2026-11-14T10:05',
    ]);
  });

  it('never returns the from-minute itself, even mid-minute', () => {
    const from = new Date('2026-11-14T10:00:30Z');
    expect(iso(nextRuns('* * * * *', from).runs[0])).toBe('2026-11-14T10:01');
    expect(iso(nextRuns('0 10 * * *', from).runs[0])).toBe('2026-11-15T10:00');
  });

  it('handles steps', () => {
    expect(runs('*/15 * * * *', '2026-11-14T10:07', { count: 4 })).toEqual([
      '2026-11-14T10:15',
      '2026-11-14T10:30',
      '2026-11-14T10:45',
      '2026-11-14T11:00',
    ]);
  });

  it('handles a stepped range and a number with a step', () => {
    expect(runs('0 9-17/4 * * *', '2026-11-14T00:00', { count: 4 })).toEqual([
      '2026-11-14T09:00',
      '2026-11-14T13:00',
      '2026-11-14T17:00',
      '2026-11-15T09:00',
    ]);
    expect(runs('40/10 23 * * *', '2026-11-14T00:00', { count: 3 })).toEqual([
      '2026-11-14T23:40',
      '2026-11-14T23:50',
      '2026-11-15T23:40',
    ]);
  });

  it('handles lists and ranges together', () => {
    expect(runs('0,30 8-9 * * *', '2026-11-14T08:15', { count: 4 })).toEqual([
      '2026-11-14T08:30',
      '2026-11-14T09:00',
      '2026-11-14T09:30',
      '2026-11-15T08:00',
    ]);
  });

  it('rolls over the hour, day, month and year', () => {
    expect(runs('59 23 31 12 *', '2026-12-31T23:59', { count: 2 })).toEqual([
      '2027-12-31T23:59',
      '2028-12-31T23:59',
    ]);
    expect(runs('0 0 1 * *', '2026-12-15T00:00', { count: 2 })).toEqual(['2027-01-01T00:00', '2027-02-01T00:00']);
  });

  it('reads weekdays, with 14 November 2026 a Saturday', () => {
    expect(runs('0 9 * * 1-5', '2026-11-14T00:00', { count: 6 })).toEqual([
      '2026-11-16T09:00',
      '2026-11-17T09:00',
      '2026-11-18T09:00',
      '2026-11-19T09:00',
      '2026-11-20T09:00',
      '2026-11-23T09:00',
    ]);
  });

  it('treats 7 as Sunday, and a range ending in 7', () => {
    expect(runs('0 0 * * 7', '2026-11-14T00:00', { count: 2 })).toEqual(['2026-11-15T00:00', '2026-11-22T00:00']);
    expect(runs('0 0 * * 0', '2026-11-14T00:00', { count: 2 })).toEqual(['2026-11-15T00:00', '2026-11-22T00:00']);
    expect(runs('0 0 * * 5-7', '2026-11-14T00:00', { count: 3 })).toEqual([
      '2026-11-15T00:00',
      '2026-11-20T00:00',
      '2026-11-21T00:00',
    ]);
  });

  it('reads month and weekday names in any case', () => {
    expect(runs('0 9 * * MON-FRI', '2026-11-14T00:00', { count: 2 })).toEqual(runs('0 9 * * 1-5', '2026-11-14T00:00', { count: 2 }));
    expect(runs('0 0 1 jan,Jul *', '2026-11-14T00:00', { count: 3 })).toEqual([
      '2027-01-01T00:00',
      '2027-07-01T00:00',
      '2028-01-01T00:00',
    ]);
  });

  it('skips months that are too short for the day', () => {
    expect(runs('0 0 31 * *', '2026-01-31T00:00', { count: 4 })).toEqual([
      '2026-03-31T00:00',
      '2026-05-31T00:00',
      '2026-07-31T00:00',
      '2026-08-31T00:00',
    ]);
  });

  it('reads L as the last day of the month, leap years included', () => {
    expect(runs('0 0 L * *', '2028-01-15T00:00', { count: 3 })).toEqual([
      '2028-01-31T00:00',
      '2028-02-29T00:00',
      '2028-03-31T00:00',
    ]);
  });

  describe('when both day fields are restricted', () => {
    it('runs when either matches', () => {
      expect(runs('0 0 13 * 5', '2026-11-01T00:00', { count: 5 })).toEqual([
        '2026-11-06T00:00',
        '2026-11-13T00:00',
        '2026-11-20T00:00',
        '2026-11-27T00:00',
        '2026-12-04T00:00',
      ]);
      expect(runs('0 0 15 * 1', '2026-11-14T00:00', { count: 3 })).toEqual([
        '2026-11-15T00:00',
        '2026-11-16T00:00',
        '2026-11-23T00:00',
      ]);
    });

    it('requires both when one of them starts with a star, as Vixie cron does', () => {
      expect(daysMatchEither('*/2', '1')).toBe(false);
      expect(runs('0 0 */2 * 1', '2026-11-01T00:00', { count: 3 })).toEqual([
        '2026-11-09T00:00',
        '2026-11-23T00:00',
        '2026-12-07T00:00',
      ]);
    });

    it('reports which rule applies', () => {
      expect(daysMatchEither('13', '5')).toBe(true);
      expect(daysMatchEither('*', '5')).toBe(false);
      expect(daysMatchEither('13', '*')).toBe(false);
      expect(daysMatchEither('L', '5')).toBe(true);
    });
  });

  describe('expressions that cannot fire', () => {
    it('reports no runs for 30 February without hanging', () => {
      const started = Date.now();
      const result = nextRuns('0 0 30 2 *', at('2026-11-14T00:00'));
      expect(result).toMatchObject({ ok: true, runs: [], exhausted: true });
      expect(Date.now() - started).toBeLessThan(500);
    });

    it('reports no runs for 31 April, June, September and November', () => {
      expect(nextRuns('0 0 31 4,6,9,11 *', at('2026-11-14T00:00')).runs).toEqual([]);
    });

    it('returns what exists inside the five-year horizon and says it stopped', () => {
      const result = nextRuns('0 0 29 2 *', at('2026-11-14T00:00'));
      expect(result.runs.map(iso)).toEqual(['2028-02-29T00:00']);
      expect(result.exhausted).toBe(true);
    });

    it('honours a shorter horizon', () => {
      expect(nextRuns('0 0 29 2 *', at('2026-11-14T00:00'), { horizonYears: 1 }).runs).toEqual([]);
    });
  });

  it('is not exhausted when it found everything it was asked for', () => {
    expect(nextRuns('0 0 * * *', at('2026-11-14T00:00')).exhausted).toBe(false);
  });

  it('computes in UTC whatever the from-date crosses', () => {
    expect(runs('30 1 * * *', '2026-03-28T00:00', { count: 3 })).toEqual([
      '2026-03-28T01:30',
      '2026-03-29T01:30',
      '2026-03-30T01:30',
    ]);
    expect(runs('30 1 * * *', '2026-10-24T02:00', { count: 2 })).toEqual(['2026-10-25T01:30', '2026-10-26T01:30']);
  });

  it.each([
    ['* * * *', 'four fields'],
    ['5x * * * *', 'a number with a tail, which the validator lets through'],
    ['* * * * 8', 'a weekday out of range'],
    ['61 * * * *', 'a minute out of range'],
    ['*/0 * * * *', 'a zero step'],
    ['5-1 * * * *', 'a reversed range'],
    ['* * 1,L * *', 'L inside a list'],
    ['* * * * L', 'L outside day of month'],
  ])('refuses %s (%s)', (expression) => {
    const result = nextRuns(expression, at('2026-11-14T00:00'));
    expect(result.ok).toBe(false);
    expect(result.runs).toEqual([]);
    expect(result.error).toEqual(expect.any(String));
  });
});

describe('parseCronSchedule', () => {
  it('expands each field to the values it allows', () => {
    const { schedule } = parseCronSchedule('*/20 0,12 1-3 */6 1-5');
    expect([...schedule.minute]).toEqual([0, 20, 40]);
    expect([...schedule.hour]).toEqual([0, 12]);
    expect([...schedule.dayOfMonth]).toEqual([1, 2, 3]);
    expect([...schedule.month]).toEqual([1, 7]);
    expect([...schedule.dayOfWeek]).toEqual([1, 2, 3, 4, 5]);
  });

  it('gives a star seven weekdays, not eight', () => {
    expect(parseCronSchedule('* * * * *').schedule.dayOfWeek.size).toBe(7);
  });

  it('rejects a non-string', () => {
    expect(parseCronSchedule(null).ok).toBe(false);
  });
});

describe('nextRunsOnLocalClock', () => {
  it('returns instants whose local wall-clock time matches the expression', () => {
    const from = new Date(2026, 0, 10, 12, 0);
    const result = nextRunsOnLocalClock('30 9 * * *', from);
    expect(result.runs).toHaveLength(5);
    for (const run of result.runs) {
      expect(run.getHours()).toBe(9);
      expect(run.getMinutes()).toBe(30);
      expect(run.getTime()).toBeGreaterThan(from.getTime());
    }
    expect(result.runs[0].getDate()).toBe(11);
  });

  it('passes a failure through', () => {
    expect(nextRunsOnLocalClock('nope', new Date()).ok).toBe(false);
  });
});

describe('formatUntil', () => {
  const minutes = (count) => count * 60000;

  it.each([
    [30000, 'in less than a minute'],
    [minutes(1), 'in 1 minute'],
    [minutes(59) + 59000, 'in 59 minutes'],
    [minutes(60), 'in 1 hour'],
    [minutes(192), 'in 3 hours 12 minutes'],
    [minutes(1440), 'in 1 day'],
    [minutes(1440 * 2 + 180 + 5), 'in 2 days 3 hours'],
    [minutes(1440 * 400), 'in 1 year 35 days'],
    [minutes(1440 * 730), 'in 2 years'],
  ])('%i ms reads %s', (milliseconds, text) => {
    expect(formatUntil(milliseconds)).toBe(text);
  });
});

describe('formatUtc', () => {
  it('prints the minute in UTC', () => {
    expect(formatUtc(at('2026-11-14T09:05'))).toBe('2026-11-14 09:05 UTC');
  });
});
