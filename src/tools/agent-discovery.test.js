import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SITE_URL } from '../shell/site.mjs';
import apiConfig from '../utils/api/apiConfig.json';

/**
 * The RFC 8288/9727 discovery surfaces, held to the code the same way
 * llms.txt is held to the registry.
 *
 * `public/_headers` (Cloudflare Pages) advertises the API catalog from the
 * homepage; `public/.well-known/api-catalog` is an RFC 9264 linkset naming
 * the four lookup APIs; `public/.well-known/ai-catalog.json` is the ARD
 * manifest. All three are static and checked in — the drift they guard
 * against is a lookup endpoint changing in apiConfig.json while the
 * published catalog keeps pointing agents at the old address.
 *
 * The lookups are the site's own same-origin API (`/api/ssl`, `/api/whois`,
 * `/api/tenant`, `/api/headers`), so apiConfig.json holds root-relative paths and the
 * catalog anchors are those paths on SITE_URL. Each must have a Pages
 * Function behind it, and the catalog must not send agents to the retired
 * per-lookup hostnames.
 */

const headers = readFileSync('public/_headers', 'utf8');
const apiCatalog = JSON.parse(readFileSync('public/.well-known/api-catalog', 'utf8'));
const aiCatalog = JSON.parse(readFileSync('public/.well-known/ai-catalog.json', 'utf8'));
const robots = readFileSync('public/robots.txt', 'utf8');
const LOOKUPS = ['ssl', 'whois', 'tenant', 'headers'];

describe('_headers', () => {
  it('advertises the api-catalog from the homepage', () => {
    expect(headers).toMatch(/^\/\n {2}Link: .*<\/\.well-known\/api-catalog>; rel="api-catalog"/m);
  });

  it('serves the catalog as linkset+json with open CORS', () => {
    const rule = headers.split(/\n(?=\S)/).find((r) => r.startsWith('/.well-known/api-catalog'));
    expect(rule).toContain('Content-Type: application/linkset+json');
    expect(rule).toContain('Access-Control-Allow-Origin: *');
  });
});

describe('robots.txt', () => {
  it('declares Content-Signals inside the wildcard group', () => {
    expect(robots).toMatch(/^User-agent: \*\nContent-Signal: /m);
  });
});

describe('api-catalog', () => {
  it('anchors every lookup endpoint from apiConfig.json on the site origin', () => {
    const anchors = apiCatalog.linkset.map((entry) => entry.anchor);
    for (const key of LOOKUPS) {
      expect(apiConfig.endpoints[key].url).toBe(`/api/${key}`);
      expect(anchors).toContain(`${SITE_URL}${apiConfig.endpoints[key].url}`);
    }
  });

  it('has a Pages Function behind every lookup endpoint', () => {
    for (const key of LOOKUPS) {
      const source = readFileSync(`functions${apiConfig.endpoints[key].url}.js`, 'utf8');
      expect(source, key).toMatch(/export const onRequest = lookupHandler\(/);
    }
  });

  it('no longer points at the per-lookup worker hostnames', () => {
    const published = JSON.stringify(apiCatalog) + JSON.stringify(aiCatalog) + JSON.stringify(apiConfig);
    expect(published).not.toMatch(/(ssl|whois|tenant)\.russ\.tools/);
  });

  it('tells an agent the lookup API is same-origin only', () => {
    for (const entry of apiCatalog.linkset.filter((e) => e.anchor.includes('/api/'))) {
      expect(entry['service-doc'][0].title, entry.anchor).toMatch(/same-origin/);
    }
  });

  it('gives every entry an anchor and at least one documentation link', () => {
    for (const entry of apiCatalog.linkset) {
      expect(entry.anchor).toMatch(/^https:\/\//);
      const links = [...(entry['service-doc'] ?? []), ...(entry.describedby ?? [])];
      expect(links.length, entry.anchor).toBeGreaterThan(0);
      for (const link of links) expect(link.href).toMatch(/^https:\/\//);
    }
  });
});

describe('ai-catalog.json', () => {
  it('identifies the host as the site', () => {
    expect(aiCatalog.host.url).toBe(SITE_URL);
    expect(aiCatalog.specVersion).toBeTruthy();
  });

  it('entries carry a urn:air id, a media type, one url and 2-5 queries', () => {
    expect(aiCatalog.entries.length).toBeGreaterThan(0);
    for (const entry of aiCatalog.entries) {
      expect(entry.id).toMatch(/^urn:air:russ\.tools:[a-z-]+:[a-z-]+$/);
      expect(entry.displayName).toBeTruthy();
      expect(entry.type).toMatch(/^[a-z]+\/[\w.+-]+$/);
      expect('url' in entry !== 'data' in entry).toBe(true);
      expect(entry.representativeQueries.length).toBeGreaterThanOrEqual(2);
      expect(entry.representativeQueries.length).toBeLessThanOrEqual(5);
      if (entry.url) expect(entry.url.startsWith(SITE_URL)).toBe(true);
    }
  });

  it('points at the agent surfaces the build actually produces', () => {
    const urls = aiCatalog.entries.map((e) => e.url);
    expect(urls).toContain(`${SITE_URL}/llms.txt`);
    expect(urls).toContain(`${SITE_URL}/_webmcp/manifest.json`);
    expect(urls).toContain(`${SITE_URL}/.well-known/api-catalog`);
  });
});
