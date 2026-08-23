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

  test('the index presents Microsoft and Azure together in one stream', async ({ page }) => {
    await page.goto('/');

    // One stream, no sections: the chips name the categories and the icon tile
    // carries the hue, so there are no group heads left to assert on.
    await expect(page.locator('.rt-stream')).toBeVisible();
    await expect(page.locator('.rt-group')).toHaveCount(0);
    await expect(page.locator('.rt-card-badge')).toHaveCount(0);

    const platformFilter = page.getByRole('radio', { name: 'Microsoft & Azure 7' });
    await expect(platformFilter).toBeVisible();
    await expect(page.locator('.rt-card[data-category="azure"]')).toHaveCount(0);
    await expect(page.locator('.rt-card[data-category="microsoft"]')).toHaveCount(0);
    await expect(page.locator('.rt-card[data-category="microsoft-azure"]')).toHaveCount(7);

    await platformFilter.click();
    await expect(platformFilter).toHaveAttribute('aria-checked', 'true');
    await expect(page).toHaveURL(/#microsoft-azure$/);

    // Filtering is now "hide what does not match" — the promote-one-group,
    // demote-the-rest model went with the sections.
    await expect(page.locator('.rt-card:visible')).toHaveCount(7);

    // Back clears the filter instead of leaving the site.
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('.rt-card:visible')).toHaveCount(18);
  });

  test('the tiles vary in width so the rows break unevenly', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');

    // The three width steps are what make this a stream rather than a grid.
    // A regression to one width would repack it into a uniform 3xN and every
    // other assertion here would still pass.
    const rows = await page.evaluate(() => {
      const counts = new Map();
      for (const card of document.querySelectorAll('.rt-stream .rt-card')) {
        const top = Math.round(card.getBoundingClientRect().top);
        counts.set(top, (counts.get(top) ?? 0) + 1);
      }
      return [...counts.entries()].sort((a, b) => a[0] - b[0]).map(([, n]) => n);
    });

    expect(rows.reduce((a, b) => a + b, 0)).toBe(18);
    expect(new Set(rows).size, `every row held the same count: ${rows}`).toBeGreaterThan(1);
  });

  test('the name filter narrows the index and is readable off the URL', async ({ page }) => {
    await page.goto('/');

    const find = page.getByRole('searchbox', { name: 'Filter tools by name' });
    await expect(find).toBeVisible();

    await find.fill('subnet');
    await expect(page.locator('.rt-card:visible')).toHaveCount(1);
    await expect(page.locator('a[href="/subnet-calculator"]')).toBeVisible();
    await expect(page).toHaveURL(/\?q=subnet/);

    await find.fill('zzzz');
    await expect(page.locator('.rt-card:visible')).toHaveCount(0);
    await expect(page.locator('#rt-empty')).toBeVisible();
    await expect(page.locator('#rt-empty')).toContainText('No tool matches \u201Czzzz\u201D');
    // The same fact reaches a screen reader through the live region.
    await expect(page.locator('#rt-status')).toHaveText('No tool matches \u201Czzzz\u201D');

    await page.getByRole('button', { name: 'Clear the filter' }).click();
    await expect(page.locator('.rt-card:visible')).toHaveCount(18);
  });

  test('a shared category link arrives filtered', async ({ page }) => {
    await page.goto('/#security');

    await expect(page.getByRole('radio', { name: 'Security 3' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    await expect(page.locator('.rt-card:visible')).toHaveCount(3);
    // The anchor rides on the first tile of the run, so the breadcrumb link
    // every tool page carries still has something to scroll to.
    await expect(page.locator('#security')).toHaveClass(/rt-card/);
  });

  test('the paste panel dispatches to the tool that reads the value', async ({ page }) => {
    await page.goto('/');

    const input = page.locator('#rt-jump-input');
    await expect(input).toBeVisible();

    // Five tools take a bare hostname, so the panel offers all five rather
    // than silently choosing one.
    await input.fill('example.com');
    const chips = page.locator('#rt-jump-hint a');
    await expect(chips).toHaveCount(5);
    await expect(chips.first()).toHaveText('DNS Lookup \u2192 /dns-lookup');

    // A CIDR is unambiguous, and its slash is a real segment boundary.
    await input.fill('10.0.0.0/22');
    await expect(chips).toHaveCount(1);
    await expect(chips.first()).toHaveAttribute('href', '/subnet-calculator/10.0.0.0/22');

    await input.press('Enter');
    await expect(page).toHaveURL(/\/subnet-calculator\/10\.0\.0\.0\/22$/);
    await expect(page.locator('h1')).toHaveText('Subnet Calculator');
  });

  test('/404 reads the failed URL rather than dead-ending', async ({ page }) => {
    // The page knows the one thing the index does not: the URL that failed.
    await page.goto('/subnet-calcualtor');
    await expect(page.locator('h1')).toHaveText('That page does not exist.');
    await expect(page.locator('#rt-404-path')).toHaveText('/subnet-calcualtor');
    await expect(page.locator('#rt-404-guess')).toBeVisible();
    await expect(page.locator('#rt-404-grid .rt-card:visible')).toHaveCount(1);
    await expect(page.locator('#rt-404-grid .rt-card:visible')).toHaveAttribute(
      'href',
      '/subnet-calculator'
    );

    // A wrong tool name carrying a right value: the domain lands in the panel.
    await page.goto('/whois/example.com');
    await expect(page.locator('#rt-jump-input')).toHaveValue('example.com');
    await expect(page.locator('#rt-jump-hint a')).toHaveCount(5);

    // A guess nobody could act on is worse than silence.
    await page.goto('/sdfsdfsdf');
    await expect(page.locator('#rt-404-guess')).not.toBeVisible();
    await expect(page.locator('#rt-jump')).toBeVisible();
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
    // The palette picker is gone: Signal ships two themes, so the appearance
    // controls collapsed from a group (picker + mode cycle) to the single
    // theme cell, which is a sibling of the nav links rather than a wrapper.
    await expect(page.locator('[data-theme-toggle]')).toBeVisible();
    await expect(page.locator('[data-palette-toggle]')).toHaveCount(0);

    await page.keyboard.press('Escape');
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'false');

    await menuToggle.click();
    // A raw coordinate rather than a locator, deliberately. The open panel
    // covers the middle of the viewport down past y≈240, so the h1 this used
    // to click is underneath the menu, not outside it, and Playwright
    // correctly refuses the click as intercepted by the panel's own "Tools"
    // link. Every locator-based alternative gets scrolled into view first,
    // which puts it back under the sticky header. This point is in main's
    // left gutter — clear of the panel, not a link, and needs no scrolling.
    await page.mouse.click(10, 300);
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

  // `russ-tools-palette` is a retired key — the six alternate palettes went
  // with the Signal redesign and nothing reads it any more. It stays here on
  // purpose: an orphaned site-preference key is exactly what "Clear all tool
  // data" must leave alone, and a stored value has to degrade to a valid
  // theme rather than throw on the pre-paint path.
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

  test('/m365-licenses/:query resolves a SKU GUID', async ({ page }) => {
    // Microsoft 365 E3. A GUID rather than a part number on purpose: it is
    // what Graph hands back, and it is the case the tool exists to answer.
    await expectRewrite(
      page,
      '/m365-licenses/05e9a617-0261-4cee-bb44-138d3ef5d965',
      'Microsoft 365 License Decoder'
    );
    await expect(page.getByLabel('Search licence SKUs')).toHaveValue(
      '05e9a617-0261-4cee-bb44-138d3ef5d965'
    );
    await expect(page.getByText('Microsoft 365 E3').first()).toBeVisible();
  });

  test('/m365-licenses/:query opens the plan tab for a service plan', async ({ page }) => {
    // SHAREPOINTWAC is a service plan and NOT also a SKU part number, so the
    // island has to switch tabs rather than sit on the SKU tab showing a
    // no-match. Terms that are both (INTUNE_A is a plan *and* the standalone
    // Intune SKU) deliberately resolve as the SKU instead.
    await expectRewrite(page, '/m365-licenses/SHAREPOINTWAC', 'Microsoft 365 License Decoder');
    await expect(page.getByText('Office for the Web').first()).toBeVisible();
    await expect(page.getByText(/Included in \d+ SKUs/)).toBeVisible();
  });

  test('/azure-rbac/:role opens a role by slug', async ({ page }) => {
    await expectRewrite(page, '/azure-rbac/storage-blob-data-reader', 'Azure RBAC Role Explorer');
    await expect(page.getByText('Storage Blob Data Reader').first()).toBeVisible();
    // The permission buckets are what the deep link is for.
    await expect(page.getByText('Actions', { exact: true }).first()).toBeVisible();
  });

  test('/conditional-access explains a pasted policy set', async ({ page }) => {
    // No params: the policy is pasted, so the sample button is the entry point.
    const response = await page.goto('/conditional-access');
    expect(response.status()).toBe(200);
    await expect(page.locator('h1')).toHaveText('Conditional Access Analyser');

    await page.getByRole('button', { name: 'Load sample' }).click();

    // GUIDs resolved to names is the whole point of the who/what rows.
    await expect(page.getByText('the Global Administrator role', { exact: false })).toBeVisible();
    await expect(page.getByText('Office 365 Exchange Online', { exact: false })).toBeVisible();
    // Report-only must be visibly distinct from enabled.
    await expect(page.getByText('Report-only').first()).toBeVisible();

    await page.getByRole('tab', { name: /Gaps/ }).click();
    await expect(page.getByText('No enabled policy blocks legacy authentication')).toBeVisible();
    await expect(page.getByText('not a tenant assessment', { exact: false })).toBeVisible();
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

  test('/dns-lookup/:domain runs the lookup', async ({ page }) => {
    // Added with the paste panel: the island already read a `domain` param
    // through useLookupTool, only the manifest was missing it.
    await expectRewrite(page, '/dns-lookup/example.com', 'DNS Lookup Tool');
    await expect(page.locator('#domain')).toHaveValue('example.com');
  });

  test('/cron/:expression seeds the builder', async ({ page }) => {
    // The one deep link whose value carries both spaces and a slash, so it is
    // also the proof that a %2F survives the Pages rewrite intact.
    await expectRewrite(page, '/cron/*%2F5%20*%20*%20*%20*', 'CRON Expression Builder');
    await expect(page.getByText('*/5 * * * *').first()).toBeVisible();
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
