import { algorithm, authnContext, binding, claimLabel, confirmation, nameIdFormat, statusCode } from './labels.js';

export const NS = {
  protocol: 'urn:oasis:names:tc:SAML:2.0:protocol',
  assertion: 'urn:oasis:names:tc:SAML:2.0:assertion',
  signature: 'http://www.w3.org/2000/09/xmldsig#',
};

const SUCCESS = 'urn:oasis:names:tc:SAML:2.0:status:Success';

const KINDS = {
  [`${NS.protocol}|Response`]: 'Response',
  [`${NS.protocol}|AuthnRequest`]: 'Authentication request',
  [`${NS.protocol}|LogoutRequest`]: 'Logout request',
  [`${NS.protocol}|LogoutResponse`]: 'Logout response',
  [`${NS.assertion}|Assertion`]: 'Assertion',
  [`${NS.assertion}|EncryptedAssertion`]: 'Encrypted assertion',
};

export class SamlParseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'SamlParseError';
  }
}

const kids = (element, namespace, name) =>
  element ? [...element.children].filter((child) => child.namespaceURI === namespace && child.localName === name) : [];
const kid = (element, namespace, name) => kids(element, namespace, name)[0] ?? null;
const attr = (element, name) => element?.getAttribute(name) ?? null;
const content = (element) => (element ? element.textContent.trim() : null);
const flag = (value) => (value === null ? null : value === 'true' || value === '1');

