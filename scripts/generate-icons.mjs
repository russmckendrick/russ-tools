#!/usr/bin/env node

/**
 * The site mark as files: the SVG favicon, favicon.ico, and the touch and
 * home-screen PNGs.
 *
 * Run on demand (`pnpm generate:icons`) and commit the output, as with the
 * Open Graph cards. The drawing is lifted from `src/shell/SiteMark.astro` and
 * the colours from the generated token layer, so the icon in a browser tab is
 * the mark in the header rather than a second drawing that can drift from it.
 *
 * Two shapes of icon:
 *   - a rounded tile with clear corners, for the tab (logo.svg, favicon.ico)
 *   - a full-bleed square with the mark inside the maskable safe zone, for
 *     iOS and Android, which cut their own corners
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const tokens = readFileSync('src/styles/tokens.generated.css', 'utf8');

/** @param {string} name a custom property name, without the leading `--` */
const token = (name) => {
  const found = tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8});`))?.[1];
  if (!found) throw new Error(`token not found in tokens.generated.css: --${name}`);
  return found;
};

const BAND = token('color-band');
const KEY = token('color-on-band');
const BOLT = token('color-accent-bright');

const source = readFileSync('src/shell/SiteMark.astro', 'utf8').match(/<svg[^>]*>([\s\S]*?)<\/svg>/)[1];
const KEY_FILL = 'fill="currentColor"';
const BOLT_FILL = 'style="fill: var(--rt-mark-bolt, currentColor)"';
if (!source.includes(KEY_FILL) || !source.includes(BOLT_FILL)) {
  throw new Error('SiteMark.astro no longer carries the two fills this script rewrites');
}
const mark = source
  .replace(KEY_FILL, `fill="${KEY}"`)
  .replace(BOLT_FILL, `fill="${BOLT}"`)
  .replace(/\s*\n\s*/g, ' ')
  .trim();

/** The mark's bounding box is centred on this point of the 24px grid. */
const CENTRE = 12.125;

/**
 * @param {number} scale how much of the square the mark's grid fills
 * @param {number} radius corner radius of the ground, in grid units
 */
const iconSvg = (scale, radius) => {
  const shift = (12 - CENTRE * scale).toFixed(3);
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">',
    `  <rect width="24" height="24" rx="${radius}" fill="${BAND}"/>`,
    `  <g transform="translate(${shift} ${shift}) scale(${scale})">${mark}</g>`,
    '</svg>',
    '',
  ].join('\n');
};

const tile = iconSvg(0.84, 5);
const bleed = iconSvg(0.6, 0);

writeFileSync('public/assets/logo.svg', tile);

const browser = await chromium.launch();
const page = await browser.newPage();

/** @param {string} svg @param {number} size */
const raster = async (svg, size) => {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`
  );
  return page.screenshot({ omitBackground: true });
};

for (const [file, size] of [
  ['public/apple-touch-icon.png', 180],
  ['public/android-chrome-192x192.png', 192],
  ['public/android-chrome-512x512.png', 512],
]) {
  writeFileSync(file, await raster(bleed, size));
}

const ICO_SIZES = [16, 32, 48];
const images = [];
for (const size of ICO_SIZES) images.push(await raster(tile, size));
await browser.close();

const header = Buffer.alloc(6);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = 6 + 16 * images.length;
const entries = images.map((png, i) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(ICO_SIZES[i], 0);
  entry.writeUInt8(ICO_SIZES[i], 1);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += png.length;
  return entry;
});
writeFileSync('public/favicon.ico', Buffer.concat([header, ...entries, ...images]));

console.log('✅ public/assets/logo.svg, favicon.ico (16/32/48), apple-touch-icon.png, android-chrome-192/512');
