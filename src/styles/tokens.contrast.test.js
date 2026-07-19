import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The accessibility floor for the design tokens, enforced against the real
 * stylesheet rather than a copy of it. If someone retunes a colour and drops
 * a pair below its WCAG minimum, this fails.
 *
 * Ratios are WCAG 2.1 relative-luminance contrast:
 *   4.5  body text (1.4.3 AA)
 *   3.0  large text, UI component boundaries and graphics (1.4.11 AA)
 *
 * Three files are in play, and the test reads all of them so that "the
 * palette is generated from DESIGN.md" is a property the build checks rather
 * than a convention someone remembers:
 *
 *   DESIGN.md              the contract (YAML front matter)
 *   tokens.generated.css   its export — asserted to still match
 *   globals.css            the light-mode remap and the shadcn aliases
 */

const read = (name) => readFileSync(fileURLToPath(new URL(name, import.meta.url)), 'utf8');

const css = read('./globals.css');
const generated = read('./tokens.generated.css');
const design = readFileSync(fileURLToPath(new URL('../../DESIGN.md', import.meta.url)), 'utf8');

/** Pull `--color-x: <value>;` declarations out of the first block matching a header. */
function blockFrom(source, header) {
  const start = source.indexOf(header);
  if (start === -1) throw new Error(`block not found: ${header}`);
  let depth = 0;
  let end = start;
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) { end = i; break; }
  }
  const out = {};
  for (const [, name, value] of source.slice(start, end).matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/gi)) {
    out[name] = value.trim().toLowerCase();
  }
  return out;
}

/**
 * Aliases are declared by reference (`--color-card: var(--color-surface-raised)`)
 * so that the light-mode remap carries through without restating 20 hexes.
 * Resolve that indirection down to a literal before measuring.
 */
