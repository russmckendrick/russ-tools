/**
 * CRON expression validation, extracted verbatim from `island.jsx` so it can
 * be tested and so the homepage's paste dispatcher can ask "is this a cron
 * expression?" without importing a React island.
 *
 * Behaviour is unchanged from the island's private copy — including its
 * quirks, which are pinned by `cron.test.js` rather than fixed here:
 * `parseInt` accepts a trailing tail (`5x` reads as 5), a step's base is only
 * bounds-checked and not its own range, and `L` is honoured for day-of-month
 * only. Changing any of that is a behaviour change and belongs in its own PR
 * with a `docs/BEHAVIOR_CHANGES.md` entry.
 */

const validateRange = (value, min, max) => {
  if (value === '*') return true;
  if (value.includes(',')) {
    return value.split(',').every((v) => {
      const num = parseInt(v);
      return !isNaN(num) && num >= min && num <= max;
    });
  }
  if (value.includes('/')) {
    const [base, step] = value.split('/');
    if (base === '*' || (parseInt(base) >= min && parseInt(base) <= max)) {
      return parseInt(step) > 0;
    }
    return false;
  }
  if (value.includes('-')) {
    const [start, end] = value.split('-');
    return parseInt(start) >= min && parseInt(end) <= max && parseInt(start) <= parseInt(end);
  }
  const num = parseInt(value);
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * @param {string} cronString
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateCronExpression(cronString) {
  try {
    const parts = cronString.trim().split(/\s+/);
    if (parts.length !== 5) {
      return { valid: false, error: 'CRON expression must have exactly 5 fields' };
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    if (!validateRange(minute, 0, 59)) {
      return { valid: false, error: 'Invalid minute value (0-59)' };
    }
    if (!validateRange(hour, 0, 23)) {
      return { valid: false, error: 'Invalid hour value (0-23)' };
    }
    if (!validateRange(dayOfMonth, 1, 31) && dayOfMonth !== 'L') {
      return { valid: false, error: 'Invalid day of month value (1-31 or L)' };
    }
    if (!validateRange(month, 1, 12)) {
      return { valid: false, error: 'Invalid month value (1-12)' };
    }
    if (!validateRange(dayOfWeek, 0, 7)) {
      return { valid: false, error: 'Invalid day of week value (0-7)' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid CRON expression format' };
  }
}

/**
 * A cheaper gate for the paste dispatcher.
 *
 * `validateCronExpression` alone is too generous to sniff with: `parseInt`
 * makes `5x` read as 5, so a five-word sentence of numbers-with-tails would
 * validate. Requiring every field to be drawn from the cron alphabet first is
 * what keeps arbitrary text out — no hostname, JWT or base64 value survives it.
 */
export function looksLikeCron(input) {
  if (typeof input !== 'string') return false;
  const parts = input.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  if (!parts.every((part) => /^[\d*,/\-LW?#]+$/.test(part))) return false;
  return validateCronExpression(input).valid;
}
