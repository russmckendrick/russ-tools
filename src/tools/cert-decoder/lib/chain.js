const DAY = 86_400_000;

export const EXPIRY_WARNING_DAYS = 30;
export const MIN_RSA_BITS = 2048;

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

export function validityOf(certificate, now = Date.now()) {
  const start = Date.parse(certificate.notBefore);
  const end = Date.parse(certificate.notAfter);
  if (now > end) {
    const days = Math.floor((now - end) / DAY);
    return { state: 'expired', days, text: days ? `expired ${plural(days, 'day')} ago` : 'expired today' };
  }
  if (now < start) {
    const days = Math.ceil((start - now) / DAY);
    return { state: 'not-yet-valid', days, text: `valid in ${plural(days, 'day')}` };
  }
  const days = Math.floor((end - now) / DAY);
  return {
    state: days <= EXPIRY_WARNING_DAYS ? 'expiring' : 'valid',
    days,
    text: `${plural(days, 'day')} left`,
  };
}

export function roleOf(certificate) {
  if (certificate.isCa) return certificate.selfIssued ? 'Root CA' : 'Intermediate CA';
  return certificate.selfIssued ? 'Self-signed' : 'Leaf';
}

export const timestamp = (iso) => `${iso.slice(0, 10)} ${iso.slice(11, 19)} UTC`;

const namesMatch = (child, parent) => child.issuer.key === parent.subject.key;

const keysDisagree = (child, parent) =>
  Boolean(child.authorityKeyId && parent.subjectKeyId && child.authorityKeyId !== parent.subjectKeyId);

export function orderChain(certificates) {
  if (!certificates.length) return { path: [], links: [] };
  const issuesAnother = (candidate) =>
    certificates.some((other) => other !== candidate && !other.selfIssued && namesMatch(other, candidate));
  const ends = certificates.filter((candidate) => !issuesAnother(candidate));
  const leaf = ends.find((candidate) => !candidate.isCa) ?? ends[0] ?? certificates[0];

  const path = [leaf];
  const links = [];
  const remaining = certificates.filter((candidate) => candidate !== leaf);
  while (remaining.length) {
    const last = path[path.length - 1];
    const candidates = last.selfIssued ? [] : remaining.filter((candidate) => namesMatch(last, candidate));
    const parent = candidates.find((candidate) => !keysDisagree(last, candidate)) ?? candidates[0];
    const next = parent ?? remaining[0];
    links.push({
      ok: Boolean(parent) && !keysDisagree(last, next),
      reason: !parent ? (last.selfIssued ? 'after-root' : 'issuer-mismatch') : keysDisagree(last, next) ? 'key-mismatch' : null,
    });
    path.push(next);
    remaining.splice(remaining.indexOf(next), 1);
  }
  return { path, links };
}

function linkFinding(child, parent, link) {
  if (link.reason === 'after-root') {
    return {
      severity: 'error',
      code: 'broken-link',
      title: `${parent.subject.displayName} is not part of this chain`,
      detail: `${child.subject.displayName} is self-signed, so the chain ends there. Nothing in the paste is issued by ${parent.subject.displayName}.`,
    };
  }
  if (link.reason === 'key-mismatch') {
    return {
      severity: 'error',
      code: 'broken-link',
      title: `Broken link: ${child.subject.displayName} was signed by a different key`,
      detail: `The names match, but its authority key identifier (${child.authorityKeyId}) is not the subject key identifier of ${parent.subject.displayName} (${parent.subjectKeyId}). This is usually an old or cross-signed copy of the issuing CA.`,
    };
  }
  return {
    severity: 'error',
    code: 'broken-link',
    title: `Broken link: ${child.subject.displayName} was not issued by ${parent.subject.displayName}`,
    detail: `Its issuer is "${child.issuer.dn}", and the next certificate's subject is "${parent.subject.dn}".`,
  };
}

function certificateFindings(certificate, now) {
  const findings = [];
  const name = certificate.subject.displayName;
  const validity = validityOf(certificate, now);
  if (validity.state === 'expired') {
    findings.push({
      severity: 'error',
      code: 'expired',
      title: `${name} has expired`,
      detail: `It stopped being valid on ${certificate.notAfter.slice(0, 10)}, ${validity.text.replace('expired ', '')}.`,
    });
  }
  if (validity.state === 'not-yet-valid') {
    findings.push({
      severity: 'warning',
      code: 'not-yet-valid',
      title: `${name} is not valid yet`,
      detail: `Its validity starts on ${certificate.notBefore.slice(0, 10)}.`,
    });
  }
  if (validity.state === 'expiring') {
    findings.push({
      severity: 'warning',
      code: 'expiring',
      title: `${name} expires in ${plural(validity.days, 'day')}`,
      detail: `It is valid until ${certificate.notAfter.slice(0, 10)}, inside the ${EXPIRY_WARNING_DAYS}-day warning window.`,
    });
  }
  if (certificate.signatureAlgorithm.weak && !certificate.selfIssued) {
    findings.push({
      severity: 'warning',
      code: 'weak-signature',
      title: `${name} is signed with ${certificate.signatureAlgorithm.name}`,
      detail: 'MD5 and SHA-1 signatures are no longer accepted by browsers or public CAs.',
    });
  }
  if (certificate.key.algorithm.startsWith('RSA') && certificate.key.size && certificate.key.size < MIN_RSA_BITS) {
    findings.push({
      severity: 'warning',
      code: 'weak-key',
      title: `${name} has a ${certificate.key.size}-bit RSA key`,
      detail: `RSA keys under ${MIN_RSA_BITS} bits are no longer accepted for public trust.`,
    });
  }
  return findings;
}

const RANK = { error: 3, warning: 2, info: 1, success: 0 };

export function inspectChain(certificates, now = Date.now()) {
  const { path, links } = orderChain(certificates);
  const findings = [];
  links.forEach((link, index) => {
    if (!link.ok) findings.push(linkFinding(path[index], path[index + 1], link));
  });
  for (const certificate of path) findings.push(...certificateFindings(certificate, now));

  const linked = links.every((link) => link.ok);
  const reordered = path.some((certificate, index) => certificate !== certificates[index]);
  const top = path[path.length - 1];
  const complete = Boolean(top?.selfIssued);

  if (path.length > 1 && linked && reordered) {
    findings.push({
      severity: 'warning',
      code: 'out-of-order',
      title: 'The certificates were pasted out of order',
      detail: 'They are shown leaf first. A server must send them in that order too: the leaf, then each issuer in turn.',
    });
  }
  if (path.length > 1 && linked && !complete) {
    findings.push({
      severity: 'info',
      code: 'no-root',
      title: 'The root is not included',
      detail: `The chain stops at ${top.subject.displayName}, issued by "${top.issuer.dn}". That is normal for a server bundle: the client supplies the root from its own trust store.`,
    });
  }
  if (path.length > 1 && !findings.some((finding) => finding.severity !== 'info')) {
    findings.unshift({
      severity: 'success',
      code: 'linked',
      title: `${plural(path.length, 'certificate')}, each issued by the next`,
      detail: 'Issuer and subject names line up from the leaf to the top, and nothing is expired or close to expiry. Signatures are not verified.',
    });
  }

  const status = findings.reduce(
    (worst, finding) => (RANK[finding.severity] > RANK[worst] ? finding.severity : worst),
    'success'
  );
  return { path, links, findings, status, complete, linked };
}
