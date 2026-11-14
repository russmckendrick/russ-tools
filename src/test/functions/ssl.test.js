import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import sslReady from '../fixtures/workers/ssl.ready.json' with { type: 'json' };
import sslInProgress from '../fixtures/workers/ssl.russ.tools.json' with { type: 'json' };
import sslBasic from '../fixtures/workers/ssl.error.json' with { type: 'json' };
import { onRequest } from '../../../functions/api/ssl.js';
import { call, includes, sameOriginRequest, stable, startsWith, stubUpstream } from './harness.js';

const SSL_ENV = { SSL_LABS_EMAIL: 'fixture@example.com', SSL_LABS_USER_AGENT: 'fixture-agent/1.0' };
const LABS = 'https://api.ssllabs.com/api/v4';
const INFO = [startsWith(`${LABS}/info`), { engineVersion: '2.4.1', criteriaVersion: '2009q' }];

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const check = (query, env = SSL_ENV) => call(onRequest, sameOriginRequest(`/api/ssl${query}`), env);

function sslLabsAssessmentFor(fixture) {
  const leafDetails = new Map();
  for (const endpoint of fixture.endpoints) {
    const leafId = endpoint.details.certChains?.[0]?.certIds?.[0];
    if (leafId && endpoint.details.cert) {
      const { daysUntilExpiry: _derived, ...cert } = endpoint.details.cert;
      leafDetails.set(leafId, cert);
    }
  }

  const upstreamEndpoints = fixture.endpoints.map(({ isComplete: _derived, details, ...endpoint }) => {
    const { cert: _cert, ...upstreamDetails } = details;
    return { ...endpoint, details: upstreamDetails };
  });

  return {
    host: fixture.host,
    status: fixture.status,
    startTime: fixture.startTime,
    testTime: fixture.testTime,
    engineVersion: fixture.engineVersion,
    criteriaVersion: fixture.criteriaVersion,
    certHostnames: fixture.certHostnames,
    endpoints: upstreamEndpoints,
    certs: fixture.certs.map((cert) => ({ ...cert, ...(leafDetails.get(cert.id) ?? {}) })),
  };
}

