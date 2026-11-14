import { describe, expect, it } from 'vitest';
import { splitPem, toBytes } from './pem.js';
import { CHAIN, INTERMEDIATE, LEAF, REQUEST, ROOT, UNRELATED_ROOT } from './test-fixtures.js';
import { decodeCertificate, decodeRequest, decodeText, fingerprints, hex } from './x509.js';

const certificate = (pem) => decodeCertificate(toBytes(splitPem(pem)[0].base64));

describe('decodeCertificate, against what openssl x509 -text prints', () => {
  const leaf = certificate(LEAF);

  it('reads subject and issuer in encoded order', () => {
    expect(leaf.subject.dn).toBe('C=GB, L=Nottingham, O=Example Ltd, CN=www.example.com');
    expect(leaf.subject.commonName).toBe('www.example.com');
    expect(leaf.issuer.dn).toBe('C=GB, O=Example Trust Services, CN=Example Issuing CA E1');
    expect(leaf.subject.attributes[1]).toEqual({ oid: '2.5.4.7', name: 'L', value: 'Nottingham' });
    expect(leaf.selfIssued).toBe(false);
  });

  it('reads version, serial and validity', () => {
    expect(leaf.version).toBe(3);
    expect(leaf.serial.replace(/:/g, '')).toBe('04D2F1A09B3C7E5522186FA0C4E9D713');
    expect(leaf.notBefore).toBe('2026-11-14T10:16:57.000Z');
    expect(leaf.notAfter).toBe('2036-11-11T10:16:57.000Z');
  });

  it('reads the key and signature algorithms', () => {
    expect(leaf.key).toEqual({
      oid: '1.2.840.10045.2.1',
      algorithm: 'ECDSA',
      size: 256,
      curve: 'P-256',
      label: 'ECDSA P-256',
    });
    expect(leaf.signatureAlgorithm).toEqual({
      oid: '1.2.840.10045.4.3.3',
      name: 'ECDSA with SHA-384',
      weak: false,
    });
  });

  it('reads every subject alternative name form', () => {
    expect(leaf.sans).toEqual([
      { type: 'DNS', value: 'www.example.com' },
      { type: 'DNS', value: 'example.com' },
      { type: 'DNS', value: '*.api.example.com' },
      { type: 'IP', value: '192.0.2.10' },
      { type: 'IP', value: '2001:db8::10' },
      { type: 'Email', value: 'hostmaster@example.com' },
      { type: 'URI', value: 'https://example.com/id' },
    ]);
  });

  it('reads usages and constraints', () => {
    expect(leaf.keyUsage).toEqual({ critical: true, usages: ['Digital signature'] });
    expect(leaf.extendedKeyUsage.map((usage) => usage.name)).toEqual([
      'TLS server authentication',
      'TLS client authentication',
    ]);
    expect(leaf.basicConstraints).toEqual({ critical: true, ca: false, pathLength: null });
    expect(leaf.isCa).toBe(false);
  });

  it('reads revocation and issuer URLs', () => {
    expect(leaf.ocsp).toEqual(['http://ocsp.example.com']);
    expect(leaf.caIssuers).toEqual(['http://pki.example.com/issuing-e1.crt']);
    expect(leaf.crl).toEqual(['http://crl.example.com/issuing-e1.crl']);
  });

  it('reads the key identifiers that tie it to its issuer', () => {
    expect(leaf.subjectKeyId).toBe('DA:DA:44:DF:27:83:D9:2E:7D:DC:BB:E9:EC:E5:41:FE:91:84:22:0F');
    expect(leaf.authorityKeyId).toBe('8A:1E:E0:40:D8:97:11:E0:34:1A:CF:A6:01:22:DC:EB:D2:27:EE:50');
    expect(certificate(INTERMEDIATE).subjectKeyId).toBe(leaf.authorityKeyId);
  });

  it('lists every extension with its criticality', () => {
    expect(leaf.extensions.map((extension) => [extension.name, extension.critical])).toEqual([
      ['Basic constraints', true],
      ['Key usage', true],
      ['Extended key usage', false],
      ['Subject key identifier', false],
      ['Authority key identifier', false],
      ['Subject alternative name', false],
      ['Authority information access', false],
      ['CRL distribution points', false],
    ]);
    expect(leaf.extensions.every((extension) => extension.decoded && !extension.malformed)).toBe(true);
  });

  it('reads a CA with a path length and a P-384 key', () => {
    const intermediate = certificate(INTERMEDIATE);
    expect(intermediate.isCa).toBe(true);
    expect(intermediate.basicConstraints).toEqual({ critical: true, ca: true, pathLength: 0 });
    expect(intermediate.keyUsage.usages).toEqual(['Digital signature', 'Certificate signing', 'CRL signing']);
    expect(intermediate.key.label).toBe('ECDSA P-384');
    expect(intermediate.key.size).toBe(384);
    expect(intermediate.signatureAlgorithm.name).toBe('RSA with SHA-256');
    expect(intermediate.serial.replace(/:/g, '')).toBe('1000A1B2C3D4E5F60718293A4B5C6D7E');
  });

  it('reads a self-signed RSA root', () => {
    const root = certificate(ROOT);
    expect(root.selfIssued).toBe(true);
    expect(root.subject.dn).toBe('C=GB, O=Example Trust Services, CN=Example Root CA R1');
    expect(root.key).toMatchObject({ algorithm: 'RSA', size: 2048, label: 'RSA 2048' });
    expect(root.serial.replace(/:/g, '')).toBe('4F7CBA212C100D89F059C09D4EBD2726A5A5AE55');
    expect(root.subjectKeyId).toBe('DD:96:09:BA:A7:C4:A2:8F:AE:EB:C9:43:D8:B6:D2:69:0F:93:28:51');
    expect(root.sans).toEqual([]);
    expect(root.ocsp).toEqual([]);
  });

  it('reads an Ed25519 certificate', () => {
    const other = certificate(UNRELATED_ROOT);
    expect(other.key).toMatchObject({ algorithm: 'Ed25519', size: 256, label: 'Ed25519' });
    expect(other.signatureAlgorithm.name).toBe('Ed25519');
    expect(other.subject.dn).toBe('O=Somebody Else, CN=Unrelated Root X9');
  });

  it('refuses a request handed in as a certificate', () => {
    expect(() => certificate(REQUEST)).toThrow();
  });
});

