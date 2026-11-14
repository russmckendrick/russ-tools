export default {
  id: 'cert-decoder',
  path: '/cert-decoder',
  title: 'Certificate & CSR Decoder',
  shortDescription: 'Decode PEM certificates, chains and CSRs without uploading them.',
  description:
    'Paste or drop X.509 certificates, a full chain or a PKCS#10 signing request and read ' +
    'them in the browser: subject, issuer, alternative names, validity, key and signature ' +
    'algorithms, usages, fingerprints and revocation URLs. A chain is ordered leaf to root, ' +
    'drawn, and checked for broken links and expiry. Nothing is uploaded.',
  category: 'security',
  icon: 'file-badge',
  badges: ['X.509', 'PKCS#10', 'Chain order', 'Local only'],
  params: [],
  features: [
    'X.509 certificate and PKCS#10 CSR decoding',
    'Chain ordering, leaf to root',
    'Broken-link and expiry checks',
    'SHA-1 and SHA-256 fingerprints',
    'Subject alternative names, key usage and constraints',
    'OCSP, CRL and CA issuer URLs',
  ],
  seo: {
    title: 'Certificate & CSR Decoder - Read X.509 PEM in the Browser',
    keywords: [
      'certificate decoder',
      'csr decoder',
      'x509 decoder',
      'pem decoder',
      'certificate chain checker',
      'ssl certificate viewer',
      'certificate fingerprint',
      'pkcs10 decoder',
    ],
  },
  storageKeys: [],
  legacyKeys: [],
  help: () => import('../../../docs/tools/cert-decoder/README.md?raw'),
  island: () => import('./island.jsx'),
};
