import { describe, it, expect } from 'vitest';
import { createHash, createHmac } from 'node:crypto';
import {
  ALGORITHMS,
  MAX_FILE_BYTES,
  compareDigest,
  formatBytes,
  hashBytes,
  hashFile,
  hashText,
  toBase64,
  toHex,
} from './hash.js';

const NODE_NAMES = { md5: 'md5', sha1: 'sha1', sha256: 'sha256', sha384: 'sha384', sha512: 'sha512' };

const byId = (digests) => Object.fromEntries(digests.map((digest) => [digest.id, digest]));

const patterned = (length) => {
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) bytes[i] = (i * 17 + 3) & 0xff;
  return bytes;
};

describe('encoders', () => {
  it('renders hex in lower case with leading zeros', () => {
    expect(toHex(new Uint8Array([0, 1, 15, 16, 255]))).toBe('00010f10ff');
  });

  it('renders padded standard Base64', () => {
    expect(toBase64(new Uint8Array([0xfb, 0xff]))).toBe('+/8=');
  });
});

describe('hashText', () => {
  it('returns the five algorithms in a fixed order', async () => {
    const digests = await hashText('abc');
    expect(digests.map((digest) => digest.id)).toEqual(ALGORITHMS.map((algorithm) => algorithm.id));
  });

  it('marks MD5, and only MD5, as not for security', async () => {
    const digests = await hashText('abc');
    expect(digests.filter((digest) => digest.insecure).map((digest) => digest.id)).toEqual(['md5']);
  });

  it('matches the published vectors for "abc"', async () => {
    const digests = byId(await hashText('abc'));
    expect(digests.md5.hex).toBe('900150983cd24fb0d6963f7d28e17f72');
    expect(digests.sha1.hex).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
    expect(digests.sha256.hex).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
    expect(digests.sha256.base64).toBe('ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=');
  });

  it('hashes the empty string rather than refusing it', async () => {
    const digests = byId(await hashText(''));
    expect(digests.md5.hex).toBe('d41d8cd98f00b204e9800998ecf8427e');
    expect(digests.sha256.hex).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    );
  });

  it('hashes the UTF-8 bytes of non-ASCII text', async () => {
    const text = 'naïve café ☕ 日本語';
    const digests = byId(await hashText(text));
    for (const [id, name] of Object.entries(NODE_NAMES)) {
      expect(digests[id].hex, id).toBe(createHash(name).update(text, 'utf8').digest('hex'));
    }
  });

  it('switches every algorithm to HMAC when a key is given', async () => {
    const digests = byId(await hashText('what do ya want for nothing?', 'Jefe'));
    expect(digests.md5.hex).toBe('750c783e6ab0b503eaa86e310a5db738');
    expect(digests.sha256.hex).toBe(
      '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843'
    );
    for (const [id, name] of Object.entries(NODE_NAMES)) {
      expect(digests[id].hex, id).toBe(
        createHmac(name, 'Jefe').update('what do ya want for nothing?').digest('hex')
      );
    }
  });

  it('treats an empty key as no key', async () => {
    expect(await hashText('abc', '')).toEqual(await hashText('abc'));
  });
});

describe('hashFile', () => {
  it('reads in chunks and agrees with the one-shot digest', async () => {
    const bytes = patterned(300_000);
    const file = new File([bytes], 'sample.bin');
    const progress = [];
    const digests = await hashFile(file, {
      chunkSize: 64 * 1024,
      onProgress: (fraction) => progress.push(fraction),
    });

    expect(digests).toEqual(await hashBytes(bytes));
    expect(progress.length).toBeGreaterThanOrEqual(5);
    expect(progress.at(-1)).toBe(1);
    expect([...progress].sort((a, b) => a - b)).toEqual(progress);
  });

  it('applies the HMAC key to a file too', async () => {
    const bytes = patterned(70_000);
    const digests = byId(await hashFile(new File([bytes], 'sample.bin'), { key: 'secret', chunkSize: 4096 }));
    for (const [id, name] of Object.entries(NODE_NAMES)) {
      expect(digests[id].hex, id).toBe(createHmac(name, 'secret').update(bytes).digest('hex'));
    }
  });

  it('hashes an empty file', async () => {
    const digests = byId(await hashFile(new File([], 'empty')));
    expect(digests.sha1.hex).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
  });

  it('stops and returns nothing when aborted between chunks', async () => {
    const controller = new AbortController();
    const file = new File([patterned(50_000)], 'sample.bin');
    const result = await hashFile(file, {
      chunkSize: 1024,
      signal: controller.signal,
      onProgress: () => controller.abort(),
    });
    expect(result).toBeNull();
  });

  it('refuses a file larger than it can hold in memory, before reading it', async () => {
    const tooBig = { size: MAX_FILE_BYTES + 1, slice: () => { throw new Error('read'); } };
    await expect(hashFile(tooBig)).rejects.toThrow(/over the 512 MB/);
  });
});

describe('compareDigest', () => {
  const digestsOf = () => hashText('abc');

  it('says nothing for an empty field', async () => {
    expect(compareDigest('   ', await digestsOf())).toEqual({ status: 'empty' });
  });

  it('matches hex in any case, with spaces or colons', async () => {
    const digests = await digestsOf();
    const sha1 = 'A9:99:3E:36:47:06:81:6A:BA:3E:25:71:78:50:C2:6C:9C:D0:D8:9D';
    expect(compareDigest(sha1, digests)).toMatchObject({ status: 'match', id: 'sha1', encoding: 'hex' });
    expect(compareDigest('  900150983CD24FB0 D6963F7D28E17F72 ', digests)).toMatchObject({
      status: 'match',
      id: 'md5',
    });
  });

  it('matches Base64, URL-safe Base64 and an unpadded value', async () => {
    const digests = await digestsOf();
    expect(compareDigest('ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=', digests)).toMatchObject({
      status: 'match',
      id: 'sha256',
      encoding: 'Base64',
    });
    expect(compareDigest('ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0', digests)).toMatchObject({
      status: 'match',
      id: 'sha256',
    });
  });

  it('reads through an algorithm prefix, including the SRI form', async () => {
    const digests = await digestsOf();
    expect(
      compareDigest('sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', digests)
    ).toMatchObject({ status: 'match', id: 'sha256' });
    expect(compareDigest('sha256-ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=', digests)).toMatchObject({
      status: 'match',
      id: 'sha256',
    });
  });

  it('names the algorithm a mismatched hex value is the length of', async () => {
    const result = compareDigest('0'.repeat(64), await digestsOf());
    expect(result.status).toBe('none');
    expect(result.hint).toContain('SHA-256');
  });

  it('says when a value is the shape of no digest at all', async () => {
    const digests = await digestsOf();
    expect(compareDigest('abcdef', digests).hint).toContain('not the length of any digest');
    expect(compareDigest('not a digest!', digests).hint).toContain('not the hex or Base64 form');
  });
});

describe('formatBytes', () => {
  it.each([
    [0, '0 bytes'],
    [1, '1 byte'],
    [1023, '1023 bytes'],
    [1024, '1.0 KB'],
    [1536, '1.5 KB'],
    [150 * 1024 * 1024, '150 MB'],
    [MAX_FILE_BYTES, '512 MB'],
  ])('%i → %s', (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected);
  });
});
