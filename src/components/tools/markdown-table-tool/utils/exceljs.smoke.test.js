import { describe, it, expect } from 'vitest';

/**
 * exceljs dynamic-import smoke test — one of Phase 2's gates.
 *
 * exceljs is the heaviest dependency in the tree (940 kB / 270 kB gzipped),
 * it is loaded lazily from two places, and it needs special handling in the
 * build (`optimizeDeps.exclude`, and `define: { global: 'globalThis' }` for
 * the UMD bundle's Node-isms). That combination is exactly the kind that
 * survives a config change silently and fails the first time a user drops an
 * .xlsx on the import dialog.
 *
 * **The interop shape is the thing to pin, and it is not the same everywhere.**
 * Under Node, `await import('exceljs')` yields a namespace with `default` and
 * nothing else — `ns.Workbook` is `undefined`. In the browser bundle Rollup's
 * `_mergeNamespaces` helper copies the CJS exports onto the namespace, so
 * `ns.Workbook` *is* defined there. The two call sites in this repo disagree
 * accordingly:
 *
 *   csvParser.js            `const X = await import('exceljs'); new X.Workbook()`
 *   ResultsDisplayShadcn    `const X = (await import('exceljs')).default`
 *
 * Only the second is correct in both environments. This test pins the shape
 * so that if a toolchain change ever stops merging the namespace, the
 * `.default`-less call site is caught here rather than by a user.
 */

describe('exceljs dynamic import', () => {
  it('resolves, and carries the Workbook constructor on .default', async () => {
    const ns = await import('exceljs');

    expect(ns.default).toBeTypeOf('object');
    expect(ns.default.Workbook).toBeTypeOf('function');
  });

  it('round-trips a workbook through xlsx.writeBuffer and xlsx.load', async () => {
    // The two operations the tools actually perform — azure-naming writes,
    // markdown-table reads — so a broken build fails here, not on a user's
    // first export.
    const ExcelJS = (await import('exceljs')).default;

    const out = new ExcelJS.Workbook();
    const sheet = out.addWorksheet('Sheet1');
    sheet.addRow(['name', 'cidr']);
    sheet.addRow(['prod', '10.0.0.0/16']);

    const buffer = await out.xlsx.writeBuffer();
    // A real xlsx is a zip: 'PK'.
    expect(Buffer.from(buffer).subarray(0, 2).toString()).toBe('PK');

    const back = new ExcelJS.Workbook();
    await back.xlsx.load(buffer);
    const loaded = back.getWorksheet(1);

    expect(loaded).toBeTruthy();
    expect(loaded.getRow(2).getCell(2).value).toBe('10.0.0.0/16');
  });
});

describe('the call sites agree with the shape above', () => {
  it('csvParser reaches through .default', async () => {
    // A regression guard with teeth: this exact line was `await
    // import('exceljs')` and threw `Workbook is not a constructor` in the
    // Astro build and in Node, working only in the Vite SPA build.
    const source = await import('node:fs').then(({ readFileSync }) =>
      readFileSync(new URL('./csvParser.js', import.meta.url), 'utf8')
    );

    expect(source).toContain("(await import('exceljs')).default");
    expect(source).not.toMatch(/const ExcelJS = await import\('exceljs'\);/);
  });
});
