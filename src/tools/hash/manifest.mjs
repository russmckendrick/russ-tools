export default {
  id: 'hash',
  path: '/hash',
  title: 'Hash & HMAC Generator',

  shortDescription: 'MD5 and SHA digests of text or a file, with HMAC and a compare check.',
  description:
    'Compute MD5, SHA-1, SHA-256, SHA-384 and SHA-512 digests of text or a ' +
    'file in the browser, as hex and Base64. Add a key for HMAC, and paste ' +
    'an expected digest to check for a match.',

  category: 'developer',
  icon: 'hash',
  badges: ['SHA-256', 'HMAC', 'Files'],

  params: ['input'],

  features: [
    'MD5, SHA-1, SHA-256, SHA-384 and SHA-512',
    'Hex and Base64 output',
    'HMAC with an optional key',
    'File hashing read in chunks',
    'Compare against an expected digest',
    'Runs entirely in the browser',
  ],

  seo: {
    title: 'Hash & HMAC Generator - MD5, SHA-256 and SHA-512 Online',
    keywords: [
      'hash generator',
      'sha256 generator',
      'sha512 hash',
      'md5 hash',
      'sha1 hash',
      'hmac generator',
      'hmac sha256',
      'file checksum',
      'checksum calculator',
      'verify checksum',
    ],
  },

  storageKeys: [],
  legacyKeys: [],

  help: () => import('../../../docs/tools/hash/README.md?raw'),
  island: () => import('./island.jsx'),
};
