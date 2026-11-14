import { createHmacMd5, createMd5 } from './md5.js';

export const ALGORITHMS = [
  { id: 'md5', label: 'MD5', bits: 128, insecure: true },
  { id: 'sha1', label: 'SHA-1', bits: 160, subtle: 'SHA-1' },
  { id: 'sha256', label: 'SHA-256', bits: 256, subtle: 'SHA-256' },
  { id: 'sha384', label: 'SHA-384', bits: 384, subtle: 'SHA-384' },
  { id: 'sha512', label: 'SHA-512', bits: 512, subtle: 'SHA-512' },
];

export const MAX_FILE_BYTES = 512 * 1024 * 1024;
export const FILE_CHUNK_BYTES = 2 * 1024 * 1024;

const encoder = new TextEncoder();

export const utf8 = (text) => encoder.encode(text);

export function toHex(bytes) {
  let out = '';
  for (const byte of bytes) out += byte.toString(16).padStart(2, '0');
  return out;
}

export function toBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function subtleDigests(bytes, keyBytes) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('This browser does not expose WebCrypto on this page.');
  const entries = await Promise.all(
    ALGORITHMS.filter((algorithm) => algorithm.subtle).map(async (algorithm) => {
      if (!keyBytes) return [algorithm.id, new Uint8Array(await subtle.digest(algorithm.subtle, bytes))];
      const key = await subtle.importKey(
        'raw',
        keyBytes,
        { name: 'HMAC', hash: algorithm.subtle },
        false,
        ['sign']
      );
      return [algorithm.id, new Uint8Array(await subtle.sign('HMAC', key, bytes))];
    })
  );
  return Object.fromEntries(entries);
}

const describe = (raw) =>
  ALGORITHMS.map((algorithm) => ({
    ...algorithm,
    hex: toHex(raw[algorithm.id]),
    base64: toBase64(raw[algorithm.id]),
  }));

const keyBytesOf = (key) => (typeof key === 'string' && key.length > 0 ? utf8(key) : null);

export async function hashBytes(bytes, key = '') {
  const keyBytes = keyBytesOf(key);
  const md5 = (keyBytes ? createHmacMd5(keyBytes) : createMd5()).update(bytes).digest();
  return describe({ md5, ...(await subtleDigests(bytes, keyBytes)) });
}

export function hashText(text, key = '') {
  return hashBytes(utf8(text), key);
}

export async function hashFile(file, { key = '', onProgress, signal, chunkSize = FILE_CHUNK_BYTES } = {}) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`${formatBytes(file.size)} is over the ${formatBytes(MAX_FILE_BYTES)} this page can hold in memory.`);
  }
  const keyBytes = keyBytesOf(key);
  const md5 = keyBytes ? createHmacMd5(keyBytes) : createMd5();
  const bytes = new Uint8Array(file.size);
  for (let offset = 0; offset < file.size; offset += chunkSize) {
    if (signal?.aborted) return null;
    const chunk = new Uint8Array(await file.slice(offset, offset + chunkSize).arrayBuffer());
    bytes.set(chunk, offset);
    md5.update(chunk);
    onProgress?.(Math.min(1, (offset + chunk.length) / file.size));
  }
  if (signal?.aborted) return null;
  const sha = await subtleDigests(bytes, keyBytes);
  if (signal?.aborted) return null;
  onProgress?.(1);
  return describe({ md5: md5.digest(), ...sha });
}

const HEX_LENGTHS = new Map(ALGORITHMS.map((algorithm) => [algorithm.bits / 4, algorithm.label]));

const looseBase64 = (value) => value.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');

export function compareDigest(candidate, digests) {
  const raw = typeof candidate === 'string' ? candidate.trim().replace(/^["']|["']$/g, '') : '';
  if (!raw || !digests?.length) return { status: 'empty' };

  const unprefixed = raw.replace(/^(?:hmac-)?(?:md5|sha-?(?:1|256|384|512))[:=-]\s*/i, '');
  const compact = unprefixed.replace(/\s+/g, '');
  const hex = compact.replace(/:/g, '').toLowerCase();
  const isHex = /^[0-9a-f]+$/.test(hex);

  if (isHex) {
    const hit = digests.find((digest) => digest.hex === hex);
    if (hit) return { status: 'match', id: hit.id, label: hit.label, encoding: 'hex' };
  }
  const hit = digests.find((digest) => looseBase64(digest.base64) === looseBase64(compact));
  if (hit) return { status: 'match', id: hit.id, label: hit.label, encoding: 'Base64' };

  const shape = isHex ? HEX_LENGTHS.get(hex.length) : undefined;
  return {
    status: 'none',
    hint: shape
      ? `${hex.length} hex characters is the length of ${shape}, but the value differs.`
      : isHex
        ? `${hex.length} hex characters is not the length of any digest here.`
        : 'It is not the hex or Base64 form of any digest here.',
  };
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} byte${bytes === 1 ? '' : 's'}`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}
