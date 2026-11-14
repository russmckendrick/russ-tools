export default {
  id: 'timestamp',
  path: '/timestamp',
  title: 'Timestamp Converter',

  shortDescription: 'Convert Unix epoch seconds, milliseconds and ISO 8601 in any time zone.',
  description:
    'Convert a Unix timestamp in seconds or milliseconds, or an ISO 8601 ' +
    'date, into local time, UTC, ISO 8601, RFC 2822, relative time and both ' +
    'epoch forms, in any time zone, with a live clock.',

  category: 'developer',
  icon: 'hourglass',
  badges: ['Epoch', 'ISO 8601', 'Time zones'],

  params: ['value'],

  features: [
    'Epoch seconds, milliseconds, microseconds and nanoseconds',
    'ISO 8601 and RFC 2822 input',
    'Seconds or milliseconds detected by magnitude',
    'Any IANA time zone',
    'Relative time',
    'Live current time with copy buttons',
  ],

  seo: {
    title: 'Timestamp Converter - Unix Epoch, ISO 8601 and Time Zones',
    keywords: [
      'timestamp converter',
      'unix timestamp',
      'epoch converter',
      'epoch to date',
      'unix time',
      'iso 8601 converter',
      'milliseconds to date',
      'rfc 2822 date',
      'time zone converter',
      'current unix time',
    ],
  },

  storageKeys: [],
  legacyKeys: [],

  help: () => import('../../../docs/tools/timestamp/README.md?raw'),
  island: () => import('./island.jsx'),
};
