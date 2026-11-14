import { secureRandomInt, secureShuffle } from './random.js';
import { describeStrength } from './strength.js';

export const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
export const NUMBERS = '0123456789';
export const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
export const SIMILAR_CHARS = 'il1Lo0O';
export const AMBIGUOUS_CHARS = '{}[]()/\\\'"`~,;.<>';

export const DEFAULT_PASSWORD_OPTIONS = {
  length: 24,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
  excludeSimilar: false,
  excludeAmbiguous: false,
};

function applyExclusions(characters, options) {
  let kept = characters;
  if (options.excludeSimilar) {
    kept = kept.split('').filter((char) => !SIMILAR_CHARS.includes(char)).join('');
  }
  if (options.excludeAmbiguous) {
    kept = kept.split('').filter((char) => !AMBIGUOUS_CHARS.includes(char)).join('');
  }
  return kept;
}

export function enabledClasses(options) {
  const classes = [];
  if (options.includeUppercase) classes.push(UPPERCASE);
  if (options.includeLowercase) classes.push(LOWERCASE);
  if (options.includeNumbers) classes.push(NUMBERS);
  if (options.includeSymbols) classes.push(SYMBOLS);
  return classes.map((characters) => applyExclusions(characters, options));
}

export function buildCharset(options) {
  return enabledClasses(options).join('');
}

export function passwordStrength(options) {
  const { length, includeUppercase, includeLowercase, includeNumbers, includeSymbols } = options;
  const charsetSize = buildCharset(options).length;
  const possibleCombinations = Math.pow(charsetSize, length);
  const entropy = Math.log2(possibleCombinations);

  const feedback = [];

  if (length < 8) {
    feedback.push({ type: 'error', message: 'Under 8 characters' });
  } else if (length < 12) {
    feedback.push({ type: 'warning', message: 'Under 12 characters' });
  }

  if (!includeUppercase && !includeLowercase) {
    feedback.push({ type: 'error', message: 'No letters included' });
  } else if (!includeUppercase || !includeLowercase) {
    feedback.push({ type: 'warning', message: 'Only one letter case' });
  }

  if (!includeNumbers) {
    feedback.push({ type: 'warning', message: 'Numbers are excluded' });
  }

  if (!includeSymbols) {
    feedback.push({ type: 'warning', message: 'Symbols are excluded' });
  }

  if (charsetSize < 26) {
    feedback.push({ type: 'error', message: 'Character set is too limited' });
  } else if (charsetSize < 62) {
    feedback.push({ type: 'warning', message: 'Narrow character set' });
  }

  return {
    ...describeStrength(entropy, possibleCombinations),
    charsetSize,
    poolLabel: 'Character Pool',
    pool: `${charsetSize} characters`,
    feedback,
  };
}

export function generateFromClasses(classes, length, randomInt = secureRandomInt) {
  const charset = classes.join('');

  if (charset.length === 0) {
    throw new Error('At least one character type must be selected');
  }

  let password = '';

  const requiredChars = [];
  for (const characters of classes) {
    if (characters.length > 0) requiredChars.push(characters[randomInt(characters.length)]);
  }

  for (let i = 0; i < Math.min(requiredChars.length, length); i++) {
    password += requiredChars[i];
  }

  for (let i = password.length; i < length; i++) {
    password += charset[randomInt(charset.length)];
  }

  return secureShuffle(password.split(''), randomInt).join('');
}

export function generatePassword(options, randomInt = secureRandomInt) {
  return generateFromClasses(enabledClasses(options), options.length, randomInt);
}
