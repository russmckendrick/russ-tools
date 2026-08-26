import { describe, it, expect } from 'vitest';
import { EMAIL_PROVIDERS, matchEmailProvider, detectEmailProviders } from './email-provider.js';

describe('matchEmailProvider', () => {
  it('normalizes case and trailing dots', () => {
    expect(matchEmailProvider('ASPMX.L.GOOGLE.COM.')?.id).toBe('google-workspace');
  });

  it.each([
    ['example-com.mail.protection.outlook.com', 'microsoft-365'],
    ['smtp.google.com', 'google-workspace'],
    ['alt1.aspmx.l.google.com', 'google-workspace'],
    ['mx0a-00123456.pphosted.com', 'proofpoint'],
    ['us-smtp-inbound-1.mimecast.com', 'mimecast'],
    ['d123456a.ess.barracudanetworks.com', 'barracuda'],
    ['cluster5.eu.messagelabs.com', 'messagelabs'],
    ['mx01.hornetsecurity.com', 'hornetsecurity'],
    ['in.tmes.trendmicro.com', 'trendmicro'],
    ['mx.zoho.eu', 'zoho'],
    ['in1-smtp.messagingengine.com', 'fastmail'],
    ['inbound-smtp.eu-west-1.amazonaws.com', 'amazon'],
    ['route1.mx.cloudflare.net', 'cloudflare'],
    ['mx01.mail.icloud.com', 'icloud'],
    ['gmail-smtp-in.l.google.com', 'google-workspace'],
    ['mx-eu.mail.am0.yahoodns.net', 'yahoo'],
    ['mx.yandex.net', 'yandex'],
    ['mx1.improvmx.com', 'improvmx'],
    ['mx1.emailsrvr.com', 'rackspace'],
    ['smtp.secureserver.net', 'godaddy'],
    ['mail.protonmail.ch', 'proton'],
    ['mxa.mailgun.org', 'mailgun'],
  ])('matches %s to %s', (host, id) => {
    expect(matchEmailProvider(host)?.id).toBe(id);
  });

  it('returns null for unknown hosts', () => {
    expect(matchEmailProvider('mail.example.com')).toBeNull();
    expect(matchEmailProvider('')).toBeNull();
  });

  it('anchors suffixes at label boundaries', () => {
    expect(matchEmailProvider('evilpphosted.com')).toBeNull();
    expect(matchEmailProvider('outlook.com.attacker.example')).toBeNull();
  });

  it('every provider declares valid pattern shapes', () => {
    for (const provider of EMAIL_PROVIDERS) {
      expect(provider.id).toMatch(/^[a-z0-9-]+$/);
      expect(['mailbox', 'gateway', 'routing']).toContain(provider.type);
      expect(new URL(provider.url).protocol).toBe('https:');
      for (const pattern of [...provider.mx, ...(provider.spf ?? [])]) {
        expect(pattern).toBe(pattern.toLowerCase());
        expect(pattern.endsWith('.')).toBe(false);
      }
    }
  });
});

describe('detectEmailProviders', () => {
  it('dedupes multiple hosts of one provider and collects them as evidence', () => {
    const result = detectEmailProviders(['aspmx.l.google.com', 'alt1.aspmx.l.google.com', 'alt2.aspmx.l.google.com']);
    expect(result.providers).toEqual([
      {
        id: 'google-workspace',
        name: 'Google Workspace',
        type: 'mailbox',
        url: 'https://workspace.google.com',
        via: 'mx',
        hosts: ['aspmx.l.google.com', 'alt1.aspmx.l.google.com', 'alt2.aspmx.l.google.com'],
      },
    ]);
    expect(result.unmatched).toEqual([]);
  });

  it('names the mailbox provider behind a gateway from the SPF graph', () => {
    const result = detectEmailProviders(['us-smtp-inbound-1.mimecast.com'], ['spf.protection.outlook.com']);
    expect(result.providers.map((entry) => [entry.id, entry.via])).toEqual([
      ['mimecast', 'mx'],
      ['microsoft-365', 'spf'],
    ]);
  });

  it('names the SPF domain as evidence for a via-SPF match', () => {
    const result = detectEmailProviders(['us-smtp-inbound-1.mimecast.com'], ['spf.protection.outlook.com']);
    expect(result.providers[1].hosts).toEqual(['spf.protection.outlook.com']);
    expect(result.providers[1].url).toBe('https://www.microsoft.com/microsoft-365');
  });

  it('skips SPF corroboration when a mailbox provider matched via MX', () => {
    const result = detectEmailProviders(['example-com.mail.protection.outlook.com'], ['_spf.google.com']);
    expect(result.providers.map((entry) => entry.id)).toEqual(['microsoft-365']);
    expect(result.providers[0].via).toBe('mx');
  });

  it('collects unmatched hosts', () => {
    const result = detectEmailProviders(['mail.example.com', 'MX2.EXAMPLE.COM.']);
    expect(result.providers).toEqual([]);
    expect(result.unmatched).toEqual(['mail.example.com', 'mx2.example.com']);
  });
});
