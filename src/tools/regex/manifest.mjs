export default {
  id: 'regex',
  path: '/regex',
  title: 'Regex Tester',

  shortDescription: 'Test a regular expression: live highlights, groups, replace and a timeout.',
  description:
    'Test a JavaScript regular expression against sample text, with every ' +
    'match highlighted in place, numbered and named groups with their ' +
    'indices, a replace mode, a library of network and identity patterns, ' +
    'and a time limit that stops catastrophic backtracking.',

  category: 'developer',
  icon: 'regex',
  badges: ['RegExp', 'Groups', 'Replace'],

  params: [],

  features: [
    'Matches highlighted in the test text as you type',
    'Numbered and named groups with index ranges',
    'Replace mode with $1 and $<name> references',
    'Runs in a worker and stops after one second',
    'Patterns for IPv4, IPv6, CIDR, MAC, GUID, FQDN, email and ISO 8601',
    'Pattern and sample shared as a link',
  ],

  seo: {
    title: 'Regex Tester - JavaScript RegExp with Groups and Replace',
    keywords: [
      'regex tester',
      'regular expression tester',
      'javascript regex',
      'regex groups',
      'regex replace',
      'catastrophic backtracking',
      'ipv4 regex',
      'ipv6 regex',
      'cidr regex',
      'mac address regex',
    ],
  },

  storageKeys: [],
  legacyKeys: [],

  help: () => import('../../../docs/tools/regex/README.md?raw'),
  island: () => import('./island.jsx'),
};
