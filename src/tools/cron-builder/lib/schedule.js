import { normaliseCronNames } from './cron.js';

const MINUTE_MS = 60000;

const FIELDS = [
  { key: 'minute', label: 'minute', min: 0, max: 59, starMax: 59 },
  { key: 'hour', label: 'hour', min: 0, max: 23, starMax: 23 },
  { key: 'dayOfMonth', label: 'day of month', min: 1, max: 31, starMax: 31 },
  { key: 'month', label: 'month', min: 1, max: 12, starMax: 12 },
  { key: 'dayOfWeek', label: 'day of week', min: 0, max: 7, starMax: 6 },
];

const isInteger = (text) => /^\d+$/.test(text);

function expandPart(part, field) {
  const pieces = part.split('/');
  if (pieces.length > 2) return null;
  const [rangeText, stepText] = pieces;

  let step = 1;
  if (stepText !== undefined) {
    if (!isInteger(stepText)) return null;
    step = Number(stepText);
    if (step < 1) return null;
  }

  let start;
  let end;
  if (rangeText === '*') {
    start = field.min;
    end = field.starMax;
  } else if (rangeText.includes('-')) {
    const bounds = rangeText.split('-');
    if (bounds.length !== 2 || !bounds.every(isInteger)) return null;
    start = Number(bounds[0]);
    end = Number(bounds[1]);
    if (start > end) return null;
  } else {
    if (!isInteger(rangeText)) return null;
    start = Number(rangeText);
    end = stepText === undefined ? start : field.starMax;
  }

  if (start < field.min || end > field.max) return null;

  const values = [];
  for (let value = start; value <= end; value += step) values.push(value);
  return values;
}

function expandField(text, field) {
  const values = new Set();
  for (const part of text.split(',')) {
    const expanded = expandPart(part, field);
    if (!expanded) return null;
    for (const value of expanded) values.add(field.key === 'dayOfWeek' ? value % 7 : value);
  }
  return values;
}

export function daysMatchEither(dayOfMonth, dayOfWeek) {
  return !String(dayOfMonth).startsWith('*') && !String(dayOfWeek).startsWith('*');
}

export function parseCronSchedule(expression) {
  if (typeof expression !== 'string') return { ok: false, error: 'Not a cron expression' };
  const parts = normaliseCronNames(expression).trim().split(/\s+/);
  if (parts.length !== 5) return { ok: false, error: 'A cron expression has exactly five fields' };

  const schedule = { lastDayOfMonth: false, either: daysMatchEither(parts[2], parts[4]) };
  for (let index = 0; index < FIELDS.length; index += 1) {
    const field = FIELDS[index];
    if (field.key === 'dayOfMonth' && parts[index] === 'L') {
      schedule.lastDayOfMonth = true;
      schedule.dayOfMonth = new Set();
      continue;
    }
    const values = expandField(parts[index], field);
    if (!values) return { ok: false, error: `The ${field.label} field "${parts[index]}" cannot be read` };
    schedule[field.key] = values;
  }
  return { ok: true, schedule };
}

const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

const firstAfter = (values, current) => {
  let best;
  for (const value of values) {
    if (value > current && (best === undefined || value < best)) best = value;
  }
  return best;
};

function dayMatches(schedule, year, month, day) {
  const byDate = schedule.lastDayOfMonth ? day === daysInMonth(year, month) : schedule.dayOfMonth.has(day);
  const byWeekday = schedule.dayOfWeek.has(new Date(Date.UTC(year, month - 1, day)).getUTCDay());
  return schedule.either ? byDate || byWeekday : byDate && byWeekday;
}

export function nextRuns(expression, from, { count = 5, horizonYears = 5 } = {}) {
  const parsed = parseCronSchedule(expression);
  if (!parsed.ok) return { ok: false, error: parsed.error, runs: [], exhausted: false };
  const { schedule } = parsed;

  const start = new Date(Math.floor(from.getTime() / MINUTE_MS) * MINUTE_MS + MINUTE_MS);
  const limit = Date.UTC(
    start.getUTCFullYear() + horizonYears,
    start.getUTCMonth(),
    start.getUTCDate(),
    start.getUTCHours(),
    start.getUTCMinutes(),
  );

  let year = start.getUTCFullYear();
  let month = start.getUTCMonth() + 1;
  let day = start.getUTCDate();
  let hour = start.getUTCHours();
  let minute = start.getUTCMinutes();

  const nextMonth = () => {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    day = 1;
    hour = 0;
    minute = 0;
  };
  const nextDay = () => {
    day += 1;
    hour = 0;
    minute = 0;
    if (day > daysInMonth(year, month)) nextMonth();
  };
  const nextHour = () => {
    hour += 1;
    minute = 0;
    if (hour > 23) nextDay();
  };

  const runs = [];
  while (runs.length < count) {
    const time = Date.UTC(year, month - 1, day, hour, minute);
    if (time > limit) break;

    if (!schedule.month.has(month)) {
      nextMonth();
    } else if (!dayMatches(schedule, year, month, day)) {
      nextDay();
    } else if (!schedule.hour.has(hour)) {
      const later = firstAfter(schedule.hour, hour);
      if (later === undefined) {
        nextDay();
      } else {
        hour = later;
        minute = 0;
      }
    } else if (!schedule.minute.has(minute)) {
      const later = firstAfter(schedule.minute, minute);
      if (later === undefined) nextHour();
      else minute = later;
    } else {
      runs.push(new Date(time));
      minute += 1;
      if (minute > 59) nextHour();
    }
  }

  return { ok: true, runs, exhausted: runs.length < count };
}

export function nextRunsOnLocalClock(expression, from, options) {
  const wallFrom = new Date(
    Date.UTC(from.getFullYear(), from.getMonth(), from.getDate(), from.getHours(), from.getMinutes(), from.getSeconds()),
  );
  const result = nextRuns(expression, wallFrom, options);
  if (!result.ok) return result;

  const runs = [];
  for (const wall of result.runs) {
    const real = new Date(
      wall.getUTCFullYear(),
      wall.getUTCMonth(),
      wall.getUTCDate(),
      wall.getUTCHours(),
      wall.getUTCMinutes(),
    );
    const previous = runs[runs.length - 1];
    if (real.getTime() > from.getTime() && (!previous || real.getTime() > previous.getTime())) runs.push(real);
  }
  return { ...result, runs };
}

const plural = (value, unit) => `${value} ${unit}${value === 1 ? '' : 's'}`;

export function formatUntil(milliseconds) {
  if (milliseconds < MINUTE_MS) return 'in less than a minute';

  const totalMinutes = Math.floor(milliseconds / MINUTE_MS);
  const totalDays = Math.floor(totalMinutes / 1440);
  const units = [
    [Math.floor(totalDays / 365), 'year'],
    [totalDays % 365, 'day'],
    [Math.floor(totalMinutes / 60) % 24, 'hour'],
    [totalMinutes % 60, 'minute'],
  ];

  const first = units.findIndex(([value]) => value > 0);
  const shown = units.slice(first, first + 2).filter(([value]) => value > 0);
  return `in ${shown.map(([value, unit]) => plural(value, unit)).join(' ')}`;
}

export function formatUtc(date) {
  return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}
