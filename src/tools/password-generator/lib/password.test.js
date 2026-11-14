import { describe, expect, it } from 'vitest';
import {
  AMBIGUOUS_CHARS,
  DEFAULT_PASSWORD_OPTIONS,
  LOWERCASE,
  NUMBERS,
  SIMILAR_CHARS,
  SYMBOLS,
  UPPERCASE,
  buildCharset,
  enabledClasses,
  generateFromClasses,
  generatePassword,
  passwordStrength,
} from './password.js';
import { secureRandomInt, secureShuffle } from './random.js';

const options = (overrides) => ({ ...DEFAULT_PASSWORD_OPTIONS, ...overrides });
const sequence = (values) => {
  let index = 0;
  return (max) => values[index++ % values.length] % max;
};

describe('secureRandomInt', () => {
  it('stays inside the range', () => {
    for (let i = 0; i < 500; i++) {
      const value = secureRandomInt(7);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(7);
    }
  });

  it('reaches every value of a small range', () => {
    const seen = new Set();
    for (let i = 0; i < 400; i++) seen.add(secureRandomInt(4));
    expect([...seen].sort()).toEqual([0, 1, 2, 3]);
  });

  it('never calls Math.random', () => {
    const original = Math.random;
    Math.random = () => {
      throw new Error('Math.random was called');
    };
    try {
      expect(() => generatePassword(options())).not.toThrow();
    } finally {
      Math.random = original;
    }
  });
});

describe('secureShuffle', () => {
  it('keeps every item and shuffles in place', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const result = secureShuffle(items);
    expect(result).toBe(items);
    expect([...result].sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('follows the random source it is given', () => {
    expect(secureShuffle(['a', 'b', 'c'], () => 0)).toEqual(['b', 'c', 'a']);
  });
});

describe('buildCharset', () => {
  it('joins the enabled classes in order', () => {
    expect(buildCharset(options())).toBe(UPPERCASE + LOWERCASE + NUMBERS + SYMBOLS);
    expect(buildCharset(options({ includeUppercase: false, includeSymbols: false }))).toBe(LOWERCASE + NUMBERS);
  });

  it('is empty when nothing is enabled', () => {
    expect(
      buildCharset(
        options({ includeUppercase: false, includeLowercase: false, includeNumbers: false, includeSymbols: false }),
      ),
    ).toBe('');
  });

  it('removes similar and ambiguous characters', () => {
    const similar = buildCharset(options({ excludeSimilar: true }));
    expect([...SIMILAR_CHARS].some((char) => similar.includes(char))).toBe(false);
    expect(similar).toHaveLength(88 - 7);

    const ambiguous = buildCharset(options({ excludeAmbiguous: true }));
    expect([...AMBIGUOUS_CHARS].some((char) => ambiguous.includes(char))).toBe(false);
    expect(ambiguous).toHaveLength(88 - 11);
  });
});

describe('generatePassword', () => {
  it('returns the requested length from the enabled pool', () => {
    for (const length of [4, 12, 24, 64]) {
      const password = generatePassword(options({ length }));
      expect(password).toHaveLength(length);
      expect([...password].every((char) => buildCharset(options()).includes(char))).toBe(true);
    }
  });

  it('includes every enabled class', () => {
    for (let i = 0; i < 50; i++) {
      const password = generatePassword(options({ length: 4 }));
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[0-9]/);
      expect(password).toMatch(/[^A-Za-z0-9]/);
    }
  });

  it('uses only the classes that are enabled', () => {
    const password = generatePassword(
      options({ length: 40, includeUppercase: false, includeNumbers: false, includeSymbols: false }),
    );
    expect(password).toMatch(/^[a-z]{40}$/);
  });

  it('throws when no class is enabled', () => {
    expect(() =>
      generatePassword(
        options({ includeUppercase: false, includeLowercase: false, includeNumbers: false, includeSymbols: false }),
      ),
    ).toThrow('At least one character type must be selected');
  });

  it('is decided entirely by the random source', () => {
    const first = generatePassword(options({ length: 8 }), sequence([3, 1, 4, 1, 5, 9, 2, 6]));
    const second = generatePassword(options({ length: 8 }), sequence([3, 1, 4, 1, 5, 9, 2, 6]));
    expect(first).toBe(second);
    expect(first).toHaveLength(8);
  });

  it('draws the guaranteed character of a class from what the exclusions leave', () => {
    const upperOnly = { includeLowercase: false, includeNumbers: false, includeSymbols: false };
    const password = generatePassword(options({ length: 1, excludeSimilar: true, ...upperOnly }), () =>
      UPPERCASE.indexOf('O'),
    );
    expect(password).not.toBe('O');
    expect(SIMILAR_CHARS).not.toContain(password);
    expect(UPPERCASE).toContain(password);
  });

  it.each([
    ['similar characters', { excludeSimilar: true }, SIMILAR_CHARS],
    ['ambiguous symbols', { excludeAmbiguous: true }, AMBIGUOUS_CHARS],
    ['both', { excludeSimilar: true, excludeAmbiguous: true }, SIMILAR_CHARS + AMBIGUOUS_CHARS],
  ])('never emits an excluded character with %s excluded', (name, exclusions, excluded) => {
    for (const length of [4, 5, 8, 24]) {
      for (let i = 0; i < 500; i++) {
        const password = generatePassword(options({ length, ...exclusions }));
        expect(password).toHaveLength(length);
        const leaked = [...password].filter((char) => excluded.includes(char));
        expect(leaked).toEqual([]);
      }
    }
  });

  it('still includes every enabled class when exclusions are on', () => {
    for (let i = 0; i < 200; i++) {
      const password = generatePassword(options({ length: 4, excludeSimilar: true, excludeAmbiguous: true }));
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[0-9]/);
      expect(password).toMatch(/[^A-Za-z0-9]/);
    }
  });

  it('never emits an excluded character with only one class enabled', () => {
    const classes = ['includeUppercase', 'includeLowercase', 'includeNumbers', 'includeSymbols'];
    for (const enabled of classes) {
      const only = Object.fromEntries(classes.map((name) => [name, name === enabled]));
      for (let i = 0; i < 300; i++) {
        const password = generatePassword(options({ length: 6, excludeSimilar: true, excludeAmbiguous: true, ...only }));
        expect([...password].filter((char) => (SIMILAR_CHARS + AMBIGUOUS_CHARS).includes(char))).toEqual([]);
      }
    }
  });

  it('skips the guarantee for a class that filtering has emptied, instead of throwing', () => {
    const calls = [];
    const randomInt = (max) => {
      calls.push(max);
      return 0;
    };
    const password = generateFromClasses(['', 'abc', ''], 4, randomInt);
    expect(password).toMatch(/^[abc]{4}$/);
    expect(calls).not.toContain(0);

    for (let i = 0; i < 200; i++) {
      expect(generateFromClasses(['', 'xyz'], 3)).toMatch(/^[xyz]{3}$/);
    }
  });

  it('throws when every class is empty', () => {
    expect(() => generateFromClasses(['', ''], 8)).toThrow('At least one character type must be selected');
  });

  it('leaves no class empty with the current character sets, whatever the exclusions', () => {
    const classes = enabledClasses(options({ excludeSimilar: true, excludeAmbiguous: true }));
    expect(classes).toHaveLength(4);
    expect(classes.every((characters) => characters.length > 0)).toBe(true);
  });
});

