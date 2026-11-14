/** Renders ../preview.html to PNG in both themes at 1440px. Run from the repo root so @playwright/test resolves. */
import { chromium } from '@playwright/test';
const dir = new URL('../', import.meta.url).pathname;
const b = await chromium.launch();
for (const theme of ['light', 'dark']) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: Number(process.env.DPR ?? 1) });
  await p.goto(`file://${dir}preview.html?theme=${theme}`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const overflow = await p.evaluate(() => [...document.querySelectorAll('.col *')].filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow === 'visible' && e.children.length === 0).map((e) => e.className + ':' + e.textContent.slice(0, 30)));
  if (overflow.length) console.log(theme, 'overflowing:', overflow.slice(0, 10));
  await p.screenshot({ path: `${dir}preview-${theme}.png`, fullPage: true });
  if (process.env.CROPS) {
    const cols = await p.locator('.col').all();
    for (let i = 0; i < cols.length; i++) await cols[i].screenshot({ path: `${dir}_work/col-${i}-${theme}.png` });
    await p.locator('.ds').screenshot({ path: `${dir}_work/ds-${theme}.png` });
  }
  await p.close();
}
await b.close();
