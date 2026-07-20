import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { server } from './server.js';
import { apiFetch, buildUrl } from '../../core/api.js';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

/**
 * The harness proves itself: core/'s client against the captured live-worker
 * fixtures, end to end, offline. Shape assertions here are the frozen
 * contract #5 tripwire — if a port changes what a worker appears to return,
 * this fails before any tool test does.
 */
describe('worker fixtures through MSW', () => {
  it('whois: domain query returns the RDAP shape', async () => {
    const res = await apiFetch(buildUrl('https://whois.russ.tools/', { query: 'example.com' }));
    const data = await res.json();
    expect(data.query).toBe('example.com');
    expect(data.type).toBe('domain');
    expect(data.data.rdap).toBeDefined();
    expect(data.normalized.registrar).toBeDefined();
  });

  it('whois: IP query returns the geo/ASN shape', async () => {
    const res = await apiFetch(buildUrl('https://whois.russ.tools/', { query: '8.8.8.8' }));
    const data = await res.json();
    expect(data.type).toBe('ip');
    expect(data.data['ipinfo.io']).toBeDefined();
    expect(data.normalized.ip).toBe('8.8.8.8');
  });

  it('tenant: a managed domain resolves with apiResults from all sources', async () => {
    const res = await apiFetch(buildUrl('https://tenant.russ.tools/', { domain: 'microsoft.com' }));
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.tenantId).toMatch(/^[0-9a-f-]{36}$/);
    expect(Object.keys(data.apiResults)).toContain('Microsoft Graph API');
  });

  it('ssl: a completed assessment carries graded endpoints', async () => {
    const res = await apiFetch(buildUrl('https://ssl.russ.tools/', { domain: 'russ.tools' }));
    const data = await res.json();
    expect(data.status).toBe('READY');
    expect(data.endpoints.length).toBeGreaterThan(0);
    expect(data.endpoints[0].grade).toBe('A');
  });

  it('dns: Google DoH answers with Answer records', async () => {
    const res = await apiFetch(buildUrl('https://dns.google/resolve', { name: 'example.com', type: 'A' }));
    const data = await res.json();
    expect(data.Status).toBe(0);
    expect(Array.isArray(data.Answer)).toBe(true);
  });

  it('dns: NXDOMAIN comes back as Status 3 with no Answer', async () => {
    const res = await apiFetch(
      buildUrl('https://dns.google/resolve', { name: 'nxdomain-fixture-nope.example', type: 'A' })
    );
    const data = await res.json();
    expect(data.Status).toBe(3);
    expect(data.Answer).toBeUndefined();
  });
});
