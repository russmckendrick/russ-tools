// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import pako from 'pako';
import { MAX_INPUT_LENGTH, SamlDecodeError, decodeSaml, encodePost, encodeRedirect } from './decode.js';
import { algorithm, claimLabel, nameIdFormat } from './labels.js';
import { parseSaml, toPlain, validityOf } from './parse.js';
import { prettyLines, prettyText } from './pretty.js';
import { sampleResponse, sampleXml } from './sample.js';
import { UNVERIFIED, readSaml, readSamlPlain } from './saml.js';

const NOW = Date.parse('2026-11-14T12:00:00Z');
const XML = sampleXml({ now: NOW });
const codes = (result) => result.findings.map((finding) => finding.code);
const parse = (xml, now = NOW) => parseSaml(xml, { now });

const AUTHN_REQUEST =
  '<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ' +
  'ID="_req1" Version="2.0" IssueInstant="2026-11-14T11:59:00Z" Destination="https://idp.example.com/sso" ' +
  'AssertionConsumerServiceURL="https://app.example.com/saml/acs" ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" ForceAuthn="true">' +
  '<saml:Issuer>https://app.example.com/saml/metadata</saml:Issuer>' +
  '<samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" AllowCreate="true"/>' +
  '<samlp:RequestedAuthnContext Comparison="exact"><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef></samlp:RequestedAuthnContext>' +
  '</samlp:AuthnRequest>';

