import { describe, it, expect, afterEach, vi } from 'vitest';
import tenantMicrosoft from '../fixtures/workers/tenant.microsoft.com.json' with { type: 'json' };
import tenantExample from '../fixtures/workers/tenant.example.com.json' with { type: 'json' };
import { onRequest } from '../../../functions/api/tenant.js';
import { call, includes, sameOriginRequest, stable, startsWith, stubUpstream } from './harness.js';

afterEach(() => vi.unstubAllGlobals());

const GRAPH_ENV = {
  GRAPH_CLIENT_ID: 'fixture-client-id',
  GRAPH_CLIENT_SECRET: 'fixture-client-secret',
  GRAPH_TENANT_ID: 'fixture-tenant-id',
};

const TOKEN_URL = 'https://login.microsoftonline.com/fixture-tenant-id/oauth2/v2.0/token';

const lookup = (query, env = GRAPH_ENV) => call(onRequest, sameOriginRequest(`/api/tenant${query}`), env);

function upstreamFor(fixture) {
  const { domain, apiResults } = fixture;
  const graph = apiResults['Microsoft Graph API'];
  const realm = apiResults['GetUserRealm API'];
  const credential = apiResults['GetCredentialType API'];
  const dns = apiResults['DNS Analysis'];

  return [
    [startsWith(TOKEN_URL), { access_token: 'fixture-token' }],
    [
      startsWith('https://graph.microsoft.com/v1.0/tenantRelationships/findTenantInformationByDomainName'),
      {
        tenantId: graph.tenantId,
        displayName: graph.displayName,
        federationBrandName: graph.federationBrandName,
        defaultDomainName: graph.defaultDomainName,
      },
    ],
    [
      includes('GetUserRealm.srf', `login=test@${domain}`),
      {
        DomainName: domain,
        FederationBrandName: realm.displayName === domain ? undefined : realm.displayName,
        NameSpaceType: realm.namespaceType,
        CloudInstanceName: realm.cloudInstance,
      },
    ],
    [
      startsWith('https://login.microsoftonline.com/common/GetCredentialType'),
      {
        Username: `test@${domain}`,
        IfExistsResult: credential.userExists ? 0 : 1,
        IsUnmanaged: credential.isUnmanaged,
        EstsProperties: { DomainType: credential.domainType },
      },
    ],
    [includes('GetUserRealm.srf', `login=admin@${domain}`), apiResults['User Realm Details']],
    [
      includes('cloudflare-dns.com/dns-query', 'type=MX'),
      { Answer: dns.mxRecords.map((mx) => ({ data: `${mx.priority} ${mx.exchange}` })) },
    ],
    [includes('cloudflare-dns.com/dns-query', 'type=TXT'), { Answer: dns.txtRecords.map((data) => ({ data })) }],
  ];
}

