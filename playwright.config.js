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
 *       pnpm build && pnpm test:e2e
 *     which auto-starts `wrangler pages dev dist` on :8788. That serves the
 *     Pages Functions in functions/ too, so e2e/api.spec.js runs against the
 *     same build. `PW_PORT` moves it when 8788 is taken — an existing server
 *     on the port is reused, so a stale one would be tested instead of this
 *     build.
 */
const port = process.env.PW_PORT ?? '8788';
const local = `http://127.0.0.1:${port}`;
const baseURL = process.env.PW_BASE_URL ?? local;

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
        command: `pnpm dlx wrangler pages dev dist --port ${port} --compatibility-date 2025-05-05`,
        url: local,
        reuseExistingServer: true,
        timeout: 120_000,
        env: { WRANGLER_SEND_METRICS: 'false' },
      },
});