describe('decodeRequest', () => {
  const request = decodeRequest(toBytes(splitPem(REQUEST)[0].base64));

  it('reads the subject, including an email attribute', () => {
    expect(request.kind).toBe('csr');
    expect(request.subject.dn).toBe(
      'C=GB, ST=England, O=Example Ltd, OU=Platform, CN=app.example.com, emailAddress=ops@example.com'
    );
    expect(request.subject.commonName).toBe('app.example.com');
  });

  it('reads the key and signature algorithms', () => {
    expect(request.key).toMatchObject({ algorithm: 'RSA', size: 2048, label: 'RSA 2048' });
    expect(request.signatureAlgorithm.name).toBe('RSA with SHA-256');
  });

  it('reads the requested extensions', () => {
    expect(request.sans).toEqual([
      { type: 'DNS', value: 'app.example.com' },
      { type: 'DNS', value: 'app.internal.example' },
      { type: 'IP', value: '10.20.30.40' },
    ]);
    expect(request.keyUsage).toEqual({ critical: true, usages: ['Digital signature', 'Key encipherment'] });
    expect(request.extendedKeyUsage.map((usage) => usage.name)).toEqual(['TLS server authentication']);
  });
});

describe('fingerprints', () => {
  it('matches openssl x509 -fingerprint', async () => {
    expect(await fingerprints(toBytes(splitPem(LEAF)[0].base64))).toEqual({
      sha1: '18:20:1B:A7:13:4D:6B:85:8F:F1:D9:71:ED:82:76:6C:DC:9B:DC:77',
      sha256:
        '7E:F9:32:57:9D:CE:DB:95:E7:8E:A4:EC:96:D0:F4:D4:45:1F:8F:42:F4:08:C1:FA:D6:D7:D8:CB:DC:DE:40:06',
    });
  });

  it('formats bytes from a buffer or a view', () => {
    expect(hex(new Uint8Array([0, 171, 255]))).toBe('00:AB:FF');
    expect(hex(new Uint8Array([0, 171, 255]).buffer, '')).toBe('00ABFF');
  });
});

describe('decodeText', () => {
  it('splits a mixed paste into certificates and requests', () => {
    const result = decodeText(`${CHAIN}\n${REQUEST}`);
    expect(result.certificates.map((item) => item.subject.commonName)).toEqual([
      'www.example.com',
      'Example Issuing CA E1',
      'Example Root CA R1',
    ]);
    expect(result.requests).toHaveLength(1);
    expect(result.problems).toEqual([]);
    expect(result.certificates[1].position).toBe(2);
  });

  it('decodes bare base64 as whichever it is', () => {
    expect(decodeText(splitPem(LEAF)[0].base64).certificates).toHaveLength(1);
    expect(decodeText(splitPem(REQUEST)[0].base64).requests).toHaveLength(1);
  });

  it('reports text with no PEM in it', () => {
    const result = decodeText('example.com');
    expect(result.problems.map((problem) => problem.code)).toEqual(['no-pem']);
    expect(decodeText('   ').problems).toEqual([]);
  });

  it('ignores a private key and says so', () => {
    const key = '-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIFakeFakeFakeFakeFake\n-----END EC PRIVATE KEY-----';
    const result = decodeText(`${key}\n${LEAF}`);
    expect(result.certificates).toHaveLength(1);
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0]).toMatchObject({ code: 'private-key', severity: 'warning' });
    expect(JSON.stringify(result.problems)).not.toContain('MHcCAQEE');
  });

  it('shows a repeated certificate once', () => {
    const result = decodeText(`${LEAF}\n${LEAF}`);
    expect(result.certificates).toHaveLength(1);
    expect(result.problems.map((problem) => problem.code)).toEqual(['duplicate']);
  });

  it('reports a truncated block without losing the good ones', () => {
    const { base64 } = splitPem(INTERMEDIATE)[0];
    const truncated = `-----BEGIN CERTIFICATE-----\n${base64.slice(0, 400)}\n-----END CERTIFICATE-----`;
    const result = decodeText(`${LEAF}\n${truncated}`);
    expect(result.certificates).toHaveLength(1);
    expect(result.problems[0]).toMatchObject({ code: 'malformed', severity: 'error' });
    expect(result.problems[0].title).toBe('Block 2 is not a readable certificate');
  });

  it('reports a mislabelled block and bad base64', () => {
    const mislabelled = REQUEST.replaceAll('CERTIFICATE REQUEST', 'CERTIFICATE');
    expect(decodeText(mislabelled).problems[0].code).toBe('malformed');
    const broken = '-----BEGIN CERTIFICATE-----\nMII*broken*\n-----END CERTIFICATE-----';
    expect(decodeText(broken).problems[0].detail).toContain('not valid base64');
  });

  it('skips other PEM types', () => {
    const result = decodeText('-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA\n-----END PUBLIC KEY-----');
    expect(result.problems[0]).toMatchObject({ code: 'unsupported', severity: 'info' });
  });
});
