import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import whoisDomain from '../fixtures/workers/whois.example.com.json' with { type: 'json' };
import whoisIp from '../fixtures/workers/whois.8.8.8.8.json' with { type: 'json' };
import { call, sameOriginRequest, stable, startsWith, stubUpstream } from './harness.js';

const BOOTSTRAP = 'https://data.iana.org/rdap/dns.json';
const VERISIGN = 'https://rdap.verisign.com/com/v1/';
const NOMINET = 'https://rdap.nominet.uk/uk/';

const bootstrap = {
  services: [
    [['com'], [VERISIGN]],
    [['uk', 'co.uk'], [NOMINET]],
  ],
};

let onRequest;

beforeEach(async () => {
  vi.resetModules();
  ({ onRequest } = await import('../../../functions/api/whois.js'));
});

afterEach(() => vi.unstubAllGlobals());

const lookup = (query) => call(onRequest, sameOriginRequest(`/api/whois${query}`));

describe('/api/whois — domain', () => {
  it('reproduces the captured production response from the same RDAP data', async () => {
    const { calls } = stubUpstream([
      [startsWith(BOOTSTRAP), bootstrap],
      [startsWith(`${VERISIGN}domain/example.com`), whoisDomain.data.rdap],
    ]);

    const { status, body, response } = await lookup('?query=example.com');

    expect(status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(stable(body)).toEqual(stable(whoisDomain));
    expect(body.timestamp).toEqual(expect.any(Number));
    expect(body.sources[0].timestamp).toEqual(expect.any(Number));
    expect(calls.map((c) => c.url)).toEqual([BOOTSTRAP, `${VERISIGN}domain/example.com`]);
    expect(calls[1].headers.Accept).toBe('application/rdap+json, application/json');
  });

  it('trims and lower-cases the query before looking it up', async () => {
    stubUpstream([
      [startsWith(BOOTSTRAP), bootstrap],
      [startsWith(`${VERISIGN}domain/example.com`), whoisDomain.data.rdap],
    ]);

    const { body } = await lookup('?query=%20Example.COM%20');
    expect(body.query).toBe('example.com');
    expect(body.status).toBe('success');
  });

  it('resolves a multi-part TLD to its own RDAP service', async () => {
    const { calls } = stubUpstream([
      [startsWith(BOOTSTRAP), bootstrap],
      [startsWith(NOMINET), { objectClassName: 'domain', ldhName: 'bbc.co.uk' }],
    ]);

    const { body } = await lookup('?query=bbc.co.uk');
    expect(body.sources[0]).toMatchObject({ name: 'rdap', service: NOMINET, tld: 'co.uk', status: 'success' });
    expect(calls[1].url).toBe(`${NOMINET}domain/bbc.co.uk`);
  });

  it('turns a registry 404 into a 200 "not found" record', async () => {
    stubUpstream([[startsWith(BOOTSTRAP), bootstrap]]);

    const { status, body } = await lookup('?query=no-such-domain-fixture.com');
    expect(status).toBe(200);
    expect(body.status).toBe('success');
    expect(body.data.rdap).toMatchObject({ ldhName: 'no-such-domain-fixture.com', status: ['not found'] });
    expect(body.normalized.status).toEqual(['not found']);
  });

  it('reports an unknown TLD as a failed lookup, still with a 200', async () => {
    stubUpstream([[startsWith(BOOTSTRAP), bootstrap]]);

    const { status, body } = await lookup('?query=example.nosuchtld');
    expect(status).toBe(200);
    expect(body).toMatchObject({
      query: 'example.nosuchtld',
      type: 'domain',
      status: 'failed',
      error: 'No RDAP service found for domain: example.nosuchtld',
      data: {},
      sources: [],
    });
  });

  it('reports a registry failure in the failed-source shape', async () => {
    stubUpstream([
      [startsWith(BOOTSTRAP), bootstrap],
      [startsWith(VERISIGN), new Response('boom', { status: 503, statusText: 'Service Unavailable' })],
    ]);

    const { status, body } = await lookup('?query=example.com');
    expect(status).toBe(200);
    expect(body.status).toBe('failed');
    expect(body.error).toBe('RDAP query failed: 503 Service Unavailable');
    expect(body.sources).toEqual([
      { name: 'rdap', status: 'failed', error: body.error, timestamp: expect.any(Number) },
    ]);
  });

  it('fetches the IANA bootstrap once and reuses it', async () => {
    const { calls } = stubUpstream([
      [startsWith(BOOTSTRAP), bootstrap],
      [startsWith(VERISIGN), whoisDomain.data.rdap],
    ]);

    await lookup('?query=example.com');
    await lookup('?query=example.com');
    expect(calls.filter((c) => c.url === BOOTSTRAP)).toHaveLength(1);
  });
});

describe('/api/whois — IP', () => {
  const ipinfo = whoisIp.data['ipinfo.io'];
  const ipapi = whoisIp.data['ip-api.com'];

  const ipinfoUpstream = {
    ip: ipinfo.ip,
    city: ipinfo.city,
    region: ipinfo.region,
    country: ipinfo.country,
    loc: ipinfo.location,
    org: ipinfo.organization,
    postal: ipinfo.postal,
    timezone: ipinfo.timezone,
    hostname: ipinfo.hostname,
    anycast: ipinfo.anycast,
  };

  const ipapiUpstream = {
    status: 'success',
    query: ipapi.ip,
    city: ipapi.city,
    regionName: ipapi.region,
    region: ipapi.region_code,
    country: ipapi.country,
    countryCode: ipapi.country_code,
    continent: ipapi.continent,
    lat: ipapi.latitude,
    lon: ipapi.longitude,
    timezone: ipapi.timezone,
    isp: ipapi.isp,
    org: ipapi.organization,
    as: ipapi.as,
    asname: ipapi.asname,
    reverse: ipapi.reverse,
    mobile: ipapi.mobile,
    proxy: ipapi.proxy,
    hosting: ipapi.hosting,
  };

  it('reproduces the captured production response from the same provider data', async () => {
    const { calls } = stubUpstream([
      [startsWith('https://ipinfo.io/8.8.8.8/json'), ipinfoUpstream],
      [startsWith('http://ip-api.com/json/8.8.8.8'), ipapiUpstream],
    ]);

    const { status, body } = await lookup('?query=8.8.8.8');

    expect(status).toBe(200);
    expect(stable(body)).toEqual(stable(whoisIp));
    expect(calls).toHaveLength(2);
  });

  it('keeps going on one provider when the other fails', async () => {
    stubUpstream([[startsWith('http://ip-api.com/json/8.8.8.8'), ipapiUpstream]]);

    const { body } = await lookup('?query=8.8.8.8');
    expect(body.status).toBe('success');
    expect(Object.keys(body.data)).toEqual(['ip-api.com']);
    expect(body.sources.map((s) => [s.name, s.status])).toEqual([
      ['ipinfo.io', 'failed'],
      ['ip-api.com', 'success'],
    ]);
    expect(body.normalized.ip).toBe('8.8.8.8');
  });

  it('reports total provider failure in the failed shape', async () => {
    stubUpstream();

    const { status, body } = await lookup('?query=8.8.8.8');
    expect(status).toBe(200);
    expect(body).toMatchObject({ type: 'ip', status: 'failed', error: 'All IP lookup services failed', data: {} });
    expect(body.normalized).toBeUndefined();
  });

  it('honours an explicit type=ip', async () => {
    const { calls } = stubUpstream();
    const { body } = await lookup('?query=example.com&type=ip');
    expect(body.type).toBe('ip');
    expect(calls[0].url).toBe('https://ipinfo.io/example.com/json');
  });
});

describe('/api/whois — request handling', () => {
  it('400s a missing query in the production error shape', async () => {
    const { fetchMock } = stubUpstream();
    const { status, body } = await lookup('');
    expect(status).toBe(400);
    expect(body).toEqual({ error: 'Query parameter is required' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
