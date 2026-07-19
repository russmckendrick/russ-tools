import { describe, it, expect } from 'vitest';
import {
  encodeBase64,
  decodeBase64,
  detectBase64,
  isBase64Image,
  createImagePreviewUrl,
  getFileType,
} from './base64.js';

/**
 * Characterization of the base64 codec (Deferred test coverage §B).
 *
 * Every expected value below was observed by executing the code extracted
 * verbatim from `Base64ToolShadcn.jsx` — these tests pin behaviour, they do
 * not specify aspiration. The annotations follow frozen contract #6:
 * KEEP is load-bearing, KNOWN-QUIRK is pinned so a change is deliberate.
 */

describe('encodeBase64 / decodeBase64 round-trips', () => {
  it('standard: ASCII', () => {
    expect(encodeBase64('Hello world', 'standard')).toBe('SGVsbG8gd29ybGQ=');
    expect(decodeBase64('SGVsbG8gd29ybGQ=', 'standard')).toBe('Hello world');
  });

  it('standard: multi-byte unicode', () => {
    expect(encodeBase64('café — ☕', 'standard')).toBe('Y2Fmw6kg4oCUIOKYlQ==');
    expect(decodeBase64('Y2Fmw6kg4oCUIOKYlQ==', 'standard')).toBe('café — ☕');
  });

  it('standard: supplementary-plane character (surrogate pair)', () => {
    expect(encodeBase64('G-clef 𝄞 ok', 'standard')).toBe('Ry1jbGVmIPCdhJ4gb2s=');
    expect(decodeBase64('Ry1jbGVmIPCdhJ4gb2s=', 'standard')).toBe('G-clef 𝄞 ok');
  });

  it('urlsafe: round-trips unicode', () => {
    expect(encodeBase64('café — ☕', 'urlsafe')).toBe('Y2Fmw6kg4oCUIOKYlQ');
    expect(decodeBase64('Y2Fmw6kg4oCUIOKYlQ', 'urlsafe')).toBe('café — ☕');
  });

  it('mime: round-trips long text', () => {
    const long = 'The quick brown fox jumps over the lazy dog. '.repeat(4);
    expect(decodeBase64(encodeBase64(long, 'mime'), 'mime')).toBe(long);
  });

  it('an unknown type encodes as standard', () => {
    expect(encodeBase64('Hello world', 'bogus')).toBe('SGVsbG8gd29ybGQ=');
  });
});

describe('the UTF-8 mechanism is escape/unescape — pinned before any modernisation', () => {
  it('KEEP: a lone surrogate throws (TextEncoder would silently emit U+FFFD → "77+9")', () => {
    // btoa(unescape(encodeURIComponent('\uD800'))): encodeURIComponent throws
    // URIError on a lone surrogate. A TextEncoder rewrite would instead
    // produce the replacement character and encode to "77+9" — a silent
    // change of output for the same input. This pin is the tripwire.
    expect(() => encodeBase64('\uD800', 'standard')).toThrow('Encoding failed: URI malformed');
  });

  it('KEEP: decoding bytes that are not valid UTF-8 throws rather than mojibake', () => {
    // btoa('\xff\xfe') — escape/decodeURIComponent rejects invalid sequences.
    expect(() => decodeBase64(btoa('\xff\xfe'), 'standard')).toThrow('Decoding failed');
  });
});

describe('urlsafe alphabet', () => {
  it('output never contains + / =, and maps back to the standard alphabet', () => {
    // '>>>?' encodes to Pj4+Pw== in standard — exercising +, / … and padding.
    expect(encodeBase64('>>>?', 'standard')).toBe('Pj4+Pw==');
    const urlsafe = encodeBase64('>>>?', 'urlsafe');
    expect(urlsafe).toBe('Pj4-Pw');
    expect(urlsafe).not.toMatch(/[+/=]/);
    expect(decodeBase64(urlsafe, 'urlsafe')).toBe('>>>?');
  });

  it('"/" becomes "_" and survives the round-trip', () => {
    expect(encodeBase64('a×>?ÿ', 'standard')).toBe('YcOXPj/Dvw==');
    expect(encodeBase64('a×>?ÿ', 'urlsafe')).toBe('YcOXPj_Dvw');
    expect(decodeBase64('YcOXPj_Dvw', 'urlsafe')).toBe('a×>?ÿ');
  });
});

