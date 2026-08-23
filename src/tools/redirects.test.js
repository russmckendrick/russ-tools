import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { TOOLS } from './registry.mjs';

const PATH = 'dist/_redirects';

describe.runIf(existsSync(PATH))('Cloudflare Pages redirects', () => {
  const rules = readFileSync(PATH, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split(/\s+/));

  it('emits three distinct columns even for long tool paths', () => {
    expect(rules.every((columns) => columns.length === 3)).toBe(true);
    expect(rules.every(([, , status]) => ['200', '301'].includes(status))).toBe(true);
  });

  it('protects every help page from its tool parameter rewrite', () => {
    const bySource = new Map(rules.map(([from, to, status]) => [from, { to, status }]));
    for (const tool of TOOLS.filter((item) => item.params.length)) {
      expect(bySource.get(`${tool.path}/help`), tool.id).toEqual({
        to: `${tool.path}/help`,
        status: '200',
      });
    }
  });
});
