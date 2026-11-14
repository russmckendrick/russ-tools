import { formatDistanceStrict, parseISO } from 'date-fns';

export const MAX_DATE_MS = 8.64e15;

export const UNITS = [
  { id: 'auto', label: 'Detect from size' },
  { id: 'seconds', label: 'Seconds' },
  { id: 'milliseconds', label: 'Milliseconds' },
];

const NUMERIC = /^([+-]?)(\d+)(?:\.(\d+))?$/;
const HAS_TIME = /\d[t ]\d/i;
const HAS_OFFSET = /(?:z|[+-]\d{2}(?::?\d{2})?)$/i;
const RFC_2822 =
  /^(?:[a-z]{3},\s*)?\d{1,2}\s+[a-z]{3}\s+\d{4}\s+\d{2}:\d{2}(?::\d{2})?\s*(?:[+-]\d{4}|gmt|utc|ut|z)$/i;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FALLBACK_ZONES = [
  'UTC',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/New_York',
  'America/Sao_Paulo',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Europe/Berlin',
  'Europe/London',
  'Europe/Paris',
  'Pacific/Auckland',
];

const pad = (value, length = 2) => String(value).padStart(length, '0');

const fieldFormatters = new Map();

function fieldFormatter(timeZone) {
  if (!fieldFormatters.has(timeZone)) {
    fieldFormatters.set(
      timeZone,
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        era: 'short',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      })
    );
  }
  return fieldFormatters.get(timeZone);
}

export function isValidTimeZone(timeZone) {
  if (typeof timeZone !== 'string' || !timeZone) return false;
  try {
    fieldFormatter(timeZone);
    return true;
  } catch {
    return false;
  }
}