describe('mime line breaks', () => {
  it('wraps at 76 characters', () => {
    const long = 'The quick brown fox jumps over the lazy dog. '.repeat(4);
    const lines = encodeBase64(long, 'mime').split('\n');
    expect(lines.map((l) => l.length)).toEqual([76, 76, 76, 12]);
  });

  it('short input gains no line break', () => {
    expect(encodeBase64('Hello world', 'mime')).toBe('SGVsbG8gd29ybGQ=');
  });

  it('the decoder tolerates embedded whitespace and newlines in every mode', () => {
    expect(decodeBase64('SGVs bG8g\nd29y bGQ=', 'standard')).toBe('Hello world');
    expect(decodeBase64('SGVs\nbG8gd29ybGQ=', 'mime')).toBe('Hello world');
  });
});

describe('detectBase64 validation', () => {
  it('accepts standard input', () => {
    expect(detectBase64('SGVsbG8gd29ybGQ=')).toBe(true);
  });

  it('accepts URL-safe input', () => {
    expect(detectBase64('SGVsbG8_d29ybGQ-')).toBe(true);
  });

  it('rejects wrong-length input', () => {
    expect(detectBase64('SGVsbG8')).toBe(false);
  });

  it('rejects invalid characters', () => {
    expect(detectBase64('SGVs!!*bG8=')).toBe(false);
  });

  it('rejects input shorter than 4 characters', () => {
    expect(detectBase64('abc')).toBe(false);
  });

  it('KEEP: rejects a mix of the two alphabets — each regex is tested alone', () => {
    expect(detectBase64('ab+_')).toBe(false);
  });
});

describe('image signature detection', () => {
  const jpeg = '/9j/' + 'A'.repeat(120);

  it('/9j/ is detected as JPEG', () => {
    expect(isBase64Image(jpeg)).toBe(true);
    expect(createImagePreviewUrl(jpeg)).toBe(`data:image/jpeg;base64,${jpeg}`);
  });

  it('iVBORw0KGgo is detected as PNG', () => {
    const png = 'iVBORw0KGgo' + 'A'.repeat(121);
    expect(isBase64Image(png)).toBe(true);
    expect(createImagePreviewUrl(png)).toBe(`data:image/png;base64,${png}`);
  });

  it('a short non-image string is not misidentified', () => {
    expect(isBase64Image('SGVsbG8gd29ybGQ=')).toBe(false);
    expect(isBase64Image('A'.repeat(500))).toBe(false);
    expect(createImagePreviewUrl('SGVsbG8gd29ybGQ=')).toBe(null);
  });

  it('KNOWN-QUIRK: any valid base64 over 1000 chars is presumed an image', () => {
    // `isLikelyImage = length > 1000 && length % 4 === 0` — no signature
    // required. A long base64 text file therefore gets the image treatment.
    // Pinned so that fixing it is a deliberate, logged change.
    expect(isBase64Image('A'.repeat(1500))).toBe(true);
  });

  it('a data: URL passes straight through', () => {
    expect(isBase64Image('data:image/png;base64,xyz')).toBe(true);
    expect(createImagePreviewUrl('data:image/png;base64,xyz')).toBe('data:image/png;base64,xyz');
  });

  it('KNOWN-QUIRK: decodeBase64 double-decodes when the payload looks like an image, and throws on the raw bytes', () => {
    // decodeBase64 checks isBase64Image(decoded) and, when true, decodes a
    // second time then UTF-8-interprets raw image bytes — which throws.
    expect(() => decodeBase64(btoa('/9j/' + 'A'.repeat(120)), 'standard')).toThrow(
      'Decoding failed: URI malformed'
    );
  });
});

describe('getFileType', () => {
  it('classifies by extension, case-insensitively', () => {
    expect(getFileType('photo.PNG')).toBe('image');
    expect(getFileType('notes.txt')).toBe('text');
    expect(getFileType('report.pdf')).toBe('document');
  });

  it('unknown or missing extensions are "other"', () => {
    expect(getFileType('README')).toBe('other');
    expect(getFileType('')).toBe('other');
    expect(getFileType('archive.zip')).toBe('other');
  });
});
