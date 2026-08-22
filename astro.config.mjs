import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import webmcp from 'astro-webmcp';

/**
 * The site. A static shell with one React island per tool.
 *
 *   pnpm dev · pnpm build → dist/ · pnpm preview
 *
 * The React SPA this replaced is gone, and Astro now owns the plain `build`
 * script and the `dist/` output the SPA used — so the hosting configuration
 * is unchanged by the cutover and the merge is the deploy. Astro carries its
 * own Vite config; there is no vite.config.js any more.
 *
 * See docs/plans/redesign-plan.md.
 */
export default defineConfig({
  site: 'https://russ.tools',
  output: 'static',
  outDir: './dist',
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
    // also matches the stylesheets that sit beside the islands, and hands
    // them to the JSX transform.
    react(),
    // No @astrojs/sitemap. It emitted `sitemap-index.xml` + `sitemap-0.xml`
    // carrying the identical URL set to the `/sitemap.xml` that robots.txt
    // actually advertises — three files, one set, two sources to drift. The
    // single generator is scripts/generate-sitemap.js, driven by the
    // manifests and run at the head of `pnpm build`.
    webmcp({
      search: { backend: 'manifest' },
      security: { exposedTo: [], sanitizeOutputs: true, maxOutputLength: 8192 },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: { '@': new URL('./src', import.meta.url).pathname },
    },
  },
});
