/**
 * Assembles ../preview.html: one self-contained page (inline CSS, inline SVG,
 * Google Fonts the only external request). Every colour and every contrast
 * figure on the page is read from palettes.mjs and computed here, never typed.
 *
 * Run: node _work/build-preview.mjs
 */
import { writeFileSync } from 'node:fs';
import { PALETTES, DATASHEET } from './palettes.mjs';
import { contrast, measure, measureMark, separation } from './contrast.mjs';
import { markInner, markColours, block16, TILE, BLOCK_LIT_LIGHT } from './marks.mjs';
import { lockup } from './build-marks.mjs';

const IDS = ['hex', 'block', 'ligature'];
const LETTER = { hex: 'A', block: 'B', ligature: 'C' };
const IDEA = {
  hex: 'A hex key and the bolt it turns. The key is also the r; the bolt is the dot.',
  block: 'One square divided the way a prefix divides: a half, a quarter, an eighth, two sixteenths. One block lit.',
  ligature: 'r and t sharing one stroke: the arm of the r runs on as the crossbar of the t.',
};
const SCHEME = {
  hex: 'Graphite band, copper accent. Bright copper fills in both themes; russet for text on paper.',
  block: 'Cyanotype-blue band that doubles as the light theme’s accent. Sky blue acts on the band and in dark.',
  ligature: 'Indigo-black band, iris accent. The only accent hue here that sits clear of all four status hues.',
};

