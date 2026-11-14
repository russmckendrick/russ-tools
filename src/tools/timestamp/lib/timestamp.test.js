import { describe, it, expect } from 'vitest';
import {
  convertTimestamp,
  formatOffset,
  groupTimeZones,
  isValidTimeZone,
  listTimeZones,
  parseTimestamp,
  relativeTime,
  toIsoWithOffset,
  toRfc2822,
  zoneOffsetMinutes,
} from './timestamp.js';

const T = Date.UTC(2026, 10, 14, 10, 13, 30);
const SUMMER = Date.UTC(2026, 6, 1, 12, 0, 0);

describe('parseTimestamp: epoch values', () => {
  it('reads ten digits as seconds and says so', () => {
    expect(parseTimestamp('1794651210')).toEqual({
      ok: true,
      ms: 1794651210000,
      kind: 'seconds',
      assumed: true,
      note: '10 digits: read as seconds.',
    });
  });

  it('reads thirteen digits as milliseconds and says so', () => {
    expect(parseTimestamp('1794651210123')).toEqual({
      ok: true,
      ms: 1794651210123,
      kind: 'milliseconds',
      assumed: true,
      note: '13 digits: read as milliseconds.',
    });
  });

  it.each([
    ['0', 'seconds', 0],
    ['1', 'seconds', 1000],
    ['99999999999', 'seconds', 99999999999000],
    ['100000000000', 'milliseconds', 100000000000],
    ['1794651210123456', 'microseconds', 1794651210123],
    ['1794651210123456789', 'nanoseconds', 1794651210123],
  ])('picks the unit of %s by magnitude: %s', (input, kind, ms) => {
    expect(parseTimestamp(input)).toMatchObject({ ok: true, kind, ms, assumed: true });
  });

  it('keeps the fraction of a decimal seconds value', () => {
    expect(parseTimestamp('1794651210.123').ms).toBe(1794651210123);
  });

  it('reads a negative value as a time before 1970', () => {
    expect(parseTimestamp('-86400')).toMatchObject({ ok: true, ms: -86400000, kind: 'seconds' });
  });

  it('does not let leading zeros change the unit', () => {
    expect(parseTimestamp('0001794651210')).toMatchObject({ kind: 'seconds', ms: 1794651210000 });
  });

  it('obeys an explicit unit over the magnitude', () => {
    expect(parseTimestamp('1794651210', { unit: 'milliseconds' })).toEqual({
      ok: true,
      ms: 1794651210,
      kind: 'milliseconds',
      assumed: false,
      note: 'Read as milliseconds, as set.',
    });
    expect(parseTimestamp('1794651210123', { unit: 'seconds' })).toMatchObject({
      ms: 1794651210123000,
      kind: 'seconds',
    });
  });

  it('refuses a value past the end of the date range', () => {
    expect(parseTimestamp('99999999999999', { unit: 'seconds' })).toMatchObject({ ok: false });
    expect(parseTimestamp('99999999999999', { unit: 'seconds' }).error).toContain('outside the range');
  });
});

describe('parseTimestamp: dates', () => {
  it('reads ISO 8601 with a Z or a numeric offset as the instant it names', () => {
    expect(parseTimestamp('2026-11-14T10:13:30Z')).toMatchObject({ ok: true, ms: T, kind: 'iso', assumed: false });
    expect(parseTimestamp('2026-11-14T15:43:30+05:30').ms).toBe(T);
    expect(parseTimestamp('2026-11-14T05:13:30.000-0500').ms).toBe(T);
    expect(parseTimestamp('2026-11-14 10:13:30Z').ms).toBe(T);
  });

  it('reads a value with no offset in the chosen zone, and says which', () => {
    expect(parseTimestamp('2026-11-14T10:13:30', { timeZone: 'UTC' })).toMatchObject({
      ms: T,
      assumed: true,
      note: 'No offset in the value: read as UTC time.',
    });
    expect(parseTimestamp('2026-11-14T05:13:30', { timeZone: 'America/New_York' }).ms).toBe(T);
    expect(parseTimestamp('2026-11-14T15:43:30', { timeZone: 'Asia/Kolkata' }).ms).toBe(T);
  });

  it('uses the offset in force on that date, not today, for a zone with daylight saving', () => {
    expect(parseTimestamp('2026-07-01T08:00:00', { timeZone: 'America/New_York' }).ms).toBe(SUMMER);
    expect(parseTimestamp('2026-07-01T13:00:00', { timeZone: 'Europe/London' }).ms).toBe(SUMMER);
  });

  it('reads a bare date as midnight in the chosen zone', () => {
    expect(parseTimestamp('2026-11-14', { timeZone: 'UTC' })).toMatchObject({
      ms: Date.UTC(2026, 10, 14),
      note: 'Date only: read as midnight, UTC time.',
    });
    expect(parseTimestamp('2026-11-14', { timeZone: 'Asia/Tokyo' }).ms).toBe(Date.UTC(2026, 10, 13, 15));
  });

  it('reads an RFC 2822 date', () => {
    expect(parseTimestamp('Sat, 14 Nov 2026 10:13:30 +0000')).toMatchObject({ ms: T, kind: 'rfc2822' });
    expect(parseTimestamp('14 Nov 2026 05:13:30 -0500').ms).toBe(T);
    expect(parseTimestamp('Sat, 14 Nov 2026 10:13:30 GMT').ms).toBe(T);
  });

  it.each(['hello', '2026-13-45', 'tomorrow', '12:30', 'hello 5', '1794651210abc'])(
    'refuses %j rather than guessing',
    (input) => {
      const result = parseTimestamp(input);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Not an epoch value');
    }
  );

  it('reports an empty field as empty, not as an error', () => {
    expect(parseTimestamp('   ')).toEqual({ ok: false, empty: true, error: '' });
    expect(parseTimestamp(undefined)).toMatchObject({ empty: true });
  });
});

