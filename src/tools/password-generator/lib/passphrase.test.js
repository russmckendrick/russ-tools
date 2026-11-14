import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_PASSPHRASE_OPTIONS,
  SEPARATORS,
  WORDLIST_SIZE,
  clampWords,
  generatePassphrase,
  loadWordlist,
  parseWordlist,
  passphraseEntropy,
  passphraseStrength,
  separatorCharacter,
} from './passphrase.js';

const options = (overrides) => ({ ...DEFAULT_PASSPHRASE_OPTIONS, ...overrides });
const LIST = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot'];
const counter = () => {
  let index = 0;
  return (max) => index++ % max;
};

describe('the EFF large wordlist', () => {
  it('loads 7,776 different lowercase words', async () => {
    const words = await loadWordlist();
    expect(words).toHaveLength(WORDLIST_SIZE);
    expect(new Set(words).size).toBe(WORDLIST_SIZE);
    expect(words.every((word) => /^[a-z-]{3,9}$/.test(word))).toBe(true);
    expect(words[0]).toBe('abacus');
    expect(words[WORDLIST_SIZE - 1]).toBe('zoom');
  });

  it('has no word that begins another, so words run together still read one way', async () => {
    const sorted = [...(await loadWordlist())].sort();
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].startsWith(sorted[i - 1])).toBe(false);
    }
  });

  it('returns the same list on every call', async () => {
    expect(await loadWordlist()).toBe(await loadWordlist());
  });
});

describe('parseWordlist', () => {
  it('refuses a list of the wrong size', () => {
    expect(() => parseWordlist('11111\tabacus\n11112\tabdomen\n')).toThrow(/expected 7776 different words/);
  });

  it('refuses a list with a repeated word', () => {
    const lines = Array.from({ length: WORDLIST_SIZE }, (_, i) => `${i}\tword${i === 5 ? 4 : i}`);
    expect(() => parseWordlist(lines.join('\n'))).toThrow(/different words/);
  });

  it('refuses a line with no word', () => {
    expect(() => parseWordlist('11111\n')).toThrow(/no word/);
  });
});

describe('generatePassphrase', () => {
  it('joins the default five words with hyphens', () => {
    expect(generatePassphrase(LIST, options(), counter())).toEqual({
      value: 'alpha-bravo-charlie-delta-echo',
      parts: ['alpha', 'bravo', 'charlie', 'delta', 'echo'],
      separator: '-',
    });
  });

  it.each([
    ['hyphen', 'alpha-bravo-charlie'],
    ['space', 'alpha bravo charlie'],
    ['dot', 'alpha.bravo.charlie'],
    ['underscore', 'alpha_bravo_charlie'],
    ['none', 'alphabravocharlie'],
  ])('uses the %s separator', (separator, value) => {
    expect(generatePassphrase(LIST, options({ words: 3, separator }), counter()).value).toBe(value);
  });

  it('capitalises each word', () => {
    expect(generatePassphrase(LIST, options({ words: 3, capitalise: true }), counter()).value).toBe(
      'Alpha-Bravo-Charlie',
    );
  });

  it('appends one digit to the last word', () => {
    const result = generatePassphrase(LIST, options({ words: 3, digit: true }), counter());
    expect(result.value).toBe('alpha-bravo-charlie3');
    expect(result.parts).toEqual(['alpha', 'bravo', 'charlie3']);
  });

  it('draws once per word, plus once for the digit, from the given source', () => {
    const randomInt = vi.fn(() => 0);
    generatePassphrase(LIST, options({ words: 4, digit: true }), randomInt);
    expect(randomInt.mock.calls).toEqual([[6], [6], [6], [6], [10]]);
  });

  it('keeps the word count between three and ten', () => {
    expect(generatePassphrase(LIST, options({ words: 1 }), counter()).parts).toHaveLength(3);
    expect(generatePassphrase(LIST, options({ words: 99 }), counter()).parts).toHaveLength(10);
  });

  it('uses the cryptographic source by default and never Math.random', async () => {
    const words = await loadWordlist();
    const original = Math.random;
    Math.random = () => {
      throw new Error('Math.random was called');
    };
    try {
      const { parts } = generatePassphrase(words, options({ words: 10 }));
      expect(parts).toHaveLength(10);
      expect(parts.every((word) => words.includes(word))).toBe(true);
    } finally {
      Math.random = original;
    }
  });
});

describe('clampWords and separatorCharacter', () => {
  it('rounds and bounds the count', () => {
    expect(clampWords(4.6)).toBe(5);
    expect(clampWords(2)).toBe(3);
    expect(clampWords(11)).toBe(10);
    expect(clampWords('nope')).toBe(5);
  });

  it('falls back to a hyphen for an unknown separator', () => {
    expect(separatorCharacter('wat')).toBe('-');
    expect(SEPARATORS.map((option) => option.value)).toEqual(['hyphen', 'space', 'dot', 'underscore', 'none']);
  });
});

describe('passphrase entropy', () => {
  it('is the word count times log2(7776)', () => {
    expect(passphraseEntropy(options({ words: 1 }))).toBeCloseTo(3 * 12.9248, 3);
    expect(passphraseEntropy(options({ words: 5 }))).toBeCloseTo(64.624, 3);
    expect(passphraseEntropy(options({ words: 10 }))).toBeCloseTo(129.248, 3);
  });

  it('adds log2(10) for the digit and nothing for capitals or the separator', () => {
    const base = passphraseEntropy(options());
    expect(passphraseEntropy(options({ digit: true })) - base).toBeCloseTo(Math.log2(10), 10);
    expect(passphraseEntropy(options({ capitalise: true }))).toBe(base);
    expect(passphraseEntropy(options({ separator: 'none' }))).toBe(base);
  });

  it('does not use the character-pool sum', () => {
    const fiveWords = passphraseStrength(options());
    expect(fiveWords.entropy).toBe(64.6);
    expect(fiveWords).not.toHaveProperty('charsetSize');
    expect(fiveWords.poolLabel).toBe('Word List');
    expect(fiveWords.pool).toBe('7,776 words');
  });
});

describe('passphraseStrength', () => {
  it.each([
    [3, 'Fair', 38.8, [{ type: 'error', message: 'Under 4 words' }]],
    [4, 'Good', 51.7, [{ type: 'warning', message: 'Under 6 words' }]],
    [5, 'Good', 64.6, [{ type: 'warning', message: 'Under 6 words' }]],
    [6, 'Strong', 77.5, []],
    [7, 'Excellent', 90.5, []],
  ])('rates %i words as %s', (words, level, entropy, feedback) => {
    expect(passphraseStrength(options({ words }))).toMatchObject({ level, entropy, feedback });
  });

  it('counts the combinations and the time to search half of them', () => {
    expect(passphraseStrength(options())).toMatchObject({
      combinations: '28.4 quintillion',
      timeToCrack: '451 years',
    });
    expect(passphraseStrength(options({ digit: true })).combinations).toBe('284.3 quintillion');
  });
});