function instant(value) {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

function readSignature(owner) {
  const element = kid(owner, NS.signature, 'Signature');
  if (!element) return null;

  const info = kid(element, NS.signature, 'SignedInfo');
  const references = kids(info, NS.signature, 'Reference');
  const certificates = kids(kid(element, NS.signature, 'KeyInfo'), NS.signature, 'X509Data')
    .flatMap((data) => kids(data, NS.signature, 'X509Certificate'))
    .map((certificate) => content(certificate).replace(/\s+/g, ''))
    .filter(Boolean);
  const ownerId = attr(owner, 'ID');

  return {
    signatureAlgorithm: algorithm(attr(kid(info, NS.signature, 'SignatureMethod'), 'Algorithm')),
    canonicalization: algorithm(attr(kid(info, NS.signature, 'CanonicalizationMethod'), 'Algorithm')),
    digestAlgorithms: references
      .map((reference) => algorithm(attr(kid(reference, NS.signature, 'DigestMethod'), 'Algorithm')))
      .filter(Boolean),
    references: references.map((reference) => attr(reference, 'URI') ?? ''),
    coversOwner: references.some((reference) => {
      const uri = attr(reference, 'URI');
      return uri === '' || (ownerId !== null && uri === `#${ownerId}`);
    }),
    certificates,
  };
}

function readNameId(subject) {
  const element = kid(subject, NS.assertion, 'NameID');
  if (!element) {
    return kid(subject, NS.assertion, 'EncryptedID') ? { value: null, encrypted: true, format: null } : null;
  }
  return {
    value: content(element),
    encrypted: false,
    format: nameIdFormat(attr(element, 'Format')),
    nameQualifier: attr(element, 'NameQualifier'),
    spNameQualifier: attr(element, 'SPNameQualifier'),
  };
}

function readAssertion(element) {
  const subject = kid(element, NS.assertion, 'Subject');
  const conditions = kid(element, NS.assertion, 'Conditions');
  const restrictions = kids(conditions, NS.assertion, 'AudienceRestriction');

  const confirmations = kids(subject, NS.assertion, 'SubjectConfirmation').map((item) => {
    const data = kid(item, NS.assertion, 'SubjectConfirmationData');
    return {
      method: confirmation(attr(item, 'Method')),
      recipient: attr(data, 'Recipient'),
      inResponseTo: attr(data, 'InResponseTo'),
      notBefore: instant(attr(data, 'NotBefore')),
      notOnOrAfter: instant(attr(data, 'NotOnOrAfter')),
    };
  });

  const authnStatements = kids(element, NS.assertion, 'AuthnStatement').map((statement) => {
    const context = kid(statement, NS.assertion, 'AuthnContext');
    return {
      authnInstant: instant(attr(statement, 'AuthnInstant')),
      sessionIndex: attr(statement, 'SessionIndex'),
      sessionNotOnOrAfter: instant(attr(statement, 'SessionNotOnOrAfter')),
      contextClass: authnContext(content(kid(context, NS.assertion, 'AuthnContextClassRef'))),
    };
  });

  const statements = kids(element, NS.assertion, 'AttributeStatement');
  const attributes = statements
    .flatMap((statement) => kids(statement, NS.assertion, 'Attribute'))
    .map((attribute) => {
      const name = attr(attribute, 'Name') ?? '';
      return {
        name,
        label: claimLabel(name) ?? attr(attribute, 'FriendlyName'),
        nameFormat: attr(attribute, 'NameFormat'),
        values: kids(attribute, NS.assertion, 'AttributeValue').map((value) => content(value)),
      };
    });

  return {
    id: attr(element, 'ID'),
    version: attr(element, 'Version'),
    issueInstant: instant(attr(element, 'IssueInstant')),
    issuer: content(kid(element, NS.assertion, 'Issuer')),
    nameId: readNameId(subject),
    confirmations,
    notBefore: instant(attr(conditions, 'NotBefore')),
    notOnOrAfter: instant(attr(conditions, 'NotOnOrAfter')),
    hasConditions: Boolean(conditions),
    audiences: restrictions.flatMap((restriction) => kids(restriction, NS.assertion, 'Audience').map(content)),
    oneTimeUse: Boolean(kid(conditions, NS.assertion, 'OneTimeUse')),
    authnStatements,
    attributes,
    encryptedAttributes: statements.reduce(
      (count, statement) => count + kids(statement, NS.assertion, 'EncryptedAttribute').length,
      0
    ),
    signature: readSignature(element),
  };
}

function readStatus(root) {
  const status = kid(root, NS.protocol, 'Status');
  if (!status) return null;
  const top = kid(status, NS.protocol, 'StatusCode');
  const value = attr(top, 'Value');
  return {
    code: statusCode(value),
    subCode: statusCode(attr(kid(top, NS.protocol, 'StatusCode'), 'Value')),
    message: content(kid(status, NS.protocol, 'StatusMessage')),
    success: value === SUCCESS,
  };
}

function readRequest(root) {
  const policy = kid(root, NS.protocol, 'NameIDPolicy');
  const requested = kid(root, NS.protocol, 'RequestedAuthnContext');
  return {
    assertionConsumerServiceUrl: attr(root, 'AssertionConsumerServiceURL'),
    assertionConsumerServiceIndex: attr(root, 'AssertionConsumerServiceIndex'),
    protocolBinding: binding(attr(root, 'ProtocolBinding')),
    forceAuthn: flag(attr(root, 'ForceAuthn')),
    isPassive: flag(attr(root, 'IsPassive')),
    providerName: attr(root, 'ProviderName'),
    nameIdPolicy: policy
      ? { format: nameIdFormat(attr(policy, 'Format')), allowCreate: flag(attr(policy, 'AllowCreate')) }
      : null,
    requestedContexts: kids(requested, NS.assertion, 'AuthnContextClassRef').map((item) => authnContext(content(item))),
    comparison: attr(requested, 'Comparison'),
    nameId: readNameId(root),
    sessionIndexes: kids(root, NS.protocol, 'SessionIndex').map(content),
  };
}

function span(ms) {
  const abs = Math.abs(ms);
  const pick = (count, unit) => `${count} ${unit}${count === 1 ? '' : 's'}`;
  if (abs >= 86_400_000) return pick(Math.floor(abs / 86_400_000), 'day');
  if (abs >= 3_600_000) return pick(Math.floor(abs / 3_600_000), 'hour');
  if (abs >= 60_000) return pick(Math.floor(abs / 60_000), 'minute');
  return pick(Math.max(1, Math.floor(abs / 1000)), 'second');
}

export function validityOf(assertion) {
  const bearer = assertion.confirmations.find((item) => item.notOnOrAfter);
  return {
    start: assertion.notBefore ?? assertion.issueInstant,
    end: assertion.notOnOrAfter ?? bearer?.notOnOrAfter ?? null,
  };
}

function signatureFindings(findings, signature, where) {
  if (!signature) return;

  const weak = [signature.signatureAlgorithm, ...signature.digestAlgorithms].filter((item) => item?.weak);
  if (weak.length) {
    findings.push({
      code: 'weak-algorithm',
      severity: 'warning',
      title: `The ${where} signature uses ${[...new Set(weak.map((item) => item.label ?? item.uri))].join(' and ')}`,
      detail:
        'SHA-1 is no longer collision-resistant. Identity providers have signed with SHA-256 by default for years; this one needs its signing algorithm changed.',
    });
  }
  if (!signature.coversOwner) {
    findings.push({
      code: 'signature-reference',
      severity: 'warning',
      title: `The ${where} signature does not reference the ${where}`,
      detail: `Its Reference URI is ${signature.references.map((uri) => `"${uri}"`).join(', ') || 'missing'}, which is not the ID of the element it sits in. A signature that covers a different element is how signature-wrapping attacks are built.`,
    });
  }
}

function buildFindings(result, now) {
  const findings = [];
  const { assertions, status, signature } = result;

  if (status && !status.success) {
    findings.push({
      code: 'status',
      severity: 'error',
      title: `The identity provider answered ${status.code?.label ?? status.code?.uri ?? 'without a status code'}`,
      detail: [status.subCode && (status.subCode.label ?? status.subCode.uri), status.message].filter(Boolean).join('. ') ||
        'No further detail was given, and no assertion is issued for a failed response.',
    });
  }

  if (result.encryptedAssertions > 0) {
    findings.push({
      code: 'encrypted',
      severity: 'info',
      title: 'The assertion is encrypted',
      detail:
        "It can only be read with the service provider's private key, so its subject, conditions and attributes are not shown.",
    });
  }

  assertions.forEach((assertion, index) => {
    const label = assertions.length > 1 ? `Assertion ${index + 1}` : 'The assertion';
    const { end } = validityOf(assertion);
    const notBefore = assertion.notBefore ? Date.parse(assertion.notBefore) : null;
    const notOnOrAfter = end ? Date.parse(end) : null;

    if (notOnOrAfter !== null && now >= notOnOrAfter) {
      findings.push({
        code: 'expired',
        severity: 'error',
        title: `${label} expired ${span(now - notOnOrAfter)} ago`,
        detail:
          'A service provider must reject it. That is normal for a trace captured earlier: assertions usually live for minutes.',
      });
    } else if (notBefore !== null && now < notBefore) {
      findings.push({
        code: 'not-yet-valid',
        severity: 'warning',
        title: `${label} is not valid for another ${span(notBefore - now)}`,
        detail: 'NotBefore is in the future. If it was just issued, the two clocks disagree.',
      });
    } else if (notOnOrAfter === null) {
      findings.push({
        code: 'no-expiry',
        severity: 'warning',
        title: `${label} has no expiry`,
        detail: 'Neither Conditions nor SubjectConfirmationData carries NotOnOrAfter, so nothing limits how long it can be replayed.',
      });
    }

    if (assertion.audiences.length === 0) {
      findings.push({
        code: 'no-audience',
        severity: 'warning',
        title: `${label} has no audience restriction`,
        detail:
          'Without an AudienceRestriction it does not say which service provider it was issued for, so one service could replay it to another.',
      });
    }

    signatureFindings(findings, assertion.signature, 'assertion');
  });

  signatureFindings(findings, signature, result.kind === 'Assertion' ? 'assertion' : 'message');

  if (assertions.length > 0) {
    const unsigned = assertions.filter((assertion) => !assertion.signature).length;
    if (unsigned > 0 && !signature) {
      findings.push({
        code: 'unsigned',
        severity: 'error',
        title: 'Nothing is signed',
        detail:
          'Neither the response nor the assertion carries a signature, so anyone could have written it. A service provider must not accept it.',
      });
    } else if (unsigned > 0) {
      findings.push({
        code: 'unsigned-assertion',
        severity: 'warning',
        title: 'The assertion is not signed',
        detail:
          'Only the response is signed. The assertion is covered while it stays inside that response, and cannot be checked once it is lifted out. Many service providers require the assertion itself to be signed.',
      });
    }
  }

  return findings;
}

function signedState(result) {
  const assertionSigned = result.assertions.some((assertion) => assertion.signature);
  if (result.kind === 'Assertion') return assertionSigned ? 'assertion' : 'neither';
  if (result.signature && assertionSigned) return 'both';
  if (result.signature) return 'message';
  if (assertionSigned) return 'assertion';
  return 'neither';
}

export function parseSaml(xml, { now = Date.now(), Parser = globalThis.DOMParser } = {}) {
  if (/<!DOCTYPE/i.test(xml)) {
    throw new SamlParseError('This document has a DOCTYPE. SAML messages never carry one, so it was not parsed.');
  }
  if (typeof Parser !== 'function') throw new SamlParseError('No XML parser is available here');

  let document;
  try {
    document = new Parser().parseFromString(xml, 'application/xml');
  } catch {
    throw new SamlParseError('The XML is not well-formed');
  }
  const failure = document.getElementsByTagName('parsererror')[0];
  if (failure) {
    const reason = failure.textContent.replace(/\s+/g, ' ').trim();
    throw new SamlParseError(`The XML is not well-formed${reason ? `: ${reason.slice(0, 200)}` : ''}`);
  }

  const root = document.documentElement;
  const kind = KINDS[`${root.namespaceURI}|${root.localName}`] ?? null;
  const isAssertion = kind === 'Assertion';
  const assertionElements = isAssertion ? [root] : kids(root, NS.assertion, 'Assertion');

  const result = {
    kind,
    rootName: root.nodeName,
    rootNamespace: root.namespaceURI,
    id: attr(root, 'ID'),
    version: attr(root, 'Version'),
    issueInstant: instant(attr(root, 'IssueInstant')),
    destination: attr(root, 'Destination'),
    inResponseTo: attr(root, 'InResponseTo'),
    issuer: content(kid(root, NS.assertion, 'Issuer')),
    status: readStatus(root),
    request: kind === 'Authentication request' || kind === 'Logout request' ? readRequest(root) : null,
    assertions: assertionElements.map(readAssertion),
    encryptedAssertions:
      kind === 'Encrypted assertion' ? 1 : kids(root, NS.assertion, 'EncryptedAssertion').length,
    signature: isAssertion ? null : readSignature(root),
    document,
  };

  result.signed = signedState(result);
  result.findings = kind
    ? buildFindings(result, now)
    : [
        {
          code: 'unknown-root',
          severity: 'warning',
          title: `<${root.nodeName}> is not a SAML 2.0 message`,
          detail:
            'The XML is shown below, but only SAML 2.0 responses, requests and assertions are summarised. SAML 1.1 and WS-Federation messages are not read.',
        },
      ];

  return result;
}

export function toPlain(result) {
  return JSON.parse(JSON.stringify({ ...result, document: undefined }));
}
