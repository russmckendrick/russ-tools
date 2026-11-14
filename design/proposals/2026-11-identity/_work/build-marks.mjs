/**
 * Writes the standalone SVG files into ../marks from the hand-written paths
 * in marks.mjs. The wordmark is IBM Plex Mono converted to outlines (read from
 * the repo's own @fontsource copy), so no file depends on an installed font.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as fk from '../../../../node_modules/.pnpm/fontkitten@1.0.3/node_modules/fontkitten/dist/index.js';
import { PALETTES } from './palettes.mjs';
import { MARKS, markInner, markColours, block16, TILE, BLOCK_LIT_LIGHT } from './marks.mjs';

const FONT_DIR = new URL('../../../../node_modules/.pnpm/@fontsource+ibm-plex-mono@5.3.0/node_modules/@fontsource/ibm-plex-mono/files/', import.meta.url).pathname;
const fonts = {};
const font = (w) => (fonts[w] ??= fk.create(readFileSync(`${FONT_DIR}ibm-plex-mono-latin-${w}-normal.woff`)));
const r = (n) => Number(n.toFixed(2));

/** One word as a single outlined path, baked to final coordinates. */
function wordPath(text, weight, size, x0, baseline, tracking) {
  const f = font(weight);
  const s = size / f.unitsPerEm;
  let x = x0;
  let d = '';
  for (const ch of text) {
    const g = f.glyphForCodePoint(ch.codePointAt(0));
    for (const c of g.path.commands) {
      const a = c.args.map((v, i) => r(i % 2 === 0 ? x + v * s : baseline - v * s));
      d += { moveTo: 'M', lineTo: 'L', quadraticCurveTo: 'Q', bezierCurveTo: 'C', closePath: 'Z' }[c.command] + a.join(' ');
    }
    x += g.advanceWidth * s + tracking * size;
  }
  return { d, end: x };
}

/** The dot of russ.tools, drawn as each direction's own lit shape. */
function dot(id, cx, baseline, size) {
  const u = size / 100;
  if (id === 'hex') {
    const R = 13.5 * u;
    const h = R * 0.866;
    const cy = baseline - h;
    return `M${r(cx - R)} ${r(cy)}L${r(cx - R / 2)} ${r(cy - h)}H${r(cx + R / 2)}L${r(cx + R)} ${r(cy)}L${r(cx + R / 2)} ${r(cy + h)}H${r(cx - R / 2)}Z`;
  }
  const w = 19 * u;
  const rad = id === 'ligature' ? w / 2 : 0;
  const x = cx - w / 2;
  const y = baseline - w;
  if (!rad) return `M${r(x)} ${r(y)}h${r(w)}v${r(w)}h${r(-w)}z`;
  const k = r(rad);
  const e = r(w - 2 * rad);
  return `M${r(x + rad)} ${r(y)}h${e}a${k} ${k} 0 0 1 ${k} ${k}v${e}a${k} ${k} 0 0 1 ${-k} ${k}h${-e}a${k} ${k} 0 0 1 ${-k} ${-k}v${-e}a${k} ${k} 0 0 1 ${k} ${-k}z`;
}

const WEIGHT = { hex: 600, block: 500, ligature: 500 };
const SIZE = 22;
const BASE = 22.6;
const TRACK = -0.035;

export function lockup(id, c) {
  const mark = `<g transform="scale(1.3333)">${markInner(id, c.ink, c.lit)}</g>`;
  const a = wordPath('russ', WEIGHT[id], SIZE, 43, BASE, TRACK);
  const cell = SIZE * 0.4;
  const b = wordPath('tools', WEIGHT[id], SIZE, a.end + cell + TRACK * SIZE * 0.5, BASE, TRACK);
  const width = Math.ceil(b.end + 1);
  const body = `${mark}<path fill="${c.word}" d="${a.d}${b.d}"/><path fill="${c.lit}" d="${dot(id, a.end + cell / 2 - TRACK * SIZE * 0.25, BASE, SIZE)}"/>`;
  return { width, body };
}

const svg = (w, h, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}">\n  ${body}\n</svg>\n`;

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = new URL('../marks/', import.meta.url).pathname;
  mkdirSync(out, { recursive: true });
  for (const [id, p] of Object.entries(PALETTES)) {
    const c = markColours(id, p);
    writeFileSync(`${out}${id}-mark-on-light.svg`, svg(24, 24, markInner(id, c.light.ink, c.light.lit), 'russ.tools'));
    writeFileSync(`${out}${id}-mark-on-dark.svg`, svg(24, 24, markInner(id, c.dark.ink, c.dark.lit), 'russ.tools'));
    writeFileSync(`${out}${id}-mark-mono.svg`, svg(24, 24, markInner(id, 'currentColor'), 'russ.tools'));
    const tile = `<rect width="24" height="24" rx="5" fill="${p.band.band}"/><g transform="translate(${TILE.shift} ${TILE.shift}) scale(${TILE.scale})">${markInner(id, c.dark.ink, c.dark.lit)}</g>`;
    writeFileSync(`${out}${id}-favicon.svg`, svg(24, 24, tile, 'russ.tools'));
    for (const g of ['light', 'dark']) {
      const l = lockup(id, c[g]);
      writeFileSync(`${out}${id}-lockup-on-${g}.svg`, svg(l.width, 32, l.body, 'russ.tools'));
    }
    const m = lockup(id, { ink: 'currentColor', lit: 'currentColor', word: 'currentColor' });
    writeFileSync(`${out}${id}-lockup-mono.svg`, svg(m.width, 32, m.body, 'russ.tools'));
    if (id === 'block') writeFileSync(`${out}block-favicon-16.svg`, svg(16, 16, block16(p.light.primary, BLOCK_LIT_LIGHT), 'russ.tools'));
    console.log(id, 'nodes:', [...MARKS[id].ink, ...MARKS[id].lit].join('').match(/[A-Za-z]/g).length, 'lockup width', m.width);
  }
}
