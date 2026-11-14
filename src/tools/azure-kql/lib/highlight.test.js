import { describe, expect, it } from 'vitest';
import { highlightKql } from './highlight.js';

const classes = (html, text) =>
  [...html.matchAll(/<span class="token ([^"]+)">([^<]*)<\/span>/g)].filter((match) => match[2] === text).map((match) => match[1]);

describe('highlightKql', () => {
  const html = highlightKql(
    ['AZFWNetworkRule', '| where TimeGenerated > ago(24h)', '| where Action == "Deny" // why', '| summarize Hits = count() by SourceIp', '| top 20 by Hits desc'].join('\n')
  );

  it('marks the pipeline keywords', () => {
    for (const word of ['where', 'summarize', 'by', 'top', 'desc']) expect(classes(html, word)).toContain('keyword');
  });

  it('marks strings, functions, timespans and comments', () => {
    expect(classes(html, '"Deny"')).toEqual(['string']);
    expect(classes(html, 'ago')).toEqual(['function']);
    expect(classes(html, 'count')).toEqual(['function']);
    expect(classes(html, '24h')).toEqual(['number']);
    expect(classes(html, '// why')).toEqual(['comment']);
  });

  it('leaves table and column names as plain text', () => {
    expect(html.startsWith('AZFWNetworkRule\n')).toBe(true);
    expect(classes(html, 'SourceIp')).toEqual([]);
  });

  it('escapes markup in the source instead of rendering it', () => {
    const risky = highlightKql('T | where A == "<img src=x onerror=alert(1)>" and B < 3');
    expect(risky).not.toContain('<img');
    expect(risky).toContain('&lt;img src=x onerror=alert(1)>');
    expect(highlightKql(null)).toBe('');
  });

  it('reads a verbatim string and a word operator', () => {
    const out = highlightKql('T | where Name matches regex @"a""b\\d" and Port !in (1, 2)');
    expect(classes(out, '@"a""b\\d"')).toEqual(['string']);
    expect(classes(out, 'matches regex')).toEqual(['operator word']);
    expect(classes(out, '!in')).toEqual(['operator word']);
  });
});
