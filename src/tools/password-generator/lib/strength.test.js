import { describe, expect, it } from 'vitest';
import { describeStrength, formatCombinations, formatCrackTime, strengthLevel } from './strength.js';

describe('formatCombinations', () => {
  it.each([
    [999, '999'],
    [1500, '1.5 thousand'],
    [2500000, '2.5 million'],
    [3e9, '3.0 billion'],
    [4e12, '4.0 trillion'],
    [5e15, '5.0 quadrillion'],
    [6e18, '6.0 quintillion'],
    [7.2e30, '7.2 × 10^30'],
  ])('%d reads %s', (value, text) => {
    expect(formatCombinations(value)).toBe(text);
  });
});

describe('formatCrackTime', () => {
  const year = 31536000;

  it.each([
    [0.5, 'Instantly'],
    [1, '1 second'],
    [30, '30 seconds'],
    [120, '2 minutes'],
    [7200, '2 hours'],
    [172800, '2 days'],
    [5184000, '2 months'],
    [year, '1 year'],
    [year * 250, '250 years'],
    [year * 2500, '2.5 thousand years'],
    [year * 3.2e6, '3.2 million years'],
    [year * 4e9, '4.0 billion years'],
    [year * 5e12, '5.0 trillion years'],
    [year * 6e20, '6.0 × 10^20 years'],
  ])('%d seconds reads %s', (seconds, text) => {
    expect(formatCrackTime(seconds)).toBe(text);
  });
});

describe('strengthLevel', () => {
  it.each([
    [24.9, 'Very Weak', 10],
    [25, 'Weak', 25],
    [35, 'Fair', 45],
    [50, 'Good', 65],
    [65, 'Strong', 80],
    [80, 'Excellent', 100],
  ])('%d bits is %s', (entropy, level, percentage) => {
    expect(strengthLevel(entropy)).toMatchObject({ level, percentage });
  });
});

describe('describeStrength', () => {
  it('halves the search space and divides by a billion guesses a second', () => {
    expect(describeStrength(Math.log2(4e9), 4e9)).toMatchObject({
      entropy: 31.9,
      combinations: '4.0 billion',
      timeToCrack: '2 seconds',
      level: 'Weak',
    });
  });
});
