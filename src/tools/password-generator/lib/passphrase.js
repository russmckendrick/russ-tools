import { secureRandomInt } from './random.js';
import { describeStrength } from './strength.js';

export const WORDLIST_SIZE = 7776;
export const MIN_WORDS = 3;
export const MAX_WORDS = 10;

export const SEPARATORS = [
  { value: 'hyphen', label: 'Hyphen', character: '-' },
  { value: 'space', label: 'Space', character: ' ' },
  { value: 'dot', label: 'Dot', character: '.' },
  { value: 'underscore', label: 'Underscore', character: '_' },
  { value: 'none', label: 'None', character: '' },
];

export const DEFAULT_PASSPHRASE_OPTIONS = {
  words: 5,
  separator: 'hyphen',
  capitalise: false,
  digit: false,
};

export function separatorCharacter(value) {
  const separator = SEPARATORS.find((option) => option.value === value);
  return separator ? separator.character : '-';
}

export function clampWords(value) {
  const count = Math.round(Number(value));
  if (!Number.isFinite(count)) return DEFAULT_PASSPHRASE_OPTIONS.words;
  return Math.max(MIN_WORDS, Math.min(MAX_WORDS, count));
}

export function parseWordlist(text) {
  const words = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const word = trimmed.split(/\s+/)[1];
    if (!word) throw new Error('The word list is damaged: a line has no word');
    words.push(word);
  }
  if (words.length !== WORDLIST_SIZE || new Set(words).size !== WORDLIST_SIZE) {
    throw new Error(`The word list is damaged: expected ${WORDLIST_SIZE} different words`);
  }
  return words;
}

let wordlistPromise;

export function loadWordlist() {
  if (!wordlistPromise) {
    wordlistPromise = import('../data/eff_large_wordlist.txt?raw')
      .then((module) => parseWordlist(module.default))
      .catch((error) => {
        wordlistPromise = undefined;
        throw error;
      });
  }
  return wordlistPromise;
}

export function generatePassphrase(wordlist, options, randomInt = secureRandomInt) {
  const count = clampWords(options.words);
  const parts = [];
  for (let i = 0; i < count; i++) {
    const word = wordlist[randomInt(wordlist.length)];
    parts.push(options.capitalise ? word[0].toUpperCase() + word.slice(1) : word);
  }
  if (options.digit) {
    parts[parts.length - 1] += String(randomInt(10));
  }
  const separator = separatorCharacter(options.separator);
  return { value: parts.join(separator), parts, separator };
}

export function passphraseEntropy(options, listSize = WORDLIST_SIZE) {
  return clampWords(options.words) * Math.log2(listSize) + (options.digit ? Math.log2(10) : 0);
}

export function passphraseStrength(options, listSize = WORDLIST_SIZE) {
  const words = clampWords(options.words);
  const possibleCombinations = Math.pow(listSize, words) * (options.digit ? 10 : 1);

  const feedback = [];
  if (words < 4) {
    feedback.push({ type: 'error', message: 'Under 4 words' });
  } else if (words < 6) {
    feedback.push({ type: 'warning', message: 'Under 6 words' });
  }

  return {
    ...describeStrength(passphraseEntropy(options, listSize), possibleCombinations),
    poolLabel: 'Word List',
    pool: `${listSize.toLocaleString('en-US')} words`,
    feedback,
  };
}
