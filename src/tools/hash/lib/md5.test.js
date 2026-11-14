import { describe, it, expect } from 'vitest';
import { createHash, createHmac } from 'node:crypto';
import { createHmacMd5, createMd5, md5 } from './md5.js';

const hex = (bytes) => Buffer.from(bytes).toString('hex');
const bytesOf = (text) => new TextEncoder().encode(text);

const patterned = (length) => {
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) bytes[i] = (i * 31 + 7) & 0xff;
  return bytes;
};

describe('md5', () => {
  it.each([
    ['', 'd41d8cd98f00b204e9800998ecf8427e'],
    ['a', '0cc175b9c0f1b6a831c399e269772661'],
    ['abc', '900150983cd24fb0d6963f7d28e17f72'],
    ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'],
    ['abcdefghijklmnopqrstuvwxyz', 'c3fcd3d76192e4007dfb496cca67e13b'],
    [
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
      'd174ab98d277d9f5a5611c2c9f419d9f',
    ],
    ['1234567890'.repeat(8), '57edf4a22be3c955ac49da2e2107b67a'],
    ['The quick brown fox jumps over the lazy dog', '9e107d9d372bb6826bd81d3542a419d6'],
  ])('matches the RFC 1321 suite for %j', (text, expected) => {
    expect(hex(md5(bytesOf(text)))).toBe(expected);
  });

  it('agrees with node:crypto at every length around the block and padding boundaries', () => {
    for (let length = 0; length <= 260; length++) {
      const bytes = patterned(length);
      expect(hex(md5(bytes)), `length ${length}`).toBe(
        createHash('md5').update(bytes).digest('hex')
      );
    }
  });

  it('gives the same digest however the input is split', () => {
    const bytes = patterned(1000);
    const expected = createHash('md5').update(bytes).digest('hex');
    for (const size of [1, 3, 55, 56, 63, 64, 65, 128, 999]) {
      const hasher = createMd5();
      for (let offset = 0; offset < bytes.length; offset += size) {
        hasher.update(bytes.subarray(offset, offset + size));
      }
      expect(hex(hasher.digest()), `chunks of ${size}`).toBe(expected);
    }
  });

  it('reads a view at its own offset, not the start of the buffer', () => {
    const buffer = patterned(300);
    const view = buffer.subarray(100, 250);
    expect(hex(md5(view))).toBe(createHash('md5').update(view).digest('hex'));
  });

  it('returns the same digest when asked twice and refuses more input afterwards', () => {
    const hasher = createMd5().update(bytesOf('abc'));
    expect(hex(hasher.digest())).toBe(hex(hasher.digest()));
    expect(() => hasher.update(bytesOf('d'))).toThrow();
  });
});

describe('hmac-md5', () => {
  it('matches RFC 2202 test case 2', () => {
    const mac = createHmacMd5(bytesOf('Jefe')).update(bytesOf('what do ya want for nothing?'));
    expect(hex(mac.digest())).toBe('750c783e6ab0b503eaa86e310a5db738');
  });

  it('agrees with node:crypto for short, block-sized and over-long keys', () => {
    const message = patterned(333);
    for (const keyLength of [1, 16, 63, 64, 65, 200]) {
      const key = patterned(keyLength);
      expect(hex(createHmacMd5(key).update(message).digest()), `key of ${keyLength}`).toBe(
        createHmac('md5', key).update(message).digest('hex')
      );
    }
  });
});
