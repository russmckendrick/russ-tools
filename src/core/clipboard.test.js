import { describe, it, expect, vi, afterEach } from 'vitest';
import { copyText, readText } from './clipboard.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('copyText', () => {
  it('rejects non-strings without touching the clipboard', async () => {
    expect(await copyText(42)).toBe(false);
    expect(await copyText(undefined)).toBe(false);
  });

  it('uses the async clipboard when present', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    expect(await copyText('hello')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('reports failure when both paths are unavailable', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    // node has no document, so the execCommand fallback cannot run either.
    expect(await copyText('hello')).toBe(false);
  });
});

describe('readText', () => {
  it('returns the clipboard text when the platform allows it', async () => {
    vi.stubGlobal('navigator', { clipboard: { readText: async () => 'pasted' } });
    expect(await readText()).toBe('pasted');
  });

  it('returns null when refused — there is no fallback for paste', async () => {
    vi.stubGlobal('navigator', {
      clipboard: {
        readText: async () => {
          throw new Error('denied');
        },
      },
    });
    expect(await readText()).toBe(null);
  });

  it('returns null when the API is missing entirely', async () => {
    vi.stubGlobal('navigator', {});
    expect(await readText()).toBe(null);
  });
});
