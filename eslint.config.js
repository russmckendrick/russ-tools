import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

/* Tailwind palette scales that must not be used directly in tool code —
   use the semantic tokens from src/styles/globals.css instead
   (bg-success-subtle, text-danger, border-info, …). See DESIGN.md in the repo root. */
const PALETTE = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const UTILITY = 'bg|text|border|ring|from|via|to|fill|stroke|divide|outline|shadow|accent|caret|decoration|placeholder'
const RAW_PALETTE_CLASS = String.raw`(^|[\s"'\`])(hover:|focus:|focus-visible:|active:|disabled:|group-hover:|dark:|sm:|md:|lg:|xl:|2xl:)*(${UTILITY})-(${PALETTE})-\d{2,3}\b`

const RAW_PALETTE_MESSAGE =
  'Raw Tailwind palette class. Use a semantic token instead — bg-success-subtle / text-danger / border-info / text-muted-foreground. See DESIGN.md.'

// DESIGN.md defines exactly ten typography steps. Tailwind's stock sizes are
// not on that scale, and because a call-site class wins over the shared
// component's, one `text-lg` on a CardTitle silently opts that heading out of
// the design system. Weights above 660 are banned outright: DESIGN.md's
// Typography section says weights stay in the 400-660 range.
const OFF_SCALE_TYPE = String.raw`(^|[\s"'\`])(hover:|focus:|focus-visible:|active:|disabled:|group-hover:|dark:|sm:|md:|lg:|xl:|2xl:)*(text-(xs|sm|base|lg|xl|[2-9]xl)|font-(thin|extralight|light|normal|bold|extrabold|black))\b`

const OFF_SCALE_TYPE_MESSAGE =
  'Off-scale typography. DESIGN.md defines the type steps: text-display / text-headline-lg / text-headline-md / text-title-sm / text-body-lg / text-body-md / text-body-sm / text-label-caps / text-data-md / text-data-sm. Each carries its own weight, line-height and tracking, so it needs no font-* or tracking-* alongside it.'

export default [
  // .wrangler holds scratch bundles that `wrangler pages dev` writes while
  // the _redirects behaviour is being tested.
  { ignores: ['dist', '.astro', '.wrangler', 'coverage'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: { react: { version: 'detect' } },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Marks identifiers referenced from JSX as used. Without it, every
      // PascalCase component import looks unused — which is why the old
      // config carried varsIgnorePattern: '^[A-Z_]'. That pattern also
      // exempted genuinely dead component imports, so the plugin replaces
      // it rather than sitting alongside it.
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      // `try { localStorage.setItem(...) } catch {}` is the house idiom for
      // storage that may be unavailable (private mode, quota). Deliberate.
      'no-empty': ['error', { allowEmptyCatch: true }],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  /* The shared component layer. Every tool renders through it, so it holds
     the full bar: semantic colour AND the DESIGN.md type scale, both errors. */
  {
    files: ['src/components/ui/**/*.{js,jsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: `Literal[value=/${RAW_PALETTE_CLASS}/]`,
          message: RAW_PALETTE_MESSAGE,
        },
        {
          selector: `TemplateElement[value.raw=/${RAW_PALETTE_CLASS}/]`,
          message: RAW_PALETTE_MESSAGE,
        },
        {
          selector: `Literal[value=/${OFF_SCALE_TYPE}/]`,
          message: OFF_SCALE_TYPE_MESSAGE,
        },
        {
          selector: `TemplateElement[value.raw=/${OFF_SCALE_TYPE}/]`,
          message: OFF_SCALE_TYPE_MESSAGE,
        },
      ],
    },
  },

  /* Every tool. All fifteen are ported, so the whole tree holds the same bar
     as ui/ — semantic colour and the DESIGN.md type scale, both errors. */
  {
    files: ['src/tools/**/*.{js,jsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: `Literal[value=/${RAW_PALETTE_CLASS}/]`,
          message: RAW_PALETTE_MESSAGE,
        },
        {
          selector: `TemplateElement[value.raw=/${RAW_PALETTE_CLASS}/]`,
          message: RAW_PALETTE_MESSAGE,
        },
        {
          selector: `Literal[value=/${OFF_SCALE_TYPE}/]`,
          message: OFF_SCALE_TYPE_MESSAGE,
        },
        {
          selector: `TemplateElement[value.raw=/${OFF_SCALE_TYPE}/]`,
          message: OFF_SCALE_TYPE_MESSAGE,
        },
      ],
    },
  },

  {
    files: ['**/*.test.{js,jsx}', 'vitest.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['scripts/**/*.{js,mjs}', '*.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
]
