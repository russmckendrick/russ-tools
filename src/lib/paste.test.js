import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { refine, suggest } from './paste.js';
import { allRoutes } from '../tools/registry.mjs';
import { fromFragment, splitPem } from '../tools/cert-decoder/lib/pem.js';

/**
 * The dispatcher's contract is the ranking, not just the routing: eight tools
 * accept a bare hostname, so "paste a domain" must offer eight chips rather
 * than silently choosing one.
 *
 * Every href here is also a route the registry actually serves —
 * `registry.test.js` freezes that list, and `serves the frozen deep links`
 * below re-checks the pairing so a renamed param cannot rot this file quietly.
 */

// HS256, the same token e2e/deeplinks.spec.js mints.
const JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const first = (input) => suggest(input)[0];
const ids = (input) => suggest(input).map((s) => s.toolId);

describe('suggest', () => {
  it('offers nothing for empty or whitespace input', () => {
    expect(suggest('')).toEqual([]);
    expect(suggest('   ')).toEqual([]);
    expect(suggest(null)).toEqual([]);
  });

  it('routes a JWT to the decoder', () => {
    expect(ids(JWT)).toEqual(['jwt']);
    expect(first(JWT).href).toBe(`/jwt/${JWT}`);
  });

  it('does not mistake three dotted words for a JWT', () => {
    // Structurally three segments, but the header is not JSON.
    expect(ids('a.b.c')).not.toContain('jwt');
  });

  it('splits an IPv4 CIDR across the two route segments', () => {
    expect(first('10.0.0.0/22')).toMatchObject({
      toolId: 'subnet-calculator',
      href: '/subnet-calculator/10.0.0.0/22',
    });
  });

  it('also offers CIDR set work and route visibility', () => {
    expect(ids('10.0.0.0/22')).toEqual(['subnet-calculator', 'cidr-workbench', 'bgp-explorer']);
    expect(suggest('10.0.0.0/22')[1].href).toBe('/cidr-workbench/10.0.0.0%2F22');
    expect(suggest('10.0.0.0/22')[2].href).toBe('/bgp-explorer/10.0.0.0%2F22');
  });

  it('splits an IPv6 CIDR the same way, colons intact', () => {
    // Byte-identical to the fixture frozen in e2e/deeplinks.spec.js. A colon
    // is a legal pchar, and percent-encoding it would make every IPv6 deep
    // link unreadable on a site whose premise is shareable URLs.
    expect(first('2001:db8:abcd::/48').href).toBe('/subnet-calculator/2001:db8:abcd::/48');
  });

  it('offers calculators and live routing datasets for a bare IP', () => {
    const expected = ['subnet-calculator', 'whois-lookup', 'bgp-explorer', 'azure-service-tags'];
    expect(ids('10.0.0.1')).toEqual(expected);
    expect(ids('2001:db8::1')).toEqual(expected);
  });

  it('routes an ASN to the BGP explorer', () => {
    expect(first('AS3333').href).toBe('/bgp-explorer/AS3333');
    expect(first('3333').href).toBe('/bgp-explorer/AS3333');
  });

  it('reads a ten- or thirteen-digit number as a Unix timestamp', () => {
    expect(first('1794651210')).toMatchObject({ toolId: 'timestamp', href: '/timestamp/1794651210' });
    expect(ids('1794651210123')).toEqual(['timestamp']);
    expect(first('1794651210123').href).toBe('/timestamp/1794651210123');
  });

  it('keeps BGP behind the timestamp when ten digits could still be an AS number', () => {
    expect(ids('1794651210')).toEqual(['timestamp', 'bgp-explorer']);
    expect(suggest('4200000001')[1].href).toBe('/bgp-explorer/AS4200000001');
    expect(ids('9999999999')).toEqual(['timestamp']);
  });

  it('leaves shorter and longer numbers where they were', () => {
    expect(ids('179465121')).toEqual(['bgp-explorer']);
    expect(ids('17946512101')).not.toContain('timestamp');
    expect(ids('AS1794651210')).toEqual(['bgp-explorer']);
  });

  it('routes a cron expression to the builder', () => {
    expect(first('*/15 * * * *')).toMatchObject({
      toolId: 'cron-builder',
      href: `/cron/${encodeURIComponent('*/15 * * * *')}`,
    });
  });

  it('does not mistake five words for a cron expression', () => {
    expect(ids('the quick brown fox jumps')).toEqual(['base64']);
  });

  it('offers all eight domain tools, DNS first', () => {
    expect(ids('example.com')).toEqual([
      'dns-lookup',
      'email-dns-analyser',
      'dnssec-checker',
      'whois-lookup',
      'ssl-checker',
      'http-headers',
      'tenant-lookup',
      'microsoft-portals',
    ]);
  });

  it('offers the headers checker for a pasted http(s) URL, by host alone', () => {
    for (const url of ['https://example.com/pricing?ref=1', 'http://example.com', 'HTTPS://Example.com/Login#top']) {
      const headers = suggest(url).find((s) => s.toolId === 'http-headers');
      expect(headers, url).toMatchObject({ href: '/http-headers/example.com', why: 'URL', path: '/http-headers' });
    }
    expect(suggest('example.com').find((s) => s.toolId === 'http-headers').why).toBe('domain');
  });

  it('does not offer the headers checker for a URL that names an address', () => {
    expect(ids('https://10.0.0.1:8443/')).not.toContain('http-headers');
    expect(ids('http://[2001:db8::1]/')).not.toContain('http-headers');
  });

  it('leads with the headers checker when the paste is a web address', () => {
    const [first, ...rest] = ids('https://example.com');
    expect(first).toBe('http-headers');
    expect(rest).toEqual(ids('example.com').filter((id) => id !== 'http-headers'));
    expect(ids('http://example.com/')).toEqual(ids('https://example.com'));
  });

  it('reduces a pasted URL to its host for every tool that reads a host', () => {
    const [url, ...hosts] = suggest('https://example.com/pricing?ref=1');
    expect(url.toolId).toBe('url');
    expect(hosts).toHaveLength(8);
    for (const s of hosts) {
      expect(s.href).toContain('example.com');
      expect(s.href).not.toContain('pricing');
    }
  });

  it('falls back to base64 for anything else', () => {
    expect(ids('hello world')).toEqual(['base64']);
    expect(first('SGVsbG8gd29ybGQ=').href).toBe('/base64/SGVsbG8gd29ybGQ%3D');
  });

  /**
   * The four collisions the ordering exists to resolve. Each of these inputs
   * satisfies more than one detector; the assertion is which one wins.
   */
  it('offers Azure RBAC and the licence decoder for a bare GUID, with the UUID decoder and the Entra lookup behind them', () => {
    // Contributor's role definition id. Nothing in the string says whether it
    // names a role or a SKU, so the panel says both rather than guessing. The
    // Entra lookup is last until `refine()` has had a look at its index.
    expect(ids('b24988ac-6180-42a0-ab88-20f7382dd24c')).toEqual([
      'azure-rbac',
      'm365-licenses',
      'uuid',
      'entra-ids',
    ]);
    expect(first('b24988ac-6180-42a0-ab88-20f7382dd24c').href).toBe(
      '/azure-rbac/b24988ac-6180-42a0-ab88-20f7382dd24c'
    );
    expect(ids('B24988AC-6180-42A0-AB88-20F7382DD24C')).toEqual([
      'azure-rbac',
      'm365-licenses',
      'uuid',
      'entra-ids',
    ]);
    expect(suggest('b24988ac-6180-42a0-ab88-20f7382dd24c')[2].href).toBe(
      '/uuid/b24988ac-6180-42a0-ab88-20f7382dd24c'
    );
    expect(suggest('b24988ac-6180-42a0-ab88-20f7382dd24c')[3].href).toBe(
      '/entra-ids/b24988ac-6180-42a0-ab88-20f7382dd24c'
    );
  });

  /**
   * `refine()` is the half of the GUID branch that needs data. These run
   * against the checked-in index, so they also prove the index is the one the
   * panel will actually load.
   */
  describe('refine', () => {
    const refined = async (value, loadIndex) => {
      const matches = suggest(value);
      return { matches, result: await refine(value, matches, loadIndex) };
    };

    it('puts the Entra lookup first for a GUID it recognises, and says what it recognised', async () => {
      // Microsoft Graph's application id, a Graph permission (User.Read,
      // delegated) and the Global Administrator role template.
      const cases = [
        ['00000003-0000-0000-c000-000000000000', 'Microsoft application ID'],
        ['e1fe6dd8-ba31-4d61-89e7-88639da4683d', 'Microsoft Graph permission ID'],
        ['62e90394-69f5-4237-9190-012177145e10', 'Entra directory role ID'],
      ];
      for (const [guid, why] of cases) {
        const { result } = await refined(guid);
        expect(result.map((m) => m.toolId), guid).toEqual(['entra-ids', 'azure-rbac', 'm365-licenses', 'uuid']);
        expect(result[0].why, guid).toBe(why);
        expect(result[0].href, guid).toBe(`/entra-ids/${guid}`);
      }
    });

    it('recognises a GUID however it was cased', async () => {
      const { result } = await refined('62E90394-69F5-4237-9190-012177145E10');
      expect(result[0].toolId).toBe('entra-ids');
    });

    it('leaves the order alone for a GUID the lookup does not hold', async () => {
      // An Azure RBAC role id: real, and not an Entra identifier.
      const { matches, result } = await refined('b24988ac-6180-42a0-ab88-20f7382dd24c');
      expect(result).toBe(matches);
    });

    it('does not touch a list with no Entra entry, and does not load the index for it', async () => {
      let loads = 0;
      const loadIndex = async () => {
        loads += 1;
        return {};
      };
      const { matches, result } = await refined('example.com', loadIndex);
      expect(result).toBe(matches);
      expect(loads).toBe(0);
    });

    it('keeps the suggestions it had when the index cannot be loaded', async () => {
      const { matches, result } = await refined('00000003-0000-0000-c000-000000000000', async () => {
        throw new Error('offline');
      });
      expect(result).toBe(matches);
      expect(result.map((m) => m.toolId)).toEqual(['azure-rbac', 'm365-licenses', 'uuid', 'entra-ids']);
    });
  });

  it('routes a SKU part number to the licence decoder, encoder behind it', () => {
    expect(ids('SPE_E3')).toEqual(['m365-licenses', 'base64']);
    expect(ids('ENTERPRISEPACK')).toEqual(['m365-licenses', 'base64']);
    expect(first('SPE_E3').href).toBe('/m365-licenses/SPE_E3');
  });

  it('routes a bare licence code to the decoder', () => {
    // The shorthand people actually carry. The decoder resolves a partial by
    // substring, so E3 lands on results rather than an empty state.
    for (const code of ['E3', 'e5', 'F1', 'A5', 'G3', 'P2']) {
      expect(ids(code), code).toEqual(['m365-licenses', 'base64']);
    }
    expect(first('E3').href).toBe('/m365-licenses/E3');

    // The digit is what makes the shape safe to claim. "BP" for Business
    // Premium is real shorthand, but a bare pair of letters is also `go`,
    // `id` and `ok`, so it stays text.
    expect(ids('BP')).toEqual(['base64']);
  });

  it('drops the family prefix from a licence code, because the decoder cannot read it', () => {
    // `/m365-licenses/m365 e3` finds nothing: the search is a literal
    // substring over part numbers, names and GUIDs.
    expect(first('M365 E3').href).toBe('/m365-licenses/E3');
    expect(first('Microsoft 365 E5').href).toBe('/m365-licenses/E5');
    expect(first('o365 e1').href).toBe('/m365-licenses/e1');
    expect(first('EMS E3').href).toBe('/m365-licenses/E3');
  });

  describe('collisions', () => {
    it('a bare word is base64, not a domain — both predicates say yes', () => {
      expect(ids('test')).toEqual(['base64']);
      expect(ids('abcd')).toEqual(['base64']);
    });

    it('a GUID is not a hostname and not base64, even though it is text', () => {
      // Dashed hex reaches the encoder in every other reading of it.
      expect(ids('00000000-0000-0000-0000-000000000000')).toEqual([
        'azure-rbac',
        'm365-licenses',
        'uuid',
        'entra-ids',
      ]);
      // One character short of a GUID is just text again.
      expect(ids('b24988ac-6180-42a0-ab88-20f7382dd24')).toEqual(['base64']);
    });

    it('a lower-case underscored word is text, not a SKU', () => {
      expect(ids('hello_world')).toEqual(['base64']);
    });

    it('a word is not a licence code — the shape is letters then digits', () => {
      expect(ids('test')).toEqual(['base64']);
      expect(ids('IPv4')).toEqual(['base64']);
      expect(ids('hello world')).toEqual(['base64']);
    });

    it('a JWT wins over base64 even though its segments are base64', () => {
      expect(ids(JWT)).toEqual(['jwt']);
    });

    it('an IP wins over hostname even though both are dotted', () => {
      expect(ids('192.168.1.1')).toEqual(['subnet-calculator', 'whois-lookup', 'bgp-explorer', 'azure-service-tags']);
    });

    it('a CIDR wins over a bare IP', () => {
      expect(ids('192.168.1.0/24')).toEqual(['subnet-calculator', 'cidr-workbench', 'bgp-explorer']);
    });
  });

  describe('encoding', () => {
    it('percent-encodes base64 padding and slashes', () => {
      const href = first('a/b+c==').href;
      expect(href).toBe('/base64/a%2Fb%2Bc%3D%3D');
      expect(decodeURIComponent(href.slice('/base64/'.length))).toBe('a/b+c==');
    });

    it('leaves the CIDR slash as a real segment boundary', () => {
      const href = first('10.0.0.0/22').href;
      expect(href.split('/').filter(Boolean)).toEqual(['subnet-calculator', '10.0.0.0', '22']);
    });

    it('encodes the spaces in a cron expression', () => {
      expect(first('0 9 * * 1').href).toBe('/cron/0%209%20*%20*%201');
    });
  });

  it('rejects a paste too long to be a link', () => {
    expect(suggest('x'.repeat(2001))).toEqual([]);
    expect(suggest('x'.repeat(2000))).toHaveLength(1);
  });

  it('always offers something for usable input', () => {
    // Base64 encodes anything, so the panel has no dead-end state to design.
    for (const junk of ['hello world', '!!!', '{"a":1}', '@daily', 'x'.repeat(500)]) {
      expect(suggest(junk).length, junk).toBeGreaterThanOrEqual(1);
    }
  });

  describe('URLs', () => {
    it('reads an IP out of a URL rather than dropping it into base64', () => {
      expect(ids('https://10.0.0.1:8443/')).toEqual(['subnet-calculator', 'whois-lookup', 'bgp-explorer', 'azure-service-tags']);
    });

    it('unwraps a bracketed IPv6 literal', () => {
      expect(ids('https://[2001:db8::1]/')).toEqual(['subnet-calculator', 'whois-lookup', 'bgp-explorer', 'azure-service-tags']);
      expect(first('https://[2001:db8::1]/').href).toBe('/subnet-calculator/2001:db8::1');
    });

    it('falls back to base64 for a scheme with no host', () => {
      expect(ids('https://')).toEqual(['base64']);
    });

    it('offers the URL parser first when the URL has a path or a query, then the headers checker', () => {
      const web = ids('https://example.com');
      expect(web[0]).toBe('http-headers');
      expect(ids('https://example.com/pricing')).toEqual(['url', ...web]);
      expect(ids('http://example.com?ref=1')).toEqual(['url', ...web]);
      expect(ids('HTTPS://example.com/?ref=1')).toEqual(['url', ...web]);
      expect(ids('https://example.com/pricing').slice(0, 3)).toEqual(['url', 'http-headers', 'dns-lookup']);
      expect(ids('https://10.0.0.1:8443/admin')).toEqual([
        'url',
        'subnet-calculator',
        'whois-lookup',
        'bgp-explorer',
        'azure-service-tags',
      ]);
      expect(ids('https://localhost:3000/health')).toEqual(['url', 'base64']);
    });

    it('carries the whole URL in the fragment, which is never sent to the server', () => {
      const pasted = 'https://example.com/cb?code=abc&state=x y#frag';
      const chip = first(pasted);
      expect(chip).toMatchObject({ toolId: 'url', label: 'URL Parser', path: '/url', why: 'URL' });
      expect(chip.href).toBe(`/url#url=${encodeURIComponent(pasted)}`);
      expect(chip.href.split('#')[0]).toBe('/url');
    });

    it('does not offer the URL parser for a bare host, with or without a scheme', () => {
      const domains = ids('example.com');
      const web = ids('https://example.com');
      expect(domains).not.toContain('url');
      expect(web).not.toContain('url');
      expect(domains[0]).toBe('dns-lookup');
      expect(ids('https://example.com/')).toEqual(web);
      expect(ids('https://example.com/#section')).toEqual(web);
      expect(ids('example.com/pricing')).toEqual(domains);
      expect(ids('ftp://example.com/file.txt')).toEqual(domains);
    });
  });

  describe('JWT header', () => {
    it('requires alg, which RFC 7515 makes mandatory', () => {
      // Three base64url segments whose header is {"a":1} — an object, but not
      // a JOSE header.
      const notAToken = `${btoa('{"a":1}')}.${btoa('{"b":2}')}.s1g`.replace(/=/g, '');
      expect(ids(notAToken)).not.toContain('jwt');
    });
  });

  it('offers DNS for an underscore-prefixed record name', () => {
    // _dmarc and _acme-challenge are the names most often pasted at a DNS
    // tool, and DNS Lookup is one of the destinations here.
    expect(ids('_dmarc.example.com')[0]).toBe('dns-lookup');
  });

  it('normalises the whitespace inside a cron expression', () => {
    // The tool's translator splits on a single space where its validator
    // splits on any run of whitespace, so a deep link carrying a double space
    // would validate and then fail to translate.
    expect(first('0   9  * * 1').href).toBe('/cron/0%209%20*%20*%201');
  });

  it('trims before detecting', () => {
    expect(ids('  example.com  ')).toEqual(ids('example.com'));
    expect(first('  10.0.0.0/22  ').href).toBe('/subnet-calculator/10.0.0.0/22');
  });

  /**
   * Every href the dispatcher can produce has to be a route the registry
   * actually serves. Without this, renaming a manifest param — `:query` to
   * `:domain`, say — would leave the panel cheerfully linking at 404s and
   * every assertion above would still pass.
   */
  it('only ever links at routes the registry serves', () => {
    const patterns = allRoutes().map((r) => r.path);
    const inputs = [
      JWT,
      '10.0.0.0/22',
      '10.0.0.1',
      '*/15 * * * *',
      'example.com',
      'hello world',
      'b24988ac-6180-42a0-ab88-20f7382dd24c',
      '1794651210',
      '1794651210123',
    ];

    for (const input of inputs) {
      for (const { href } of suggest(input)) {
        const depth = href.split('/').length;
        const base = `/${href.split('/')[1]}`;
        const served = patterns.filter((p) => p === base || p.startsWith(`${base}/`));
        expect(served, `${href} names no tool`).not.toHaveLength(0);
        expect(
          served.some((p) => p.split('/').length === depth),
          `${href} has no route of its depth: ${served.join(', ')}`
        ).toBe(true);
      }
    }
  });
});

