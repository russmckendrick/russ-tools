import { describe, expect, it } from 'vitest';
import { cleanHostname, isHostname } from './hostname.js';

/**
 * The one behaviour that matters here is the one that differs from the three
 * domain regexes already in the repo: a bare word is NOT a hostname.
 *
 * `detectBase64('test')` is true and every existing `isValidDomain('test')` is
 * also true, so without this rule the paste dispatcher has no way to tell a
 * word from a blob. Requiring a real dotted name is the tie-break.
 */

describe('isHostname', () => {
  it.each(['example.com', 'sub.example.co.uk', 'a-b.example.io', 'EXAMPLE.COM', 'xn--bcher-kva.example'])(
    'accepts %s',
    (value) => {
      expect(isHostname(value)).toBe(true);
    }
  );

  it.each([
    ['test', 'a bare word — this is the collision with base64'],
    ['abcd', 'a bare word that is also valid base64'],
    ['', 'empty'],
    ['   ', 'whitespace'],
    ['10.0.0.1', 'an IPv4 address: the TLD must be alphabetic'],
    ['example.', 'a trailing dot with nothing after it'],
    ['-example.com', 'a label may not start with a hyphen'],
    ['example-.com', 'a label may not end with a hyphen'],
    ['exa mple.com', 'a space'],
    ['example..com', 'an empty label'],
  ])('rejects %s (%s)', (value) => {
    expect(isHostname(value)).toBe(false);
  });

  it('rejects a name longer than 253 octets', () => {
    expect(isHostname(`${'a'.repeat(60)}.`.repeat(5) + 'com')).toBe(false);
  });

  it('accepts what cleanHostname can reduce to a name', () => {
    expect(isHostname('https://example.com/pricing?ref=1')).toBe(true);
    expect(isHostname('russ@mckendrick.io')).toBe(true);
  });
});

describe('cleanHostname', () => {
  it.each([
    ['https://example.com/pricing', 'example.com'],
    ['http://EXAMPLE.com', 'example.com'],
    ['example.com/path#frag', 'example.com'],
    ['example.com.', 'example.com'],
    ['  example.com  ', 'example.com'],
    ['russ@mckendrick.io', 'mckendrick.io'],
    ['plain', 'plain'],
    ['', ''],
  ])('%s → %s', (input, expected) => {
    expect(cleanHostname(input)).toBe(expected);
  });

  it('survives a string that only looks like a URL', () => {
    // `new URL('https://')` throws, so this falls through to the bare-string
    // path. What matters is that it neither throws nor claims to be a name.
    expect(() => cleanHostname('https://')).not.toThrow();
    expect(isHostname('https://')).toBe(false);
  });

  it('returns an empty string for a non-string', () => {
    expect(cleanHostname(null)).toBe('');
    expect(cleanHostname(undefined)).toBe('');
  });
});
