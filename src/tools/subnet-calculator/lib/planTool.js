import { textResult } from '@/lib/useWebMCPTool';
import { generateShareableURL } from '@/core';
import { FAMILIES } from './format.js';
import { DEFAULT_PREFIX, detailsFor, parseInput, rootOf } from './parse.js';
import { MAX_REQUIREMENTS, planSubnets, sharePayload } from './plan.js';

const REASONS = {
  invalid: 'Not a usable size for this address family.',
  'larger-than-parent': 'Needs a block larger than the parent.',
  'no-space': 'No room left in the parent after the larger requirements.',
};

function describe(family, block) {
  const d = detailsFor(family, FAMILIES[family].format(block.addr), block.prefix);
  const base = { name: block.name, subnet: block.key, prefix: block.prefix };
  if (family === 4) {
    return {
      ...base,
      requestedHosts: block.hosts,
      usableHosts: d.usableHosts,
      netmask: d.netmask,
      firstHost: d.firstHost,
      lastHost: d.lastHost,
      broadcastAddress: d.broadcastAddress,
    };
  }
  return { ...base, firstAddress: d.firstAddress, lastAddress: d.lastAddress };
}

export function runPlan({ cidr, requirements } = {}) {
  const parsed = parseInput(cidr);
  if (!parsed) return { error: 'Not a valid IPv4 or IPv6 address or CIDR.' };
  if (!Array.isArray(requirements) || requirements.length === 0) {
    return { error: 'Give at least one requirement.' };
  }
  if (requirements.length > MAX_REQUIREMENTS) {
    return { error: `A plan takes at most ${MAX_REQUIREMENTS} requirements.` };
  }

  const prefix = parsed.prefix ?? DEFAULT_PREFIX[parsed.family];
  const details = detailsFor(parsed.family, parsed.address, prefix);
  const plan = planSubnets(
    FAMILIES[parsed.family],
    rootOf(parsed.family, details),
    requirements.map((req) => req ?? {})
  );

  const page =
    typeof window === 'undefined' ? undefined : `${window.location.origin}/subnet-calculator`;

  return {
    parent: details.cidr,
    allocations: plan.allocations.map((block) => describe(parsed.family, block)),
    unallocated: plan.unallocated.map((want) => ({
      name: want.name,
      requestedHosts: want.hosts,
      prefix: want.prefix,
      reason: REASONS[want.reason],
    })),
    freeBlocks: plan.free.map((leaf) => leaf.key),
    freeAddresses: plan.freeAddresses.toString(),
    totalAddresses: plan.totalAddresses.toString(),
    url: page
      ? generateShareableURL(sharePayload(parsed.family, details.cidr, plan.splits, plan.names), page)
      : null,
  };
}

export const PLAN_SUBNETS_TOOL = {
  name: 'plan_subnets',
  description:
    'Plan subnets by size (VLSM): allocate the smallest subnet that fits each requirement out ' +
    'of a parent block, largest first on aligned boundaries, and report what did not fit and ' +
    'the space left. IPv4 requirements take a host count or a prefix; IPv6 takes a prefix.',
  inputSchema: {
    type: 'object',
    properties: {
      cidr: {
        type: 'string',
        description: 'The parent block, e.g. 10.0.0.0/22 or 2001:db8::/48',
      },
      requirements: {
        type: 'array',
        description: 'One entry per subnet wanted.',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Optional label, e.g. web' },
            hosts: {
              type: 'integer',
              minimum: 1,
              description: 'IPv4 only: usable hosts needed. 2 gives a /31 and 1 a /32.',
            },
            prefix: {
              type: 'integer',
              minimum: 0,
              maximum: 128,
              description: 'An exact prefix length instead of a host count. Required for IPv6.',
            },
          },
        },
      },
    },
    required: ['cidr', 'requirements'],
  },
  annotations: { readOnlyHint: true },
  execute: (input) => textResult(runPlan(input)),
};