describe('/api/tenant', () => {
  it.each([
    ['microsoft.com', tenantMicrosoft],
    ['example.com', tenantExample],
  ])('reproduces the captured production response for %s from the same upstream data', async (domain, fixture) => {
    const { calls } = stubUpstream(upstreamFor(fixture));

    const { status, body, response } = await lookup(`?domain=${domain}`);

    expect(status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(stable(body)).toEqual(stable(fixture));
    expect(body.timestamp).toEqual(expect.any(Number));

    const graphCall = calls.find((c) => c.url.startsWith('https://graph.microsoft.com/'));
    expect(graphCall.url).toContain(`domainName='${domain}'`);
    expect(graphCall.headers.Authorization).toBe('Bearer fixture-token');

    const tokenCall = calls.find((c) => c.url === TOKEN_URL);
    expect(tokenCall.method).toBe('POST');
    expect(Object.fromEntries(tokenCall.body)).toEqual({
      client_id: 'fixture-client-id',
      client_secret: 'fixture-client-secret',
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    });

    const credentialCall = calls.find((c) => c.url.endsWith('/common/GetCredentialType'));
    expect(credentialCall.method).toBe('POST');
    expect(JSON.parse(credentialCall.body)).toEqual({ Username: `test@${domain}` });
  });

  it('skips Graph without credentials and falls back to the public endpoints', async () => {
    const { calls } = stubUpstream(upstreamFor(tenantMicrosoft));

    const { status, body } = await lookup('?domain=microsoft.com', {});

    expect(status).toBe(200);
    expect(calls.some((c) => c.url.includes('oauth2/v2.0/token'))).toBe(false);
    expect(calls.some((c) => c.url.startsWith('https://graph.microsoft.com/'))).toBe(false);
    expect(body.success).toBe(true);
    expect(body.method).toBe('GetUserRealm API');
    expect(body.tenantId).toBe(null);
    expect(Object.keys(body.apiResults)).toEqual(['GetUserRealm API', 'GetCredentialType API', 'DNS Analysis']);
    expect(body.tenantCategory).toBe('Custom Domain');
  });

  describe('when Microsoft refuses the Graph token', () => {
    const SENSITIVE = [
      'fixture-client-id',
      'fixture-client-secret',
      'fixture-tenant-id',
      'trace-id-fixture',
      'correlation-id-fixture',
      'AADSTS700016: Application with identifier',
    ];

    const refusedWith = (response) => {
      const routes = upstreamFor(tenantMicrosoft).filter(([matches]) => !matches(TOKEN_URL));
      return stubUpstream([[startsWith(TOKEN_URL), response], ...routes]);
    };

    const loggedLines = (spy) => spy.mock.calls.map((args) => args.map(String).join(' '));

    it('logs the status, error and error_codes, and nothing that identifies the tenant or app', async () => {
      const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
      const otherLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      const { calls } = refusedWith(
        () =>
          new Response(
            JSON.stringify({
              error: 'unauthorized_client',
              error_description:
                "AADSTS700016: Application with identifier 'fixture-client-id' was not found in the directory 'fixture-tenant-id'. Trace ID: trace-id-fixture Correlation ID: correlation-id-fixture",
              error_codes: [700016],
              trace_id: 'trace-id-fixture',
              correlation_id: 'correlation-id-fixture',
            }),
            { status: 400, statusText: 'Bad Request', headers: { 'content-type': 'application/json' } }
          )
      );

      const { status, body } = await lookup('?domain=microsoft.com');

      expect(errorLog.mock.calls).toEqual([['Failed to get Graph access token:', 400, 'unauthorized_client', '700016']]);

      const everything = [...loggedLines(errorLog), ...loggedLines(otherLog)].join('\n');
      for (const secret of SENSITIVE) expect(everything).not.toContain(secret);

      expect(status).toBe(200);
      expect(body.method).toBe('GetUserRealm API');
      expect(body.tenantId).toBe(null);
      expect(JSON.stringify(body)).not.toMatch(/unauthorized_client|700016|AADSTS/);
      expect(calls.some((c) => c.url.startsWith('https://graph.microsoft.com/'))).toBe(false);

      errorLog.mockRestore();
      otherLog.mockRestore();
    });

    it('joins several error codes', async () => {
      const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
      refusedWith(
        () => new Response(JSON.stringify({ error: 'invalid_client', error_codes: [7000215, 7000222] }), { status: 401 })
      );

      await lookup('?domain=microsoft.com');

      expect(errorLog.mock.calls).toEqual([['Failed to get Graph access token:', 401, 'invalid_client', '7000215,7000222']]);
      errorLog.mockRestore();
    });

    it.each([
      ['an HTML error page', () => new Response('<html>Bad Request</html>', { status: 400 }), 'unreadable', 'none'],
      ['an empty body', () => new Response('', { status: 400 }), 'unreadable', 'none'],
      ['JSON without the fields', () => new Response('{"message":"nope"}', { status: 400 }), 'unknown', 'none'],
      ['JSON null', () => new Response('null', { status: 400 }), 'unknown', 'none'],
      [
        'an error string that is not an OAuth error code',
        () => new Response(JSON.stringify({ error: 'tenant fixture-tenant-id not found', error_codes: [90002] }), { status: 400 }),
        'unknown',
        '90002',
      ],
      [
        'fields of the wrong type',
        () => new Response(JSON.stringify({ error: { secret: 'fixture-client-secret' }, error_codes: ['fixture-tenant-id'] }), { status: 400 }),
        'unknown',
        'none',
      ],
    ])('still logs the status for %s', async (_label, response, error, codes) => {
      const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
      refusedWith(response);

      const { status, body } = await lookup('?domain=microsoft.com');

      expect(errorLog.mock.calls).toEqual([['Failed to get Graph access token:', 400, error, codes]]);
      for (const secret of SENSITIVE) expect(loggedLines(errorLog).join('\n')).not.toContain(secret);
      expect(status).toBe(200);
      expect(body.success).toBe(true);
      errorLog.mockRestore();
    });

    it('logs only the message when the token request cannot be made at all', async () => {
      const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
      refusedWith(() => {
        throw new Error('network unreachable');
      });

      const { body } = await lookup('?domain=microsoft.com');

      expect(errorLog.mock.calls).toEqual([['Error getting Graph access token:', 'network unreachable']]);
      expect(body.method).toBe('GetUserRealm API');
      errorLog.mockRestore();
    });
  });

  it('accepts an email address and looks up its domain', async () => {
    stubUpstream(upstreamFor(tenantMicrosoft));
    const { body } = await lookup(`?domain=${encodeURIComponent('Someone@Microsoft.com')}`);
    expect(body.domain).toBe('microsoft.com');
    expect(body.success).toBe(true);
  });

  it('returns the production "nothing found" shape when no source knows the domain', async () => {
    stubUpstream();

    const { status, body } = await lookup('?domain=no-tenant-fixture.example');

    expect(status).toBe(200);
    expect(body).toEqual({
      success: false,
      error: 'Unable to discover tenant information for domain: no-tenant-fixture.example',
      domain: 'no-tenant-fixture.example',
      suggestions: [
        'The domain may not be associated with a Microsoft tenant',
        'The domain may use a different identity provider',
        'The lookup services may be temporarily unavailable',
      ],
      timestamp: expect.any(Number),
    });
  });

  it('400s a missing domain in the production error shape', async () => {
    const { fetchMock } = stubUpstream();
    const { status, body } = await lookup('');
    expect(status).toBe(400);
    expect(body).toEqual({ error: 'Domain parameter is required' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('400s a malformed domain in the production error shape', async () => {
    const { fetchMock } = stubUpstream();
    const { status, body } = await lookup('?domain=not_a_domain');
    expect(status).toBe(400);
    expect(body).toEqual({ error: 'Invalid domain format', domain: 'not_a_domain' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
