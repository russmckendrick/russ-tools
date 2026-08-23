import { describe, it, expect } from 'vitest';
import { parsePolicies, policyKey } from './parse.js';

const POLICY = {
  id: '11111111-1111-1111-1111-111111111111',
  displayName: 'Require MFA for admins',
  state: 'enabled',
  conditions: { users: { includeUsers: ['All'] }, applications: { includeApplications: ['All'] } },
  grantControls: { operator: 'OR', builtInControls: ['mfa'] },
};

describe('parsePolicies — the three export shapes', () => {
  it('accepts a single policy object', () => {
    const r = parsePolicies(JSON.stringify(POLICY));
    expect(r.ok).toBe(true);
    expect(r.shape).toBe('single policy');
    expect(r.policies).toHaveLength(1);
  });

  it('accepts a bare array, as PowerShell produces', () => {
    const r = parsePolicies(JSON.stringify([POLICY, { ...POLICY, id: '2' }]));
    expect(r.ok).toBe(true);
    expect(r.shape).toBe('array');
    expect(r.policies).toHaveLength(2);
  });

  it('accepts a Graph collection envelope', () => {
    const r = parsePolicies(
      JSON.stringify({ '@odata.context': 'https://graph.microsoft.com/v1.0/$metadata', value: [POLICY] })
    );
    expect(r.ok).toBe(true);
    expect(r.shape).toBe('graph collection');
    expect(r.policies).toHaveLength(1);
  });

  it('tolerates surrounding whitespace', () => {
    expect(parsePolicies(`\n\n  ${JSON.stringify(POLICY)}  \n`).ok).toBe(true);
  });
});

describe('parsePolicies — failures are described, not thrown', () => {
  it('reports empty input', () => {
    const r = parsePolicies('   ');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Paste a Conditional Access policy/);
  });

  it('reports invalid JSON with the parser message', () => {
    const r = parsePolicies('{ not json');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/not valid JSON/);
  });

  it('rejects JSON that is not a policy', () => {
    const r = parsePolicies(JSON.stringify({ hello: 'world' }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/does not look like a Conditional Access policy/);
  });

  it('reports an empty collection distinctly from a non-policy one', () => {
    expect(parsePolicies(JSON.stringify({ value: [] })).error).toMatch(/contains no policies/);
    expect(parsePolicies(JSON.stringify({ value: [{ nope: 1 }] })).error).toMatch(/none carry conditions/);
  });

  it('never throws on hostile input', () => {
    for (const input of ['null', 'true', '42', '"a string"', '[]', '[[]]']) {
      expect(() => parsePolicies(input)).not.toThrow();
      expect(parsePolicies(input).ok).toBe(false);
    }
  });

  it('keeps the policies in a mixed array and drops the rest', () => {
    const r = parsePolicies(JSON.stringify([POLICY, { unrelated: true }]));
    expect(r.ok).toBe(true);
    expect(r.policies).toHaveLength(1);
  });
});

describe('policyKey', () => {
  it('prefers the id, then the name, then the position', () => {
    expect(policyKey(POLICY, 0)).toBe(POLICY.id);
    expect(policyKey({ displayName: 'Named' }, 3)).toBe('Named');
    expect(policyKey({}, 3)).toBe('policy-3');
  });
});
