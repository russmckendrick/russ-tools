export default {
  id: 'diff',
  path: '/diff',
  title: 'Text Diff',

  shortDescription: 'Compare two texts line by line, with changed words marked.',
  description:
    'Compare two texts line by line with changed words highlighted, in a ' +
    'unified or side-by-side view. Ignores whitespace or case on request, ' +
    'normalises JSON before comparing, counts additions and deletions and ' +
    'copies the result as a unified diff.',

  category: 'developer',
  icon: 'diff',
  badges: ['Unified diff', 'Side by side', 'JSON'],

  params: [],

  features: [
    'Line-by-line diff with the Myers algorithm',
    'Changed words highlighted inside a changed line',
    'Unified and side-by-side views',
    'Ignore whitespace and case',
    'Normalise JSON before diffing',
    'Copy as a unified diff that patch can apply',
  ],

  seo: {
    title: 'Text Diff - Compare Text, Config Files and JSON',
    keywords: [
      'text diff',
      'diff checker',
      'compare text online',
      'unified diff',
      'side by side diff',
      'json diff',
      'compare config files',
      'diff ignore whitespace',
      'myers diff',
      'text compare',
    ],
  },

  storageKeys: [],
  legacyKeys: [],

  help: () => import('../../../docs/tools/diff/README.md?raw'),
  island: () => import('./island.jsx'),
};
