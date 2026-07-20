import { describe, it, expect } from 'vitest';
import { RESOURCE_TYPES, validateResourceName, generateResourceName } from './rules.js';

// Characterization tests for the Azure CAF naming rules engine.
// RESOURCE_TYPES is double-keyed: both the full provider name
// ("azurerm_cognitive_deployment") and its abbreviation ("cog") resolve.

describe('RESOURCE_TYPES', () => {
  it('is keyed by both provider name and abbreviation', () => {
    expect(RESOURCE_TYPES.azurerm_cognitive_deployment).toBeTruthy();
    expect(RESOURCE_TYPES.cog).toBeTruthy();
  });

  it('definitions carry the fields the generator relies on', () => {
    const def = RESOURCE_TYPES.azurerm_cognitive_deployment;
    expect(def).toMatchObject({
      type: 'cog',
      maxLength: expect.any(Number),
      minLength: expect.any(Number),
      format: expect.any(String),
    });
  });
});

describe('generateResourceName', () => {
  it('builds a CAF name from workload, environment, region and instance', () => {
    const name = generateResourceName(
      { resourceType: 'azurerm_cognitive_deployment', workload: 'shop', environment: 'prod', region: 'uksouth', instance: '01' },
      { uksouth: 'uks' }
    );
    expect(name).toBe('cog-shop-prod-uks-01');
  });

  it('applies the region short name map', () => {
    const name = generateResourceName(
      { resourceType: 'azurerm_cognitive_deployment', workload: 'shop', environment: 'prod', region: 'uksouth' },
      { uksouth: 'uks' }
    );
    expect(name).toContain('uks');
    expect(name).not.toContain('uksouth');
  });

  it('accepts a composite "slug|name" resource type', () => {
    const name = generateResourceName(
      { resourceType: 'azurerm_cognitive_deployment|Cognitive Deployment', workload: 'shop', environment: 'prod', region: 'uksouth' },
      { uksouth: 'uks' }
    );
    expect(name.startsWith('cog-')).toBe(true);
  });

  it('throws on an unknown resource type', () => {
    expect(() => generateResourceName({ resourceType: 'not-a-real-type', workload: 'x', environment: 'prod', region: 'uksouth' })).toThrow();
  });
});

describe('validateResourceName', () => {
  it('accepts a generated name', () => {
    expect(validateResourceName('cog-shop-prod-uks-01', 'azurerm_cognitive_deployment')).toMatchObject({ valid: true });
  });

  it('rejects a name that exceeds maxLength', () => {
    const def = RESOURCE_TYPES.azurerm_cognitive_deployment;
    const tooLong = 'a'.repeat(def.maxLength + 5);
    expect(validateResourceName(tooLong, 'azurerm_cognitive_deployment').valid).toBe(false);
  });
});
