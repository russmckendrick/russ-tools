import { http, HttpResponse } from 'msw';

import whoisDomain from '../fixtures/workers/whois.example.com.json' with { type: 'json' };
import whoisIp from '../fixtures/workers/whois.8.8.8.8.json' with { type: 'json' };
import tenantKnown from '../fixtures/workers/tenant.microsoft.com.json' with { type: 'json' };
import tenantUnmanaged from '../fixtures/workers/tenant.example.com.json' with { type: 'json' };
import sslInProgress from '../fixtures/workers/ssl.russ.tools.json' with { type: 'json' };
import sslReady from '../fixtures/workers/ssl.ready.json' with { type: 'json' };
import sslError from '../fixtures/workers/ssl.error.json' with { type: 'json' };
import dnsA from '../fixtures/workers/dns.example.com.A.json' with { type: 'json' };
import dnsMx from '../fixtures/workers/dns.example.com.MX.json' with { type: 'json' };
import dnsNx from '../fixtures/workers/dns.nxdomain.json' with { type: 'json' };

/**
 * MSW handlers for the five lookup tools, built on responses captured from
 * the **live** workers (frozen contract #5 — the deployed schemas are the
 * contract, and repo-vs-deployed drift is proven, so the fixtures were taken
 * from production, not from the worker source in `cloudflare-worker/`).
 *
 * Captured 2026-07-19 with `Origin: https://russ.tools` — the workers 403
 * any other origin, which is also why these tools cannot be tested against
 * the real endpoints from CI.
 *
 * Handlers key off the same query params the tools send:
 *   whois.russ.tools/?query=…    tenant.russ.tools/?domain=…
 *   ssl.russ.tools/?domain=…     dns.google/resolve?name=…&type=…
 */
export const workerHandlers = [
  http.get('https://whois.russ.tools/', ({ request }) => {
    const query = new URL(request.url).searchParams.get('query');
    if (!query) return HttpResponse.json({ error: 'query required' }, { status: 400 });
    return HttpResponse.json(/^[0-9.:]+$/.test(query) ? whoisIp : whoisDomain);
  }),

  http.get('https://tenant.russ.tools/', ({ request }) => {
    const domain = new URL(request.url).searchParams.get('domain');
    if (!domain) return HttpResponse.json({ error: 'domain required' }, { status: 400 });
    return HttpResponse.json(domain === 'microsoft.com' ? tenantKnown : tenantUnmanaged);
  }),

  http.get('https://ssl.russ.tools/', ({ request }) => {
    const domain = new URL(request.url).searchParams.get('domain');
    if (!domain) return HttpResponse.json({ error: 'domain required' }, { status: 400 });
    if (domain.endsWith('.invalid')) return HttpResponse.json(sslError);
    if (domain === 'in-progress.example') return HttpResponse.json(sslInProgress);
    return HttpResponse.json(sslReady);
  }),

  http.get('https://dns.google/resolve', ({ request }) => {
    const url = new URL(request.url);
    const name = url.searchParams.get('name') ?? '';
    const type = url.searchParams.get('type') ?? 'A';
    if (name.startsWith('nxdomain')) return HttpResponse.json(dnsNx);
    return HttpResponse.json(type === 'MX' ? dnsMx : dnsA);
  }),
];
