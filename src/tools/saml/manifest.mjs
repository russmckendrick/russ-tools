export default {
  id: 'saml',
  path: '/saml',
  title: 'SAML Decoder',
  shortDescription: 'Decode a SAML response, request or assertion without uploading it.',
  description:
    'Paste a SAML response, request or assertion as it appears in a browser trace: base64, ' +
    'base64 with DEFLATE, URL-encoded or raw XML. Read the issuer, subject, audience, ' +
    'destination, validity window, authentication context, every attribute and the signature ' +
    'and digest algorithms, with expired, unsigned and SHA-1 messages flagged. Decoded in the ' +
    'browser; signatures are reported, not verified.',
  category: 'security',
  icon: 'code-xml',
  badges: ['SAML 2.0', 'Entra ID claims', 'Redirect and POST', 'Local only'],
  params: [],
  features: [
    'Base64, DEFLATE, URL-encoded and raw XML input, auto-detected',
    'Issuer, subject, audience, destination and recipient',
    'Validity window and authentication context',
    'Attribute table with Entra ID claim names',
    'Signature and digest algorithms, and what is signed',
    'Expired, unsigned, SHA-1 and missing-audience findings',
  ],
  seo: {
    title: 'SAML Decoder - Read a SAML Response or Request in the Browser',
    keywords: [
      'saml decoder',
      'saml response decoder',
      'saml request decoder',
      'saml assertion viewer',
      'saml tracer',
      'decode samlresponse',
      'saml base64 decode',
      'entra id saml claims',
      'saml debugger',
    ],
  },
  storageKeys: [],
  legacyKeys: [],
  help: () => import('../../../docs/tools/saml/README.md?raw'),
  island: () => import('./island.jsx'),
};