describe('passwordStrength', () => {
  it('describes the default settings', () => {
    expect(passwordStrength(options())).toEqual({
      level: 'Excellent',
      tone: 'text-success',
      percentage: 100,
      description: '',
      entropy: 155,
      combinations: '4.7 × 10^46',
      timeToCrack: '7.4 × 10^29 years',
      charsetSize: 88,
      poolLabel: 'Character Pool',
      pool: '88 characters',
      feedback: [],
    });
  });

  it.each([
    [4, { includeUppercase: false, includeNumbers: false, includeSymbols: false }, 'Very Weak', 18.8],
    [6, { includeUppercase: false, includeNumbers: false, includeSymbols: false }, 'Weak', 28.2],
    [8, { includeSymbols: false }, 'Fair', 47.6],
    [8, {}, 'Good', 51.7],
    [12, {}, 'Strong', 77.5],
    [13, {}, 'Excellent', 84],
  ])('rates %i characters with %o as %s', (length, overrides, level, entropy) => {
    const strength = passwordStrength(options({ length, ...overrides }));
    expect(strength.level).toBe(level);
    expect(strength.entropy).toBe(entropy);
  });

  it('lists what weakens the settings', () => {
    const strength = passwordStrength(
      options({ length: 6, includeUppercase: false, includeNumbers: false, includeSymbols: false }),
    );
    expect(strength.feedback).toEqual([
      { type: 'error', message: 'Under 8 characters' },
      { type: 'warning', message: 'Only one letter case' },
      { type: 'warning', message: 'Numbers are excluded' },
      { type: 'warning', message: 'Symbols are excluded' },
      { type: 'warning', message: 'Narrow character set' },
    ]);
  });

  it('flags a pool with no letters', () => {
    const messages = passwordStrength(options({ includeUppercase: false, includeLowercase: false })).feedback.map(
      (item) => item.message,
    );
    expect(messages).toContain('No letters included');
    expect(messages).toContain('Narrow character set');
  });
});
