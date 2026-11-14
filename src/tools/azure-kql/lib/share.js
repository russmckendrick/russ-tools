import { generateShareableURL, parseConfigFromURL } from '@/core';
import { fromLegacyConfig } from './legacy.js';
import { portable, restore } from './state.js';

export const SHARE_VERSION = 2;

export function sharePayload(state) {
  return { v: SHARE_VERSION, ...portable(state) };
}

export function shareUrl(state, origin) {
  return generateShareableURL(sharePayload(state), `${origin}/azure-kql`);
}

export function fromShare(config) {
  if (!config || typeof config !== 'object') return null;
  if (config.v === SHARE_VERSION) return restore(config);
  return fromLegacyConfig(config);
}

function plainBase64(text) {
  try {
    return JSON.parse(atob(text));
  } catch {
    return null;
  }
}

export function readShare(search) {
  const raw = new URLSearchParams(search).get('config');
  if (!raw) return null;
  const repaired = raw.replace(/ /g, '+');
  const legacy = repaired.startsWith('ey') ? plainBase64(repaired) : null;
  return fromShare(legacy ?? parseConfigFromURL({ get: () => repaired }));
}
