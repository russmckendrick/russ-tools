import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { TOOLS } from './registry.mjs';
import { CATEGORY_IDS } from '../shell/categories.mjs';

/**
 * The WebMCP manifest, after scripts/patch-webmcp-manifest.mjs has run.
 *
 * astro-webmcp's own dist scan only extracts metadata from index.html-shaped
 * documents, so under `build.format: 'file'` every tool page came out as a
 * slug with an empty description — and the description is the field the
 * in-page search_content tool searches. The patch step rewrites the entries
 * from the manifests; this pins that the patched file covers the registry,
 * so a new tool cannot ship invisible to agents.
 *
 * Only runs against a built dist/ (`pnpm build` runs the patch last); CI
 * builds before testing, mirroring seo.test.js.
 */

const PATH = 'dist/_webmcp/manifest.json';

describe.runIf(existsSync(PATH))('WebMCP manifest', () => {
  const manifest = JSON.parse(readFileSync(PATH, 'utf8'));
  const byUrl = new Map(manifest.entries.map((e) => [e.url, e]));

  it('covers the index, every tool and every help page', () => {
    const expected = ['/', ...TOOLS.flatMap((t) => [t.path, `${t.path}/help`])];
    const missing = expected.filter((u) => !byUrl.has(u));
    const extra = [...byUrl.keys()].filter((u) => !expected.includes(u));

    expect({ missing, extra }).toEqual({ missing: [], extra: [] });
  });

  it('carries the manifest title and one-liner for every tool', () => {
    for (const t of TOOLS) {
      const entry = byUrl.get(t.path);
      expect(entry.title, t.id).toBe(t.title);
      expect(entry.description, t.id).toBe(t.shortDescription);
      expect(entry.collection, t.id).toBe(t.category);
    }
  });

  it('groups collections by category', () => {
    for (const c of manifest.collections) {
      expect(CATEGORY_IDS).toContain(c.name);
      expect(c.count).toBeGreaterThan(0);
    }
  });
});
