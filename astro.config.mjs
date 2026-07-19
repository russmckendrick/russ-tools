import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * The Phase 2 shell, running alongside the existing Vite SPA rather than
 * replacing it. Nothing here touches vite.config.js — Astro carries its own
 * Vite config, so the two builds are independent until the cutover.
 *
 *   pnpm dev    / pnpm build          the live React SPA (unchanged)
 *   pnpm dev:astro / pnpm build:astro the new shell, into dist-astro/
 *
 * See docs/plans/redesign-plan.md, Phase 2.
 */
export default defineConfig({
  site: 'https://russ.tools',
  output: 'static',
  outDir: './dist-astro',
  srcDir: './src',
  publicDir: './public',

  // The SPA served every route from one document, so trailing slashes never
  // mattered. They do now: /dns-lookup/ and /dns-lookup must not become two
  // URLs, or frozen contract #4 (identical URLs) breaks on day one.
  trailingSlash: 'never',
  build: { format: 'file' },

  integrations: [
    // No include/exclude filter: React is the only island framework, so it
    // claims every .jsx. A path-shaped filter here is a trap — `**/tools/**`
    // also matches the stylesheets under src/components/tools/, and hands
    // them to the JSX transform.
    react(),
    sitemap(),
  ],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: { '@': new URL('./src', import.meta.url).pathname },
    },
  },
});
