import { describe, it, expect } from 'vitest';
import { generateAzurePortalLinks, generateM365AdminLinks } from './portalLinks.js';

// Regression guard for the baseUrl bug: getApiEndpoint('external') returns a
// { url, timeout, retries, headers } wrapper, so reading .azure_portal off it was
// undefined and 24 of 31 Azure portal links rendered as "undefined/...".

describe('generateAzurePortalLinks', () => {
  it('never produces a URL beginning with "undefined"', () => {
    for (const tenant of [null, '00000000-1111-2222-3333-444444444444']) {
      const links = generateAzurePortalLinks(tenant, null);
      const broken = Object.entries(links).filter(([, l]) => String(l.url).startsWith('undefined'));
      expect(broken).toEqual([]);
    }
  });

  it('points path-based portals at the Azure portal host', () => {
    const links = generateAzurePortalLinks(null, null);
    const urls = Object.values(links).map((l) => l.url);
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url).toMatch(/^https:\/\//);
    }
    expect(urls.some((u) => u.startsWith('https://portal.azure.com'))).toBe(true);
  });

  it('embeds the tenant id when one is supplied', () => {
    const tenantId = '00000000-1111-2222-3333-444444444444';
    const urls = Object.values(generateAzurePortalLinks(tenantId, null)).map((l) => l.url);
    expect(urls.some((u) => u.includes(tenantId))).toBe(true);
  });

  it('returns entries carrying name, url and category', () => {
    const links = generateAzurePortalLinks(null, null);
    for (const entry of Object.values(links)) {
      expect(entry).toMatchObject({
        name: expect.any(String),
        url: expect.any(String),
        category: expect.any(String),
      });
    }
  });
});

describe('generateM365AdminLinks', () => {
  it('substitutes the domain placeholder and leaves no undefined URLs', () => {
    const links = generateM365AdminLinks(null, 'contoso.com');
    const urls = Object.values(links).map((l) => l.url);
    expect(urls.every((u) => !String(u).startsWith('undefined'))).toBe(true);
    expect(urls.every((u) => !String(u).includes('{domain}'))).toBe(true);
  });
});

describe('no-tenant URLs', () => {
  // Fixed at the Phase 4 port: the no-tenant branch glued a slash onto
  // paths that already start with one, yielding portal.azure.com//blade/….
  it('never contain a double slash after the scheme', () => {
    const links = generateAzurePortalLinks(null, null);
    for (const { url } of Object.values(links)) {
      expect(url.replace(/^https:\/\//, '')).not.toContain('//');
    }
  });
});
