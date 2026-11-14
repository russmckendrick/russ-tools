import { describe, expect, it } from 'vitest';
import { inspectChain, orderChain, validityOf } from './chain.js';
import { decodeAll, toPlain } from './decode.js';
import { CHAIN, DAY, INTERMEDIATE, ISSUED, LEAF, REQUEST, ROOT, UNRELATED_ROOT } from './test-fixtures.js';
import { decodeText } from './x509.js';

const NOW = ISSUED + 30 * DAY * 12;
const certificates = (...pems) => decodeText(pems.join('\n')).certificates;
const names = (path) => path.map((item) => item.subject.commonName);
const codes = (report) => report.findings.map((finding) => finding.code);

describe('validityOf', () => {
  const [leaf] = certificates(LEAF);
  const end = Date.parse(leaf.notAfter);

  it('is valid with more than 30 days to go', () => {
    expect(validityOf(leaf, end - 31 * DAY)).toEqual({ state: 'valid', days: 31, text: '31 days left' });
  });

  it('is expiring from 30 days out to the last second', () => {
    expect(validityOf(leaf, end - 30 * DAY).state).toBe('expiring');
    expect(validityOf(leaf, end - DAY).text).toBe('1 day left');
    expect(validityOf(leaf, end - 1000)).toMatchObject({ state: 'expiring', days: 0 });
  });

  it('is expired after the end', () => {
    expect(validityOf(leaf, end + 1000)).toMatchObject({ state: 'expired', text: 'expired today' });
    expect(validityOf(leaf, end + 3 * DAY + 1000).text).toBe('expired 3 days ago');
  });

  it('is not yet valid before the start', () => {
    expect(validityOf(leaf, ISSUED - 2 * DAY)).toEqual({
      state: 'not-yet-valid',
      days: 2,
      text: 'valid in 2 days',
    });
  });
});

describe('orderChain', () => {
  it('puts the leaf first and the root last whatever order they arrive in', () => {
    const expected = ['www.example.com', 'Example Issuing CA E1', 'Example Root CA R1'];
    expect(names(orderChain(certificates(CHAIN)).path)).toEqual(expected);
    expect(names(orderChain(certificates(ROOT, INTERMEDIATE, LEAF)).path)).toEqual(expected);
    expect(names(orderChain(certificates(INTERMEDIATE, ROOT, LEAF)).path)).toEqual(expected);
  });

  it('marks every link of a real chain as good', () => {
    expect(orderChain(certificates(CHAIN)).links).toEqual([
      { ok: true, reason: null },
      { ok: true, reason: null },
    ]);
  });

  it('keeps an unrelated certificate in the path and breaks the link to it', () => {
    const { path, links } = orderChain(certificates(LEAF, UNRELATED_ROOT));
    expect(names(path)).toEqual(['www.example.com', 'Unrelated Root X9']);
    expect(links).toEqual([{ ok: false, reason: 'issuer-mismatch' }]);
  });

  it('breaks the link when the intermediate is missing', () => {
    const { path, links } = orderChain(certificates(LEAF, ROOT));
    expect(names(path)).toEqual(['www.example.com', 'Example Root CA R1']);
    expect(links[0]).toEqual({ ok: false, reason: 'issuer-mismatch' });
  });

  it('breaks the link when the names match and the key identifiers do not', () => {
    const [leaf, intermediate] = certificates(LEAF, INTERMEDIATE);
    const reissued = { ...intermediate, subjectKeyId: 'AA:BB' };
    expect(orderChain([leaf, reissued]).links).toEqual([{ ok: false, reason: 'key-mismatch' }]);
    expect(names(orderChain([leaf, reissued, intermediate]).path).slice(0, 2)).toEqual([
      'www.example.com',
      'Example Issuing CA E1',
    ]);
    expect(orderChain([leaf, reissued, intermediate]).path[1]).toBe(intermediate);
  });

  it('flags a certificate that follows a self-signed root', () => {
    const { path, links } = orderChain(certificates(CHAIN, UNRELATED_ROOT));
    expect(names(path)[3]).toBe('Unrelated Root X9');
    expect(links[2]).toEqual({ ok: false, reason: 'after-root' });
  });

  it('handles one certificate and none', () => {
    expect(orderChain(certificates(ROOT)).links).toEqual([]);
    expect(orderChain([])).toEqual({ path: [], links: [] });
  });
});

