import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { toolTable } from '../../scripts/generate-docs.mjs';

/**
 * The tool inventory in the READMEs, pinned to the registry.
 *
 * Hand-maintained lists are why the docs simultaneously claimed 11, 14 and 15
 * tools, and why they advertised the Network Designer for a month after it
 * was retired. The tables are generated now; this is what stops a tool being
 * added — or removed — without regenerating them.
 */

const TARGETS = [
  ['README.md', 'docs/'],
  ['docs/README.md', ''],
];

/** @param {string} file */
const tableIn = (file) => {
  const src = readFileSync(file, 'utf8');
  const start = src.indexOf('<!-- TOOLS:START -->');
  const end = src.indexOf('<!-- TOOLS:END -->');
  expect(start, `${file}: TOOLS:START marker`).toBeGreaterThan(-1);
  expect(end, `${file}: TOOLS:END marker`).toBeGreaterThan(start);
  return src.slice(start + '<!-- TOOLS:START -->'.length, end).trim();
};

describe('generated tool tables', () => {
  for (const [file, prefix] of TARGETS) {
    it(`${file} matches the registry`, () => {
      expect(tableIn(file)).toBe(toolTable(prefix).trim());
    });
  }

  it('links each doc relative to the file it is written in', () => {
    // The two tables differ only by link prefix, and getting that wrong
    // yields links that 404 on GitHub while looking right in review.
    expect(tableIn('README.md')).toContain('](docs/tools/');
    expect(tableIn('docs/README.md')).toContain('](tools/');
    expect(tableIn('docs/README.md')).not.toContain('](docs/tools/');
  });
});