function resolve(tokens) {
  const out = {};
  for (const key of Object.keys(tokens)) {
    let value = tokens[key];
    const seen = new Set();
    while (value?.startsWith('var(')) {
      const ref = value.slice(4, -1).replace(/^--color-/, '');
      if (seen.has(ref)) throw new Error(`cyclic token reference at --color-${key}`);
      seen.add(ref);
      value = tokens[ref];
    }
    if (/^#[0-9a-f]{6}$/.test(value ?? '')) out[key] = value;
  }
  return out;
}

// Dark is the default theme: the generated @theme block plus globals.css's
// aliases is already the dark theme. Light is an override on top of it.
const base = { ...blockFrom(generated, '@theme {'), ...blockFrom(css, '@theme {') };
const dark = resolve(base);
const light = resolve({ ...base, ...blockFrom(css, '.light {') });
const lightMedia = resolve({ ...base, ...blockFrom(css, ':root:not(.dark) {') });

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

const CATEGORIES = ['network', 'azure', 'microsoft', 'security', 'developer', 'content'];

/** [foreground token, background token, minimum ratio, why] */
const PAIRS = [
  // --- the shadcn alias surface the un-ported components render against ---
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

  // --- DESIGN.md's own three-step text ramp, on all three surfaces --------
  ['on-surface', 'surface', 4.5, 'body text on the page'],
  ['on-surface-muted', 'surface-raised', 4.5, 'muted text on a panel'],
  ['on-surface-muted', 'surface-inset', 4.5, 'muted text on an inset'],
  ['on-surface-faint', 'surface', 4.5, 'faint text on the page'],
  ['on-surface-faint', 'surface-raised', 4.5, 'faint text on a panel'],
  ['on-surface-faint', 'surface-inset', 4.5, 'faint text on an inset'],

  // --- status -------------------------------------------------------------
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
  ['input', 'background', 3, 'input outline against the page'],
  ['input', 'card', 3, 'input outline against a card'],

  // `outline-strong` exists solely to satisfy 1.4.11 for control boundaries,
  // so it has to clear 3:1 on every surface a control can sit on — including
  // the inset, which is where the light value originally failed.
  ['outline-strong', 'surface', 3, 'control boundary on the page'],
  ['outline-strong', 'surface-raised', 3, 'control boundary on a panel'],
  ['outline-strong', 'surface-inset', 3, 'control boundary on an inset'],
];

// Category hue as text, on all three surfaces, in both themes. This is the
// reason the light category values are so much darker than the dark ones.
for (const c of CATEGORIES) {
  PAIRS.push(
    [`category-${c}`, 'surface', 4.5, `${c} label on the page`],
    [`category-${c}`, 'surface-raised', 4.5, `${c} label on a panel`],
    [`category-${c}`, 'surface-inset', 4.5, `${c} label on an inset`]
  );
}

describe.each([
  ['light', light],
  ['dark', dark],
])('%s theme contrast', (mode, tokens) => {
  it.each(PAIRS)('%s on %s >= %s:1 (%s)', (fg, bg, min) => {
    expect(tokens[fg], `--color-${fg} does not resolve in the ${mode} theme`).toBeDefined();
    expect(tokens[bg], `--color-${bg} does not resolve in the ${mode} theme`).toBeDefined();
    const ratio = contrast(tokens[fg], tokens[bg]);
    expect(
      Number(ratio.toFixed(2)),
      `--color-${fg} (${tokens[fg]}) on --color-${bg} (${tokens[bg]}) = ${ratio.toFixed(2)}:1, needs ${min}:1`
    ).toBeGreaterThanOrEqual(min);
  });
});

describe('token layer integrity', () => {
  it('generates every DESIGN.md colour verbatim', () => {
    // The whole point of `pnpm generate:tokens` is that the stylesheet is
    // derived from DESIGN.md rather than retyped alongside it. If someone
    // edits DESIGN.md and forgets to regenerate, this is what says so.
    const frontMatter = design.slice(0, design.indexOf('\n---', 4));
    const colors = frontMatter.slice(frontMatter.indexOf('colors:'), frontMatter.indexOf('typography:'));
    const declared = [...colors.matchAll(/^ {2}([a-z0-9-]+):\s*"(#[0-9a-f]{6})"/gim)];

    expect(declared.length).toBeGreaterThan(30);
    for (const [, name, hex] of declared) {
      expect(
        generated,
        `DESIGN.md declares ${name}: ${hex} — run \`pnpm generate:tokens\``
      ).toContain(`--color-${name}: ${hex};`);
    }
  });

  it('resolves the same token names in light and dark', () => {
    // `-light` peers only exist as raw values; they are the source of the
    // light theme, not part of it.
    const names = (t) => Object.keys(t).filter((k) => !k.endsWith('-light')).sort();
    expect(names(light)).toEqual(names(dark));
  });

  it('keeps the prefers-color-scheme fallback in sync with .light', () => {
    // These two blocks are duplicated by necessity (a media query cannot
    // reuse a class block). Drift between them means the pre-hydration paint
    // disagrees with the hydrated one.
    expect(lightMedia).toEqual(light);
  });

  it('leaves no trace of the abandoned Solarized palette', () => {
    // Phase 1's rejected direction. Its ramp was exposed as --color-solar-*
    // and referenced from a handful of utilities; both are gone.
    expect(css).not.toMatch(/solar-/);
    expect(css).not.toMatch(/#002b36|#fdf6e3|#eee8d5|#073642/i);
  });

  it('does not reintroduce a remote font import', () => {
    expect(css).not.toMatch(/@import\s+url\(['"]?https?:/);
  });

  it('reserves the mono family for data by self-hosting it', () => {
    // DESIGN.md pairs Inter with JetBrains Mono, and requires both to be
    // self-hosted so first paint makes no third-party request.
    expect(css).toMatch(/--font-mono:\s*"JetBrains Mono Variable"/);
    expect(css).toMatch(/--font-sans:\s*"Inter Variable"/);
  });

  it('disables ambient animation under prefers-reduced-motion', () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });

  it('folds each type step into one text-* token, with no family peer', () => {
    const generated = readFileSync(
      new URL('./tokens.generated.css', import.meta.url),
      'utf8'
    );

    // A step must carry its own weight and line-height, so one class applies
    // it and a call site cannot half-apply it.
    for (const step of ['display', 'headline-lg', 'headline-md', 'title-sm', 'body-sm']) {
      expect(generated, step).toMatch(
        new RegExp(`--text-${step}--font-weight:\\s*\\d+`)
      );
      expect(generated, step).toMatch(
        new RegExp(`--text-${step}--line-height:\\s*[\\d.]+`)
      );
    }

    // And no per-step font-family token may exist. Tailwind's font-* namespace
    // covers family and weight both, and family wins — so `font-title-sm`
    // would set `font-family: "Inter"`, which is not the self-hosted name
    // ("Inter Variable"), and headings fall back to the browser default serif.
    // DESIGN.md: there is no serif anywhere in this system.
    expect(generated).not.toMatch(/--font-(?!weight-|sans|mono)[\w-]+:\s*"/);
  });

  it('keeps the spacing scale out of Tailwind\'s --spacing-* namespace', () => {
    // DESIGN.md names its spacing steps xs/sm/md/lg/xl/2xl/3xl, which are
    // exactly Tailwind 4's *container* scale keys. Emitted as `--spacing-lg`
    // they shadow it, and `max-w-lg` silently stops meaning 32rem and starts
    // meaning 16px — which collapsed every dialog in both apps to a sliver
    // before anyone noticed, because no tool body rendered under the shell
    // until the bridge landed. The generator renames them to --rt-space-*.
    const generated = readFileSync(
      new URL('./tokens.generated.css', import.meta.url),
      'utf8'
    );
    expect(generated).not.toMatch(/--spacing-/);
    expect(generated).toMatch(/--rt-space-lg:\s*16px/);

    // And nothing may reach for the old names, or it resolves to nothing.
    expect(css).not.toMatch(/var\(--spacing-/);
  });
});