describe('inspectChain', () => {
  it('passes a complete, in-date chain', () => {
    const report = inspectChain(certificates(CHAIN), NOW);
    expect(report.status).toBe('success');
    expect(codes(report)).toEqual(['linked']);
    expect(report.complete).toBe(true);
    expect(report.linked).toBe(true);
  });

  it('notes a missing root without calling it a fault', () => {
    const report = inspectChain(certificates(LEAF, INTERMEDIATE), NOW);
    expect(report.status).toBe('info');
    expect(codes(report)).toEqual(['linked', 'no-root']);
    expect(report.complete).toBe(false);
  });

  it('reports a broken link with both names', () => {
    const report = inspectChain(certificates(LEAF, UNRELATED_ROOT), NOW);
    expect(report.status).toBe('error');
    expect(report.linked).toBe(false);
    expect(report.findings[0]).toMatchObject({
      code: 'broken-link',
      severity: 'error',
      title: 'Broken link: www.example.com was not issued by Unrelated Root X9',
    });
    expect(report.findings[0].detail).toContain('CN=Example Issuing CA E1');
    expect(codes(report)).not.toContain('linked');
  });

  it('warns when a chain is pasted root first', () => {
    const report = inspectChain(certificates(ROOT, INTERMEDIATE, LEAF), NOW);
    expect(codes(report)).toEqual(['out-of-order']);
    expect(report.status).toBe('warning');
  });

  it('flags a certificate expiring within 30 days', () => {
    const leafEnd = Date.parse('2036-11-11T10:16:57Z');
    const report = inspectChain(certificates(CHAIN), leafEnd - 12 * DAY);
    expect(report.status).toBe('warning');
    expect(report.findings[0]).toMatchObject({
      code: 'expiring',
      title: 'www.example.com expires in 12 days',
    });
  });

  it('flags an expired certificate and leaves the in-date ones alone', () => {
    const leafEnd = Date.parse('2036-11-11T10:16:57Z');
    const report = inspectChain(certificates(CHAIN), leafEnd + 5 * DAY);
    expect(report.status).toBe('error');
    expect(codes(report)).toEqual(['expired']);
    expect(report.findings[0].detail).toBe('It stopped being valid on 2036-11-11, 5 days ago.');
  });

  it('flags a certificate that is not valid yet', () => {
    expect(codes(inspectChain(certificates(LEAF), ISSUED - DAY))).toEqual(['not-yet-valid']);
  });

  it('flags a weak signature and a short RSA key', () => {
    const [leaf] = certificates(LEAF);
    const weak = {
      ...leaf,
      signatureAlgorithm: { oid: '1.2.840.113549.1.1.5', name: 'RSA with SHA-1', weak: true },
      key: { oid: '1.2.840.113549.1.1.1', algorithm: 'RSA', size: 1024, curve: null, label: 'RSA 1024' },
    };
    expect(codes(inspectChain([weak], NOW))).toEqual(['weak-signature', 'weak-key']);
  });

  it('says nothing about a single healthy certificate', () => {
    const report = inspectChain(certificates(LEAF), NOW);
    expect(report.findings).toEqual([]);
    expect(report.status).toBe('success');
  });
});

describe('decodeAll', () => {
  it('returns certificates leaf first with fingerprints and validity', async () => {
    const result = await decodeAll(`${ROOT}\n${LEAF}\n${INTERMEDIATE}\n${REQUEST}`, NOW);
    expect(names(result.certificates)).toEqual([
      'www.example.com',
      'Example Issuing CA E1',
      'Example Root CA R1',
    ]);
    expect(result.certificates[0].fingerprints.sha1).toBe(
      '18:20:1B:A7:13:4D:6B:85:8F:F1:D9:71:ED:82:76:6C:DC:9B:DC:77'
    );
    expect(result.certificates[2].fingerprints.sha256).toBe(
      '43:9F:7A:3A:BE:33:B8:84:82:BD:8C:CE:1C:52:BA:FE:1F:98:25:DB:44:3E:FF:29:8B:AF:59:7C:E6:73:84:11'
    );
    expect(result.certificates[0].validity.state).toBe('valid');
    expect(result.requests).toHaveLength(1);
    expect(result.chain.status).toBe('warning');
  });

  it('serialises without the raw bytes', async () => {
    const plain = toPlain(await decodeAll(`${CHAIN}\n${REQUEST}`, NOW));
    const json = JSON.stringify(plain);
    expect(json).not.toContain('"der"');
    expect(json).not.toContain('"base64"');
    expect(plain.certificates[0].subject.dn).toBe('C=GB, L=Nottingham, O=Example Ltd, CN=www.example.com');
    expect(plain.certificates[0].subjectAlternativeNames[0]).toEqual({ type: 'DNS', value: 'www.example.com' });
    expect(plain.requests[0].key.label).toBe('RSA 2048');
    expect(plain.chain.status).toBe('success');
    expect(toPlain(await decodeAll(LEAF, NOW)).chain).toBeNull();
  });

  it('copes with nothing to decode', async () => {
    const result = await decodeAll('not a certificate', NOW);
    expect(result.certificates).toEqual([]);
    expect(result.problems[0].code).toBe('no-pem');
  });
});
