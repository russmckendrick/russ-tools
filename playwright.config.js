import { defineConfig, devices } from '@playwright/test';

/**
 * The deep-link matrix — frozen contract #1's browser-level gate.
 *
 * These tests exercise what only the Cloudflare Pages layer can prove: the
 * `_redirects` 200-rewrites (a param deep link serves the tool page with the
 * URL intact), the /network-designer 301, and the islands applying the param
 * after hydration. `astro dev` serves param routes as 404s by design, so the
 * matrix never runs against it.
 *
 * Two targets:
 *   - Deployed preview (the real gate):
 *       PW_BASE_URL=https://russ-tools-preview.pages.dev pnpm test:e2e
 *   - Local Cloudflare runtime (pre-flight; same engine wrangler ships):
 *       pnpm build:astro && pnpm test:e2e
 *     which auto-starts `wrangler pages dev dist-astro` on :8788.
 */
const baseURL = process.env.PW_BASE_URL ?? 'http://127.0.0.1:8788';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 1,
  reporter: [['list']],
  timeout: 45_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.PW_BASE_URL
    ? undefined
    : {
        command:
          'pnpm dlx wrangler pages dev dist-astro --port 8788 --compatibility-date 2025-05-05',
        url: 'http://127.0.0.1:8788',
        reuseExistingServer: true,
        timeout: 120_000,
        env: { WRANGLER_SEND_METRICS: 'false' },
      },
});
