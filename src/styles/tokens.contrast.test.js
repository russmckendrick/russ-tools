import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The accessibility floor for the design tokens, enforced against the real
 * stylesheet rather than a copy of it. If someone retunes a colour in
 * globals.css and drops a pair below its WCAG minimum, this fails.
 *
 * Ratios are WCAG 2.1 relative-luminance contrast:
 *   4.5  body text (1.4.3 AA)
 *   3.0  large text, UI component boundaries and graphics (1.4.11 AA)
 */

const css = readFileSync(fileURLToPath(new URL('./globals.css', import.meta.url)), 'utf8');

/** Pull `--color-x: #hex;` declarations out of the first block matching a header. */
function tokensFrom(header) {
  const start = css.indexOf(header);
  if (start === -1) throw new Error(`block not found in globals.css: ${header}`);
  let depth = 0;
  let end = start;
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) { end = i; break; }
  }
  const block = css.slice(start, end);
  const out = {};
  for (const [, name, hex] of block.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-f]{6})\s*;/gi)) {
    out[name] = hex.toLowerCase();
  }
  return out;
}

const light = tokensFrom('@theme {');
const dark = tokensFrom('.dark {');
const darkMedia = tokensFrom(':root:not(.light) {');

const channel = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const luminance = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => channel(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** [foreground token, background token, minimum ratio, why] */
const PAIRS = [
  ['foreground', 'background', 4.5, 'body text on the page'],
  ['foreground', 'card', 4.5, 'body text on a card'],
  ['card-foreground', 'card', 4.5, 'card text'],
  ['popover-foreground', 'popover', 4.5, 'popover text'],
  ['muted-foreground', 'background', 4.5, 'secondary text on the page'],
  ['muted-foreground', 'card', 4.5, 'secondary text on a card'],
  ['secondary-foreground', 'secondary', 4.5, 'text on a secondary surface'],
  ['accent-foreground', 'accent', 4.5, 'text on an accent surface'],
  ['primary-foreground', 'primary', 4.5, 'label on a primary button'],
  ['destructive-foreground', 'destructive', 4.5, 'label on a destructive button'],

  ['success', 'background', 4.5, 'success text on the page'],
  ['success', 'card', 4.5, 'success text on a card'],
  ['success', 'success-subtle', 4.5, 'success text on its own tint'],
  ['success-foreground', 'success', 4.5, 'label on a solid success fill'],
  ['warning', 'background', 4.5, 'warning text on the page'],
  ['warning', 'card', 4.5, 'warning text on a card'],
  ['warning', 'warning-subtle', 4.5, 'warning text on its own tint'],
  ['warning-foreground', 'warning', 4.5, 'label on a solid warning fill'],
  ['info', 'background', 4.5, 'info text on the page'],
  ['info', 'card', 4.5, 'info text on a card'],
  ['info', 'info-subtle', 4.5, 'info text on its own tint'],
  ['info-foreground', 'info', 4.5, 'label on a solid info fill'],
  ['danger', 'background', 4.5, 'danger text on the page'],
  ['danger', 'card', 4.5, 'danger text on a card'],
  ['danger', 'danger-subtle', 4.5, 'danger text on its own tint'],
  ['danger-foreground', 'danger', 4.5, 'label on a solid danger fill'],

  // Non-text: WCAG 1.4.11 wants 3:1 for anything a user must perceive to
  // operate the control — the focus ring and the input outline both qualify.
  ['ring', 'background', 3, 'focus ring against the page'],
  ['ring', 'card', 3, 'focus ring against a card'],
  ['input', 'card', 3, 'input outline against a card'],
];

describe.each([
  ['light', light],
  ['dark', dark],
])('%s theme contrast', (mode, tokens) => {
  it.each(PAIRS)('%s on %s >= %s:1 (%s)', (fg, bg, min) => {
    expect(tokens[fg], `--color-${fg} missing from the ${mode} block`).toBeDefined();
    expect(tokens[bg], `--color-${bg} missing from the ${mode} block`).toBeDefined();
    const ratio = contrast(tokens[fg], tokens[bg]);
    expect(
      Number(ratio.toFixed(2)),
      `--color-${fg} (${tokens[fg]}) on --color-${bg} (${tokens[bg]}) = ${ratio.toFixed(2)}:1, needs ${min}:1`
    ).toBeGreaterThanOrEqual(min);
  });
});

describe('token layer integrity', () => {
  it('defines the same token names in light and dark', () => {
    // --color-solar-* only appear in @theme; they are mode-independent.
    const lightSemantic = Object.keys(light).filter((k) => !k.startsWith('solar-')).sort();
    expect(Object.keys(dark).sort()).toEqual(lightSemantic);
  });

  it('keeps the prefers-color-scheme fallback in sync with .dark', () => {
    // These two blocks are duplicated by necessity (a media query cannot
    // reuse a class block). Drift between them means the pre-hydration paint
    // disagrees with the hydrated one.
    expect(darkMedia).toEqual(dark);
  });

  it('exposes the full Solarized ramp', () => {
    const ramp = Object.keys(light).filter((k) => k.startsWith('solar-'));
    expect(ramp).toHaveLength(16);
    expect(light['solar-base03']).toBe('#002b36');
    expect(light['solar-base3']).toBe('#fdf6e3');
    expect(light['solar-blue']).toBe('#268bd2');
  });

  it('does not reintroduce a remote font import', () => {
    expect(css).not.toMatch(/@import\s+url\(['"]?https?:/);
  });

  it('disables ambient animation under prefers-reduced-motion', () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });
});
