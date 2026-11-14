import { inspectChain, validityOf } from './chain.js';
import { decodeText, fingerprints } from './x509.js';

export function decodeSync(text, now = Date.now()) {
  const decoded = decodeText(text);
  const chain = inspectChain(decoded.certificates, now);
  return {
    certificates: chain.path.map((certificate) => ({
      ...certificate,
      fingerprints: null,
      validity: validityOf(certificate, now),
    })),
    requests: decoded.requests,
    chain: {
      links: chain.links,
      findings: chain.findings,
      status: chain.status,
      complete: chain.complete,
      linked: chain.linked,
    },
    problems: decoded.problems,
    blocks: decoded.blocks,
  };
}

export async function decodeAll(text, now = Date.now()) {
  const result = decodeSync(text, now);
  const prints = await Promise.all(
    result.certificates.map((certificate) => fingerprints(certificate.der).catch(() => null))
  );
  return {
    ...result,
    certificates: result.certificates.map((certificate, index) => ({
      ...certificate,
      fingerprints: prints[index],
    })),
  };
}

const name = ({ dn, commonName, attributes }) => ({ dn, commonName, attributes });

const shared = (item) => ({
  subject: name(item.subject),
  subjectAlternativeNames: item.sans,
  key: item.key,
  signatureAlgorithm: item.signatureAlgorithm,
  keyUsage: item.keyUsage,
  extendedKeyUsage: item.extendedKeyUsage,
  basicConstraints: item.basicConstraints,
});

export function toPlain(result) {
  return {
    certificates: result.certificates.map((certificate) => ({
      ...shared(certificate),
      issuer: name(certificate.issuer),
      serial: certificate.serial,
      version: certificate.version,
      notBefore: certificate.notBefore,
      notAfter: certificate.notAfter,
      validity: certificate.validity,
      isCa: certificate.isCa,
      selfIssued: certificate.selfIssued,
      subjectKeyId: certificate.subjectKeyId,
      authorityKeyId: certificate.authorityKeyId,
      fingerprints: certificate.fingerprints,
      ocsp: certificate.ocsp,
      caIssuers: certificate.caIssuers,
      crl: certificate.crl,
      extensions: certificate.extensions,
    })),
    requests: result.requests.map(shared),
    chain: result.certificates.length > 1 ? result.chain : null,
    problems: result.problems,
  };
}