describe('PEM certificates', () => {
  const read = (name) =>
    readFileSync(new URL(`../tools/cert-decoder/fixtures/${name}`, import.meta.url), 'utf8');
  const LEAF = read('leaf.pem');
  const CHAIN = read('chain.pem');
  const REQUEST = read('request.csr.pem');
  const KEY = '-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIFakeFakeFakeFake\n-----END PRIVATE KEY-----';

  it('routes a certificate to the decoder, carried in the fragment', () => {
    expect(ids(LEAF)).toEqual(['cert-decoder']);
    expect(first(LEAF).href).toMatch(/^\/cert-decoder#pem=c\.[A-Za-z0-9_-]+$/);
    expect(first(LEAF).why).toBe('PEM certificate');
    expect(allRoutes().map((r) => r.path)).toContain(first(LEAF).path);
  });

  it('round-trips what it was given', () => {
    const fragment = first(CHAIN).href.split('#pem=')[1];
    expect(splitPem(fromFragment(fragment))).toEqual(splitPem(CHAIN));
  });

  it('takes a whole chain although it is far past the length limit', () => {
    expect(CHAIN.length).toBeGreaterThan(2000);
    expect(ids(CHAIN)).toEqual(['cert-decoder']);
    expect(first(CHAIN).href.split('~')).toHaveLength(3);
  });

  it('still reads one after a single-line field has flattened it', () => {
    expect(first(CHAIN.replace(/\n/g, ' ')).href).toBe(first(CHAIN).href);
    expect(first(CHAIN.replace(/\n/g, '')).href).toBe(first(CHAIN).href);
  });

  it('routes a signing request and says so', () => {
    expect(ids(REQUEST)).toEqual(['cert-decoder']);
    expect(first(REQUEST).href).toMatch(/^\/cert-decoder#pem=r\./);
    expect(first(REQUEST).why).toBe('certificate signing request');
  });

  it('never puts a private key in a link', () => {
    expect(suggest(KEY)).not.toContainEqual(expect.objectContaining({ toolId: 'cert-decoder' }));
    const href = first(`${KEY}\n${LEAF}`).href;
    expect(href).toBe(first(LEAF).href);
    expect(href).not.toContain('MC4CAQAw');
  });

  it('leaves bare base64 with the encoder', () => {
    expect(ids(splitPem(LEAF)[0].base64.slice(0, 400))).toEqual(['base64']);
  });
});
