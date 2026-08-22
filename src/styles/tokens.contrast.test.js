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
const base = { ...blockFrom(generated, '@theme static {'), ...blockFrom(css, '@theme {') };
const dark = resolve(base);
const light = resolve({ ...base, ...blockFrom(css, '.light {') });
const lightMedia = resolve({ ...base, ...blockFrom(css, ':root:not(.dark) {') });

// Signal ships two themes. The six alternate palettes (Solarized, Catppuccin,
// Dracula, Nord, Tokyo Night, GitHub) are retired — they multiplied every
// colour decision by six and made this matrix the largest single constraint on
// the design. Note the base dark/light pair was never actually measured before:
// the suite only ever ran over the palettes, and `DEFAULT_PALETTE` meant nobody
// saw the base theme. It is measured now.
const themes = [
  ['ink dark', dark],
  ['paper light', light],
];

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

/**
 * The three page grounds any piece of text or control can land on.
 *
 * `nav-active` is deliberately NOT in this list. It is one cell in the header,
 * and the only things that ever sit on it are nav labels — no category hue, no
 * form control, no dim metadata. Measuring every role against it would
 * over-constrain the palette for a ground those roles never touch. What does
 * sit on it is asserted explicitly in NAV_PAIRS below, because DESIGN.md's
 * `nav-item-active` puts `primary-text` there and the handoff's original
 * accent-text value measured 3.82:1 on it while clearing all three grounds.
 */
const GROUNDS = ['surface', 'surface-raised', 'surface-inset'];

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

  // --- the accent ----------------------------------------------------------
  // DESIGN.md: `primary` is validated as a FILL and never as text. #c6f232 is
  // 1.18:1 on the bone ground, so the text role is `primary-text`, which is
  // the raw accent in dark and an olive derivative in light. The ring alias
  // points at `primary-text` for exactly this reason.
  ['on-primary', 'primary', 4.5, 'ink on the accent'],
  ['on-primary', 'primary-hover', 4.5, 'ink on the hovered accent'],

  // DESIGN.md's text ramp and the category hues are generated over GROUNDS
  // below, rather than transcribed here.

  // --- the footer ----------------------------------------------------------
  // A deepened band of each theme's own ground, so `on-footer` and
  // `on-footer-muted` remap per theme like every other surface role.
  ['on-footer', 'footer', 4.5, 'footer text'],
  ['on-footer-muted', 'footer', 4.5, 'the footer mono strip'],

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

  // `outline-strong` exists solely to satisfy 1.4.11 for control boundaries.
  // Signal assigns it to the `select` border, so it is load-bearing: the
  // handoff's #3a3e47 measured 1.50:1 and would have made every form control
  // boundary invisible. Generated over GROUNDS below.

  // The 3px structural rule is a graphic object a reader must perceive to read
  // the layout at all, so it takes the same 3:1 bar. The 1px hairline does not
  // — it organises peers that are already distinguishable by position.
  ['rule', 'surface', 3, 'the structural rule against the page'],
  ['rule', 'surface-raised', 3, 'the structural rule against a panel'],

  // --- the active nav cell -------------------------------------------------
  // The only two inks that land on the `nav-active` ground.
  ['primary-text', 'nav-active', 4.5, 'the active nav label'],
  ['on-surface', 'nav-active', 4.5, 'a nav label on the active cell'],
];

// The text ramp, the accent-as-text and the category hues, over every ground.
// `on-surface-dim` is deliberately absent from the 4.5 list — see below.
for (const ground of GROUNDS) {
  for (const step of ['on-surface', 'on-surface-muted', 'on-surface-faint']) {
    PAIRS.push([step, ground, 4.5, `${step} on ${ground}`]);
  }
  PAIRS.push(['primary-text', ground, 4.5, `accent text on ${ground}`]);
  PAIRS.push(['outline-strong', ground, 3, `control boundary on ${ground}`]);

  // `on-surface-dim` is the one text step held to 3:1 rather than 4.5:1.
  // DESIGN.md documents it as non-essential metadata that is duplicated
  // elsewhere — a counter, a placeholder, a keyboard hint. Lifting it to 4.5
  // would put it within 0.55 of `on-surface-faint` and collapse the ramp to
  // three usable steps. Anything a reader must read is `faint` or above.
  PAIRS.push(['on-surface-dim', ground, 3, `dim metadata on ${ground}`]);
}

// Each category has two roles, and they are not interchangeable.
//
//   category-*       the TEXT hue — crumbs, tool icons, small labels. Measured
//                    against every ground, which is why the light values are so
//                    much darker than the dark ones.
//   category-fill-*  the solid badge block. Theme-independent, because the ink
//                    on it is always graphite, so it is measured once against
//                    `on-category-fill` rather than against the page.
for (const c of CATEGORIES) {
  for (const ground of GROUNDS) {
    PAIRS.push([`category-${c}`, ground, 4.5, `${c} label on ${ground}`]);
  }
  PAIRS.push([
    'on-category-fill',
    `category-fill-${c}`,
    4.5,
    `ink on the solid ${c} badge`,
  ]);
}

