#!/usr/bin/env node

/**
 * Open Graph cards — one per tool, plus a site-wide default.
 *
 * Run on demand (`pnpm generate:og`), not on every build, and the PNGs are
 * committed. That is deliberate: a card only changes when a tool's title,
 * short description, icon or category hue changes, which is roughly never,
 * and the alternative put a font pipeline on the critical path of every
 * production deploy.
 *
 * Why Playwright rather than sharp or satori: the fontsource packages ship
 * **woff2 only**. Satori cannot read woff2 and resvg/sharp need a TTF handed
 * to them, so build-time rasterising meant either three more packages to
 * decompress the font or trusting whatever fonts happen to exist on the build
 * image — an environment-dependent difference that renders as a silent
 * fallback typeface rather than an error. Chromium reads the same woff2 the
 * site does, so a card is drawn with the real families by the same engine
 * that draws the page.
 *
 * The card is drawn in Stacks' paper light — DESIGN.md names paper the house
 * ground and says link cards should read as paper — with every value read out
 * of the generated token layer rather than retyped, so `pnpm generate:tokens`
 * followed by this stays consistent with DESIGN.md.
 */

import { readFileSync, mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { loadManifests } from '../src/tools/loadManifests.mjs';
import { iconSvg } from '../src/shell/icons.mjs';
import { categoryLabel } from '../src/shell/categories.mjs';
import { SITE_NAME, SITE_DESCRIPTION } from '../src/shell/site.mjs';

const WIDTH = 1200;
const HEIGHT = 630;
const OUT_DIR = 'public/og';

const tokens = readFileSync('src/styles/tokens.generated.css', 'utf8');

/** @param {string} name a custom property name, without the leading `--` */
const token = (name) => {
  const found = tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8});`))?.[1];
  if (!found) throw new Error(`token not found in tokens.generated.css: --${name}`);
  return found;
};

const C = {
  surface: token('color-surface-light'),
  raised: token('color-surface-raised-light'),
  outline: token('color-outline-light'),
  rule: token('color-rule-light'),
  text: token('color-on-surface-light'),
  muted: token('color-on-surface-muted-light'),
  faint: token('color-on-surface-faint-light'),
  onFill: token('color-on-category-fill'),
};

/** The FILL hue, for the badge block and icon tile — always with graphite ink. */
const fillHue = (category) => token(`color-category-fill-${category}`);

/**
 * All three families, inlined. Stacks draws headings in Bricolage, labels in
 * Space Grotesk and the footer strip in Space Mono, so a card drawn with one
 * face is drawn wrong.
 */
const displayData = readFileSync(
  'node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2'
).toString('base64');
const sansData = readFileSync(
  'node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2'
).toString('base64');
const monoData = readFileSync(
  'node_modules/@fontsource/space-mono/files/space-mono-latin-400-normal.woff2'
).toString('base64');

// The toolbox mark, lifted from SiteMark.astro: the inner markup of its one
// <svg>. The drawing is two-tone — accent fill via a var() with a literal
// fallback (which is what resolves here, outside the token layer) and a
// currentColor stroke the card sets to ink.
const siteMark = readFileSync('src/shell/SiteMark.astro', 'utf8')
  .match(/<svg[^>]*>([\s\S]*?)<\/svg>/)[1];

/** @param {{title: string, sub: string, icon: string|null, category: string|null}} card */
const cardHtml = ({ title, sub, icon, category }) => {
  const fill = category ? fillHue(category) : token('color-primary');
  return `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: 'Bricolage Grotesque Variable';
    src: url(data:font/woff2;base64,${displayData}) format('woff2');
    font-weight: 200 800;
    font-display: block;
  }
  @font-face {
    font-family: 'Space Grotesk Variable';
    src: url(data:font/woff2;base64,${sansData}) format('woff2');
    font-weight: 300 700;
    font-display: block;
  }
  @font-face {
    font-family: 'Space Mono';
    src: url(data:font/woff2;base64,${monoData}) format('woff2');
    font-weight: 400;
    font-display: block;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${WIDTH}px; height: ${HEIGHT}px;
    font-family: 'Space Grotesk Variable', sans-serif;
    background: ${C.surface};
    color: ${C.text};
    position: relative; overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }
  /*
    Stacks: the whole card is one chunky panel — the 2px-rule border scaled
    up for the 1200px canvas, the panel radius, and the press-lg offset
    shadow in the rule colour. The hue appears only as the solid badge block
    and the icon tile, exactly as on a tool tile.
  */
  .frame {
    position: absolute; inset: 30px 42px 42px 30px;
    border: 4px solid ${C.rule};
    border-radius: 30px;
    background: ${C.raised};
    box-shadow: 12px 12px 0 ${C.rule};
    display: flex; flex-direction: column;
    padding: 48px 64px 40px;
  }
  header {
    display: flex; align-items: center; gap: 14px;
    color: ${C.text}; font-size: 27px; font-weight: 600; letter-spacing: -0.01em;
    font-family: 'Bricolage Grotesque Variable', sans-serif;
  }
  header svg { width: 32px; height: 32px; color: ${C.text}; }
  main { margin-top: auto; }
  .mark { display: flex; align-items: center; gap: 20px; margin-bottom: 30px; }
  .tile {
    display: flex; align-items: center; justify-content: center;
    width: 78px; height: 78px;
    background: ${fill}; color: ${C.onFill};
    border: 4px solid ${C.rule}; border-radius: 18px;
  }
  .badge {
    background: ${fill}; color: ${C.onFill};
    border: 3px solid ${C.rule}; border-radius: 12px;
    font-size: 19px; font-weight: 600; letter-spacing: 0.07em;
    text-transform: uppercase; padding: 7px 15px; white-space: nowrap;
  }
  h1 {
    font-family: 'Bricolage Grotesque Variable', sans-serif;
    font-size: ${title.length > 26 ? 62 : 74}px; font-weight: 800;
    letter-spacing: -0.02em; line-height: 1.04;
  }
  p { margin-top: 20px; font-size: 29px; line-height: 1.4; color: ${C.muted}; max-width: 900px; font-weight: 400; }
  footer {
    margin-top: 38px; padding-top: 24px;
    border-top: 1px solid ${C.outline};
    display: flex; align-items: center; gap: 16px;
    font-family: 'Space Mono', monospace;
    font-size: 18px; letter-spacing: 0.06em; text-transform: uppercase;
    color: ${C.faint};
  }
</style>
<div class="frame">
  <header>
    <svg viewBox="0 0 24 24" fill="none">${siteMark}</svg>
    <span>${SITE_NAME}</span>
  </header>
  <main>
    <div class="mark">
      ${icon ? `<span class="tile">${iconSvg(icon, 44)}</span>` : ''}
      ${category ? `<span class="badge">${categoryLabel(category)}</span>` : ''}
    </div>
    <h1>${title}</h1>
    <p>${sub}</p>
  </main>
  <footer>
    <span>Runs entirely in your browser</span>
  </footer>
</div>`;
};

const tools = await loadManifests();
const cards = [
  {
    name: 'default',
    title: 'russ.tools',
    sub: SITE_DESCRIPTION.split('. ')[0] + '.',
    icon: null,
    category: null,
  },
  ...tools.map((tool) => ({
    name: tool.id,
    title: tool.title,
    sub: tool.shortDescription,
    icon: tool.icon,
    category: tool.category,
  })),
];

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });

for (const card of cards) {
  await page.setContent(cardHtml(card), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${OUT_DIR}/${card.name}.png` });
}

await browser.close();
console.log(`✅ ${OUT_DIR}/ — ${cards.length} cards at ${WIDTH}×${HEIGHT}`);
