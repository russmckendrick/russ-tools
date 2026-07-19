import { describe, it, expect } from 'vitest';
import { validateJSON, validateYAML, validateTOML, validateWithDetection } from './validation.js';

// Characterization tests for the data-converter tri-format core — porting contract #4
// in docs/plans/redesign-plan.md. Format detection order matters: JSON is tried first
// (strictest), then TOML patterns, then YAML (most permissive, so it would otherwise
// false-positive on TOML input).

describe('validateWithDetection', () => {
  // Note: the JSON parser (json-parse-even-better-errors) attaches Symbol(newline)
  // and Symbol(indent) formatting metadata to parsed objects, so compare structurally
  // rather than with toEqual.
  it('detects JSON', () => {
    const r = validateWithDetection('{"a":1}');
    expect(r.success).toBe(true);
    expect(r.detectedFormat).toBe('json');
    expect(r.data).toMatchObject({ a: 1 });
  });

  it('detects YAML', () => {
    const r = validateWithDetection('a: 1\nb: two\n');
    expect(r.success).toBe(true);
    expect(r.detectedFormat).toBe('yaml');
    expect(r.data).toEqual({ a: 1, b: 'two' });
  });

  it('detects TOML and does not mistake it for YAML', () => {
    const r = validateWithDetection('[owner]\nname = "Ada"\n');
    expect(r.success).toBe(true);
    expect(r.detectedFormat).toBe('toml');
    expect(JSON.parse(JSON.stringify(r.data))).toEqual({ owner: { name: 'Ada' } });
  });
});

describe('per-format validators', () => {
  it('validateJSON parses valid input and reports errors for invalid input', () => {
    expect(validateJSON('{"a":1}').success).toBe(true);
    expect(validateJSON('{a:1}').success).toBe(false);
  });

  it('validateYAML parses nested structures', () => {
    const r = validateYAML('list:\n  - 1\n  - 2\n');
    expect(r.success).toBe(true);
    expect(r.data).toEqual({ list: [1, 2] });
  });

  // IMPORTANT for the port: @ltd/j-toml returns integers as BigInt, which JSON.stringify
  // throws on ("Do not know how to serialize a BigInt"). Any TOML -> JSON path must
  // coerce these. Captured here so the behaviour is not rediscovered by accident.
  it('validateTOML parses a table, returning integers as BigInt', () => {
    const r = validateTOML('[server]\nport = 8080\n');
    expect(r.success).toBe(true);
    expect(typeof r.data.server.port).toBe('bigint');
    expect(r.data.server.port).toBe(8080n);
    expect(() => JSON.stringify(r.data)).toThrow(/BigInt/);
  });

  it('reports failure rather than throwing on malformed input', () => {
    expect(() => validateJSON('not json')).not.toThrow();
    expect(validateJSON('not json').success).toBe(false);
  });
});
