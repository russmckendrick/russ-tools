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

export function buildCharset(options) {
  let charset = '';
  if (options.includeUppercase) charset += UPPERCASE;
  if (options.includeLowercase) charset += LOWERCASE;
  if (options.includeNumbers) charset += NUMBERS;
  if (options.includeSymbols) charset += SYMBOLS;

  if (options.excludeSimilar) {
    charset = charset.split('').filter((char) => !SIMILAR_CHARS.includes(char)).join('');
  }
  if (options.excludeAmbiguous) {
    charset = charset.split('').filter((char) => !AMBIGUOUS_CHARS.includes(char)).join('');
  }
  return charset;
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

export function generatePassword(options, randomInt = secureRandomInt) {
  const { length, includeUppercase, includeLowercase, includeNumbers, includeSymbols } = options;
  const charset = buildCharset(options);

  if (charset.length === 0) {
    throw new Error('At least one character type must be selected');
  }

  let password = '';

  const requiredChars = [];
  if (includeUppercase) requiredChars.push(UPPERCASE[randomInt(UPPERCASE.length)]);
  if (includeLowercase) requiredChars.push(LOWERCASE[randomInt(LOWERCASE.length)]);
  if (includeNumbers) requiredChars.push(NUMBERS[randomInt(NUMBERS.length)]);
  if (includeSymbols) requiredChars.push(SYMBOLS[randomInt(SYMBOLS.length)]);

  for (let i = 0; i < Math.min(requiredChars.length, length); i++) {
    password += requiredChars[i];
  }

  for (let i = password.length; i < length; i++) {
    password += charset[randomInt(charset.length)];
  }

  return secureShuffle(password.split(''), randomInt).join('');
}
