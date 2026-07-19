import { describe, it, expect } from 'vitest';
import { generateShareableURL, parseConfigFromURL } from './sharelink.js';

// Characterization tests for the share-URL codec. This is frozen contract #2 in
// docs/plans/redesign-plan.md: safeStringify -> pako.deflate (raw zlib, NOT gzip)
// -> URL-safe base64, plus a legacy uncompressed-base64 fallback. Any redesign must
// keep these round-trips and golden fixtures passing byte-for-byte.

const roundTrip = (config) => {
  const url = generateShareableURL(config, 'https://russ.tools/t');
  const encoded = url.split('?config=')[1];
  return parseConfigFromURL(new URLSearchParams(`config=${encoded}`));
};

describe('sharelink codec', () => {
  it('round-trips a simple config', () => {
    const config = { service: 'ssl', template: 'basic', parameters: { domain: 'example.com' } };
    expect(roundTrip(config)).toEqual(config);
  });

  it('round-trips nested arrays/objects (network-designer shape)', () => {
    const config = {
      networks: [
        { id: 'a', name: 'prod', cidr: '10.0.0.0/16', color: '#e74c3c', subnets: [{ name: 'web', size: 24 }] },
      ],
      selectedNetworkId: 'a',
    };
    expect(roundTrip(config)).toEqual(config);
  });

  it('round-trips unicode payloads', () => {
    const config = { note: 'café — ünïcode ☕', tags: ['a', 'b'] };
    expect(roundTrip(config)).toEqual(config);
  });

  it('builds a ?config= URL on the provided base', () => {
    const url = generateShareableURL({ a: 1 }, 'https://russ.tools/tool');
    expect(url).toMatch(/^https:\/\/russ\.tools\/tool\?config=[A-Za-z0-9_-]+$/);
  });

  it('returns null when no config param is present', () => {
    expect(parseConfigFromURL(new URLSearchParams(''))).toBeNull();
  });

  it('returns null (does not throw) on malformed input', () => {
    expect(parseConfigFromURL(new URLSearchParams('config=!!!not-base64!!!'))).toBeNull();
  });

  it('decodes the legacy uncompressed-base64 format', () => {
    // btoa(JSON.stringify({ service: 'legacy', parameters: { x: 1 } }))
    const legacyParam = 'eyJzZXJ2aWNlIjoibGVnYWN5IiwicGFyYW1ldGVycyI6eyJ4IjoxfX0=';
    expect(parseConfigFromURL(new URLSearchParams(`config=${legacyParam}`))).toEqual({
      service: 'legacy',
      parameters: { x: 1 },
    });
  });

  // Golden fixtures captured from the v1 codec (2026-07). Encoded strings like these
  // exist in shared links in the wild and MUST keep decoding forever.
  describe('v1 golden fixtures keep decoding', () => {
    const goldens = [
      [
        'eJwVykEKwCAMRNG7zLr0AN4m1VkETBUjpSDeven2_b_gHI9mIsG94sCk9Srzh0tcc1CXIcbJ4UgLpZnoHZmvxMozN8PeH7ZIGbM',
        { service: 'ssl', template: 'basic', parameters: { domain: 'example.com' } },
      ],
      [
        'eJyrVspLLSnPL8ouVrKKrlbKTFGyUkpU0lHKS8xNBTILivJTgLzkzJQiIM_QQA8M9Q3NQIL5OfkgUeVUc5Nk42SgSHFpEtA0iElQA8pTk0ASmVVAjpFJbWxtLJCXmpOaXJKa4gex2RNiZy0AUo0qaw',
        {
          networks: [
            { id: 'a', name: 'prod', cidr: '10.0.0.0/16', color: '#e74c3c', subnets: [{ name: 'web', size: 24 }] },
          ],
          selectedNetworkId: 'a',
        },
      ],
      [
        'eJwVzLsNwzAMhOFdWDuN4cpdmgzgDQjpkAihHqCoCIjh3S219x3-kyr0Fxxop-e_KV5B0VmEFjLEImyTEqxn_T60CeqgwsoRBq20n2Qh4uD0ns91-wxnZyGn2RTJfQwevpXhpg3XdQOgyCjj',
        { service: 'AzureFirewall', template: 'network-rules', parameters: { timeRange: '24h', action: 'Allow', dedupe: true } },
      ],
      [
        'eJyrVsrLL0lVslJKTkw7vFLhUcMUhcN78g6vT85PSVV4NGOqko5SSWJ6sZJVtFIikJ2kFFsLACkpE-4',
        { note: 'café — ünïcode ☕', tags: ['a', 'b'] },
      ],
    ];
    it.each(goldens)('decodes fixture %#', (encoded, expected) => {
      expect(parseConfigFromURL(new URLSearchParams(`config=${encoded}`))).toEqual(expected);
    });
  });
});
