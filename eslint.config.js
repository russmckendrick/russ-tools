import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

/* Tailwind palette scales that must not be used directly in tool code —
   use the semantic tokens from src/styles/globals.css instead
   (bg-success-subtle, text-danger, border-info, …). See docs/DESIGN_SPEC.md. */
const PALETTE = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const UTILITY = 'bg|text|border|ring|from|via|to|fill|stroke|divide|outline|shadow|accent|caret|decoration|placeholder'
const RAW_PALETTE_CLASS = String.raw`(^|[\s"'\`])(hover:|focus:|focus-visible:|active:|disabled:|group-hover:|dark:|sm:|md:|lg:|xl:|2xl:)*(${UTILITY})-(${PALETTE})-\d{2,3}\b`

const RAW_PALETTE_MESSAGE =
  'Raw Tailwind palette class. Use a semantic token instead — bg-success-subtle / text-danger / border-info / text-muted-foreground. See docs/DESIGN_SPEC.md.'

export default [
  // dist-astro is the Astro shell's build output, alongside Vite's dist.
  // .wrangler holds scratch bundles that `wrangler pages dev` writes while
  // the _redirects behaviour is being tested.
  { ignores: ['dist', 'dist-astro', '.astro', '.wrangler', 'coverage'] },
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

  /* Design-system boundary. Warning for now: 505 pre-existing occurrences
     across 31 files. Each tool flips to 'error' as it is ported (Phases 3-5),
     at which point this block narrows to the not-yet-ported directories. */
  {
    files: ['src/components/tools/**/*.{js,jsx}'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: `Literal[value=/${RAW_PALETTE_CLASS}/]`,
          message: RAW_PALETTE_MESSAGE,
        },
        {
          selector: `TemplateElement[value.raw=/${RAW_PALETTE_CLASS}/]`,
          message: RAW_PALETTE_MESSAGE,
        },
      ],
    },
  },

  /* Primitives and shared chrome are already token-only — hold them to it. */
  {
    files: ['src/components/ui/**/*.{js,jsx}', 'src/components/layout/**/*.{js,jsx}'],
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
      ],
    },
  },

  {
    files: ['**/*.test.{js,jsx}', 'vitest.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['scripts/**/*.js', 'vite.config.js', '*.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
]
