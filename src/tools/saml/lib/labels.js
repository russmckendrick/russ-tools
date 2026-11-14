const XMLSOAP = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/';
const MS_IDENTITY = 'http://schemas.microsoft.com/identity/claims/';
const MS_WS2008 = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/';
const MS_CLAIMS = 'http://schemas.microsoft.com/claims/';

export const CLAIM_LABELS = {
  [`${XMLSOAP}name`]: 'Name (user principal name)',
  [`${XMLSOAP}nameidentifier`]: 'Name identifier',
  [`${XMLSOAP}emailaddress`]: 'Email address',
  [`${XMLSOAP}givenname`]: 'Given name',
  [`${XMLSOAP}surname`]: 'Surname',
  [`${XMLSOAP}upn`]: 'User principal name',
  [`${XMLSOAP}mobilephone`]: 'Mobile phone',
  [`${XMLSOAP}streetaddress`]: 'Street address',
  [`${XMLSOAP}locality`]: 'City',
  [`${XMLSOAP}stateorprovince`]: 'State or province',
  [`${XMLSOAP}postalcode`]: 'Postal code',
  [`${XMLSOAP}country`]: 'Country',
  [`${MS_IDENTITY}tenantid`]: 'Tenant ID',
  [`${MS_IDENTITY}objectidentifier`]: 'Object ID',
  [`${MS_IDENTITY}displayname`]: 'Display name',
  [`${MS_IDENTITY}identityprovider`]: 'Identity provider',
  [`${MS_IDENTITY}scope`]: 'Scope',
  [`${MS_CLAIMS}authnmethodsreferences`]: 'Authentication methods',
  [`${MS_CLAIMS}groups.link`]: 'Groups overage link',
  [`${MS_WS2008}groups`]: 'Groups',
  [`${MS_WS2008}role`]: 'Roles',
  [`${MS_WS2008}wids`]: 'Directory role IDs',
  [`${MS_WS2008}windowsaccountname`]: 'Windows account name',
  [`${MS_WS2008}primarysid`]: 'Primary SID',
  [`${MS_WS2008}authenticationinstant`]: 'Authentication instant',
  [`${MS_WS2008}authenticationmethod`]: 'Authentication method',
  'urn:oid:0.9.2342.19200300.100.1.1': 'User ID (uid)',
  'urn:oid:0.9.2342.19200300.100.1.3': 'Email (mail)',
  'urn:oid:2.5.4.3': 'Common name',
  'urn:oid:2.5.4.4': 'Surname (sn)',
  'urn:oid:2.5.4.42': 'Given name',
  'urn:oid:2.16.840.1.113730.3.1.241': 'Display name',
  'urn:oid:1.3.6.1.4.1.5923.1.1.1.6': 'eduPersonPrincipalName',
  'urn:oid:1.3.6.1.4.1.5923.1.1.1.9': 'eduPersonScopedAffiliation',
  'urn:oid:1.3.6.1.4.1.5923.1.1.1.10': 'eduPersonTargetedID',
};

const NAMEID_FORMATS = {
  'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified': 'Unspecified',
  'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress': 'Email address',
  'urn:oasis:names:tc:SAML:1.1:nameid-format:X509SubjectName': 'X.509 subject name',
  'urn:oasis:names:tc:SAML:1.1:nameid-format:WindowsDomainQualifiedName': 'Windows domain qualified name',
  'urn:oasis:names:tc:SAML:2.0:nameid-format:kerberos': 'Kerberos principal',
  'urn:oasis:names:tc:SAML:2.0:nameid-format:entity': 'Entity identifier',
  'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent': 'Persistent',
  'urn:oasis:names:tc:SAML:2.0:nameid-format:transient': 'Transient',
  'urn:oasis:names:tc:SAML:2.0:nameid-format:encrypted': 'Encrypted',
};

const AUTHN_CONTEXTS = {
  'urn:oasis:names:tc:SAML:2.0:ac:classes:Password': 'Password',
  'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport': 'Password over a protected transport',
  'urn:oasis:names:tc:SAML:2.0:ac:classes:X509': 'X.509 certificate',
  'urn:oasis:names:tc:SAML:2.0:ac:classes:TLSClient': 'TLS client certificate',
  'urn:oasis:names:tc:SAML:2.0:ac:classes:Kerberos': 'Kerberos',
  'urn:oasis:names:tc:SAML:2.0:ac:classes:Smartcard': 'Smart card',
  'urn:oasis:names:tc:SAML:2.0:ac:classes:SmartcardPKI': 'Smart card with PKI',
  'urn:oasis:names:tc:SAML:2.0:ac:classes:TimeSyncToken': 'Time-synchronised token',
  'urn:oasis:names:tc:SAML:2.0:ac:classes:MobileTwoFactorContract': 'Mobile two-factor',
  'urn:oasis:names:tc:SAML:2.0:ac:classes:PreviousSession': 'Previous session',
  'urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified': 'Unspecified',
  'urn:federation:authentication:windows': 'Windows integrated authentication',
  'http://schemas.microsoft.com/claims/multipleauthn': 'Multi-factor authentication',
  'http://schemas.microsoft.com/ws/2008/06/identity/authenticationmethod/password': 'Password',
  'http://schemas.microsoft.com/ws/2008/06/identity/authenticationmethod/windows': 'Windows integrated authentication',
  'http://schemas.microsoft.com/ws/2008/06/identity/authenticationmethod/x509': 'X.509 certificate',
};

const BINDINGS = {
  'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST': 'HTTP POST',
  'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect': 'HTTP Redirect',
  'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Artifact': 'HTTP Artifact',
  'urn:oasis:names:tc:SAML:2.0:bindings:SOAP': 'SOAP',
  'urn:oasis:names:tc:SAML:2.0:bindings:PAOS': 'Reverse SOAP (PAOS)',
};