export function localTimeZone() {
  try {
    return new Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function listTimeZones() {
  let zones;
  try {
    zones = Intl.supportedValuesOf('timeZone');
  } catch {
    zones = FALLBACK_ZONES;
  }
  return zones.includes('UTC') ? [...zones] : ['UTC', ...zones];
}

export function groupTimeZones(zones) {
  const groups = new Map();
  for (const zone of zones) {
    const region = zone.includes('/') ? zone.slice(0, zone.indexOf('/')) : 'Universal';
    if (!groups.has(region)) groups.set(region, []);
    groups.get(region).push(zone);
  }
  return [...groups].map(([region, members]) => ({ region, zones: members }));
}

export function zoneOffsetMinutes(ms, timeZone) {
  const fields = {};
  for (const part of fieldFormatter(timeZone).formatToParts(new Date(ms))) fields[part.type] = part.value;
  const year = fields.era === 'BC' ? 1 - Number(fields.year) : Number(fields.year);
  const wall = new Date(0);
  wall.setUTCFullYear(year, Number(fields.month) - 1, Number(fields.day));
  wall.setUTCHours(Number(fields.hour), Number(fields.minute), Number(fields.second), 0);
  return Math.round((wall.getTime() - Math.floor(ms / 1000) * 1000) / 60000);
}

export function formatOffset(minutes, colon = true) {
  const sign = minutes < 0 ? '-' : '+';
  const absolute = Math.abs(minutes);
  return `${sign}${pad(Math.floor(absolute / 60))}${colon ? ':' : ''}${pad(absolute % 60)}`;
}

function wallToInstant(wall, timeZone) {
  const guess = wall - zoneOffsetMinutes(wall, timeZone) * 60000;
  return wall - zoneOffsetMinutes(guess, timeZone) * 60000;
}

const inRange = (ms) => Number.isFinite(ms) && Math.abs(ms) <= MAX_DATE_MS;

const OUT_OF_RANGE = 'That is outside the range a date can represent (about 271,821 BC to AD 275,760).';

function parseNumber(match, unit) {
  const [, sign, digits, fraction = ''] = match;
  const significant = digits.replace(/^0+(?=\d)/, '');
  const negative = sign === '-';
  const assumed = unit === 'auto';
  let kind = unit;
  if (assumed) {
    if (significant.length <= 11) kind = 'seconds';
    else if (significant.length <= 14) kind = 'milliseconds';
    else if (significant.length <= 17) kind = 'microseconds';
    else kind = 'nanoseconds';
  }

  let ms;
  if (kind === 'seconds') ms = Math.round(Number(`${digits}.${fraction || '0'}`) * 1000);
  else if (kind === 'milliseconds') ms = Math.trunc(Number(`${digits}.${fraction || '0'}`));
  else ms = Number(BigInt(digits) / (kind === 'microseconds' ? 1000n : 1000000n));
  if (negative) ms = -ms;
  if (!inRange(ms)) return { ok: false, error: OUT_OF_RANGE };

  const count = `${significant.length} digit${significant.length === 1 ? '' : 's'}`;
  return {
    ok: true,
    ms: ms === 0 ? 0 : ms,
    kind,
    assumed,
    note: assumed ? `${count}: read as ${kind}.` : `Read as ${kind}, as set.`,
  };
}

export function parseTimestamp(input, { unit = 'auto', timeZone = 'UTC' } = {}) {
  const raw = typeof input === 'string' ? input.trim() : '';
  if (!raw) return { ok: false, empty: true, error: '' };

  const numeric = NUMERIC.exec(raw);
  if (numeric) return parseNumber(numeric, unit);

  const hasTime = HAS_TIME.test(raw);
  const hasOffset = hasTime && HAS_OFFSET.test(raw);
  const parsed = parseISO(hasOffset ? raw : hasTime ? `${raw}Z` : `${raw}T00:00:00Z`);
  if (!Number.isNaN(parsed.getTime())) {
    const ms = hasOffset ? parsed.getTime() : wallToInstant(parsed.getTime(), timeZone);
    if (!inRange(ms)) return { ok: false, error: OUT_OF_RANGE };
    return {
      ok: true,
      ms,
      kind: 'iso',
      assumed: !hasOffset,
      note: hasOffset
        ? 'ISO 8601 with its own offset.'
        : hasTime
          ? `No offset in the value: read as ${timeZone} time.`
          : `Date only: read as midnight, ${timeZone} time.`,
    };
  }

  if (RFC_2822.test(raw)) {
    const ms = Date.parse(raw);
    if (inRange(ms)) return { ok: true, ms, kind: 'rfc2822', assumed: false, note: 'RFC 2822 date.' };
  }

  return {
    ok: false,
    error: 'Not an epoch value or a date this can read. Try 1794651210, 1794651210123 or 2026-11-14T10:13:30Z.',
  };
}

export function toIsoWithOffset(ms, timeZone) {
  const offset = zoneOffsetMinutes(ms, timeZone);
  return `${new Date(ms + offset * 60000).toISOString().slice(0, -1)}${formatOffset(offset)}`;
}

export function toRfc2822(ms, timeZone) {
  const offset = zoneOffsetMinutes(ms, timeZone);
  const wall = new Date(ms + offset * 60000);
  return (
    `${DAYS[wall.getUTCDay()]}, ${pad(wall.getUTCDate())} ${MONTHS[wall.getUTCMonth()]} ${wall.getUTCFullYear()} ` +
    `${pad(wall.getUTCHours())}:${pad(wall.getUTCMinutes())}:${pad(wall.getUTCSeconds())} ${formatOffset(offset, false)}`
  );
}

export function formatLong(ms, timeZone, locale) {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'long', timeZone }).format(new Date(ms));
}

export function relativeTime(ms, now) {
  if (Math.abs(ms - now) < 1000) return 'now';
  return formatDistanceStrict(new Date(ms), new Date(now), { addSuffix: true });
}

export function convertTimestamp(ms, { timeZone = 'UTC', now = Date.now(), locale } = {}) {
  return {
    timeZone,
    offset: formatOffset(zoneOffsetMinutes(ms, timeZone)),
    zoned: formatLong(ms, timeZone, locale),
    utc: formatLong(ms, 'UTC', locale),
    isoUtc: new Date(ms).toISOString(),
    isoOffset: toIsoWithOffset(ms, timeZone),
    rfc2822: toRfc2822(ms, timeZone),
    relative: relativeTime(ms, now),
    seconds: String(Math.floor(ms / 1000)),
    milliseconds: String(ms),
  };
}
