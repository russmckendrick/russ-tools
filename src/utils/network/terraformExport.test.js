import { describe, it, expect } from 'vitest';
import {
  resolveSubnetCidr,
  generateAwsTerraform,
  generateAzureTerraform,
  generateVcdTerraform,
} from './terraformExport.js';

// Characterization tests for the network-designer Terraform export — one of the four
// porting contracts named in docs/plans/redesign-plan.md. The network designer stores
// subnets as { name, base: '10.0.1.0', cidr: 24 } where cidr is the prefix LENGTH.

const SUBNETS = [
  { name: 'web', base: '10.0.1.0', cidr: 24 },
  { name: 'db', base: '10.0.2.0', cidr: 25 },
];

describe('resolveSubnetCidr', () => {
  it('joins base and numeric prefix length (the network-designer shape)', () => {
    expect(resolveSubnetCidr({ base: '10.0.1.0', cidr: 24 })).toBe('10.0.1.0/24');
  });

  it('accepts a full CIDR string already in cidr', () => {
    expect(resolveSubnetCidr({ cidr: '10.0.1.0/24' })).toBe('10.0.1.0/24');
  });

  it('falls back through ip, cidrBlock and address_prefix', () => {
    expect(resolveSubnetCidr({ ip: '10.0.3.0', cidr: 26 })).toBe('10.0.3.0/26');
    expect(resolveSubnetCidr({ cidrBlock: '10.0.4.0/24' })).toBe('10.0.4.0/24');
    expect(resolveSubnetCidr({ address_prefix: '10.0.5.0/24' })).toBe('10.0.5.0/24');
  });

  it('returns an empty string when nothing usable is present', () => {
    expect(resolveSubnetCidr({})).toBe('');
    expect(resolveSubnetCidr(null)).toBe('');
  });
});

describe('generateAwsTerraform', () => {
  const tf = generateAwsTerraform({
    vpcName: 'My VPC',
    vpcCidr: '10.0.0.0/16',
    region: 'eu-west-2',
    subnets: SUBNETS,
  });

  it('emits the provider and VPC with a sanitised resource name', () => {
    expect(tf).toContain('provider "aws"');
    expect(tf).toContain('region = "eu-west-2"');
    expect(tf).toContain('resource "aws_vpc" "my_vpc"');
    expect(tf).toContain('cidr_block = "10.0.0.0/16"');
  });

  // Regression guard: this previously emitted cidr_block = "24" because it used
  // subnet.cidr (the prefix length) directly, producing invalid Terraform.
  it('emits full subnet CIDRs, not bare prefix lengths', () => {
    expect(tf).toContain('cidr_block        = "10.0.1.0/24"');
    expect(tf).toContain('cidr_block        = "10.0.2.0/25"');
    expect(tf).not.toMatch(/cidr_block\s+=\s+"\d+"/);
  });

  it('defaults the region when none is supplied', () => {
    const d = generateAwsTerraform({ vpcName: 'v', vpcCidr: '10.0.0.0/16', subnets: [] });
    expect(d).toContain('region = "us-east-1"');
  });
});

describe('generateAzureTerraform', () => {
  const tf = generateAzureTerraform({
    vnetName: 'My VNet',
    vnetCidr: '10.0.0.0/16',
    location: 'uksouth',
    subnets: SUBNETS,
  });

  it('emits a resource group, vnet and CAF-style names with a shortened region', () => {
    expect(tf).toContain('resource "azurerm_resource_group" "main"');
    expect(tf).toContain('name     = "rg-my-vnet-prod-uks"');
    expect(tf).toContain('address_space       = ["10.0.0.0/16"]');
  });

  it('emits full subnet address prefixes', () => {
    expect(tf).toContain('address_prefixes     = ["10.0.1.0/24"]');
    expect(tf).toContain('address_prefixes     = ["10.0.2.0/25"]');
  });

  it('shortens the region (uksouth -> uks, eastus2 -> eas2)', () => {
    const t = generateAzureTerraform({ vnetName: 'n', vnetCidr: '10.0.0.0/16', location: 'eastus2', subnets: [] });
    expect(t).toContain('eas2');
  });
});

describe('generateVcdTerraform', () => {
  it('emits a routed network with a gateway and netmask derived from the CIDR', () => {
    const tf = generateVcdTerraform({
      networkName: 'My Net',
      networkCidr: '10.0.0.0/16',
      org: 'my-org',
      vdc: 'my-vdc',
      edgeGateway: 'my-edge',
      subnets: SUBNETS,
    });
    expect(tf).toContain('my-org');
    expect(tf).toContain('my-vdc');
    expect(tf).toMatch(/255\.255\.0\.0|prefix_length|\/16/);
  });
});