describe('/api/ssl — SSL Labs', () => {
  it('reproduces the captured production response for a completed assessment', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(sslReady.timestamp);

    const assessment = sslLabsAssessmentFor(sslReady);
    const { calls } = stubUpstream([
      INFO,
      [includes(`${LABS}/analyze`, 'fromCache=on'), () => structuredClone(assessment)],
      [
        startsWith(`${LABS}/getEndpointData`),
        (url) => {
          const ip = new URL(url).searchParams.get('s');
          return { details: structuredClone(assessment.endpoints.find((ep) => ep.ipAddress === ip).details) };
        },
      ],
    ]);

    const { status, body, response } = await check('?domain=russ.tools');

    expect(status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(response.headers.get('cache-control')).toBe('public, max-age=300');
    expect(body).toEqual(JSON.parse(JSON.stringify(sslReady)));

    const analyze = new URL(calls.find((c) => c.url.includes('/analyze')).url);
    expect(Object.fromEntries(analyze.searchParams)).toEqual({
      host: 'russ.tools',
      publish: 'off',
      fromCache: 'on',
      maxAge: '24',
      all: 'done',
    });
    expect(calls.filter((c) => c.url.includes('/getEndpointData'))).toHaveLength(3);
    for (const labsCall of calls) {
      expect(labsCall.headers['User-Agent']).toBe('fixture-agent/1.0');
    }
  });

  it('sends the registered email on analyze and getEndpointData, and not on info', async () => {
    const assessment = sslLabsAssessmentFor(sslReady);
    const { calls } = stubUpstream([
      INFO,
      [includes(`${LABS}/analyze`, 'fromCache=on'), () => structuredClone(assessment)],
      [startsWith(`${LABS}/getEndpointData`), { details: structuredClone(assessment.endpoints[0].details) }],
    ]);

    await check('?domain=russ.tools');

    const byAction = (action) => calls.filter((c) => c.url.startsWith(`${LABS}/${action}`));
    expect(byAction('analyze')).toHaveLength(1);
    expect(byAction('getEndpointData').length).toBeGreaterThan(0);
    for (const labsCall of [...byAction('analyze'), ...byAction('getEndpointData')]) {
      expect(labsCall.headers.email).toBe('fixture@example.com');
    }
    expect(byAction('info')).toHaveLength(1);
    expect(byAction('info')[0].headers).not.toHaveProperty('email');
  });

  it('sends the registered email when it starts a new assessment', async () => {
    const { calls } = stubUpstream([INFO, [startsWith(`${LABS}/analyze`), { host: 'example.com', status: 'DNS' }]]);

    await check('?domain=example.com');

    const analyzeCalls = calls.filter((c) => c.url.includes('/analyze'));
    expect(analyzeCalls.map((c) => new URL(c.url).searchParams.has('startNew'))).toEqual([false, true]);
    for (const analyzeCall of analyzeCalls) {
      expect(analyzeCall.headers.email).toBe('fixture@example.com');
    }
  });

  it('reproduces the captured in-progress response and tells the client to poll', async () => {
    const started = {
      host: 'russ.tools',
      status: 'IN_PROGRESS',
      startTime: sslInProgress.startTime,
      testTime: sslInProgress.testTime,
      engineVersion: sslInProgress.engineVersion,
      criteriaVersion: sslInProgress.criteriaVersion,
      endpoints: sslInProgress.endpoints.map(({ ipAddress, serverName, statusMessage }) => ({
        ipAddress,
        serverName,
        statusMessage,
      })),
    };

    const { calls } = stubUpstream([
      INFO,
      [includes(`${LABS}/analyze`, 'fromCache=on'), { host: 'russ.tools', status: 'DNS' }],
      [includes(`${LABS}/analyze`, 'startNew=on'), started],
    ]);

    const before = Date.now();
    const { status, body, response } = await check('?domain=russ.tools');

    expect(status).toBe(200);
    expect(stable(body)).toEqual(stable(sslInProgress));
    expect(body.pollInfo.shouldPoll).toBe(true);
    expect(body.pollInfo.nextPollTime).toBeGreaterThanOrEqual(before + body.pollInfo.recommendedInterval * 1000);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(calls.map((c) => c.url.replace(LABS, '').split('?')[0])).toEqual(['/info', '/analyze', '/analyze']);
  });

  it('polls a DNS-stage assessment every five seconds', async () => {
    stubUpstream([INFO, [startsWith(`${LABS}/analyze`), { host: 'example.com', status: 'DNS' }]]);

    const { body } = await check('?domain=example.com');
    expect(body.status).toBe('DNS');
    expect(body.statusMessage).toBe('SSL Labs resolving domain...');
    expect(body.pollInfo).toMatchObject({ shouldPoll: true, recommendedInterval: 5 });
    expect(body.endpoints).toEqual([
      {
        statusMessage: 'SSL Labs analysis in progress',
        grade: '-',
        hasWarnings: false,
        isExceptional: false,
        progress: 0,
        eta: 0,
        delegation: 1,
        isComplete: false,
        details: { cert: null },
      },
    ]);
  });

  it('strips a scheme and path from the domain and encodes it into the upstream query', async () => {
    const { calls } = stubUpstream([INFO, [startsWith(`${LABS}/analyze`), { status: 'DNS' }]]);

    await check(`?domain=${encodeURIComponent('https://Example.com/some/path')}`);
    expect(new URL(calls[1].url).searchParams.get('host')).toBe('example.com');

    calls.length = 0;
    await check(`?domain=${encodeURIComponent('example.com&publish=on&startNew=on')}`);
    for (const analyzeCall of calls.filter((c) => c.url.includes('/analyze'))) {
      const params = new URL(analyzeCall.url).searchParams;
      expect(params.get('host')).toBe('example.com&publish=on&startnew=on');
      expect(params.getAll('publish')).toEqual(['off']);
    }
  });
});

