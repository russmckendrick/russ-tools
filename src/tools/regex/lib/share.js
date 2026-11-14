import { compressConfig, decompressConfig } from '@/core/sharelink.js';
import { MAX_TEXT, normaliseFlags } from './regex.js';

export const MAX_LINK_LENGTH = 6000;
const PREFIX = '#config=';

const text = (value, limit) => (typeof value === 'string' ? value.slice(0, limit) : '');

export function encodeState({ pattern, flags, text: sample, replacement }) {
  const payload = { v: 1, p: pattern, f: normaliseFlags(flags), t: sample };
  if (replacement) payload.r = replacement;
  return `${PREFIX}${compressConfig(payload)}`;
}

export function decodeState(hash) {
  if (typeof hash !== 'string' || !hash.startsWith(PREFIX)) return null;
  let payload;
  try {
    payload = decompressConfig(hash.slice(PREFIX.length));
  } catch {
    return null;
  }
  if (typeof payload !== 'object' || payload === null || typeof payload.p !== 'string') return null;
  return {
    pattern: text(payload.p, 10000),
    flags: normaliseFlags(text(payload.f, 16)),
    text: text(payload.t, MAX_TEXT),
    replacement: text(payload.r, 10000),
  };
}
