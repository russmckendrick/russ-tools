import { encodePost } from './decode.js';

const TENANT = '00000000-0000-0000-0000-000000000000';
const ISSUER = `https://sts.windows.net/${TENANT}/`;
const AUDIENCE = 'https://app.example.com/saml/metadata';
const ACS = 'https://app.example.com/saml/acs';
const REQUEST_ID = '_request-0000-sample';
const RESPONSE_ID = '_response-0000-sample';
const ASSERTION_ID = '_assertion-0000-sample';

const PLACEHOLDER = (label) => btoa(`synthetic sample, not a real ${label}`);

const CLAIMS = [
  ['http://schemas.microsoft.com/identity/claims/tenantid', [TENANT]],
  ['http://schemas.microsoft.com/identity/claims/objectidentifier', ['11111111-1111-1111-1111-111111111111']],
  ['http://schemas.microsoft.com/identity/claims/displayname', ['Sam Sample']],
  ['http://schemas.microsoft.com/identity/claims/identityprovider', [ISSUER]],
  [
    'http://schemas.microsoft.com/claims/authnmethodsreferences',
    ['http://schemas.microsoft.com/ws/2008/06/identity/authenticationmethod/password', 'http://schemas.microsoft.com/claims/multipleauthn'],
  ],
  ['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname', ['Sam']],
  ['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname', ['Sample']],
  ['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress', ['sam.sample@example.com']],
  ['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name', ['sam.sample@example.com']],
  [
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/groups',
    ['22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'],
  ],
  ['http://schemas.microsoft.com/ws/2008/06/identity/claims/role', ['Reader']],
];

const stamp = (time) => new Date(time).toISOString().replace(/\.\d{3}Z$/, 'Z');

export function sampleXml({ now = Date.now(), certificate = PLACEHOLDER('certificate') } = {}) {
  const issued = stamp(now - 30_000);
  const notBefore = stamp(now - 5 * 60_000);
  const notOnOrAfter = stamp(now + 55 * 60_000);

  const attributes = CLAIMS.map(
    ([name, values]) =>
      `<Attribute Name="${name}">${values.map((value) => `<AttributeValue>${value}</AttributeValue>`).join('')}</Attribute>`
  ).join('');

  return (
    `<samlp:Response ID="${RESPONSE_ID}" Version="2.0" IssueInstant="${issued}" Destination="${ACS}" InResponseTo="${REQUEST_ID}" xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">` +
    `<Issuer xmlns="urn:oasis:names:tc:SAML:2.0:assertion">${ISSUER}</Issuer>` +
    `<samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status>` +
    `<Assertion ID="${ASSERTION_ID}" IssueInstant="${issued}" Version="2.0" xmlns="urn:oasis:names:tc:SAML:2.0:assertion">` +
    `<Issuer>${ISSUER}</Issuer>` +
    `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo>` +
    `<CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>` +
    `<SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>` +
    `<Reference URI="#${ASSERTION_ID}"><Transforms>` +
    `<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>` +
    `<Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/></Transforms>` +
    `<DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>` +
    `<DigestValue>${PLACEHOLDER('digest')}</DigestValue></Reference></SignedInfo>` +
    `<SignatureValue>${PLACEHOLDER('signature')}</SignatureValue>` +
    `<KeyInfo><X509Data><X509Certificate>${certificate}</X509Certificate></X509Data></KeyInfo></Signature>` +
    `<Subject><NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">sam.sample@example.com</NameID>` +
    `<SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">` +
    `<SubjectConfirmationData InResponseTo="${REQUEST_ID}" NotOnOrAfter="${notOnOrAfter}" Recipient="${ACS}"/>` +
    `</SubjectConfirmation></Subject>` +
    `<Conditions NotBefore="${notBefore}" NotOnOrAfter="${notOnOrAfter}">` +
    `<AudienceRestriction><Audience>${AUDIENCE}</Audience></AudienceRestriction></Conditions>` +
    `<AttributeStatement>${attributes}</AttributeStatement>` +
    `<AuthnStatement AuthnInstant="${issued}" SessionIndex="${ASSERTION_ID}">` +
    `<AuthnContext><AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password</AuthnContextClassRef></AuthnContext>` +
    `</AuthnStatement></Assertion></samlp:Response>`
  );
}

export const sampleResponse = (options) => encodePost(sampleXml(options));
