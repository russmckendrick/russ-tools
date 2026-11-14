import { describe, expect, it } from 'vitest';
import { CHAIN, LEAF, REQUEST } from './test-fixtures.js';
import {
  MAX_PEM_LENGTH,
  bytesToText,
  fromFragment,
  hasPem,
  splitPem,
  toBase64,
  toBytes,
  toFragment,
  toPem,
} from './pem.js';

const PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIFakeFakeFakeFakeFakeFakeFakeFakeFakeFakeFake\n-----END PRIVATE KEY-----';

describe('splitPem', () => {
  it('reads every block of a chain in order', () => {
    const blocks = splitPem(CHAIN);
    expect(blocks.map((block) => block.kind)).toEqual(['certificate', 'certificate', 'certificate']);
    expect(blocks[0].base64).toBe(splitPem(LEAF)[0].base64);
    expect(blocks[0].base64).toMatch(/^MII[A-Za-z0-9+/]+=*$/);
  });

  it('recognises a certificate request, old label included', () => {
    expect(splitPem(REQUEST)[0].kind).toBe('csr');
    expect(splitPem(REQUEST.replaceAll('CERTIFICATE REQUEST', 'NEW CERTIFICATE REQUEST'))[0].kind).toBe('csr');
  });

  it('survives a single-line field stripping or spacing the newlines', () => {
    const expected = splitPem(CHAIN).map((block) => block.base64);
    expect(splitPem(CHAIN.replace(/\n/g, ' ')).map((block) => block.base64)).toEqual(expected);
    expect(splitPem(CHAIN.replace(/\n/g, '')).map((block) => block.base64)).toEqual(expected);
    expect(splitPem(CHAIN.replace(/\n/g, '\r\n')).map((block) => block.base64)).toEqual(expected);
  });

  it('finds a block inside surrounding prose', () => {
    const blocks = splitPem(`subject=CN=www.example.com\nissuer=CN=Example\n${LEAF}\ntrailing notes`);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].kind).toBe('certificate');
  });

  it('never keeps the body of a private key', () => {
    const [key] = splitPem(PRIVATE_KEY);
    expect(key.kind).toBe('private-key');
    expect(key.base64).toBe('');
    expect(splitPem(PRIVATE_KEY.replaceAll('PRIVATE KEY', 'RSA PRIVATE KEY'))[0].kind).toBe('private-key');
    expect(splitPem(PRIVATE_KEY.replaceAll('PRIVATE KEY', 'ENCRYPTED PRIVATE KEY'))[0].base64).toBe('');
  });

  it('labels a block it cannot decode as other', () => {
    expect(splitPem('-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA\n-----END PUBLIC KEY-----')[0].kind).toBe('other');
  });

  it('takes bare base64 DER as an unlabelled block', () => {
    const bare = splitPem(LEAF)[0].base64;
    expect(splitPem(bare)).toEqual([{ label: '', kind: 'unknown', base64: bare }]);
    expect(splitPem('hello world')).toEqual([]);
    expect(splitPem('MIIshort')).toEqual([]);
  });

  it('returns nothing for non-strings and oversized input', () => {
    expect(splitPem(undefined)).toEqual([]);
    expect(splitPem(`${LEAF}${' '.repeat(MAX_PEM_LENGTH)}`)).toEqual([]);
  });
});

describe('hasPem', () => {
  it('is true only for armoured certificates and requests', () => {
    expect(hasPem(LEAF)).toBe(true);
    expect(hasPem(REQUEST)).toBe(true);
    expect(hasPem(PRIVATE_KEY)).toBe(false);
    expect(hasPem(splitPem(LEAF)[0].base64)).toBe(false);
    expect(hasPem('example.com')).toBe(false);
    expect(hasPem(null)).toBe(false);
  });
});

describe('bytes and base64', () => {
  it('round-trips', () => {
    const { base64 } = splitPem(LEAF)[0];
    const bytes = toBytes(base64);
    expect(bytes[0]).toBe(0x30);
    expect(toBase64(bytes)).toBe(base64);
  });

  it('rejects text that is not base64', () => {
    expect(() => toBytes('MII*not-base64')).toThrow('not valid base64');
    expect(() => toBytes('MIIBB')).toThrow('not valid base64');
  });

  it('re-armours a block at 64 columns', () => {
    const { base64 } = splitPem(LEAF)[0];
    expect(toPem('certificate', base64)).toBe(LEAF.trim());
    expect(toPem('csr', splitPem(REQUEST)[0].base64)).toBe(REQUEST.trim());
  });

  it('turns a dropped DER file into base64 and leaves a text file alone', () => {
    const { base64 } = splitPem(LEAF)[0];
    expect(bytesToText(toBytes(base64))).toBe(base64);
    expect(bytesToText(new TextEncoder().encode(LEAF))).toBe(LEAF);
  });
});

describe('the link fragment', () => {
  it('round-trips a chain and a request', () => {
    const text = `${CHAIN}\n${REQUEST}`;
    const fragment = toFragment(text);
    expect(fragment).toMatch(/^c\.[A-Za-z0-9_-]+~c\.[A-Za-z0-9_-]+~c\.[A-Za-z0-9_-]+~r\.[A-Za-z0-9_-]+$/);
    expect(splitPem(fromFragment(fragment))).toEqual(splitPem(text));
  });

  it('never carries a private key', () => {
    const fragment = toFragment(`${PRIVATE_KEY}\n${LEAF}`);
    expect(fragment.split('~')).toHaveLength(1);
    expect(fragment.startsWith('c.')).toBe(true);
    expect(toFragment(PRIVATE_KEY)).toBe('');
  });

  it('refuses a fragment it did not write', () => {
    expect(fromFragment('c.MIIB~x.nope')).toBe('');
    expect(fromFragment('pem=whatever')).toBe('');
    expect(fromFragment(undefined)).toBe('');
  });
});
