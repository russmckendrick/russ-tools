import { describe, expect, it } from 'vitest';
import { nearestTools, trailingValue } from './nearestTool.js';
import { TOOLS } from '../tools/registry.mjs';

/**
 * Run against the real catalogue rather than a fixture: the threshold is only
 * meaningful relative to the fifteen names it has to tell apart, and a
 * sixteenth tool could legitimately move it.
 */
const catalogue = TOOLS.map((t) => ({ id: t.id, path: t.path, title: t.title }));
const best = (segment) => nearestTools(segment, catalogue)[0]?.id ?? null;

describe('nearestTools', () => {
  it.each([
    ['subnet-calculator', 'subnet-calculator'],
    ['/subnet-calculator', 'subnet-calculator'],
    ['subnet', 'subnet-calculator'],
    ['subnetcalculator', 'subnet-calculator'],
    ['subnet-calcualtor', 'subnet-calculator'],
    ['dns-lookup-tool', 'dns-lookup'],
    ['dnslookup', 'dns-lookup'],
    ['dns', 'dns-lookup'],
    ['whois', 'whois-lookup'],
    ['jwt-decoder', 'jwt'],
    ['base-64', 'base64'],
    ['password', 'password-generator'],
    ['ssl', 'ssl-checker'],
    ['cron-builder', 'cron-builder'],
    ['markdown', 'markdown-table-tool'],
  ])('%s → %s', (segment, id) => {
    expect(best(segment)).toBe(id);
  });

  /**
   * The half that matters more. A wrong confident guess on a 404 is worse than
   * no guess, because the visitor is already lost.
   */
  it.each([
    ['pricing'],
    ['about'],
    ['login'],
    ['wp-admin'],
    ['.env'],
    ['favicon.ico'],
    ['xyzzy'],
    ['a'],
    [''],
  ])('says nothing for %s', (segment) => {
    expect(nearestTools(segment, catalogue)).toEqual([]);
  });

  it('ranks the obvious match first when several are close', () => {
    // Three tools carry "lookup"; the qualifier is what decides.
    expect(best('tenant-lookup')).toBe('tenant-lookup');
    expect(best('whois-lookup')).toBe('whois-lookup');
    expect(best('dns-lookup')).toBe('dns-lookup');
  });

  it('caps the list', () => {
    expect(nearestTools('lookup', catalogue, 2).length).toBeLessThanOrEqual(2);
  });

  it('survives a missing or malformed catalogue', () => {
    expect(nearestTools('subnet', null)).toEqual([]);
    expect(nearestTools(null, catalogue)).toEqual([]);
  });

  it('only ever names a tool that exists', () => {
    const ids = new Set(catalogue.map((t) => t.id));
    for (const segment of ['subnet', 'dns', 'whois', 'jwt', 'base64']) {
      for (const match of nearestTools(segment, catalogue)) {
        expect(ids).toContain(match.id);
      }
    }
  });
});

describe('trailingValue', () => {
  it.each([
    ['/whois/example.com', 'example.com'],
    ['/dnslookup/example.com', 'example.com'],
    ['/subnet/10.0.0.0/22', '10.0.0.0/22'],
    ['/jwt-decoder/abc.def.ghi', 'abc.def.ghi'],
    ['/whois/example%2Ecom', 'example.com'],
    ['/subnet-calculator', ''],
    ['/', ''],
    ['', ''],
  ])('%s → %s', (pathname, expected) => {
    expect(trailingValue(pathname)).toBe(expected);
  });

  it('survives a malformed escape rather than throwing', () => {
    expect(() => trailingValue('/whois/%')).not.toThrow();
    expect(trailingValue('/whois/%')).toBe('%');
  });
});
