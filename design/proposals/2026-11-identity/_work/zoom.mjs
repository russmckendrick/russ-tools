/** Pixel check: the 16px and 24px marks at 1x, enlarged 8x without smoothing. */
import { chromium } from '@playwright/test';
const dir = new URL('../', import.meta.url).pathname;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await p.goto(`file://${dir}preview.html?theme=light`, { waitUntil: 'networkidle' });
const shots = [];
for (const g of await p.locator('.pv-ground').all()) {
  const box = await g.locator('.pv-sizes').boundingBox();
  const buf = await p.screenshot({ clip: { x: box.x - 4, y: box.y + box.height - 62, width: 70, height: 44 } });
  const fav = await g.locator('.pv-sizes figure:last-child').boundingBox();
  const buf2 = fav ? await p.screenshot({ clip: { x: fav.x + 8, y: fav.y, width: 80, height: 36 } }) : null;
  shots.push(buf.toString('base64'), buf2 ? buf2.toString('base64') : null);
}
const z = await b.newPage({ viewport: { width: 1250, height: 760 } });
await z.setContent(`<body style="margin:0;background:#888;display:grid;grid-template-columns:repeat(4,auto);gap:6px;justify-content:start">${shots.filter(Boolean).map((s) => `<img src="data:image/png;base64,${s}" style="image-rendering:pixelated;height:240px">`).join('')}</body>`);
await z.screenshot({ path: `${dir}_work/zoom.png`, fullPage: true });
await b.close();
