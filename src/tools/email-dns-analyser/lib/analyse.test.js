import { describe, expect, it } from 'vitest';
import { analyseDkimRecord, analyseDmarcRecord, analyseEmailDns, analyseSpfRecord, parseTagRecord, spfDnsTerms } from './analyse.js';

describe('email DNS analysis', () => {
  it('parses semicolon tag records', () => {
    expect(parseTagRecord('v=DMARC1; p=reject; rua=mailto:dmarc@example.com')).toEqual({
      v: 'DMARC1', p: 'reject', rua: 'mailto:dmarc@example.com',
    });
  });

  it('counts SPF terms that can trigger DNS work', () => {
    expect(spfDnsTerms('v=spf1 a mx include:_spf.example.net ip4:192.0.2.0/24 -all')).toEqual([
      'a', 'mx', 'include:_spf.example.net',
    ]);
  });

  it('ignores SPF mechanisms after all', () => {
    expect(spfDnsTerms('v=spf1 include:first.example -all include:ignored.example')).toEqual([
      'include:first.example',
    ]);
  });

  it('flags multiple SPF policies and missing terminal all', () => {
    const result = analyseSpfRecord(['v=spf1 include:a.example', 'v=spf1 -all']);
    expect(result.findings.map((item) => item.severity)).toContain('error');
    expect(result.findings.map((item) => item.title)).toContain('No terminal all mechanism');
  });

  it('recognises enforcing DMARC and historic sampling', () => {
    const result = analyseDmarcRecord(['v=DMARC1; p=reject; pct=50']);
    expect(result.tags.p).toBe('reject');
    expect(result.findings.map((item) => item.title)).toContain('Historic pct tag');
  });

  it('recognises an empty DKIM key as revoked', () => {
    expect(analyseDkimRecord(['v=DKIM1; p='], 'selector').findings[0].severity).toBe('warning');
  });

  it('recognises null MX as an explicit no-mail policy', async () => {
    const empty = { Status: 0, Answer: [] };
    const result = await analyseEmailDns('example.com', '', {
      query: async (name, type) => name === 'example.com' && type === 'MX'
        ? { Status: 0, Answer: [{ name, type: 15, data: '0 .' }] }
        : empty,
    });
    expect(result.sections.find((section) => section.id === 'mx').findings[0]).toMatchObject({
      severity: 'info',
      title: 'Domain does not accept email',
    });
    expect(result.providers).toEqual([]);
    expect(result.sections.find((section) => section.id === 'mx').findings).toHaveLength(1);
  });

  it('names the email provider from MX signatures', async () => {
    const result = await analyseEmailDns('example.com', '', {
      query: async (name, type) => name === 'example.com' && type === 'MX'
        ? { Status: 0, Answer: [
            { name, type: 15, data: '1 aspmx.l.google.com.' },
            { name, type: 15, data: '5 alt1.aspmx.l.google.com.' },
          ] }
        : { Status: 0, Answer: [] },
    });
    expect(result.providers).toEqual([
      { id: 'google-workspace', name: 'Google Workspace', type: 'mailbox', via: 'mx' },
    ]);
    expect(result.sections.find((section) => section.id === 'mx').findings).toEqual(
      expect.arrayContaining([expect.objectContaining({
        severity: 'info',
        title: 'Email provider: Google Workspace',
        evidence: 'aspmx.l.google.com · alt1.aspmx.l.google.com',
      })])
    );
  });

  it('names the mailbox provider behind a gateway from the SPF graph', async () => {
    const result = await analyseEmailDns('example.com', '', {
      query: async (name, type) => {
        if (name === 'example.com' && type === 'MX') {
          return { Status: 0, Answer: [{ name, type: 15, data: '10 us-smtp-inbound-1.mimecast.com.' }] };
        }
        if (name === 'example.com' && type === 'TXT') {
          return { Status: 0, Answer: [{ name, type: 16, data: '"v=spf1 include:spf.protection.outlook.com -all"' }] };
        }
        if (name === 'spf.protection.outlook.com' && type === 'TXT') {
          return { Status: 0, Answer: [{ name, type: 16, data: '"v=spf1 ip4:203.0.113.0/24 -all"' }] };
        }
        return { Status: 0, Answer: [] };
      },
    });
    expect(result.providers.map((provider) => [provider.id, provider.via])).toEqual([
      ['mimecast', 'mx'],
      ['microsoft-365', 'spf'],
    ]);
    const providerFinding = result.sections.find((section) => section.id === 'mx').findings
      .find((item) => item.title.startsWith('Email provider'));
    expect(providerFinding.title).toBe('Email provider: Mimecast + Microsoft 365');
    expect(providerFinding.detail).toBe(
      'Mail is routed through Mimecast (security gateway). SPF suggests mailboxes are hosted on Microsoft 365.'
    );
  });

  it('reports unrecognised MX hosts as custom or self-hosted', async () => {
    const result = await analyseEmailDns('example.com', '', {
      query: async (name, type) => name === 'example.com' && type === 'MX'
        ? { Status: 0, Answer: [{ name, type: 15, data: '10 mail.example.com.' }] }
        : { Status: 0, Answer: [] },
    });
    expect(result.providers).toEqual([]);
    expect(result.sections.find((section) => section.id === 'mx').findings).toEqual(
      expect.arrayContaining([expect.objectContaining({
        severity: 'info',
        title: 'Custom or self-hosted email',
        evidence: 'mail.example.com',
      })])
    );
  });

  it('reports an include with no SPF policy as a permanent error', async () => {
    const result = await analyseEmailDns('example.com', '', {
      query: async (name, type) => type === 'TXT' && name === 'example.com'
        ? { Status: 0, Answer: [{ name, type: 16, data: '"v=spf1 include:empty.example -all"' }] }
        : { Status: 0, Answer: [] },
    });
    expect(result.sections.find((section) => section.id === 'spf').findings).toEqual(
      expect.arrayContaining([expect.objectContaining({ severity: 'error', title: 'SPF include has no policy' })])
    );
  });

  it('caps a branching SPF graph at a shared policy-query budget', async () => {
    let calls = 0;
    const result = await analyseEmailDns('example.com', '', {
      query: async (name, type) => {
        if (type !== 'TXT' || name.startsWith('_')) return { Status: 0, Answer: [] };
        calls += 1;
        const policy = name === 'example.com'
          ? `v=spf1 ${Array.from({ length: 25 }, (_, index) => `include:leaf${index}.example`).join(' ')} -all`
          : 'v=spf1 -all';
        return { Status: 0, Answer: [{ name, type: 16, data: `"${policy}"` }] };
      },
    });
    expect(calls).toBeLessThanOrEqual(20);
    expect(result.sections.find((section) => section.id === 'spf').findings).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'SPF analysis query budget reached' })])
    );
  });
});