const MESSAGE_SIGNATURE = (id, method = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256') =>
  `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo>` +
  `<CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>` +
  `<SignatureMethod Algorithm="${method}"/>` +
  `<Reference URI="#${id}"><DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><DigestValue>AAAA</DigestValue></Reference>` +
  `</SignedInfo><SignatureValue>AAAA</SignatureValue></Signature>`;

const withoutAssertionSignature = (xml) => xml.replace(/<Signature[\s\S]*?<\/Signature>/, '');
const withMessageSignature = (xml, id = '_response-0000-sample') =>
  xml.replace('<samlp:Status>', `${MESSAGE_SIGNATURE(id)}<samlp:Status>`);

describe('decodeSaml reads the encodings a browser trace shows', () => {
  it('passes raw XML through', () => {
    expect(decodeSaml(`  ${XML}\n`)).toEqual({ xml: XML, steps: ['XML'], binding: null });
  });

  it('reads base64 (the POST binding)', () => {
    expect(decodeSaml(encodePost(XML))).toEqual({ xml: XML, steps: ['Base64', 'XML'], binding: null });
  });

  it('reads base64 over raw DEFLATE (the redirect binding)', () => {
    expect(decodeSaml(encodeRedirect(AUTHN_REQUEST))).toEqual({
      xml: AUTHN_REQUEST,
      steps: ['Base64', 'DEFLATE', 'XML'],
      binding: null,
    });
  });

  it('reads URL-encoded base64', () => {
    const decoded = decodeSaml(encodeURIComponent(encodeRedirect(AUTHN_REQUEST)));
    expect(decoded.xml).toBe(AUTHN_REQUEST);
    expect(decoded.steps).toEqual(['URL-encoded', 'Base64', 'DEFLATE', 'XML']);
  });

  it('reads a whole redirect URL and reports how it was signed', () => {
    const url =
      `https://idp.example.com/sso?SAMLRequest=${encodeURIComponent(encodeRedirect(AUTHN_REQUEST))}` +
      `&RelayState=${encodeURIComponent('/dashboard?tab=1')}` +
      `&SigAlg=${encodeURIComponent('http://www.w3.org/2001/04/xmldsig-more#rsa-sha256')}&Signature=AbCd%2B%2F%3D`;

    const decoded = decodeSaml(url);

    expect(decoded.xml).toBe(AUTHN_REQUEST);
    expect(decoded.steps).toEqual(['SAMLRequest parameter', 'URL-encoded', 'Base64', 'DEFLATE', 'XML']);
    expect(decoded.binding).toEqual({
      parameter: 'SAMLRequest',
      value: expect.any(String),
      relayState: '/dashboard?tab=1',
      sigAlg: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
      signed: true,
    });
  });

  it('reads a POST form body', () => {
    const decoded = decodeSaml(`RelayState=abc&SAMLResponse=${encodeURIComponent(encodePost(XML))}`);
    expect(decoded.xml).toBe(XML);
    expect(decoded.binding).toMatchObject({ parameter: 'SAMLResponse', relayState: 'abc', signed: false });
  });

  it('reads the "name: value" form a devtools payload view copies', () => {
    const decoded = decodeSaml(`SAMLResponse: ${encodePost(XML)}\nRelayState: xyz`);
    expect(decoded.xml).toBe(XML);
    expect(decoded.binding.relayState).toBe('xyz');
  });

  it('restores a + that a form decoder turned into a space', () => {
    const base64 = encodePost(XML);
    expect(base64.endsWith('+')).toBe(true);
    expect(decodeSaml(`SAMLResponse=${base64}`).xml).toBe(XML);
    expect(decodeSaml(`SAMLResponse=${base64.replace(/\+/g, ' ')}&RelayState=x`).xml).toBe(XML);

    const padded = encodePost(`${XML} `);
    expect(padded.endsWith('=')).toBe(true);
    expect(decodeSaml(padded.replace(/\+/g, ' ')).xml).toBe(`${XML} `);
  });

  it('reads base64url, unpadded and line-wrapped base64', () => {
    const base64 = encodePost(XML);
    const urlSafe = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(decodeSaml(urlSafe).xml).toBe(XML);
    expect(decodeSaml(base64.match(/.{1,64}/g).join('\r\n')).xml).toBe(XML);
  });

  it('accepts zlib-wrapped DEFLATE, which some libraries send', () => {
    const bytes = pako.deflate(new TextEncoder().encode(AUTHN_REQUEST));
    const base64 = btoa(String.fromCharCode(...bytes));
    expect(decodeSaml(base64).xml).toBe(AUTHN_REQUEST);
  });

  it('keeps non-ASCII text intact', () => {
    const xml = '<Assertion xmlns="urn:oasis:names:tc:SAML:2.0:assertion"><Issuer>Zoë Müller 日本</Issuer></Assertion>';
    expect(decodeSaml(encodePost(xml)).xml).toBe(xml);
    expect(decodeSaml(encodeRedirect(xml)).xml).toBe(xml);
  });

  it('returns nothing for nothing', () => {
    expect(decodeSaml('')).toBe(null);
    expect(decodeSaml('   \n')).toBe(null);
    expect(decodeSaml(null)).toBe(null);
  });

  it.each([
    ['plain words', 'hello there, this is not SAML', /neither XML nor base64/],
    ['words that happen to be base64 characters', 'hello this is not saml', /neither XML nor base64/],
    ['base64 of something else', btoa('just some text, not xml at all'), /not to XML/],
    ['damaged URL encoding', 'PHNhbWw%3D%', /URL encoding is damaged/],
    ['an over-long paste', 'A'.repeat(MAX_INPUT_LENGTH + 1), /too long/],
  ])('refuses %s', (_label, input, message) => {
    expect(() => decodeSaml(input)).toThrow(SamlDecodeError);
    expect(() => decodeSaml(input)).toThrow(message);
  });

  it('stops inflating a compression bomb at 4 MB', () => {
    const bomb = pako.deflateRaw(new Uint8Array(40_000_000));
    expect(bomb.length).toBeLessThan(100_000);
    let binary = '';
    for (const byte of bomb) binary += String.fromCharCode(byte);

    expect(() => decodeSaml(btoa(binary))).toThrow(/more than 4 MB/);
  });
});

describe('parseSaml on the synthetic response', () => {
  const result = parse(XML);
  const [assertion] = result.assertions;

  it('summarises the message', () => {
    expect(result).toMatchObject({
      kind: 'Response',
      id: '_response-0000-sample',
      version: '2.0',
      issueInstant: '2026-11-14T11:59:30.000Z',
      destination: 'https://app.example.com/saml/acs',
      inResponseTo: '_request-0000-sample',
      issuer: 'https://sts.windows.net/00000000-0000-0000-0000-000000000000/',
      status: { code: { label: 'Success' }, success: true, subCode: null, message: null },
      encryptedAssertions: 0,
      signature: null,
      signed: 'assertion',
    });
  });

  it('reads the subject, conditions and authentication statement', () => {
    expect(assertion).toMatchObject({
      id: '_assertion-0000-sample',
      issuer: 'https://sts.windows.net/00000000-0000-0000-0000-000000000000/',
      nameId: {
        value: 'sam.sample@example.com',
        encrypted: false,
        format: { uri: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress', label: 'Email address' },
      },
      confirmations: [
        {
          method: { label: 'Bearer' },
          recipient: 'https://app.example.com/saml/acs',
          inResponseTo: '_request-0000-sample',
          notOnOrAfter: '2026-11-14T12:55:00.000Z',
        },
      ],
      notBefore: '2026-11-14T11:55:00.000Z',
      notOnOrAfter: '2026-11-14T12:55:00.000Z',
      audiences: ['https://app.example.com/saml/metadata'],
      authnStatements: [
        {
          authnInstant: '2026-11-14T11:59:30.000Z',
          sessionIndex: '_assertion-0000-sample',
          contextClass: { uri: 'urn:oasis:names:tc:SAML:2.0:ac:classes:Password', label: 'Password' },
        },
      ],
    });
    expect(validityOf(assertion)).toEqual({ start: '2026-11-14T11:55:00.000Z', end: '2026-11-14T12:55:00.000Z' });
  });

  it('lists every attribute and value, with Entra claim URIs labelled', () => {
    expect(assertion.attributes).toHaveLength(11);
    expect(assertion.attributes.map((attribute) => attribute.label)).toEqual([
      'Tenant ID',
      'Object ID',
      'Display name',
      'Identity provider',
      'Authentication methods',
      'Given name',
      'Surname',
      'Email address',
      'Name (user principal name)',
      'Groups',
      'Roles',
    ]);
    expect(assertion.attributes.find((attribute) => attribute.label === 'Groups').values).toEqual([
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
    ]);
  });

  it('reports the signature and digest algorithms and what the signature covers', () => {
    expect(assertion.signature).toEqual({
      signatureAlgorithm: {
        uri: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
        label: 'RSA with SHA-256',
        weak: false,
      },
      canonicalization: { uri: 'http://www.w3.org/2001/10/xml-exc-c14n#', label: 'Exclusive canonical XML', weak: false },
      digestAlgorithms: [{ uri: 'http://www.w3.org/2001/04/xmlenc#sha256', label: 'SHA-256', weak: false }],
      references: ['#_assertion-0000-sample'],
      coversOwner: true,
      certificates: [expect.any(String)],
    });
  });

  it('has nothing to flag while it is inside its validity window', () => {
    expect(result.findings).toEqual([]);
  });

  it('uses no real tenant, user or key material', () => {
    expect(XML).toContain('00000000-0000-0000-0000-000000000000');
    expect(XML).toContain('@example.com');
    expect(atob(assertion.signature.certificates[0])).toBe('synthetic sample, not a real certificate');
  });
});

describe('findings', () => {
  it('flags an expired assertion', () => {
    const result = parse(XML, NOW + 2 * 3_600_000);
    expect(codes(result)).toEqual(['expired']);
    expect(result.findings[0]).toMatchObject({ severity: 'error', title: 'The assertion expired 1 hour ago' });
  });

  it('treats NotOnOrAfter itself as expired', () => {
    expect(codes(parse(XML, Date.parse('2026-11-14T12:55:00Z')))).toEqual(['expired']);
  });

  it('flags an assertion that is not valid yet', () => {
    const result = parse(XML, NOW - 3_600_000);
    expect(codes(result)).toEqual(['not-yet-valid']);
    expect(result.findings[0]).toMatchObject({ severity: 'warning', title: 'The assertion is not valid for another 55 minutes' });
  });

  it('falls back to the bearer confirmation when Conditions has no end, and flags no end at all', () => {
    const noConditionsEnd = XML.replace(/(<Conditions NotBefore="[^"]+") NotOnOrAfter="[^"]+"/, '$1');
    expect(codes(parse(noConditionsEnd, NOW + 2 * 3_600_000))).toEqual(['expired']);

    const noEnd = noConditionsEnd.replace(/ NotOnOrAfter="[^"]+"/, '');
    expect(codes(parse(noEnd))).toEqual(['no-expiry']);
  });

  it('flags a missing audience restriction', () => {
    const result = parse(XML.replace(/<AudienceRestriction>[\s\S]*?<\/AudienceRestriction>/, ''));
    expect(codes(result)).toEqual(['no-audience']);
    expect(result.findings[0].severity).toBe('warning');
  });

  it('flags SHA-1 in the signature and the digest', () => {
    const result = parse(
      XML.replace('http://www.w3.org/2001/04/xmldsig-more#rsa-sha256', 'http://www.w3.org/2000/09/xmldsig#rsa-sha1').replace(
        'http://www.w3.org/2001/04/xmlenc#sha256',
        'http://www.w3.org/2000/09/xmldsig#sha1'
      )
    );

    expect(codes(result)).toEqual(['weak-algorithm']);
    expect(result.findings[0].title).toBe('The assertion signature uses RSA with SHA-1 and SHA-1');
    expect(result.assertions[0].signature.signatureAlgorithm.weak).toBe(true);
  });

  it('flags a message where nothing is signed', () => {
    const result = parse(withoutAssertionSignature(XML));
    expect(result.signed).toBe('neither');
    expect(result.findings).toEqual([expect.objectContaining({ code: 'unsigned', severity: 'error' })]);
  });

  it('flags an unsigned assertion inside a signed response', () => {
    const result = parse(withMessageSignature(withoutAssertionSignature(XML)));
    expect(result.signed).toBe('message');
    expect(result.signature.coversOwner).toBe(true);
    expect(result.findings).toEqual([expect.objectContaining({ code: 'unsigned-assertion', severity: 'warning' })]);
  });

  it('recognises both signed', () => {
    const result = parse(withMessageSignature(XML));
    expect(result.signed).toBe('both');
    expect(result.findings).toEqual([]);
  });

  it('flags a signature that references some other element', () => {
    const result = parse(withMessageSignature(XML, '_something-else'));
    expect(codes(result)).toEqual(['signature-reference']);
    expect(result.findings[0].detail).toContain('"#_something-else"');
  });

  it('does not mistake the assertion signature for a response signature', () => {
    expect(parse(XML).signature).toBe(null);
  });

  it('reports a failed response', () => {
    const failed =
      '<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="_r" Version="2.0" IssueInstant="2026-11-14T12:00:00Z">' +
      '<samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Requester">' +
      '<samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:InvalidNameIDPolicy"/></samlp:StatusCode>' +
      '<samlp:StatusMessage>AADSTS-style message</samlp:StatusMessage></samlp:Status></samlp:Response>';
    const result = parse(failed);

    expect(result.status).toMatchObject({ success: false, code: { label: 'Requester error' }, subCode: { label: 'Invalid NameID policy' } });
    expect(result.findings).toEqual([
      {
        code: 'status',
        severity: 'error',
        title: 'The identity provider answered Requester error',
        detail: 'Invalid NameID policy. AADSTS-style message',
      },
    ]);
    expect(result.signed).toBe('neither');
  });

  it('notes an encrypted assertion and claims nothing about it', () => {
    const encrypted =
      '<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="_r" Version="2.0">' +
      '<samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status>' +
      '<EncryptedAssertion xmlns="urn:oasis:names:tc:SAML:2.0:assertion"><EncryptedData xmlns="http://www.w3.org/2001/04/xmlenc#"/></EncryptedAssertion>' +
      '</samlp:Response>';
    const result = parse(encrypted);

    expect(result.assertions).toEqual([]);
    expect(result.encryptedAssertions).toBe(1);
    expect(result.findings).toEqual([expect.objectContaining({ code: 'encrypted', severity: 'info' })]);
  });
});

describe('other message kinds', () => {
  it('reads an authentication request', () => {
    const result = parse(AUTHN_REQUEST);

    expect(result).toMatchObject({
      kind: 'Authentication request',
      issuer: 'https://app.example.com/saml/metadata',
      destination: 'https://idp.example.com/sso',
      assertions: [],
      signed: 'neither',
      findings: [],
      request: {
        assertionConsumerServiceUrl: 'https://app.example.com/saml/acs',
        protocolBinding: { label: 'HTTP POST' },
        forceAuthn: true,
        isPassive: null,
        nameIdPolicy: { format: { label: 'Email address' }, allowCreate: true },
        requestedContexts: [{ label: 'Password over a protected transport' }],
        comparison: 'exact',
      },
    });
  });

  it('reads a bare assertion', () => {
    const bare = /<Assertion[\s\S]*<\/Assertion>/.exec(XML)[0];
    const result = parse(bare);

    expect(result.kind).toBe('Assertion');
    expect(result.assertions).toHaveLength(1);
    expect(result.signed).toBe('assertion');
    expect(result.findings).toEqual([]);
  });

  it('shows but does not summarise XML that is not SAML 2.0', () => {
    const result = parse('<note><to>someone</to></note>');
    expect(result.kind).toBe(null);
    expect(codes(result)).toEqual(['unknown-root']);
  });
});

describe('hostile input', () => {
  it('refuses a DOCTYPE, so no entity is ever expanded', () => {
    const xxe =
      '<?xml version="1.0"?><!DOCTYPE r [<!ENTITY xxe SYSTEM "file:///etc/passwd"><!ENTITY lol "lol">]>' +
      '<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"><x>&xxe;&lol;</x></samlp:Response>';

    const read = readSaml(xxe);

    expect(read.error).toMatch(/DOCTYPE/);
    expect(read.result).toBeUndefined();
    expect(readSaml(encodePost(xxe)).error).toMatch(/DOCTYPE/);
  });

  it('reports XML that is not well-formed', () => {
    expect(readSaml('<samlp:Response><unclosed></samlp:Response>').error).toMatch(/not well-formed/);
  });

  it('renders markup in a value as text, never as markup', () => {
    const hostile = XML.replace('Sam Sample', '&lt;img src=x onerror=alert(1)&gt;');
    const read = readSaml(hostile, { now: NOW });

    expect(read.result.assertions[0].attributes[2].values).toEqual(['<img src=x onerror=alert(1)>']);
    expect(read.xml).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(read.xml).not.toContain('<img');
  });
});

describe('readSaml', () => {
  it('decodes, parses and pretty-prints in one step', () => {
    const read = readSaml(sampleResponse({ now: NOW }), { now: NOW });

    expect(read.steps).toEqual(['Base64', 'XML']);
    expect(read.result.kind).toBe('Response');
    expect(read.xml.split('\n')[0]).toMatch(/^<samlp:Response ID="_response-0000-sample"/);
    expect(read.error).toBeUndefined();
  });

  it('returns null for empty input and a message for unreadable input', () => {
    expect(readSaml('')).toBe(null);
    expect(readSaml('nope nope')).toEqual({ error: expect.stringMatching(/neither XML nor base64/) });
  });

  it('flags a SHA-1 redirect-binding signature from the query string', () => {
    const url =
      `https://idp.example.com/sso?SAMLRequest=${encodeURIComponent(encodeRedirect(AUTHN_REQUEST))}` +
      `&SigAlg=${encodeURIComponent('http://www.w3.org/2000/09/xmldsig#rsa-sha1')}&Signature=AAAA`;

    expect(codes(readSaml(url, { now: NOW }).result)).toEqual(['redirect-signature', 'weak-algorithm']);
  });

  it('gives agents a JSON-safe summary that says signatures are not verified', () => {
    const plain = readSamlPlain(sampleResponse({ now: NOW }), { now: NOW });

    expect(JSON.parse(JSON.stringify(plain))).toEqual(plain);
    expect(plain.document).toBeUndefined();
    expect(plain.signatureNote).toBe(UNVERIFIED);
    expect(plain.signatureNote).toMatch(/not verified/);
    expect(plain.encoding).toEqual(['Base64', 'XML']);
    expect(plain.assertions[0].nameId.value).toBe('sam.sample@example.com');
    expect(readSamlPlain('')).toEqual({ error: 'Nothing to decode' });
    expect(toPlain(parse(XML)).document).toBeUndefined();
  });
});

describe('pretty printing', () => {
  const lines = prettyLines(parse(XML).document);
  const text = prettyText(lines);

  it('indents by depth and keeps a text-only element on one line', () => {
    const rows = text.split('\n');
    expect(rows[0].startsWith('<samlp:Response ')).toBe(true);
    expect(rows[1]).toBe(
      '  <Issuer xmlns="urn:oasis:names:tc:SAML:2.0:assertion">https://sts.windows.net/00000000-0000-0000-0000-000000000000/</Issuer>'
    );
    expect(rows).toContain('    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>');
    expect(rows.at(-1)).toBe('</samlp:Response>');
    expect(lines.find((line) => line.tokens.some((part) => part.text === 'AttributeValue')).indent).toBe(8);
  });

  it('round-trips: the pretty text parses back to the same summary', () => {
    expect(toPlain(parse(text))).toEqual(toPlain(parse(XML)));
  });

  it('tags every piece so it can be coloured without innerHTML', () => {
    const types = new Set(lines.flatMap((line) => line.tokens.map((part) => part.type)));
    expect([...types].sort()).toEqual(['attr', 'punct', 'space', 'tag', 'text', 'value']);
  });

  it('escapes attribute values and keeps comments', () => {
    const document = parse('<a xmlns="urn:x" title="1 &lt; 2 &amp; &quot;q&quot;"><!-- note --><b/>tail</a>').document;
    expect(prettyText(prettyLines(document))).toBe(
      ['<a xmlns="urn:x" title="1 &lt; 2 &amp; &quot;q&quot;">', '  <!-- note -->', '  <b/>', '  tail', '</a>'].join('\n')
    );
  });
});

describe('labels', () => {
  it('names Entra claim URIs and leaves unknown ones alone', () => {
    expect(claimLabel('http://schemas.microsoft.com/identity/claims/tenantid')).toBe('Tenant ID');
    expect(claimLabel('http://schemas.microsoft.com/ws/2008/06/identity/claims/groups')).toBe('Groups');
    expect(claimLabel('urn:oid:0.9.2342.19200300.100.1.3')).toBe('Email (mail)');
    expect(claimLabel('department')).toBe(null);
  });

  it.each([
    ['http://www.w3.org/2000/09/xmldsig#rsa-sha1', true],
    ['http://www.w3.org/2000/09/xmldsig#sha1', true],
    ['http://www.w3.org/2001/04/xmldsig-more#rsa-md5', true],
    ['http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha1', true],
    ['http://www.w3.org/2001/04/xmldsig-more#rsa-sha256', false],
    ['http://www.w3.org/2001/04/xmlenc#sha512', false],
    ['http://www.w3.org/2001/10/xml-exc-c14n#', false],
    ['urn:example:unknown#sha1', true],
  ])('%s weak: %s', (uri, weak) => {
    expect(algorithm(uri).weak).toBe(weak);
  });

  it('keeps an unknown URI as it is', () => {
    expect(nameIdFormat('urn:example:custom')).toEqual({ uri: 'urn:example:custom', label: null });
    expect(nameIdFormat(null)).toBe(null);
  });
});
