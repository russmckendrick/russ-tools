import { AsnConvert } from '@peculiar/asn1-schema';
import {
  AuthorityInfoAccessSyntax,
  AuthorityKeyIdentifier,
  BasicConstraints,
  Certificate,
  CRLDistributionPoints,
  ExtendedKeyUsage,
  Extensions,
  KeyUsage,
  SubjectAlternativeName,
  SubjectKeyIdentifier,
} from '@peculiar/asn1-x509';
import { CertificationRequest } from '@peculiar/asn1-csr';
import { fromBER } from 'asn1js';
import {
  ATTRIBUTE_NAMES,
  CURVES,
  EXTENDED_KEY_USAGES,
  EXTENSION_NAMES,
  FIXED_KEY_SIZES,
  KEY_ALGORITHMS,
  KEY_USAGES,
  OID,
  SIGNATURE_ALGORITHMS,
} from './names.js';
import { MAX_PEM_LENGTH, splitPem, toBytes } from './pem.js';

export function hex(buffer, separator = ':') {
  const bytes = ArrayBuffer.isView(buffer)
    ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    : new Uint8Array(buffer);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0').toUpperCase()).join(separator);
}

const escapeValue = (value) =>
  value.replace(/[\\",+;<>]/g, '\\$&').replace(/^[ #]/, '\\$&').replace(/ $/, '\\ ');

const comparable = (value) => value.trim().replace(/\s+/g, ' ').toLowerCase();

function decodeName(name) {
  const rdns = Array.from(name, (rdn) =>
    Array.from(rdn, (attribute) => ({
      oid: attribute.type,
      name: ATTRIBUTE_NAMES[attribute.type] ?? attribute.type,
      value: attribute.value.toString(),
    }))
  );
  const attributes = rdns.flat();
  const find = (oid) => attributes.findLast((attribute) => attribute.oid === oid)?.value;
  const dn = rdns
    .map((rdn) => rdn.map((item) => `${item.name}=${escapeValue(item.value)}`).join(' + '))
    .join(', ');
  return {
    dn,
    attributes,
    commonName: find(OID.commonName) ?? null,
    displayName: find(OID.commonName) ?? find(OID.organization) ?? (dn || 'Empty name'),
    key: rdns
      .map((rdn) => rdn.map((item) => `${item.oid}=${comparable(item.value)}`).sort().join('+'))
      .join(','),
  };
}

function rsaBits(publicKey) {
  try {
    const modulus = fromBER(publicKey).result.valueBlock.value[0].valueBlock.valueHexView;
    let start = 0;
    while (start < modulus.length - 1 && modulus[start] === 0) start += 1;
    return (modulus.length - start - 1) * 8 + (32 - Math.clz32(modulus[start]));
  } catch {
    return null;
  }
}

function curveOf(parameters) {
  try {
    const oid = fromBER(parameters).result.valueBlock.toString();
    return { oid, ...(CURVES[oid] ?? { name: oid, bits: null }) };
  } catch {
    return null;
  }
}

function decodeKey(info) {
  const oid = info.algorithm.algorithm;
  const algorithm = KEY_ALGORITHMS[oid] ?? oid;
  if (oid === OID.rsa || oid === OID.rsaPss) {
    const size = rsaBits(info.subjectPublicKey);
    return { oid, algorithm, size, curve: null, label: size ? `${algorithm} ${size}` : algorithm };
  }
  if (oid === OID.ec) {
    const curve = info.algorithm.parameters ? curveOf(info.algorithm.parameters) : null;
    return {
      oid,
      algorithm,
      size: curve?.bits ?? null,
      curve: curve?.name ?? null,
      label: curve ? `${algorithm} ${curve.name}` : algorithm,
    };
  }
  return { oid, algorithm, size: FIXED_KEY_SIZES[oid] ?? null, curve: null, label: algorithm };
}

const decodeSignature = (identifier) => ({
  oid: identifier.algorithm,
  name: SIGNATURE_ALGORITHMS[identifier.algorithm]?.name ?? identifier.algorithm,
  weak: Boolean(SIGNATURE_ALGORITHMS[identifier.algorithm]?.weak),
});

function otherName(other) {
  if (other.typeId === OID.userPrincipalName) {
    try {
      const value = fromBER(other.value).result.valueBlock.value;
      if (typeof value === 'string') return { type: 'UPN', value };
    } catch {
      return { type: 'UPN', value: hex(other.value) };
    }
    return { type: 'UPN', value: hex(other.value) };
  }
  return { type: 'Other', value: other.typeId };
}

function generalName(name) {
  if (name.dNSName !== undefined) return { type: 'DNS', value: name.dNSName };
  if (name.iPAddress !== undefined) return { type: 'IP', value: name.iPAddress };
  if (name.rfc822Name !== undefined) return { type: 'Email', value: name.rfc822Name };
  if (name.uniformResourceIdentifier !== undefined) return { type: 'URI', value: name.uniformResourceIdentifier };
  if (name.directoryName) return { type: 'Directory', value: decodeName(name.directoryName).dn };
  if (name.registeredID !== undefined) return { type: 'Registered ID', value: name.registeredID };
  if (name.otherName) return otherName(name.otherName);
  return { type: 'Other', value: 'unsupported name form' };
}

const READERS = {
  [OID.subjectAltName]: (value, out) => {
    out.sans = Array.from(AsnConvert.parse(value, SubjectAlternativeName), generalName);
  },
  [OID.keyUsage]: (value, out, critical) => {
    const order = Object.keys(KEY_USAGES);
    const usages = AsnConvert.parse(value, KeyUsage)
      .toJSON()
      .sort((a, b) => order.indexOf(a) - order.indexOf(b));
    out.keyUsage = { critical, usages: usages.map((usage) => KEY_USAGES[usage] ?? usage) };
  },
  [OID.extendedKeyUsage]: (value, out) => {
    out.extendedKeyUsage = Array.from(AsnConvert.parse(value, ExtendedKeyUsage), (oid) => ({
      oid,
      name: EXTENDED_KEY_USAGES[oid] ?? oid,
    }));
  },
  [OID.basicConstraints]: (value, out, critical) => {
    const constraints = AsnConvert.parse(value, BasicConstraints);
    out.basicConstraints = {
      critical,
      ca: Boolean(constraints.cA),
      pathLength: constraints.pathLenConstraint ?? null,
    };
  },
  [OID.authorityInfoAccess]: (value, out) => {
    for (const access of AsnConvert.parse(value, AuthorityInfoAccessSyntax)) {
      const location = generalName(access.accessLocation).value;
      if (access.accessMethod === OID.ocsp) out.ocsp.push(location);
      if (access.accessMethod === OID.caIssuers) out.caIssuers.push(location);
    }
  },
  [OID.crlDistributionPoints]: (value, out) => {
    for (const point of AsnConvert.parse(value, CRLDistributionPoints)) {
      for (const name of point.distributionPoint?.fullName ?? []) out.crl.push(generalName(name).value);
    }
  },
  [OID.subjectKeyIdentifier]: (value, out) => {
    out.subjectKeyId = hex(AsnConvert.parse(value, SubjectKeyIdentifier).buffer);
  },
  [OID.authorityKeyIdentifier]: (value, out) => {
    const identifier = AsnConvert.parse(value, AuthorityKeyIdentifier).keyIdentifier;
    out.authorityKeyId = identifier ? hex(identifier.buffer) : null;
  },
};

function decodeExtensions(extensions) {
  const out = {
    sans: [],
    keyUsage: null,
    extendedKeyUsage: [],
    basicConstraints: null,
    ocsp: [],
    caIssuers: [],
    crl: [],
    subjectKeyId: null,
    authorityKeyId: null,
    extensions: [],
  };
  for (const extension of extensions ?? []) {
    const entry = {
      oid: extension.extnID,
      name: EXTENSION_NAMES[extension.extnID] ?? extension.extnID,
      critical: Boolean(extension.critical),
      decoded: false,
      malformed: false,
    };
    const read = READERS[extension.extnID];
    if (read) {
      try {
        read(extension.extnValue, out, entry.critical);
        entry.decoded = true;
      } catch {
        entry.malformed = true;
      }
    }
    out.extensions.push(entry);
  }
  return out;
}

export function decodeCertificate(bytes) {
  const certificate = AsnConvert.parse(bytes, Certificate);
  const tbs = certificate.tbsCertificate;
  const subject = decodeName(tbs.subject);
  const issuer = decodeName(tbs.issuer);
  const extensions = decodeExtensions(tbs.extensions);
  const serial = new Uint8Array(tbs.serialNumber);
  return {
    kind: 'certificate',
    version: tbs.version + 1,
    subject,
    issuer,
    selfIssued: subject.key === issuer.key,
    serial: hex(serial.length > 1 && serial[0] === 0 ? serial.subarray(1) : serial),
    notBefore: tbs.validity.notBefore.getTime().toISOString(),
    notAfter: tbs.validity.notAfter.getTime().toISOString(),
    key: decodeKey(tbs.subjectPublicKeyInfo),
    signatureAlgorithm: decodeSignature(certificate.signatureAlgorithm),
    isCa: Boolean(extensions.basicConstraints?.ca),
    ...extensions,
    der: bytes,
  };
}

export function decodeRequest(bytes) {
  const request = AsnConvert.parse(bytes, CertificationRequest);
  const info = request.certificationRequestInfo;
  const requested = Array.from(info.attributes ?? [])
    .filter((attribute) => attribute.type === OID.extensionRequest)
    .flatMap((attribute) => attribute.values.flatMap((value) => Array.from(AsnConvert.parse(value, Extensions))));
  return {
    kind: 'csr',
    version: info.version + 1,
    subject: decodeName(info.subject),
    key: decodeKey(info.subjectPKInfo),
    signatureAlgorithm: decodeSignature(request.signatureAlgorithm),
    ...decodeExtensions(requested),
    der: bytes,
  };
}

const WHAT = { certificate: 'certificate', csr: 'certificate request', unknown: 'certificate or request' };

function decodeBlock(block) {
  const bytes = toBytes(block.base64);
  try {
    if (block.kind === 'certificate') return decodeCertificate(bytes);
    if (block.kind === 'csr') return decodeRequest(bytes);
    try {
      return decodeCertificate(bytes);
    } catch {
      return decodeRequest(bytes);
    }
  } catch {
    throw new Error(
      `The base64 decoded, but the bytes are not a DER-encoded ${WHAT[block.kind]}. The block may be truncated or mislabelled.`
    );
  }
}

export function decodeText(text) {
  const result = { certificates: [], requests: [], problems: [], blocks: 0 };
  if (typeof text !== 'string' || !text.trim()) return result;
  if (text.length > MAX_PEM_LENGTH) {
    result.problems.push({
      code: 'too-large',
      severity: 'error',
      title: 'Too much text',
      detail: `Paste at most ${MAX_PEM_LENGTH.toLocaleString('en-GB')} characters at a time.`,
    });
    return result;
  }
  const blocks = splitPem(text);
  result.blocks = blocks.length;
  if (!blocks.length) {
    result.problems.push({
      code: 'no-pem',
      severity: 'error',
      title: 'No PEM block found',
      detail: 'Expected text between -----BEGIN CERTIFICATE----- and -----END CERTIFICATE-----, or a CERTIFICATE REQUEST block.',
    });
    return result;
  }
  const seen = new Set();
  blocks.forEach((block, index) => {
    const position = `Block ${index + 1}`;
    if (block.kind === 'private-key') {
      result.problems.push({
        code: 'private-key',
        severity: 'warning',
        title: `${position} is a private key and was ignored`,
        detail: 'It was not decoded, stored or sent anywhere. A private key should not be pasted into a web page; treat this one as exposed if anyone else could have seen your screen or clipboard.',
      });
      return;
    }
    if (block.kind === 'other') {
      result.problems.push({
        code: 'unsupported',
        severity: 'info',
        title: `${position} (${block.label}) was skipped`,
        detail: 'Only CERTIFICATE and CERTIFICATE REQUEST blocks are decoded.',
      });
      return;
    }
    if (seen.has(block.base64)) {
      result.problems.push({
        code: 'duplicate',
        severity: 'info',
        title: `${position} repeats an earlier block`,
        detail: 'The same certificate appears more than once; it is shown once.',
      });
      return;
    }
    seen.add(block.base64);
    try {
      const item = { ...decodeBlock(block), position: index + 1, base64: block.base64 };
      (item.kind === 'certificate' ? result.certificates : result.requests).push(item);
    } catch (error) {
      result.problems.push({
        code: 'malformed',
        severity: 'error',
        title: `${position} is not a readable ${WHAT[block.kind]}`,
        detail: error.message,
      });
    }
  });
  return result;
}

export async function fingerprints(bytes) {
  const [sha1, sha256] = await Promise.all([
    crypto.subtle.digest('SHA-1', bytes),
    crypto.subtle.digest('SHA-256', bytes),
  ]);
  return { sha1: hex(sha1), sha256: hex(sha256) };
}
