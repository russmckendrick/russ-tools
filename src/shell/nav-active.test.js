import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { TOOLS } from '../tools/registry.mjs';

/**
 * The header's open tab, asserted against the **built output**.
 *
 * The fault this was written for: the nav is drawn as folder tabs and the
 * open one is painted on the page ground, but the test for "open" was
 * `currentPath === '/'`. So the index and /delete had a tab open and every
 * tool page, every help page and every deep link had none — the bulk of the
 * site rendering a header that said the reader was nowhere.
 *
 * Built rather than source for the same reason as `canonical.test.js`: the
 * value comes from `Astro.url.pathname`, which is the *output file* during a
 * static build, so reading `HeaderActions.astro` does not tell you what a
 * tool page actually emitted.
 *
 * Skipped rather than failed without `dist/`, so `pnpm test` stays useful on
 * its own; CI builds first.
 */

const DIST = 'dist';
const built = existsSync(`${DIST}/index.html`);
const html = (name) => readFileSync(`${DIST}/${name}.html`, 'utf8');

/** The nav link carrying `aria-current`, as [label, value]. */
const openTab = (name) => {
  const nav = html(name).match(/<nav class="rt-topnav"[\s\S]*?<\/nav>/)?.[0] ?? '';
  const links = [...nav.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
  const open = links.filter(([, attrs]) => /aria-current="/.test(attrs));
  expect(open.length, `${name}: exactly one tab may be open`).toBe(1);
  const [, attrs, inner] = open[0];
  return [inner.replace(/<svg[\s\S]*?<\/svg>/g, '').trim(), attrs.match(/aria-current="([^"]*)"/)[1]];
};

describe.runIf(built)('the header opens the tab for the section you are in', () => {
  it('the index claims the Tools tab as the page itself', () => {
    expect(openTab('index')).toEqual(['Tools', 'page']);
  });

  it('/delete claims its own tab as the page itself', () => {
    expect(openTab('delete')).toEqual(['Saved data', 'page']);
  });

  /**
   * `true`, not `page`. The Tools link points at the index, so claiming
   * `page` on /dns-lookup would be a lie a screen reader repeats; `true` is
   * the same attribute's "current item of the set", which is what an open
   * section tab means. The visual state keys on bare `[aria-current]`.
   */
  it.each(TOOLS.map((t) => t.path.slice(1)))('%s opens Tools without claiming to be it', (id) => {
    expect(openTab(id)).toEqual(['Tools', 'true']);
  });

  it.each(TOOLS.map((t) => t.path.slice(1)))('%s/help opens Tools too', (id) => {
    expect(openTab(`${id}/help`)).toEqual(['Tools', 'true']);
  });

  it('a page in no section opens no tab rather than guessing', () => {
    const nav = html('404').match(/<nav class="rt-topnav"[\s\S]*?<\/nav>/)[0];
    expect(nav).not.toMatch(/aria-current/);
  });
});