const CONFIRMATIONS = {
  'urn:oasis:names:tc:SAML:2.0:cm:bearer': 'Bearer',
  'urn:oasis:names:tc:SAML:2.0:cm:holder-of-key': 'Holder of key',
  'urn:oasis:names:tc:SAML:2.0:cm:sender-vouches': 'Sender vouches',
};

const ALGORITHMS = {
  'http://www.w3.org/2000/09/xmldsig#rsa-sha1': 'RSA with SHA-1',
  'http://www.w3.org/2000/09/xmldsig#dsa-sha1': 'DSA with SHA-1',
  'http://www.w3.org/2000/09/xmldsig#hmac-sha1': 'HMAC with SHA-1',
  'http://www.w3.org/2001/04/xmldsig-more#rsa-md5': 'RSA with MD5',
  'http://www.w3.org/2001/04/xmldsig-more#rsa-sha224': 'RSA with SHA-224',
  'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256': 'RSA with SHA-256',
  'http://www.w3.org/2001/04/xmldsig-more#rsa-sha384': 'RSA with SHA-384',
  'http://www.w3.org/2001/04/xmldsig-more#rsa-sha512': 'RSA with SHA-512',
  'http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha1': 'ECDSA with SHA-1',
  'http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256': 'ECDSA with SHA-256',
  'http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha384': 'ECDSA with SHA-384',
  'http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha512': 'ECDSA with SHA-512',
  'http://www.w3.org/2007/05/xmldsig-more#sha256-rsa-MGF1': 'RSASSA-PSS with SHA-256',
  'http://www.w3.org/2007/05/xmldsig-more#sha384-rsa-MGF1': 'RSASSA-PSS with SHA-384',
  'http://www.w3.org/2007/05/xmldsig-more#sha512-rsa-MGF1': 'RSASSA-PSS with SHA-512',
  'http://www.w3.org/2009/xmldsig11#dsa-sha256': 'DSA with SHA-256',
  'http://www.w3.org/2000/09/xmldsig#sha1': 'SHA-1',
  'http://www.w3.org/2001/04/xmldsig-more#md5': 'MD5',
  'http://www.w3.org/2001/04/xmldsig-more#sha224': 'SHA-224',
  'http://www.w3.org/2001/04/xmlenc#sha256': 'SHA-256',
  'http://www.w3.org/2001/04/xmldsig-more#sha384': 'SHA-384',
  'http://www.w3.org/2001/04/xmlenc#sha512': 'SHA-512',
  'http://www.w3.org/2001/10/xml-exc-c14n#': 'Exclusive canonical XML',
  'http://www.w3.org/2001/10/xml-exc-c14n#WithComments': 'Exclusive canonical XML, with comments',
  'http://www.w3.org/TR/2001/REC-xml-c14n-20010315': 'Canonical XML 1.0',
  'http://www.w3.org/TR/2001/REC-xml-c14n-20010315#WithComments': 'Canonical XML 1.0, with comments',
  'http://www.w3.org/2006/12/xml-c14n11': 'Canonical XML 1.1',
  'http://www.w3.org/2000/09/xmldsig#enveloped-signature': 'Enveloped signature',
};

const STATUS_CODES = {
  'urn:oasis:names:tc:SAML:2.0:status:Success': 'Success',
  'urn:oasis:names:tc:SAML:2.0:status:Requester': 'Requester error',
  'urn:oasis:names:tc:SAML:2.0:status:Responder': 'Responder error',
  'urn:oasis:names:tc:SAML:2.0:status:VersionMismatch': 'Version mismatch',
  'urn:oasis:names:tc:SAML:2.0:status:AuthnFailed': 'Authentication failed',
  'urn:oasis:names:tc:SAML:2.0:status:InvalidAttrNameOrValue': 'Invalid attribute name or value',
  'urn:oasis:names:tc:SAML:2.0:status:InvalidNameIDPolicy': 'Invalid NameID policy',
  'urn:oasis:names:tc:SAML:2.0:status:NoAuthnContext': 'No authentication context',
  'urn:oasis:names:tc:SAML:2.0:status:NoAvailableIDP': 'No available identity provider',
  'urn:oasis:names:tc:SAML:2.0:status:NoPassive': 'Passive sign-in not possible',
  'urn:oasis:names:tc:SAML:2.0:status:NoSupportedIDP': 'No supported identity provider',
  'urn:oasis:names:tc:SAML:2.0:status:PartialLogout': 'Partial logout',
  'urn:oasis:names:tc:SAML:2.0:status:RequestDenied': 'Request denied',
  'urn:oasis:names:tc:SAML:2.0:status:RequestUnsupported': 'Request unsupported',
  'urn:oasis:names:tc:SAML:2.0:status:UnknownPrincipal': 'Unknown principal',
  'urn:oasis:names:tc:SAML:2.0:status:UnsupportedBinding': 'Unsupported binding',
};

const WEAK = /#.*(?:sha-?1|md5)(?!\d)/i;

const named = (table) => (uri) => (uri ? { uri, label: table[uri] ?? null } : null);

export const claimLabel = (name) => CLAIM_LABELS[name] ?? null;
export const nameIdFormat = named(NAMEID_FORMATS);
export const authnContext = named(AUTHN_CONTEXTS);
export const binding = named(BINDINGS);
export const confirmation = named(CONFIRMATIONS);
export const statusCode = named(STATUS_CODES);

export function algorithm(uri) {
  if (!uri) return null;
  return { uri, label: ALGORITHMS[uri] ?? null, weak: WEAK.test(uri) };
}
