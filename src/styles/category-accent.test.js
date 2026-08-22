import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The blind spot this closes.
 *
 * `tokens.contrast.test.js` validates token *pairs* — it proves
 * `--color-category-azure` clears 4.5:1 on every surface, in every palette,
 * in both modes. What it cannot see is a *page* putting a token into a slot
 * it was never engineered for.
 *
 * That is exactly what happened: the index assigned the merged Microsoft &
 * Azure group `accent: 'var(--color-primary)'`, and `--cat` feeds the group
 * label's text colour. `primary` is an action colour — DESIGN.md reserves it
 * for "buttons, toggles, sliders, progress fills, focus rings" — and as text
 * on the light ground it measures 3.59:1 in Tokyo Night, 4.05:1 in Nord and
 * 4.34:1 in Catppuccin, the palette that ships by default. Every contrast
 * assertion in the suite passed the whole time, because none of them knew the
 * page had made that substitution.
 *
 * So: `--cat` carries a category hue, always. That is the Division of Labour
 * Rule as a test rather than as prose.
 */

const ROOT = new URL('../', import.meta.url).pathname;
const SEARCH_DIRS = ['pages', 'layouts', 'shell', 'components', 'tools'];

/**
 * Two ways a hue reaches `--cat`, and both have to be checked.
 *
 * Directly — `style={`--cat: var(--color-category-network)`}` — and
 * indirectly, via an `accent:` field the page then interpolates into `--cat`.
 * The bug this guards took the second route, so a rule that only looked at
 * `--cat:` would have watched the wrong door.
 */
const ASSIGNMENT = /(?:--cat:|\baccent:)\s*(['"`]?)([^;'"`}\n]+)\1/g;

/**
 * The same guard for the fill slot, pointing the other way.
 *
 * `--cat-fill` is the solid badge block, so it must carry a `category-fill-*`
 * token and never a `category-*` text hue: the ink on the block is always
 * graphite, and the light-mode text hues are deepened precisely so they work
 * as text — `#0e766b` behind `#16171b` is 1.6:1.
 *
 * Written as its own pattern rather than folded into the one above because
 * `--cat:` does not match `--cat-fill:`, and a single regex that caught both
 * would have to allow both token families and could therefore prove neither.
 */
const FILL_ASSIGNMENT = /(?:--cat-fill:|\baccentFill:)\s*(['"`]?)([^;'"`}\n]+)\1/g;

/**
 * Every `--color-category-*` TEXT token DESIGN.md defines.
 *
 * `category-fill-*` is excluded on purpose, and it is the reason this filter
 * is not just "starts with category-". Under Signal each category carries two
 * values: the fill hue for a solid badge, which is engineered against graphite
 * ink (`on-category-fill`) and is identical in both themes, and the text hue,
 * which is deepened in light mode so it clears 4.5:1 on bone. `--cat` feeds
 * *text*, so a fill hue in that slot is 1.6:1 on the light card — the same
 * class of bug this file was written to catch, one token rename later.
 */
const generated = readFileSync(join(ROOT, 'styles/tokens.generated.css'), 'utf8');

const CATEGORY_TOKENS = new Set(
  [...generated.matchAll(/--color-(category-(?!fill-)[\w-]+):/g)]
    .map(([, name]) => `--color-${name}`)
    .filter((name) => !name.includes('-light')),
);

/** And every `--color-category-fill-*` token, the other half of the pair. */
const FILL_TOKENS = new Set(
  [...generated.matchAll(/--color-(category-fill-[\w-]+):/g)].map(
    ([, name]) => `--color-${name}`,
  ),
);

function* walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (/\.(astro|jsx|js|mjs|css)$/.test(entry) && !entry.includes('.test.')) yield path;
  }
}

const assignments = [];
const fillAssignments = [];
for (const dir of SEARCH_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const source = readFileSync(file, 'utf8');
    const name = file.replace(ROOT, 'src/');
    for (const [, , rawValue] of source.matchAll(ASSIGNMENT)) {
      const value = rawValue.trim();
      // `--cat` is read as well as written; a fallback read is not an assignment.
      if (!value.includes('var(')) continue;
      assignments.push({ file: name, value });
    }
    for (const [, , rawValue] of source.matchAll(FILL_ASSIGNMENT)) {
      const value = rawValue.trim();
      if (!value.includes('var(')) continue;
      fillAssignments.push({ file: name, value });
    }
  }
}

const WHY =
  '`--cat` feeds group and card label *text*. Only --color-category-* tokens are ' +
  'engineered to clear 4.5:1 as text across all twelve palette/mode combinations, ' +
  'and tokens.contrast.test.js cannot see a page substituting a different token ' +
  'into that slot. DESIGN.md: the accent acts, the category hue labels.';

describe('--cat always carries a category hue', () => {
  it('finds the assignments it is meant to be guarding', () => {
    expect(assignments.length).toBeGreaterThan(0);
    expect(CATEGORY_TOKENS.size).toBe(6);
    // The fill hues must exist and must NOT be in the allowed set — if the
    // filter above ever stops excluding them, this is what says so.
    for (const token of CATEGORY_TOKENS) expect(token).not.toContain('-fill-');
  });

  it.each(assignments)('$file: $value', ({ value }) => {
    const token = value.match(/var\(\s*(--[\w-]+)/)?.[1];
    expect(token, `expected a var() reference, got "${value}"`).toBeDefined();

    // An interpolated name (`--color-category-${tool.category}`) can only be
    // checked by its namespace; the manifest constrains which suffix lands.
    if (value.includes('${')) {
      expect(token.startsWith('--color-category-'), WHY).toBe(true);
      return;
    }

    expect(CATEGORY_TOKENS.has(token), `"${token}" is not a category token. ${WHY}`).toBe(true);
  });
});

const FILL_WHY =
  '`--cat-fill` is a solid block behind `on-category-fill` (#16171b). Only ' +
  '--color-category-fill-* is engineered against that ink; the --color-category-* ' +
  'text hues are deepened for legibility ON a ground, and #0e766b behind #16171b ' +
  'is 1.6:1. DESIGN.md: the fill marks, the text hue labels.';

describe('--cat-fill always carries a category FILL hue', () => {
  it('finds the assignments it is meant to be guarding', () => {
    expect(fillAssignments.length).toBeGreaterThan(0);
    expect(FILL_TOKENS.size).toBe(6);
  });

  it.each(fillAssignments)('$file: $value', ({ value }) => {
    const token = value.match(/var\(\s*(--[\w-]+)/)?.[1];
    expect(token, `expected a var() reference, got "${value}"`).toBeDefined();

    if (value.includes('${')) {
      expect(token.startsWith('--color-category-fill-'), FILL_WHY).toBe(true);
      return;
    }

    expect(FILL_TOKENS.has(token), `"${token}" is not a category fill token. ${FILL_WHY}`).toBe(
      true,
    );
  });
});