describe('/api/ssl — fallbacks', () => {
  const hackerTargetText = [
    'Subject: CN=example.com',
    'Issuer: CN=Fixture Issuing CA',
    'Valid from: Jan  1 00:00:00 2026 GMT',
    'Valid until: Jan  1 00:00:00 2099 GMT',
    'Serial: 0123456789ABCDEF',
  ].join('\n');

  const hackerTarget = [
    startsWith('https://api.hackertarget.com/sslcheck/'),
    () => new Response(hackerTargetText, { status: 200, headers: { 'content-type': 'text/plain' } }),
  ];

  it('falls back to HackerTarget when SSL Labs is unavailable', async () => {
    const { calls } = stubUpstream([
      [startsWith(`${LABS}/info`), new Response('down', { status: 503 })],
      hackerTarget,
    ]);

    const { status, body } = await check('?domain=example.com');

    expect(status).toBe(200);
    expect(body).toMatchObject({
      host: 'example.com',
      status: 'READY',
      apiCheck: true,
      apiSource: 'HackerTarget (via Cloudflare Worker)',
      timestamp: expect.any(Number),
    });
    expect(body.endpoints).toHaveLength(1);
    expect(body.endpoints[0]).toMatchObject({
      grade: 'A+',
      hasWarnings: false,
      isExceptional: true,
      progress: 100,
      eta: 0,
      delegation: 1,
      details: {
        cert: {
          subject: 'CN=example.com',
          issuerSubject: 'CN=Fixture Issuing CA',
          notBefore: Date.parse('Jan  1 00:00:00 2026 GMT'),
          notAfter: Date.parse('Jan  1 00:00:00 2099 GMT'),
          sigAlg: 'Unknown',
          serialNumber: '0123456789ABCDEF',
        },
      },
    });
    expect(calls.at(-1).url).toBe('https://api.hackertarget.com/sslcheck/?q=example.com');
  });

  it.each([
    ['no configuration at all', {}],
    ['no email', { SSL_LABS_USER_AGENT: 'fixture-agent/1.0' }],
    ['no user agent', { SSL_LABS_EMAIL: 'fixture@example.com' }],
  ])('never calls SSL Labs with %s, and says the analysis is not configured', async (_label, env) => {
    const { calls } = stubUpstream([hackerTarget]);

    const { status, body } = await check('?domain=example.com', env);

    expect(status).toBe(200);
    expect(body.apiSource).toBe('HackerTarget (via Cloudflare Worker)');
    expect(body.statusMessage).toBe(
      'SSL Labs analysis unavailable: it is not configured for this deployment. Showing a reduced check instead.'
    );
    expect(calls.some((c) => c.url.startsWith(LABS))).toBe(false);
  });

  const missingEmail = () =>
    new Response(
      JSON.stringify({
        errors: [{ field: 'email', message: 'You must provide email header with non empty value  in request' }],
      }),
      { status: 400, statusText: 'Bad Request', headers: { 'content-type': 'application/json' } }
    );
  const unregistered = () => new Response('', { status: 441, statusText: '' });

  it.each([
    ['a 400 naming the email field', missingEmail],
    ['a 441 for an unregistered address', unregistered],
  ])('falls back and says so when SSL Labs answers %s', async (_label, refusal) => {
    const { calls } = stubUpstream([INFO, [startsWith(`${LABS}/analyze`), refusal], hackerTarget]);

    const { status, body } = await check('?domain=example.com');

    expect(status).toBe(200);
    expect(body.apiSource).toBe('HackerTarget (via Cloudflare Worker)');
    expect(body.statusMessage).toBe(
      "SSL Labs analysis unavailable: SSL Labs did not accept this site's registered email. Showing a reduced check instead."
    );
    expect(body.endpoints[0].grade).toBe('A+');
    expect(calls.filter((c) => c.url.includes('/analyze'))).toHaveLength(1);
  });

  it('carries the same notice onto the basic check when the summary source is down too', async () => {
    stubUpstream([
      INFO,
      [startsWith(`${LABS}/analyze`), unregistered],
      [startsWith('https://example.com'), new Response(null, { status: 200 })],
    ]);

    const { body } = await check('?domain=example.com');

    expect(body.apiSource).toBe('Cloudflare Worker Basic Check');
    expect(body.statusMessage).toMatch(/did not accept this site's registered email/);
  });

  it('does not blame the registration for an unrelated 400', async () => {
    stubUpstream([
      INFO,
      [
        startsWith(`${LABS}/analyze`),
        () =>
          new Response(JSON.stringify({ errors: [{ field: 'host', message: 'invalid host' }] }), {
            status: 400,
            statusText: 'Bad Request',
          }),
      ],
      hackerTarget,
    ]);

    const { body } = await check('?domain=example.com');

    expect(body.apiSource).toBe('HackerTarget (via Cloudflare Worker)');
    expect(body).not.toHaveProperty('statusMessage');
  });

  it('never puts the registered email in a response or a log line', async () => {
    stubUpstream([INFO, [startsWith(`${LABS}/analyze`), unregistered], hackerTarget]);

    const { response, body } = await check('?domain=example.com');

    const logged = [...console.log.mock.calls, ...console.error.mock.calls].flat().map(String).join('\n');
    expect(logged).toContain('SSL Labs failed');
    expect(logged).not.toContain('fixture@example.com');
    expect(JSON.stringify(body)).not.toContain('fixture@example.com');
    expect([...response.headers].flat().join('\n')).not.toContain('fixture@example.com');
  });

  it('reproduces the captured basic-check response when every analysis source fails', async () => {
    const { calls } = stubUpstream([
      [startsWith('https://nonexistent-domain-fixture.invalid'), new Response(null, { status: 530 })],
    ]);

    const { status, body } = await check('?domain=nonexistent-domain-fixture.invalid');

    expect(status).toBe(200);
    expect(stable(body)).toEqual(stable(sslBasic));
    expect(calls.at(-1)).toMatchObject({ url: 'https://nonexistent-domain-fixture.invalid', method: 'HEAD' });
  });

  it('500s in the production error shape when even the basic check cannot connect', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('connection refused');
      })
    );

    const { status, body } = await check('?domain=example.com');

    expect(status).toBe(500);
    expect(body).toEqual({
      error: 'SSL connection failed: connection refused',
      stack: expect.any(String),
      timestamp: expect.any(Number),
    });
  });
});

describe('/api/ssl — request handling', () => {
  it('400s a missing domain in the production error shape', async () => {
    const { fetchMock } = stubUpstream();
    const { status, body } = await check('');
    expect(status).toBe(400);
    expect(body).toEqual({ error: 'Domain parameter is required' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
