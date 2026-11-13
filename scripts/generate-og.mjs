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
 * The card is drawn on Datasheet's ink band — the same ground as the site
 * header — with every value read out of the generated token layer rather than
 * retyped, so `pnpm generate:tokens` followed by this stays consistent with
 * DESIGN.md.
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
  band: token('color-band'),
  raised: token('color-band-raised'),
  outline: token('color-band-outline'),
  text: token('color-on-band'),
  muted: token('color-on-band-muted'),
  accent: token('color-accent-bright'),
  onAccent: token('color-on-accent-bright'),
};

/**
 * Both families, inlined. Datasheet reads in IBM Plex Sans and sets data and
 * small labels in IBM Plex Mono, so a card drawn with one face is drawn wrong.
 */
const sansData = readFileSync(
  'node_modules/@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2'
).toString('base64');
const monoData = readFileSync(
  'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2'
).toString('base64');

// The toolbox mark, lifted from SiteMark.astro: the inner markup of its one
// <svg>. It draws in currentColor, which the card sets to the bright accent.
const siteMark = readFileSync('src/shell/SiteMark.astro', 'utf8')
  .match(/<svg[^>]*>([\s\S]*?)<\/svg>/)[1];

/** @param {{title: string, sub: string, icon: string|null, category: string|null, path: string}} card */
const cardHtml = ({ title, sub, icon, category, path }) => {
  return `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face {
    font-family: 'IBM Plex Sans Variable';
    src: url(data:font/woff2;base64,${sansData}) format('woff2');
    font-weight: 100 700;
    font-display: block;
  }
  @font-face {
    font-family: 'IBM Plex Mono';
    src: url(data:font/woff2;base64,${monoData}) format('woff2');
    font-weight: 400;
    font-display: block;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  /*
    Datasheet: the card is the site's ink band — the deep green ground with
    its faint grid, the tool's glyph on the one bright tile, and type in
    white. No frame and no shadow.
  */
  body {
    width: ${WIDTH}px; height: ${HEIGHT}px;
    font-family: 'IBM Plex Sans Variable', sans-serif;
    background-color: ${C.band};
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.04) 2px, transparent 2px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.04) 2px, transparent 2px);
    background-size: 60px 60px;
    color: ${C.text};
    position: relative; overflow: hidden;
    -webkit-font-smoothing: antialiased;
    display: flex; flex-direction: column;
    padding: 56px 72px 48px;
  }
  header {
    display: flex; align-items: center; gap: 14px;
    font-size: 28px; font-weight: 600; letter-spacing: -0.01em;
  }
  header svg {
    width: 34px; height: 34px; color: ${C.accent};
    stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round;
  }
  main { margin-top: auto; }
  .mark { display: flex; align-items: center; gap: 22px; margin-bottom: 34px; }
  .tile {
    display: flex; align-items: center; justify-content: center;
    width: 92px; height: 92px;
    background: ${C.accent}; color: ${C.onAccent};
    border-radius: 20px;
  }
  .badge {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 21px; letter-spacing: 0.06em; text-transform: uppercase;
    color: ${C.accent}; white-space: nowrap;
  }
  h1 {
    font-size: ${title.length > 26 ? 64 : 78}px; font-weight: 500;
    letter-spacing: -0.03em; line-height: 1.04;
  }
  p { margin-top: 22px; font-size: 30px; line-height: 1.4; color: ${C.muted}; max-width: 940px; font-weight: 400; }
  footer {
    margin-top: 40px; padding-top: 24px;
    border-top: 2px solid ${C.outline};
    font-family: 'IBM Plex Mono', monospace;
    font-size: 20px; letter-spacing: 0.04em;
    color: ${C.muted};
  }
</style>
<header>
  <svg viewBox="0 0 24 24" fill="none">${siteMark}</svg>
  <span>${SITE_NAME}</span>
</header>
<main>
  <div class="mark">
    ${icon ? `<span class="tile">${iconSvg(icon, 52)}</span>` : ''}
    ${category ? `<span class="badge">${categoryLabel(category)}</span>` : ''}
  </div>
  <h1>${title}</h1>
  <p>${sub}</p>
</main>
<footer>russ.tools${path}</footer>`;
};

const tools = await loadManifests();
const cards = [
  {
    name: 'default',
    title: 'russ.tools',
    sub: SITE_DESCRIPTION.split('. ')[0] + '.',
    icon: null,
    category: null,
    path: '',
  },
  ...tools.map((tool) => ({
    name: tool.id,
    title: tool.title,
    sub: tool.shortDescription,
    icon: tool.icon,
    category: tool.category,
    path: tool.path,
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