const SEP_NOTE = {
  hex: 'Underlined: under 0.15. Copper sits between amber and red, so warning has been pushed to olive-yellow and error to rose to keep them apart. With the usual amber the light-theme figure is 0.06.',
  block: 'Info shares the accent on purpose, as success shares it in Datasheet today. Success, warning and error are all clear of it.',
  ligature: 'Underlined: under 0.15. Info has been moved from blue to cyan to stay clear of the iris.',
};
const f2 = (n) => n.toFixed(2);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/* ---- tool glyphs, copied from src/shell/icons.mjs so the page stands alone ---- */
const GLYPH = {
  network: '<path d="M8 3h8v5H8z"/><path d="M3 16h7v5H3z"/><path d="M14 16h7v5h-7z"/><path d="M12 8v4M6.5 16v-4h11v4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  braces:
    '<path d="M8 4c-2 0-3 1-3 3v2c0 1.5-1 3-2 3c1 0 2 1.5 2 3v2c0 2 1 3 3 3"/><path d="M16 4c2 0 3 1 3 3v2c0 1.5 1 3 2 3c-1 0-2 1.5-2 3v2c0 2-1 3-3 3"/><path d="M12 8h.01M12 12h.01M12 16h.01"/>',
  shield: '<path d="M12 3l7 3v5c0 5-3 8-7 10c-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  combine: '<path d="M4 4h11v11H4z"/><path d="M9 9h11v11H9z"/>',
};
const glyph = (name, size) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPH[name]}</svg>`;

const markSvg = (id, c, size, label) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${markInner(id, c.ink, c.lit)}</svg>`;
const tileSvg = (id, p, size) => {
  const c = markColours(id, p).dark;
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><rect width="24" height="24" rx="5" fill="${p.band.band}"/><g transform="translate(${TILE.shift} ${TILE.shift}) scale(${TILE.scale})">${markInner(id, c.ink, c.lit)}</g></svg>`;
};
const favicon16 = (id, p) => (id === 'block' ? `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">${block16(p.light.primary, BLOCK_LIT_LIGHT)}</svg>` : tileSvg(id, p, 16));
const lockupSvg = (id, c, height) => {
  const l = lockup(id, c);
  return `<svg viewBox="0 0 ${l.width} 32" height="${height}" width="${r1((l.width * height) / 32)}" role="img" aria-label="russ.tools">${l.body}</svg>`;
};
const r1 = (n) => Math.round(n * 10) / 10;

/* ---- CSS variables per direction ---- */
const vars = (obj) => Object.entries(obj).map(([k, v]) => `--${k}:${v}`).join(';');
let dirCss = '';
for (const id of IDS) {
  const p = PALETTES[id];
  dirCss += `[data-dir="${id}"]{${vars(p.band)};${vars(p.dark)}}\n`;
  dirCss += `:root[data-theme="light"] [data-dir="${id}"]{${vars(p.light)}}\n`;
}

/* ---- pieces ---- */
function marksPanel(id) {
  const p = PALETTES[id];
  const c = markColours(id, p);
  const row = (g) => {
    const bg = g === 'light' ? p.light.surface : p.band.band;
    const fg = g === 'light' ? p.light['on-surface-faint'] : p.band['on-band-muted'];
    const mono = g === 'light' ? p.light['on-surface'] : p.band['on-band'];
    const cell = (svg, cap) => `<figure>${svg}<figcaption>${cap}</figcaption></figure>`;
    return `<div class="pv-ground" style="background:${bg};color:${fg}">
      <div class="pv-sizes">
        ${cell(markSvg(id, c[g], 16), '16')}
        ${cell(markSvg(id, c[g], 24), '24')}
        ${cell(markSvg(id, c[g], 56), '56')}
        ${cell(markSvg(id, { ink: mono, lit: mono }, 56), 'one colour')}
        ${g === 'light' ? cell(favicon16(id, p) + tileSvg(id, p, 32), 'favicon 16 · 32') : ''}
      </div>
      <div class="pv-lockups">
        ${lockupSvg(id, c[g], 32)}
        ${lockupSvg(id, { ink: mono, lit: mono, word: mono }, 22)}
      </div>
    </div>`;
  };
  const beside = `<div class="pv-beside" style="background:${p.band.band};color:${p.band['accent-bright']}">
      ${markSvg(id, c.dark, 22)}<span class="pv-sep" style="background:${p.band['band-outline']}"></span>
      ${['network', 'globe', 'shield', 'braces', 'clock', 'combine'].map((g) => glyph(g, 22)).join('')}
      <span class="pv-note" style="color:${p.band['on-band-muted']}">beside the tool glyphs, 22px</span>
    </div>`;
  return `<div class="pv-marks">${row('light')}${row('dark')}${beside}</div>`;
}

function mock(id) {
  const p = PALETTES[id];
  const c = markColours(id, p);
  return `<div class="m" data-dir="${id}">
    <div class="m-header">
      <a class="m-brand">${lockupSvg(id, c.dark, 24)}</a>
      <nav class="m-nav"><a aria-current="true">Tools</a><a>Saved data</a><a>Source</a></nav>
    </div>
    <div class="m-band">
      <div class="m-crumb"><span>Tools</span><span>/</span><b>Network</b></div>
      <div class="m-title"><span class="m-tile">${glyph('network', 22)}</span><h3>Subnet Calculator</h3></div>
      <p class="m-desc">IPv4 and IPv6 subnet details, with a visual split-and-join divide table.</p>
    </div>
    <div class="m-page">
      <div class="m-card">
        <label class="m-label">IPv4 or IPv6 address</label>
        <div class="m-row">
          <span class="m-input">10.0.0.0/22</span>
          <span class="m-btn">Calculate</span>
        </div>
        <p class="m-hint">Nothing leaves the browser. <a>How the divide table works</a></p>
      </div>
      <div class="m-badges">
        <span class="m-badge m-badge-cat">Network</span>
        <span class="m-badge m-badge-out">IPv4</span>
        <span class="m-status" style="--s:var(--success);--t:var(--success-subtle)">Valid</span>
        <span class="m-status" style="--s:var(--warning);--t:var(--warning-subtle)">Expires in 12 days</span>
        <span class="m-status" style="--s:var(--error);--t:var(--error-subtle)">Mismatch</span>
        <span class="m-status" style="--s:var(--info);--t:var(--info-subtle)">Cached</span>
      </div>
      <div class="m-section"><h4>Divide table</h4><span>4 blocks</span></div>
      <table class="m-table">
        <thead><tr><th>Block</th><th>Range</th><th>Hosts</th><th></th></tr></thead>
        <tbody>
          <tr><td>10.0.0.0/23</td><td>10.0.0.0 – 10.0.1.255</td><td>510</td><td><a>Split</a></td></tr>
          <tr><td>10.0.2.0/24</td><td>10.0.2.0 – 10.0.2.255</td><td>254</td><td><a>Join</a></td></tr>
          <tr><td>10.0.3.0/24</td><td>10.0.3.0 – 10.0.3.255</td><td>254</td><td><a>Join</a></td></tr>
        </tbody>
      </table>
      <div class="m-diagram">
        <svg viewBox="0 0 400 150" width="100%" aria-hidden="true">
          <path class="d-line" d="M200 40v14a6 6 0 0 1-6 6h-88a6 6 0 0 0-6 6v14M200 40v14a6 6 0 0 0 6 6h88a6 6 0 0 1 6 6v14"/>
          <path class="d-line" d="M300 110v6a6 6 0 0 1-6 6h-34a6 6 0 0 0-6 6v6M300 110v6a6 6 0 0 0 6 6h34a6 6 0 0 1 6 6v6" />
          <rect class="d-node" x="140" y="10" width="120" height="30" rx="6"/><text class="d-text" x="200" y="29.5">10.0.0.0/22</text>
          <rect class="d-node d-accent" x="40" y="80" width="120" height="30" rx="6"/><text class="d-text" x="100" y="99.5">10.0.0.0/23</text>
          <rect class="d-node" x="240" y="80" width="120" height="30" rx="6"/><text class="d-text" x="300" y="99.5">10.0.2.0/23</text>
          <rect class="d-node d-stub" x="216" y="134" width="76" height="16" rx="4"/><rect class="d-node d-stub" x="308" y="134" width="76" height="16" rx="4"/>
        </svg>
      </div>
      <div class="m-footer"><span>russ.tools</span><span>MIT · no tracking</span></div>
    </div>
  </div>`;
}

const SWATCH_GROUND = {
  'on-surface': 'surface', 'on-surface-muted': 'surface', 'on-surface-faint': 'surface', 'on-surface-dim': 'surface-inset',
  'primary-text': 'surface-inset', primary: 'surface', 'on-primary': 'primary', 'outline-strong': 'surface-inset', rule: 'surface',
  success: 'surface-inset', warning: 'surface-inset', error: 'surface-inset', info: 'surface-inset',
};
const BAND_GROUND = {
  'on-band': 'band', 'on-band-muted': 'band-raised', 'accent-bright': 'band-raised', 'on-accent-bright': 'accent-bright',
  'band-outline': 'band-raised', 'band-warning': 'band-raised', 'band-error': 'band-raised',
};

function swatches(id) {
  const p = PALETTES[id];
  const chip = (role, hex, against, floor) => {
    const ink = contrast(hex, '#ffffff') >= contrast(hex, '#000000') ? '#ffffff' : '#000000';
    const ratio = against ? contrast(hex, against.hex) : null;
    return `<div class="sw" style="background:${hex};color:${ink}">
      <b>${role}</b><code>${hex}</code>
      ${ratio ? `<span class="sw-r">${f2(ratio)} <i>on ${against.role}${floor ? ` · floor ${floor}` : ''}</i></span>` : '<span class="sw-r"><i>ground</i></span>'}
    </div>`;
  };
  const themeBlock = (t) => {
    const T = p[t];
    const roles = ['surface', 'surface-raised', 'surface-inset', 'outline', 'rule', 'outline-strong', 'on-surface', 'on-surface-muted', 'on-surface-faint', 'on-surface-dim', 'primary', 'on-primary', 'primary-text', 'success', 'warning', 'error', 'info'];
    const floors = { rule: 3, 'outline-strong': 3, primary: 3 };
    return `<div class="sw-grid" data-for="${t}">${roles
      .map((role) => {
        const g = SWATCH_GROUND[role];
        return chip(role, T[role], g ? { role: g, hex: T[g] } : null, g ? floors[role] ?? 4.5 : null);
      })
      .join('')}</div>`;
  };
  const bandBlock = `<div class="sw-grid sw-band">${Object.keys(p.band)
    .map((role) => {
      const g = BAND_GROUND[role];
      return chip(role, p.band[role], g ? { role: g, hex: p.band[g] } : null, g ? (role === 'band-outline' ? 3 : 4.5) : null);
    })
    .join('')}</div>`;

  const rows = measure(p);
  const marks = measureMark(id, p);
  const sep = separation(p);
  const low = (t) => rows.filter((x) => x.theme === t && x.floor === 4.5).sort((a, b) => a.ratio - b.ratio)[0];
  const summary = ['light', 'dark', 'band']
    .map((t) => {
      const l = low(t);
      return `<li><b>${t}</b> lowest text pair ${f2(l.ratio)} <span>(${l.fg} on ${l.bg})</span></li>`;
    })
    .join('');
  const sepRow = (t) => `<tr><th>${t}</th>${sep.filter((s) => s.theme === t).map((s) => (s.dE === 0 ? '<td class="same">shared</td>' : `<td class="${s.dE < 0.1 ? 'bad' : s.dE < 0.15 ? 'warn' : ''}">${f2(s.dE)}</td>`)).join('')}</tr>`;
  const table = (t) =>
    `<table class="ct" ${t === 'band' ? '' : `data-for="${t}"`}><caption>${t === 'band' ? 'On the band' : t}</caption><tbody>${rows
      .filter((x) => x.theme === t)
      .map((x) => `<tr><td><i style="background:${x.fgHex}"></i>${x.fg}</td><td><i style="background:${x.bgHex}"></i>${x.bg}</td><td>${f2(x.ratio)}</td><td>${x.floor}</td></tr>`)
      .join('')}</tbody></table>`;

  return `<div class="pv-pal">
    <p class="pv-scheme"><b>${p.scheme}.</b> ${SCHEME[id]}</p>
    <h4 class="pv-h">Page <span data-for="light">· light</span><span data-for="dark">· dark</span></h4>
    ${themeBlock('light')}${themeBlock('dark')}
    <h4 class="pv-h">Band · same in both themes</h4>
    ${bandBlock}
    <ul class="pv-sum">${summary}<li><b>${rows.length} pairs</b> measured, ${rows.filter((x) => !x.pass).length} below floor</li>
      <li><b>mark</b> ${marks.map((m) => `${m.part} on ${m.ground} ${f2(m.ratio)}`).join(' · ')}</li></ul>
    <table class="sep"><caption>Accent text against each status hue — OKLab distance, higher is easier to tell apart</caption>
      <thead><tr><th></th><th>success</th><th>warning</th><th>error</th><th>info</th></tr></thead>
      <tbody>${sepRow('light')}${sepRow('dark')}</tbody></table>
    <p class="sep-note">${SEP_NOTE[id]}</p>
    <details><summary>All ${rows.length} measured pairs</summary>${table('light')}${table('dark')}${table('band')}</details>
  </div>`;
}

function column(id) {
  const p = PALETTES[id];
  return `<section class="col">
    <header class="col-head"><span class="col-letter">${LETTER[id]}</span><div><h2>${p.name} <span>/ ${p.scheme}</span></h2><p>${IDEA[id]}</p></div></header>
    ${marksPanel(id)}
    ${mock(id)}
    ${swatches(id)}
  </section>`;
}

/* ---- the three marks on today's palette ---- */
function onDatasheet() {
  const d = DATASHEET;
  const cell = (id) => {
    const dark = { ink: d.band['on-band'], lit: d.band['accent-bright'], word: d.band['on-band'] };
    const light = { ink: d.light['on-surface'], lit: d.light.primary, word: d.light['on-surface'] };
    const blockLight = { ink: d.light.primary, lit: '#2a9d63', word: d.light['on-surface'] };
    return `<div class="ds-cell">
      <div style="background:${d.band.band}">${lockupSvg(id, dark, 24)}</div>
      <div style="background:#fff">${lockupSvg(id, id === 'block' ? blockLight : light, 24)}</div>
    </div>`;
  };
  const today = (ink, lit) => `<span class="ds-today" style="color:${ink}"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${lit}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h16v11H4z"/><path d="M9 8V5h6v3"/><path d="M4 13h16"/><path d="M12 12v2"/></svg><span>russ<i style="color:${lit}">.</i>tools</span></span>`;
  const now = `<div class="ds-cell"><div style="background:${d.band.band}">${today(d.band['on-band'], d.band['accent-bright'])}</div><div style="background:#fff">${today(d.light['on-surface'], d.light.primary)}</div></div>`;
  return `<section class="ds"><h2>Mark only: today’s toolbox, then each mark on today’s Datasheet green</h2>
    <p>The marks do not depend on their palettes. Any of the three can replace the toolbox with no token change at all.</p>
    <div class="ds-grid">${now}${IDS.map(cell).join('')}</div></section>`;
}

const css = `
:root{--pg:#0b0b0c;--pg-ink:#f2f2f3;--pg-muted:#a3a3a8;--pg-line:#2a2a2e;--pg-panel:#151517;color-scheme:dark}
:root[data-theme="light"]{--pg:#f1f1f2;--pg-ink:#141416;--pg-muted:#5c5c63;--pg-line:#d6d6da;--pg-panel:#ffffff;color-scheme:light}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--pg);color:var(--pg-ink);font:14px/1.5 "IBM Plex Sans",system-ui,sans-serif}
code,.mono{font-family:"IBM Plex Mono",ui-monospace,monospace}
h1,h2,h3,h4,p,figure,ul{margin:0;padding:0}
.top{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;padding:28px 32px 20px;max-width:1440px;margin:0 auto}
.top h1{font-size:22px;font-weight:500;letter-spacing:-.015em}
.top p{color:var(--pg-muted);max-width:74ch;margin-top:4px}
.toggle{display:inline-flex;border:1px solid var(--pg-line);border-radius:6px;overflow:hidden;flex:none}
.toggle button{font:inherit;font-size:13px;padding:7px 14px;border:0;background:transparent;color:var(--pg-muted);cursor:pointer}
.toggle button[aria-pressed="true"]{background:var(--pg-ink);color:var(--pg)}
.toggle button:focus-visible{outline:2px solid var(--pg-ink);outline-offset:-4px}
.cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;padding:0 32px 32px;max-width:1440px;margin:0 auto;align-items:start}
.col{background:var(--pg-panel);border:1px solid var(--pg-line);border-radius:10px;overflow:hidden;min-width:0}
.col-head{display:flex;gap:14px;padding:18px 20px;border-bottom:1px solid var(--pg-line);min-height:104px}
.col-letter{font:500 13px/26px "IBM Plex Mono",monospace;width:26px;height:26px;text-align:center;border:1px solid var(--pg-line);border-radius:4px;flex:none}
.col-head h2{font-size:18px;font-weight:500;letter-spacing:-.01em}
.col-head h2 span{color:var(--pg-muted);font-weight:400}
.col-head p{color:var(--pg-muted);font-size:13px;margin-top:2px}
[data-for]{display:none}
:root[data-theme="light"] [data-for="light"],:root[data-theme="dark"] [data-for="dark"]{display:revert}
:root[data-theme="light"] .sw-grid[data-for="light"],:root[data-theme="dark"] .sw-grid[data-for="dark"]{display:grid}

/* marks */
.pv-ground{padding:18px 20px 16px;border-bottom:1px solid var(--pg-line)}
.pv-sizes{display:flex;align-items:flex-end;gap:20px}
.pv-sizes figure{display:flex;flex-direction:column;align-items:center;gap:8px}
.pv-sizes figure:nth-child(5){margin-left:auto;display:grid;grid-template-columns:auto auto;column-gap:10px;align-items:end;justify-items:center}
.pv-sizes figure:nth-child(5) figcaption{grid-column:1/-1}
.pv-sizes figcaption{font:400 10px/1 "IBM Plex Mono",monospace;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap}
.pv-lockups{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:18px}
.pv-beside{display:flex;align-items:center;gap:14px;padding:12px 20px;border-bottom:1px solid var(--pg-line)}
.pv-sep{width:1px;height:22px}
.pv-note{font:400 10px/1 "IBM Plex Mono",monospace;letter-spacing:.04em;text-transform:uppercase;margin-left:auto;white-space:nowrap}

/* the mock: the real shell, reduced */
.m{background:var(--surface);color:var(--on-surface);border-bottom:1px solid var(--pg-line)}
.m a{cursor:default}
.m-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 20px;min-height:52px;background:var(--band);border-bottom:1px solid color-mix(in srgb,var(--band-outline) 60%,transparent)}
.m-brand{display:flex}
.m-nav{display:flex;gap:18px}
.m-nav a{font-size:13px;color:var(--on-band-muted);padding:16px 0 14px;border-bottom:2px solid transparent;white-space:nowrap}
.m-nav a[aria-current]{color:var(--on-band);font-weight:600;border-bottom-color:var(--accent-bright)}
.m-band{padding:22px 20px 24px;background-color:var(--band);color:var(--on-band);
  background-image:linear-gradient(color-mix(in srgb,var(--on-band) 4%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--on-band) 4%,transparent) 1px,transparent 1px);background-size:40px 40px;border-bottom:1px solid var(--outline)}
.m-crumb{display:flex;gap:8px;font:400 11px/1 "IBM Plex Mono",monospace;letter-spacing:.06em;text-transform:uppercase;color:var(--on-band-muted)}
.m-crumb b{font-weight:400;color:var(--accent-bright)}
.m-title{display:flex;align-items:center;gap:14px;margin-top:14px}
.m-tile{display:grid;place-items:center;width:44px;height:44px;border-radius:8px;background:var(--accent-bright);color:var(--on-accent-bright);flex:none}
.m-title h3{font-size:28px;font-weight:500;letter-spacing:-.02em;line-height:1.1}
.m-desc{margin-top:12px;font-size:14px;color:var(--on-band-muted)}
.m-page{padding:20px}
.m-card{background:var(--surface-raised);border:1px solid var(--rule);border-radius:8px;padding:14px}
.m-label{display:block;font-size:13px;font-weight:500;color:var(--on-surface-muted);margin-bottom:6px}
.m-row{display:flex;gap:10px}
.m-input{flex:1;min-width:0;font:400 13px/34px "IBM Plex Mono",monospace;height:36px;padding:0 10px;border:1px solid var(--outline-strong);border-radius:6px;background:var(--surface-raised);color:var(--on-surface);box-shadow:0 0 0 2px var(--surface-raised),0 0 0 4px var(--primary-text)}
.m-btn{font-size:13px;font-weight:500;line-height:36px;height:36px;padding:0 16px;border-radius:6px;background:var(--primary);color:var(--on-primary);white-space:nowrap}
.m-hint{margin-top:12px;font-size:13px;color:var(--on-surface-faint)}
.m-hint a,.m-table a{color:var(--primary-text);text-decoration:underline;text-underline-offset:2px}
.m-badges{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.m-badge,.m-status{font-size:10px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;line-height:1;padding:5px 7px;border-radius:4px;white-space:nowrap}
.m-badge-cat{background:var(--accent-bright);color:var(--on-accent-bright)}
.m-badge-out{border:1px solid var(--primary-text);color:var(--primary-text);padding:4px 6px}
.m-status{background:var(--t);color:var(--s);display:inline-flex;align-items:center;gap:5px}
.m-status::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--s)}
.m-section{display:flex;align-items:baseline;justify-content:space-between;margin-top:22px;padding-bottom:8px;border-bottom:1px solid var(--on-surface)}
.m-section h4{font-size:16px;font-weight:500;letter-spacing:-.005em}
.m-section span{font:400 11px/1 "IBM Plex Mono",monospace;color:var(--on-surface-dim)}
.m-table{width:100%;border-collapse:collapse;font:400 12px/1.4 "IBM Plex Mono",monospace}
.m-table th{font:500 10px/1 "IBM Plex Sans",sans-serif;letter-spacing:.06em;text-transform:uppercase;text-align:left;color:var(--on-surface-faint);background:var(--surface-inset);padding:9px 8px}
.m-table td{padding:9px 8px;border-bottom:1px solid var(--outline);white-space:nowrap}
.m-table td:nth-child(2){color:var(--on-surface-muted)}
.m-table td:nth-child(3),.m-table th:nth-child(3){text-align:right}
.m-table td:last-child{text-align:right;font-family:"IBM Plex Sans",sans-serif;font-size:13px}
.m-diagram{margin-top:18px;border-radius:8px;padding:14px 10px 10px;background-color:var(--band);
  background-image:linear-gradient(color-mix(in srgb,var(--on-band) 4%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--on-band) 4%,transparent) 1px,transparent 1px);background-size:40px 40px}
.m-diagram svg{display:block}
.d-line{fill:none;stroke:var(--accent-bright);stroke-width:1.5}
.d-node{fill:var(--band-raised);stroke:var(--band-outline);stroke-width:1}
.d-accent{stroke:var(--accent-bright);stroke-width:1.5}
.d-stub{opacity:.75}
.d-text{fill:var(--on-band);font:400 12px "IBM Plex Mono",monospace;text-anchor:middle}
.m-footer{display:flex;justify-content:space-between;margin:20px -20px -20px;padding:12px 20px;background:var(--footer);color:var(--on-footer-muted);font:400 11px/1.4 "IBM Plex Mono",monospace;border-top:1px solid var(--outline)}
.m-footer span:first-child{color:var(--on-footer)}

/* palette */
.pv-pal{padding:18px 20px 20px}
.pv-scheme{font-size:13px;color:var(--pg-muted)}
.pv-scheme b{color:var(--pg-ink);font-weight:500}
.pv-h{font:500 10px/1 "IBM Plex Sans",sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--pg-muted);margin:18px 0 8px}
.pv-h span{display:none}
:root[data-theme="light"] .pv-h span[data-for="light"],:root[data-theme="dark"] .pv-h span[data-for="dark"]{display:inline}
.sw-grid{display:none;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--pg-line);border:1px solid var(--pg-line);border-radius:6px;overflow:hidden}
.sw-grid.sw-band{display:grid}
.sw{padding:8px 9px 9px;min-height:66px;display:flex;flex-direction:column;gap:2px;min-width:0}
.sw b{font:500 11px/1.2 "IBM Plex Sans",sans-serif;overflow-wrap:anywhere}
.sw code{font-size:10px;opacity:.85}
.sw-r{font:500 12px/1.2 "IBM Plex Mono",monospace;margin-top:auto}
.sw-r i{font:400 9.5px/1.2 "IBM Plex Sans",sans-serif;font-style:normal;opacity:.85;display:block;overflow-wrap:anywhere}
.pv-sum{list-style:none;margin-top:14px;font-size:12px;color:var(--pg-muted);display:grid;gap:3px}
.pv-sum b{color:var(--pg-ink);font-weight:500}
.sep{width:100%;border-collapse:collapse;margin-top:14px;font:400 12px/1.3 "IBM Plex Mono",monospace}
.sep caption,.ct caption{caption-side:top;text-align:left;font:400 11px/1.4 "IBM Plex Sans",sans-serif;color:var(--pg-muted);padding-bottom:6px}
.sep th{font:500 10px/1 "IBM Plex Sans",sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--pg-muted);text-align:right;padding:5px 6px}
.sep tbody th{text-align:left}
.sep td{text-align:right;padding:5px 6px;border-top:1px solid var(--pg-line)}
.sep td.warn{box-shadow:inset 0 -2px 0 #c89211}
.sep td.bad{box-shadow:inset 0 -2px 0 #d8453c}
.sep td.same{color:var(--pg-muted);font-family:"IBM Plex Sans",sans-serif}
.sep-note{font-size:11px;color:var(--pg-muted);margin-top:6px}
details{margin-top:14px;font-size:12px}
summary{cursor:pointer;color:var(--pg-muted)}
.ct{width:100%;border-collapse:collapse;margin-top:10px;font:400 10.5px/1.3 "IBM Plex Mono",monospace}
table.ct[data-for]{display:none}
:root[data-theme="light"] table.ct[data-for="light"],:root[data-theme="dark"] table.ct[data-for="dark"]{display:table}
.ct caption{text-transform:capitalize;font-weight:500;color:var(--pg-ink)}
.ct td{padding:3px 4px;border-top:1px solid var(--pg-line);overflow-wrap:anywhere}
.ct td:nth-child(n+3){text-align:right;white-space:nowrap}
.ct i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px;border:1px solid var(--pg-line);vertical-align:-1px}

.ds{max-width:1440px;margin:0 auto;padding:0 32px 40px}
.ds h2{font-size:16px;font-weight:500}
.ds p{color:var(--pg-muted);font-size:13px;margin:2px 0 12px}
.ds-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}
.ds-today{display:inline-flex;align-items:center;gap:9px;font:600 19px/1 "IBM Plex Sans",sans-serif;letter-spacing:-.01em}
.ds-today i{font-style:normal}
.ds-cell{border:1px solid var(--pg-line);border-radius:10px;overflow:hidden;display:grid;grid-template-columns:1fr 1fr}
.ds-cell div{display:grid;place-items:center;padding:22px 10px}
@media (max-width:1100px){.cols,.ds-grid{grid-template-columns:1fr}.top{flex-direction:column;align-items:flex-start}}
`;

const html = `<!doctype html>
<html lang="en" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>russ.tools — identity proposal, November 2026</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<script>
  (function () {
    var q = new URLSearchParams(location.search).get('theme');
    var t = q || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.dataset.theme = t === 'light' ? 'light' : 'dark';
  })();
</script>
<style>${css}${dirCss}</style>
</head>
<body>
<div class="top">
  <div>
    <h1>russ.tools — three directions for a mark and a colour scheme</h1>
    <p>Each column is one direction: the mark at favicon, header and tile size on paper and on the band; the lockup; a reduced copy of the real shell in that scheme; and the palette with its measured WCAG contrast. Structure, type and radii are Datasheet’s in all three. The reasoning is in <code>proposal.md</code>.</p>
  </div>
  <div class="toggle" role="group" aria-label="Theme">
    <button type="button" data-set="light" aria-pressed="false">Light</button>
    <button type="button" data-set="dark" aria-pressed="true">Dark</button>
  </div>
</div>
<main class="cols">
${IDS.map(column).join('\n')}
</main>
${onDatasheet()}
<script>
  (function () {
    var root = document.documentElement;
    var buttons = document.querySelectorAll('.toggle button');
    function sync() { buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.set === root.dataset.theme)); }); }
    buttons.forEach(function (b) { b.addEventListener('click', function () { root.dataset.theme = b.dataset.set; sync(); }); });
    sync();
  })();
</script>
</body>
</html>
`;

writeFileSync(new URL('../preview.html', import.meta.url).pathname, html);
console.log('wrote preview.html', (html.length / 1024).toFixed(0) + ' kB');
