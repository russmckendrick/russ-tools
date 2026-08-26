import { describe, expect, it } from 'vitest';
import { EMAIL_PROVIDERS } from '@/core';
import { PROVIDER_ICONS } from './providerIcons.js';

describe('provider icons', () => {
  it('keys every mark to a known provider id', () => {
    const ids = new Set(EMAIL_PROVIDERS.map((provider) => provider.id));
    for (const id of Object.keys(PROVIDER_ICONS)) {
      expect(ids.has(id), id).toBe(true);
    }
  });

  it('maps each id to a renderable component', () => {
    for (const [id, icon] of Object.entries(PROVIDER_ICONS)) {
      expect(typeof icon, id).toBe('function');
    }
  });

  it('covers the most common providers', () => {
    for (const id of ['microsoft-365', 'google-workspace', 'proton', 'cloudflare', 'yahoo']) {
      expect(PROVIDER_ICONS[id], id).toBeDefined();
    }
  });
});
