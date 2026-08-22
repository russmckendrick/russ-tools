import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TOOLS } from './registry.mjs';
import { CATEGORIES, categoryLabel } from '../shell/categories.mjs';
import { extractHelpMarkdown } from '../lib/helpMarkdown.js';

/**
 * The AI-readiness files, held to the registry the same way the sitemap is.
 *
 * `scripts/generate-llms.mjs` writes llms.txt, llms-full.txt and agents.md
 * into `public/` at the head of `pnpm build`. They are gitignored, so — as
 * with sitemap.test.js — the build regenerates them and CI builds before
 * testing. The risk they guard against is the same silent drift: a tool
 * ships, the sitemap knows, and the file an AI agent actually reads doesn't.
 */

const SITE = 'https://russ.tools';

const llms = readFileSync('public/llms.txt', 'utf8');
const llmsFull = readFileSync('public/llms-full.txt', 'utf8');
const agents = readFileSync('public/agents.md', 'utf8');

describe('llms.txt', () => {
  it('opens with the site name and a summary blockquote', () => {
    const [h1, blank, quote] = llms.split('\n');
    expect(h1).toBe('# russ.tools');
    expect(blank).toBe('');
    expect(quote).toMatch(/^> .+/);
  });

  it('lists every tool exactly once, and nothing else', () => {
    const linked = [...llms.matchAll(/^- \[[^\]]+\]\((\S+?)\)/gm)].map((m) => m[1]);
    const toolLinks = linked.filter((u) => !/llms-full\.txt|sitemap\.xml/.test(u));
    const fromRegistry = TOOLS.map((t) => `${SITE}${t.path}`);

    expect([...toolLinks].sort()).toEqual([...fromRegistry].sort());
    expect(new Set(toolLinks).size).toBe(toolLinks.length);
  });

  it('titles and one-liners come from the manifests', () => {
    for (const t of TOOLS) {
      expect(llms).toContain(`- [${t.title}](${SITE}${t.path}): ${t.shortDescription}`);
    }
  });

  it('sections are the populated category labels plus Documentation', () => {
    const headings = [...llms.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    const populated = CATEGORIES.filter(({ id }) =>
      TOOLS.some((t) => t.category === id)
    ).map(({ id }) => categoryLabel(id));

    expect(headings).toEqual([...populated, 'Documentation']);
  });

  it('points at llms-full.txt and the sitemap', () => {
    expect(llms).toContain(`${SITE}/llms-full.txt`);
    expect(llms).toContain(`${SITE}/sitemap.xml`);
  });
});

describe('llms-full.txt', () => {
  it('carries every tool with its URLs and manifest copy', () => {
    for (const t of TOOLS) {
      expect(llmsFull).toContain(`# ${t.title}`);
      expect(llmsFull).toContain(`URL: ${SITE}${t.path}`);
      expect(llmsFull).toContain(`Help: ${SITE}${t.path}/help`);
      expect(llmsFull).toContain(t.description);
    }
  });

  it('inlines the exact help block each /:tool/help page renders', () => {
    for (const t of TOOLS) {
      const readme = readFileSync(join('docs', 'tools', t.id, 'README.md'), 'utf8');
      expect(llmsFull, t.id).toContain(extractHelpMarkdown(readme));
    }
  });
});

describe('agents.md', () => {
  it('links the discovery files', () => {
    expect(agents).toContain(`${SITE}/llms.txt`);
    expect(agents).toContain(`${SITE}/llms-full.txt`);
    expect(agents).toContain(`${SITE}/sitemap.xml`);
  });
});
