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

/** Every `--color-category-*` token DESIGN.md actually defines. */
const CATEGORY_TOKENS = new Set(
  [...readFileSync(join(ROOT, 'styles/tokens.generated.css'), 'utf8')
    .matchAll(/--color-(category-[\w-]+):/g)]
    .map(([, name]) => `--color-${name}`)
    .filter((name) => !name.includes('-light')),
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
for (const dir of SEARCH_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const source = readFileSync(file, 'utf8');
    for (const [, , rawValue] of source.matchAll(ASSIGNMENT)) {
      const value = rawValue.trim();
      // `--cat` is read as well as written; a fallback read is not an assignment.
      if (!value.includes('var(')) continue;
      assignments.push({ file: file.replace(ROOT, 'src/'), value });
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
