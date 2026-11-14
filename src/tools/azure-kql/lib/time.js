import { datetimeLiteral, isTimespan } from './kql.js';
import { parseDatetime } from './values.js';

export const TIME_PRESETS = ['15m', '1h', '6h', '12h', '24h', '2d', '7d', '14d', '30d', '90d'];
export const DEFAULT_TIME = { kind: 'relative', span: '24h' };

const UNITS = { s: ['second', 1], m: ['minute', 60], h: ['hour', 3600], d: ['day', 86400] };

function parts(span) {
  const count = Number(span.slice(0, -1));
  const [unit, seconds] = UNITS[span.slice(-1)];
  return { count, unit, seconds: count * seconds };
}

export function spanLabel(span) {
  if (!isTimespan(span)) return span;
  const { count, unit } = parts(span);
  return count === 1 ? `Last ${unit}` : `Last ${count} ${unit}s`;
}

export function binFor(seconds) {
  if (seconds === null) return '1h';
  if (seconds <= 3600) return '1m';
  if (seconds <= 6 * 3600) return '5m';
  if (seconds <= 2 * 86400) return '1h';
  if (seconds <= 14 * 86400) return '6h';
  return '1d';
}

export function resolveTime(time) {
  if (time?.kind === 'portal') {
    return { ok: true, where: null, phrase: 'over the time range set in the portal', seconds: null };
  }

  if (time?.kind === 'absolute') {
    const from = parseDatetime(time.from ?? '');
    const to = parseDatetime(time.to ?? '');
    if (from.empty || to.empty) return { ok: false, message: 'A custom range needs a start and an end.' };
    if (!from.ok) return { ok: false, message: `Start: ${from.message}` };
    if (!to.ok) return { ok: false, message: `End: ${to.message}` };
    const seconds = (Date.parse(to.parsed) - Date.parse(from.parsed)) / 1000;
    if (seconds <= 0) return { ok: false, message: 'The end must be after the start.' };
    return {
      ok: true,
      where: `TimeGenerated between (${datetimeLiteral(from.parsed)} .. ${datetimeLiteral(to.parsed)})`,
      phrase: `between ${from.parsed.replace('T', ' ').replace(':00Z', '')} and ${to.parsed.replace('T', ' ').replace(':00Z', '')} UTC`,
      seconds,
    };
  }

  const span = time?.span ?? '';
  if (!isTimespan(span)) return { ok: false, message: 'Use a time range such as 24h, 7d or 30m.' };
  const { count, unit, seconds } = parts(span);
  return {
    ok: true,
    where: `TimeGenerated > ago(${span})`,
    phrase: count === 1 ? `in the last ${unit}` : `in the last ${count} ${unit}s`,
    seconds,
  };
}
