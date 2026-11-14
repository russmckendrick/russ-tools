import pako from 'pako';

export const MAX_INPUT_LENGTH = 1_000_000;
export const MAX_XML_BYTES = 4_000_000;

const PARAMETERS = ['SAMLResponse', 'SAMLRequest'];
const BASE64 = /^[A-Za-z0-9+/_-]+={0,2}$/;
const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

export class SamlDecodeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SamlDecodeError';
  }
}

const withoutMark = (text) => (text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text);
const startsLikeXml = (text) => /^\s*</.test(withoutMark(text));

function percentDecode(value) {
  try {
    return decodeURIComponent(value.replace(/\+/g, '%20'));
  } catch {
    return null;
  }
}

function fromQuery(raw) {
  if (!/(?:^|[?&\s])SAML(?:Response|Request)\s*[=:]/.test(raw)) return null;

  const source = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : raw;
  const pairs = new Map();
  for (const part of source.split(/[&\r\n]+/)) {
    const pair = /^\s*([A-Za-z]+)\s*[=:]\s*([\s\S]*)$/.exec(part);
    if (pair && !pairs.has(pair[1])) pairs.set(pair[1], pair[2].trimStart());
  }

  const parameter = PARAMETERS.find((name) => pairs.has(name));
  if (!parameter) return null;

  const decode = (name) => (pairs.has(name) ? percentDecode(pairs.get(name)) ?? pairs.get(name) : null);
  return {
    parameter,
    value: pairs.get(parameter),
    relayState: decode('RelayState'),
    sigAlg: decode('SigAlg'),
    signed: pairs.has('Signature'),
  };
}

function base64ToBytes(text) {
  const compact = text.replace(/\s+/g, '');
  if (!compact || !BASE64.test(compact)) return null;

  const standard = compact.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
  if (standard.length % 4 === 1) return null;
  try {
    const binary = atob(standard + '='.repeat((4 - (standard.length % 4)) % 4));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

function inflate(bytes, raw) {
  const chunks = [];
  let total = 0;
  const inflator = new pako.Inflate({ raw });
  inflator.onData = (chunk) => {
    total += chunk.length;
    if (total > MAX_XML_BYTES) throw new SamlDecodeError('The message inflates to more than 4 MB, so it was not read');
    chunks.push(chunk);
  };

  inflator.push(bytes, true);
  if (inflator.err || total === 0) return null;

  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.length;
  }
  return joined;
}

const utf8 = (bytes) => new TextDecoder('utf-8').decode(bytes);

export function decodeSaml(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return null;
  if (raw.length > MAX_INPUT_LENGTH) throw new SamlDecodeError('That is too long to be a SAML message');

  if (startsLikeXml(raw)) return { xml: withoutMark(raw), steps: ['XML'], binding: null };

  const steps = [];
  const query = fromQuery(raw);
  let value = query ? query.value : raw;
  if (query) steps.push(`${query.parameter} parameter`);

  if (/%[0-9a-f]{2}/i.test(value)) {
    const decoded = percentDecode(value);
    if (decoded === null) throw new SamlDecodeError('The URL encoding is damaged: a % is not followed by two hex digits');
    value = decoded;
    steps.push('URL-encoded');
  } else if (query && startsLikeXml(value)) {
    value = value.replace(/\+/g, ' ');
  }

  if (startsLikeXml(value)) return { xml: withoutMark(value.trim()), steps: [...steps, 'XML'], binding: query };

  const notSaml = 'That is neither XML nor base64. Paste the SAMLResponse or SAMLRequest value, or the XML itself';
  const spaced = / /.test(value.trim());
  const bytes = base64ToBytes(value.replace(/ /g, '+'));
  if (!bytes) throw new SamlDecodeError(notSaml);
  steps.push('Base64');

  const direct = utf8(bytes);
  if (startsLikeXml(direct)) return { xml: withoutMark(direct), steps: [...steps, 'XML'], binding: query };

  const inflated = inflate(bytes, true) ?? inflate(bytes, false);
  const text = inflated ? utf8(inflated) : '';
  if (startsLikeXml(text)) return { xml: withoutMark(text), steps: [...steps, 'DEFLATE', 'XML'], binding: query };

  throw new SamlDecodeError(
    spaced ? notSaml : 'The base64 decodes, but not to XML, and it does not inflate to XML either'
  );
}

export function encodeRedirect(xml) {
  const bytes = pako.deflateRaw(new TextEncoder().encode(xml));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function encodePost(xml) {
  let binary = '';
  for (const byte of new TextEncoder().encode(xml)) binary += String.fromCharCode(byte);
  return btoa(binary);
}
