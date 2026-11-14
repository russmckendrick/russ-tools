export const GUESSES_PER_SECOND = 1000000000;

export function formatCombinations(num) {
  if (num < 1000) return Math.round(num).toLocaleString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)} thousand`;
  if (num < 1000000000) return `${(num / 1000000).toFixed(1)} million`;
  if (num < 1000000000000) return `${(num / 1000000000).toFixed(1)} billion`;
  if (num < 1000000000000000) return `${(num / 1000000000000).toFixed(1)} trillion`;
  if (num < 1000000000000000000) return `${(num / 1000000000000000).toFixed(1)} quadrillion`;
  if (num < 1e21) return `${(num / 1e18).toFixed(1)} quintillion`;

  const exponent = Math.floor(Math.log10(num));
  const mantissa = num / Math.pow(10, exponent);
  return `${mantissa.toFixed(1)} × 10^${exponent}`;
}

export function formatCrackTime(secondsToCrack) {
  if (secondsToCrack < 1) return 'Instantly';
  if (secondsToCrack < 60) {
    return `${Math.round(secondsToCrack)} second${secondsToCrack > 1 ? 's' : ''}`;
  }
  if (secondsToCrack < 3600) {
    const minutes = Math.round(secondsToCrack / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  if (secondsToCrack < 86400) {
    const hours = Math.round(secondsToCrack / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  if (secondsToCrack < 2592000) {
    const days = Math.round(secondsToCrack / 86400);
    return `${days} day${days > 1 ? 's' : ''}`;
  }
  if (secondsToCrack < 31536000) {
    const months = Math.round(secondsToCrack / 2592000);
    return `${months} month${months > 1 ? 's' : ''}`;
  }

  const years = secondsToCrack / 31536000;
  const steps = [
    [1e3, 1, ''],
    [1e6, 1e3, ' thousand'],
    [1e9, 1e6, ' million'],
    [1e12, 1e9, ' billion'],
    [1e15, 1e12, ' trillion'],
  ];
  const step = steps.find(([limit]) => years < limit);
  if (!step) {
    const exponent = Math.floor(Math.log10(years));
    return `${(years / Math.pow(10, exponent)).toFixed(1)} × 10^${exponent} years`;
  }
  if (step[1] === 1) {
    const whole = Math.round(years);
    return `${whole.toLocaleString()} year${whole > 1 ? 's' : ''}`;
  }
  return `${(years / step[1]).toFixed(1)}${step[2]} years`;
}

export function strengthLevel(entropy) {
  if (entropy < 25) {
    return { level: 'Very Weak', tone: 'text-danger', percentage: 10, description: 'Crackable in seconds' };
  }
  if (entropy < 35) {
    return { level: 'Weak', tone: 'text-danger', percentage: 25, description: 'Crackable in minutes' };
  }
  if (entropy < 50) {
    return { level: 'Fair', tone: 'text-warning', percentage: 45, description: 'Crackable by a determined attacker' };
  }
  if (entropy < 65) {
    return { level: 'Good', tone: 'text-warning', percentage: 65, description: '' };
  }
  if (entropy < 80) {
    return { level: 'Strong', tone: 'text-success', percentage: 80, description: '' };
  }
  return { level: 'Excellent', tone: 'text-success', percentage: 100, description: '' };
}

export function describeStrength(entropy, possibleCombinations) {
  const secondsToCrack = possibleCombinations / 2 / GUESSES_PER_SECOND;
  return {
    ...strengthLevel(entropy),
    entropy: Math.round(entropy * 10) / 10,
    combinations: formatCombinations(possibleCombinations),
    timeToCrack: formatCrackTime(secondsToCrack),
  };
}