describe('zone offsets', () => {
  it('follows daylight saving', () => {
    expect(zoneOffsetMinutes(T, 'America/New_York')).toBe(-300);
    expect(zoneOffsetMinutes(SUMMER, 'America/New_York')).toBe(-240);
    expect(zoneOffsetMinutes(T, 'Europe/London')).toBe(0);
    expect(zoneOffsetMinutes(SUMMER, 'Europe/London')).toBe(60);
  });

  it('handles half-hour and quarter-hour zones', () => {
    expect(zoneOffsetMinutes(T, 'Asia/Kolkata')).toBe(330);
    expect(zoneOffsetMinutes(T, 'Asia/Kathmandu')).toBe(345);
  });

  it('formats an offset with and without the colon', () => {
    expect(formatOffset(0)).toBe('+00:00');
    expect(formatOffset(330)).toBe('+05:30');
    expect(formatOffset(-300)).toBe('-05:00');
    expect(formatOffset(-570, false)).toBe('-0930');
  });

  it('tells a real zone from a made-up one', () => {
    expect(isValidTimeZone('Europe/London')).toBe(true);
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus_Mons')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });
});

describe('output forms', () => {
  it('writes ISO 8601 with the zone offset', () => {
    expect(toIsoWithOffset(T, 'UTC')).toBe('2026-11-14T10:13:30.000+00:00');
    expect(toIsoWithOffset(T, 'Asia/Kolkata')).toBe('2026-11-14T15:43:30.000+05:30');
    expect(toIsoWithOffset(T + 123, 'America/New_York')).toBe('2026-11-14T05:13:30.123-05:00');
  });

  it('writes RFC 2822 in the zone, crossing the date line when the zone does', () => {
    expect(toRfc2822(T, 'UTC')).toBe('Sat, 14 Nov 2026 10:13:30 +0000');
    expect(toRfc2822(T, 'America/New_York')).toBe('Sat, 14 Nov 2026 05:13:30 -0500');
    expect(toRfc2822(Date.UTC(2026, 10, 14, 22, 0, 0), 'Asia/Tokyo')).toBe('Sun, 15 Nov 2026 07:00:00 +0900');
    expect(toRfc2822(Date.UTC(2026, 0, 5, 3, 4, 5), 'UTC')).toBe('Mon, 05 Jan 2026 03:04:05 +0000');
  });

  it('round-trips every form it writes', () => {
    for (const timeZone of ['UTC', 'America/New_York', 'Asia/Kolkata', 'Australia/Lord_Howe']) {
      const out = convertTimestamp(T, { timeZone, now: T, locale: 'en-GB' });
      for (const value of [out.isoUtc, out.isoOffset, out.rfc2822, out.seconds, out.milliseconds]) {
        expect(parseTimestamp(value).ms, `${timeZone}: ${value}`).toBe(T);
      }
    }
  });

  it('describes the distance from now in words, both ways', () => {
    expect(relativeTime(T, T)).toBe('now');
    expect(relativeTime(T - 500, T)).toBe('now');
    expect(relativeTime(T - 3 * 3600 * 1000, T)).toBe('3 hours ago');
    expect(relativeTime(T + 2 * 86400 * 1000, T)).toBe('in 2 days');
    expect(relativeTime(T - 45 * 1000, T)).toBe('45 seconds ago');
  });

  it('gathers every form for one instant', () => {
    const out = convertTimestamp(T, { timeZone: 'America/New_York', now: T + 3 * 3600 * 1000, locale: 'en-GB' });
    expect(out.zoned).toMatch(/^Saturday,? 14 November 2026 at 05:13:30 /);
    expect(out.utc).toMatch(/^Saturday,? 14 November 2026 at 10:13:30 UTC$/);
    expect(out).toMatchObject({
      timeZone: 'America/New_York',
      offset: '-05:00',
      isoUtc: '2026-11-14T10:13:30.000Z',
      isoOffset: '2026-11-14T05:13:30.000-05:00',
      rfc2822: 'Sat, 14 Nov 2026 05:13:30 -0500',
      relative: '3 hours ago',
      seconds: '1794651210',
      milliseconds: '1794651210000',
    });
  });

  it('floors the seconds form for a time before 1970', () => {
    expect(convertTimestamp(-1500, { now: 0 }).seconds).toBe('-2');
    expect(convertTimestamp(-1500, { now: 0 }).milliseconds).toBe('-1500');
  });
});

describe('time zone list', () => {
  it('always offers UTC, once', () => {
    const zones = listTimeZones();
    expect(zones.filter((zone) => zone === 'UTC')).toHaveLength(1);
    expect(zones.length).toBeGreaterThan(10);
  });

  it('only lists zones Intl will accept', () => {
    expect(listTimeZones().filter((zone) => !isValidTimeZone(zone))).toEqual([]);
  });

  it('groups by region, keeping the order within each', () => {
    expect(groupTimeZones(['UTC', 'Africa/Cairo', 'Europe/London', 'Africa/Lagos'])).toEqual([
      { region: 'Universal', zones: ['UTC'] },
      { region: 'Africa', zones: ['Africa/Cairo', 'Africa/Lagos'] },
      { region: 'Europe', zones: ['Europe/London'] },
    ]);
  });
});
