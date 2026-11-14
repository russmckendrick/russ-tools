const BLOCK = /-----BEGIN ([A-Z0-9 ]+?)-----([\s\S]*?)-----END \1-----/g;

const KINDS = {
  CERTIFICATE: 'certificate',
  'X509 CERTIFICATE': 'certificate',
  'CERTIFICATE REQUEST': 'csr',
  'NEW CERTIFICATE REQUEST': 'csr',
};

const LABELS = { certificate: 'CERTIFICATE', csr: 'CERTIFICATE REQUEST' };
const CODES = { certificate: 'c', csr: 'r', unknown: 'u' };
const KIND_OF_CODE = { c: 'certificate', r: 'csr', u: 'unknown' };

export const MAX_PEM_LENGTH = 200_000;

const kindOf = (label) =>
  KINDS[label] ?? (/PRIVATE KEY$/.test(label) ? 'private-key' : 'other');

export function splitPem(text) {
  if (typeof text !== 'string' || text.length > MAX_PEM_LENGTH) return [];
  const blocks = [];
  for (const match of text.matchAll(BLOCK)) {
    const label = match[1].trim();
    const kind = kindOf(label);
    blocks.push({
      label,
      kind,
      base64: kind === 'private-key' ? '' : match[2].replace(/\s+/g, ''),
    });
  }
  if (blocks.length) return blocks;
  const bare = text.replace(/\s+/g, '');
  if (/^MI[A-Za-z0-9+/]{60,}={0,2}$/.test(bare)) {
    return [{ label: '', kind: 'unknown', base64: bare }];
  }
  return [];
}

export const isDecodable = (block) => block.kind in CODES;

export function hasPem(text) {
  return typeof text === 'string' && text.includes('-----BEGIN ') && splitPem(text).some(isDecodable);
}

export function toBytes(base64) {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64) || base64.length % 4 === 1) {
    throw new Error('The block is not valid base64.');
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function toBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export function toPem(kind, base64) {
  const label = LABELS[kind];
  if (!label) return base64;
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
}

export function bytesToText(bytes) {
  return bytes[0] === 0x30 ? toBase64(bytes) : new TextDecoder().decode(bytes);
}

export function toFragment(text) {
  return splitPem(text)
    .filter(isDecodable)
    .map(
      (block) =>
        `${CODES[block.kind]}.${block.base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`
    )
    .join('~');
}

export function fromFragment(fragment) {
  if (typeof fragment !== 'string' || fragment.length > MAX_PEM_LENGTH) return '';
  const blocks = [];
  for (const part of fragment.split('~')) {
    const match = /^([cru])\.([A-Za-z0-9_-]+)$/.exec(part);
    if (!match) return '';
    const base64 = match[2].replace(/-/g, '+').replace(/_/g, '/');
    blocks.push(toPem(KIND_OF_CODE[match[1]], base64 + '='.repeat((4 - (base64.length % 4)) % 4)));
  }
  return blocks.join('\n');
}
