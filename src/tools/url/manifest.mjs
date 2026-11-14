export default {
  id: 'url',
  path: '/url',
  title: 'URL Parser & Encoder',

  shortDescription: 'Split a URL into editable parts, and percent-encode or decode text.',
  description:
    'Split a URL into scheme, host, port, path, query parameters and ' +
    'fragment, all decoded and editable, with checks for double-encoding, ' +
    'embedded credentials and secret-looking parameters. Also percent-encodes ' +
    'and decodes text and converts hostnames to punycode.',

  category: 'developer',
  icon: 'link',
  badges: ['URL', 'Percent-encoding', 'Punycode'],

  params: ['input'],

  features: [
    'Scheme, host, port, path, query and fragment, decoded',
    'Edit any part and the URL is rebuilt',
    'Checks for double-encoding and unencoded characters',
    'Flags embedded credentials and secret-looking parameter names',
    'encodeURIComponent, encodeURI and form encoding side by side',
    'Punycode and Unicode forms of an internationalised hostname',
  ],

  seo: {
    title: 'URL Parser & Encoder - Decode, Edit and Encode URLs',
    keywords: [
      'url parser',
      'url decoder',
      'url encoder',
      'percent encoding',
      'query string parser',
      'encodeURIComponent',
      'urlencode online',
      'punycode converter',
      'double encoded url',
      'url query editor',
    ],
  },

  storageKeys: [],
  legacyKeys: [],

  help: () => import('../../../docs/tools/url/README.md?raw'),
  island: () => import('./island.jsx'),
};