describe.each(themes)('%s theme contrast', (mode, tokens) => {
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

  it('has retired the alternate palettes', () => {
    // Signal ships two themes. Six palettes × 24 tokens made every colour
    // decision a 12-way problem, and `DEFAULT_PALETTE` meant the base theme
    // the tokens actually describe was the one nobody ever saw.
    for (const id of ['solarized', 'catppuccin', 'dracula', 'nord', 'tokyo-night', 'github']) {
      expect(generated, `--color-${id}-* should be gone`).not.toContain(`--color-${id}-`);
      expect(css, `[data-palette="${id}"] should be gone`).not.toContain(`data-palette="${id}"`);
    }
    expect(generated, 'the raw Solarized ramp should be gone').not.toMatch(/--color-solar-/);
    expect(css, 'nothing may read a palette attribute').not.toMatch(/data-palette/);
  });

  it('emits the complete token contract', () => {
    expect(generated).toMatch(/@theme\s+static\s*\{/);
    for (const [, tokens] of themes) {
      for (const category of CATEGORIES) {
        expect(tokens[`category-${category}`]).toBeDefined();
        expect(tokens[`category-fill-${category}`]).toBeDefined();
      }
    }
  });

  it('keeps the accent out of every text slot', () => {
    // `primary` is a fill. #c6f232 as text on bone is 1.18:1, so the moment an
    // alias points a text or ring role at it, the light theme loses that role
    // entirely. `primary-text` is the value that switches per theme.
    for (const [mode, tokens] of themes) {
      expect(tokens.ring, `ring resolves in ${mode}`).toBe(tokens['primary-text']);
    }
    expect(css).toMatch(/--color-ring:\s*var\(--color-primary-text\)/);
    expect(light['primary-text']).not.toBe(light.primary);
  });

  it('does not reintroduce a remote font import', () => {
    expect(css).not.toMatch(/@import\s+url\(['"]?https?:/);
  });

  it('reserves the mono family for data by self-hosting it', () => {
    // DESIGN.md sets Bricolage Grotesque for display, Space Grotesk for body
    // and labels, Space Mono for data — all self-hosted so first paint makes
    // no third-party request.
    expect(css).toMatch(/--font-mono:\s*"Space Mono"/);
    expect(css).toMatch(/--font-sans:\s*"Space Grotesk Variable"/);
    expect(css).toMatch(/--font-display:\s*"Bricolage Grotesque Variable"/);
  });

  it('carries the Stacks shape scale and the press shadows', () => {
    // Radius is a token, so one wrong step here reshapes the whole app. The
    // scale is 8/10/14/18 — badge and chip, control, panel, sheet — and
    // `full` is for pills: nav items, the toggle knob, status dots.
    for (const [step, value] of [['sm', '8px'], ['md', '10px'], ['lg', '14px'], ['xl', '18px'], ['full', '9999px']]) {
      expect(generated, `--radius-${step}`).toContain(`--radius-${step}: ${value};`);
    }

    // The offset shadow is not elevation: it is pressability, hard-edged and
    // always in the structural `rule` colour. The exporter drops `shadow`, so
    // the three steps are hand-transcribed into globals.css — and there is
    // still no shadow scale in the generated file to drift against.
    expect(generated, 'the exporter emits no shadow scale').not.toMatch(/--shadow-press/);
    for (const step of ['press-sm', 'press', 'press-lg']) {
      expect(css, `--shadow-${step}`).toMatch(
        new RegExp(`--shadow-${step}:\\s*\\d+px \\d+px 0 var\\(--color-shadow-ink\\);`)
      );
    }

    // And the shadow colour is genuinely darker than every ground it falls
    // on, in both themes — a pale shadow reads as a glow, which is the fault
    // the Espresso dark rework fixed.
    for (const [mode, tokens] of themes) {
      for (const ground of ['surface', 'surface-raised']) {
        expect(
          luminance(tokens['shadow-ink']),
          `shadow-ink is darker than ${ground} in ${mode}`
        ).toBeLessThan(luminance(tokens[ground]));
      }
    }
  });

  it('carries the rule and motion values the exporter drops', () => {
    // DESIGN.md declares `borderWidth`, `shadow` and `motion`, but the
    // exporter behind `pnpm generate:tokens` reads only colors, typography,
    // rounded and spacing. These are transcribed into globals.css by hand, so
    // nothing but this test notices when they drift.
    const frontMatter = design.slice(0, design.indexOf('\n---', 4));
    for (const [key, prop] of [
      ['hairline', '--border-hairline'],
      ['structural', '--border-structural'],
    ]) {
      const declared = frontMatter.match(new RegExp(`^  ${key}:\\s*(\\S+)`, 'm'))?.[1];
      expect(declared, `borderWidth.${key} in DESIGN.md`).toBeDefined();
      expect(css, prop).toContain(`${prop}: ${declared};`);
    }
    for (const [key, prop] of [
      ['duration-fast', '--duration-fast'],
      ['duration-base', '--duration-base'],
    ]) {
      const declared = frontMatter.match(new RegExp(`^  ${key}:\\s*(\\S+)`, 'm'))?.[1];
      expect(declared, `motion.${key} in DESIGN.md`).toBeDefined();
      expect(css, prop).toContain(`${prop}: ${declared};`);
    }
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
