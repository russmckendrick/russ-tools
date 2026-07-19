import { test, expect } from '@playwright/test';

/**
 * Frozen contract #1, exercised end-to-end through the Cloudflare Pages
 * layer: every param deep link must 200-rewrite (URL intact, tool page
 * served underneath), the island must then apply the param, and the one
 * retired path must 301. Values are realistic on purpose — a real HS256
 * token, real domains, an IPv6 CIDR — because placeholder-shaped values are
 * exactly what `_redirects` patterns and `useParams` decoding never choke on.
 *
 * Worker-backed lookups (ssl/whois/tenant) fire on mount but are NOT
 * asserted: the matrix proves routing and param application, which is
 * origin-independent. Live lookups depend on the target origin being in each
 * worker's ALLOWED_ORIGINS.
 */

// Minted for this suite: HS256, secret "your-256-bit-secret",
// payload { sub: "1234567890", name: "John Doe", iat: 1516239022 }.
const JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

// compressConfig({ f: 4, cidr: '10.0.0.0/16', splits: ['10.0.0.0/16', '10.0.0.0/17'] })
// — restores a /16 with two splits: leaves /18, /18, /17. Regenerate with
// src/core/sharelink.js if the codec ever legitimately changes (it must not:
// frozen contract #2).
const SHARE_CONFIG =
  'eJyrVkpTsjLRUUrOTClSslIyNNADQ31DMyUdpeKCnMySYiWraDRxBM9cKbYWACVDD4o';

/** Navigate and prove the `_redirects` 200-rewrite: no redirect happened —
 * the URL in the bar is still the deep link — and the prerendered page under
 * it is the right tool (its h1 comes from the manifest, no JS involved). */
const expectRewrite = async (page, path, h1) => {
  const response = await page.goto(path);
  expect(response.status()).toBe(200);
  expect(new URL(page.url()).pathname).toBe(path.split('?')[0]);
  await expect(page.locator('h1')).toHaveText(h1);
};

