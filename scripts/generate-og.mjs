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
 * Why Playwright rather than sharp or satori: `@fontsource-variable/inter`
 * ships **woff2 only**. Satori cannot read woff2 and resvg/sharp need a TTF
 * handed to them, so build-time rasterising meant either three more packages
 * to decompress the font or trusting whatever fonts happen to exist on the
 * build image — an environment-dependent difference that renders as a silent
 * fallback typeface rather than an error. Chromium reads the woff2 the site
 * itself uses, so a card is drawn with the real Inter, by the same engine
 * that draws the page.
 *
 * The palette is Catppuccin Mocha — DEFAULT_PALETTE, so a card matches what
 * a first-time visitor actually lands on. Values are read out of the
 * generated token layer rather than retyped, so `pnpm generate:tokens`
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
  surface: token('color-catppuccin-surface'),
  raised: token('color-catppuccin-surface-raised'),
  outline: token('color-catppuccin-outline'),
  text: token('color-catppuccin-on-surface'),
  muted: token('color-catppuccin-on-surface-faint'),
};

const hue = (category) => token(`color-catppuccin-category-${category}`);

const fontData = readFileSync(
  'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'
).toString('base64');

// The toolbox silhouette, lifted from SiteMark.astro. Only the outer body is
// needed at this size — the drawer detail disappears below about 40px.
const siteMarkPaths = readFileSync('src/shell/SiteMark.astro', 'utf8')
  .match(/<path d="[^"]*"\/>/g)
  .join('');

/** @param {{title: string, sub: string, icon: string|null, category: string|null}} card */
const cardHtml = ({ title, sub, icon, category }) => {
  const accent = category ? hue(category) : token('color-catppuccin-primary');
  return `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: 'Inter Variable';
    src: url(data:font/woff2;base64,${fontData}) format('woff2');
    font-weight: 100 900;
    font-display: block;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${WIDTH}px; height: ${HEIGHT}px;
    font-family: 'Inter Variable', sans-serif;
    background: ${C.surface};
    color: ${C.text};
    display: flex; flex-direction: column;
    padding: 72px 80px;
    position: relative; overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }
  /* The hue glows, it does not fill — DESIGN.md keeps category colour off
     large surfaces, and a 1200px slab of amber is the exact failure that
     rule exists for. */
  .glow {
    position: absolute; top: -280px; right: -220px;
    width: 780px; height: 780px; border-radius: 50%;
    background: radial-gradient(circle, ${accent}2e 0%, ${accent}00 68%);
  }
  .rule { position: absolute; left: 0; top: 0; width: 100%; height: 6px; background: ${accent}; }
  header { display: flex; align-items: center; gap: 13px; color: ${C.muted}; font-size: 26px; font-weight: 500; }
  header svg { width: 30px; height: 30px; }
  main { margin-top: auto; }
  .tile {
    width: 104px; height: 104px; border-radius: 24px;
    background: ${C.raised}; border: 1px solid ${C.outline};
    display: flex; align-items: center; justify-content: center;
    color: ${accent}; margin-bottom: 34px;
  }
  h1 { font-size: ${title.length > 26 ? 62 : 72}px; font-weight: 600; letter-spacing: -0.022em; line-height: 1.06; }
  p { margin-top: 20px; font-size: 31px; line-height: 1.4; color: ${C.muted}; max-width: 900px; font-weight: 400; }
  footer { margin-top: 40px; display: flex; align-items: center; gap: 16px; font-size: 21px; }
  .cat { color: ${accent}; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; }
  .dot { width: 5px; height: 5px; border-radius: 50%; background: ${C.outline}; }
  .claim { color: ${C.muted}; }
</style>
<div class="rule"></div>
<div class="glow"></div>
<header>
  <svg viewBox="0 0 950 950" fill="currentColor">${siteMarkPaths}</svg>
  <span>${SITE_NAME}</span>
</header>
<main>
  ${icon ? `<div class="tile">${iconSvg(icon, 56)}</div>` : ''}
  <h1>${title}</h1>
  <p>${sub}</p>
</main>
<footer>
  ${category ? `<span class="cat">${categoryLabel(category)}</span><span class="dot"></span>` : ''}
  <span class="claim">Runs entirely in your browser</span>
</footer>`;
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