test.describe('home and shell pages', () => {
  test('home page serves the tool index', async ({ page }) => {
    const response = await page.goto('/');
    expect(response.status()).toBe(200);
    await expect(page.locator('h1')).toHaveText('Tools');
    for (const href of ['/subnet-calculator', '/jwt', '/base64']) {
      await expect(page.locator(`a[href="${href}"]`).first()).toBeVisible();
    }
  });

  test('the index presents Microsoft and Azure together without divider counts', async ({
    page,
  }) => {
    await page.goto('/');

    const platformFilter = page.getByRole('button', { name: 'Microsoft & Azure 4' });
    await expect(platformFilter).toBeVisible();
    await expect(page.locator('.rt-group-head', { hasText: 'Microsoft & Azure' })).toBeVisible();
    await expect(page.locator('.rt-group-head em')).toHaveCount(0);
    await expect(page.locator('.rt-group[data-category="azure"]')).toHaveCount(0);
    await expect(page.locator('.rt-group[data-category="microsoft"]')).toHaveCount(0);

    await platformFilter.click();
    await expect(page.locator('.rt-group:not([hidden])')).toHaveCount(1);
    await expect(page.locator('.rt-group[data-category="microsoft-azure"]')).toBeVisible();
  });

  test('the mobile burger exposes navigation and appearance controls', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const menuToggle = page.locator('[data-menu-toggle]');
    await expect(menuToggle).toBeVisible();
    await expect(menuToggle).toHaveAccessibleName('Open menu');
    await expect(page.getByRole('navigation', { name: 'Primary' })).not.toBeVisible();

    await menuToggle.click();
    await expect(
      page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Saved data' })
    ).toBeVisible();
    await expect(page.getByRole('group', { name: 'Appearance' })).toBeVisible();

    const paletteToggle = page.locator('[data-palette-toggle]');
    await paletteToggle.click();
    await expect(page.getByRole('menu', { name: 'Color palette' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(paletteToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'false');

    await menuToggle.click();
    await page.locator('h1').click();
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('/delete serves the saved-data page, noindex', async ({ page }) => {
    const response = await page.goto('/delete');
    expect(response.status()).toBe(200);
    await expect(page.locator('h1')).toHaveText('Saved data');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      /noindex/
    );
  });

  test('/delete hides and preserves storage not owned by a tool', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('russ-tools-palette', 'nord');
      localStorage.setItem('vite-ui-theme', 'dark');
    });
    await page.goto('/delete');

    await expect(page.getByText('Nothing stored')).toBeVisible();
    await expect(page.getByText('Not owned by a tool')).toHaveCount(0);
    await expect(page.getByText('russ-tools-palette')).toHaveCount(0);
    await expect(page.getByText('vite-ui-theme')).toHaveCount(0);
    expect(
      await page.evaluate(() => ({
        palette: localStorage.getItem('russ-tools-palette'),
        mode: localStorage.getItem('vite-ui-theme'),
      }))
    ).toEqual({ palette: 'nord', mode: 'dark' });
  });

  test('an unknown path is a real 404, not a soft one', async ({ page }) => {
    const response = await page.request.get('/definitely-not-a-page', {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(404);
  });

  test('/sitemap.xml is served and robots.txt points at it', async ({ page }) => {
    const sitemap = await page.request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain('<urlset');

    const robots = await page.request.get('/robots.txt');
    expect(await robots.text()).toContain('Sitemap: https://russ.tools/sitemap.xml');
  });
});

test.describe('the retired path', () => {
  test('/network-designer 301s to /subnet-calculator', async ({ page }) => {
    const response = await page.request.get('/network-designer', {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(301);
    expect(response.headers()['location']).toMatch(/\/subnet-calculator$/);
  });

  test('/network-designer/* 301s too', async ({ page }) => {
    const response = await page.request.get('/network-designer/anything/here', {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(301);
    expect(response.headers()['location']).toMatch(/\/subnet-calculator$/);
  });

  test('following the 301 lands on the calculator', async ({ page }) => {
    await page.goto('/network-designer');
    expect(new URL(page.url()).pathname).toBe('/subnet-calculator');
    await expect(page.locator('h1')).toHaveText('Subnet Calculator');
  });
});

test.describe('param deep links — rewrite + island application', () => {
  test('/ssl-checker/:domain', async ({ page }) => {
    await expectRewrite(page, '/ssl-checker/example.com', 'SSL Certificate Checker');
    await expect(page.locator('#domain')).toHaveValue('example.com');
  });

  test('/whois-lookup/:query', async ({ page }) => {
    await expectRewrite(page, '/whois-lookup/example.com', 'WHOIS Lookup Tool');
    await expect(page.locator('#query')).toHaveValue('example.com');
  });

  test('/tenant-lookup/:domain', async ({ page }) => {
    await expectRewrite(page, '/tenant-lookup/microsoft.com', 'Microsoft Tenant Lookup');
    await expect(page.locator('#domain')).toHaveValue('microsoft.com');
  });

  test('/microsoft-portals/:domain', async ({ page }) => {
    await expectRewrite(page, '/microsoft-portals/contoso.com', 'Microsoft Portals (GDAP)');
    await expect(
      page.getByPlaceholder('Enter domain (e.g., contoso.com) or email address...')
    ).toHaveValue('contoso.com');
  });

  test('/jwt/:token decodes the token', async ({ page }) => {
    await expectRewrite(page, `/jwt/${JWT}`, 'JWT Decoder/Validator');
    await expect(page.getByText('John Doe').first()).toBeVisible();
  });

  test('/base64/:input auto-detects and decodes', async ({ page }) => {
    // Session 7's deep-link fix, pinned at the browser level: the shared
    // payload must be *decoded*, not re-encoded under the initial mode.
    await expectRewrite(page, '/base64/SGVsbG8gd29ybGQ%3D', 'Base64 Encoder/Decoder');
    await expect(page.getByPlaceholder('Output will appear here...')).toHaveValue(
      'Hello world'
    );
  });

  test('/azure-kql/:service', async ({ page }) => {
    await expectRewrite(page, '/azure-kql/azure-firewall', 'Azure KQL Query Builder');
    await expect(page.getByText('Azure Firewall').first()).toBeVisible();
  });

  test('/azure-kql/:service/:template', async ({ page }) => {
    await expectRewrite(
      page,
      '/azure-kql/azure-firewall/application',
      'Azure KQL Query Builder'
    );
    await expect(page.getByText('Application Rule Query').first()).toBeVisible();
  });

  test('/subnet-calculator/:ip defaults the prefix', async ({ page }) => {
    await expectRewrite(page, '/subnet-calculator/10.0.0.0', 'Subnet Calculator');
    await expect(page.getByText('10.0.0.0/24').first()).toBeVisible();
  });

  test('/subnet-calculator/:ip/:prefix (IPv4, host address)', async ({ page }) => {
    await expectRewrite(page, '/subnet-calculator/192.168.1.130/25', 'Subnet Calculator');
    // The details panel shows the *network* CIDR the host falls in.
    await expect(page.getByText('192.168.1.128/25').first()).toBeVisible();
  });

  test('/subnet-calculator/:ip/:prefix (IPv6 CIDR)', async ({ page }) => {
    await expectRewrite(page, '/subnet-calculator/2001:db8:abcd::/48', 'Subnet Calculator');
    await expect(page.getByText('2001:db8:abcd::/48').first()).toBeVisible();
    await expect(page.getByText('IPv6', { exact: true }).first()).toBeVisible();
  });
});

test.describe('share links', () => {
  test('subnet-calculator ?config restores without the phantom error', async ({
    page,
  }) => {
    // Regression pin for the Radix hidden-select empty echo (session 7
    // addendum): restoring a share link made the prefix select echo an empty
    // onValueChange, recalculate with "10.0.0.0/" and render a validation
    // error over a perfectly restored result. jsdom does not reproduce the
    // echo, so this browser test is the only pin it has.
    await page.goto(`/subnet-calculator?config=${SHARE_CONFIG}`);

    await expect(page.getByText('10.0.0.0/16').first()).toBeVisible();
    await expect(page.getByText('3 subnets')).toBeVisible();
    for (const leaf of ['10.0.0.0/18', '10.0.64.0/18', '10.0.128.0/17']) {
      await expect(page.getByText(leaf).first()).toBeVisible();
    }

    // The phantom error rendered through this alert. Its absence is the fix.
    await expect(
      page.getByText('Enter a valid IPv4 or IPv6 address', { exact: false })
    ).toHaveCount(0);

    // The config param survives — a restored link stays shareable.
    expect(new URL(page.url()).searchParams.get('config')).toBe(SHARE_CONFIG);
  });
});
