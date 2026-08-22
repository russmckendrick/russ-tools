import { test, expect } from '@playwright/test';

import { loadManifests } from '../src/tools/loadManifests.mjs';

const tools = (await loadManifests()).sort((a, b) => a.id.localeCompare(b.id));

/**
 * The help matrix. Help is a page (/:tool/help), not a drawer — see
 * docs/BEHAVIOR_CHANGES.md. Running it here rather than in Vitest proves the
 * one thing only the Cloudflare layer can: for tools with param deep-links,
 * the `/help` self-rewrite in the generated _redirects wins over the
 * `/:param` rewrite that would otherwise swallow the page.
 */
for (const tool of tools) {
  test(`${tool.id} links to its documentation-backed help page`, async ({ page }) => {
    await page.goto(tool.path);

    const trigger = page.locator('[data-tool-actions]').getByRole('link', { name: 'Help' });
    await expect(trigger).toBeVisible();
    await trigger.click();

    await expect(page).toHaveURL(new RegExp(`${tool.path}/help$`));
    await expect(
      page.getByRole('heading', { level: 1, name: `${tool.title} help` })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Quick start' })).toBeVisible();

    await page.getByRole('link', { name: `Back to ${tool.title}` }).click();
    await expect(page).toHaveURL(new RegExp(`${tool.path}$`));
  });
}

for (const tool of [
  { id: 'azure-kql', path: '/azure-kql', action: 'Share Configuration' },
  {
    id: 'azure-naming',
    path: '/azure-naming',
    action: 'Copy Configuration Share URL',
  },
]) {
  test(`${tool.id} keeps its share action and Help in one row`, async ({ page }) => {
    await page.goto(tool.path);

    const share = page.getByRole('button', { name: tool.action });
    const help = page.locator('[data-tool-actions]').getByRole('link', { name: 'Help' });
    await expect(share).toBeVisible();
    await expect(help).toBeVisible();

    const [shareBox, helpBox] = await Promise.all([share.boundingBox(), help.boundingBox()]);
    expect(shareBox).not.toBeNull();
    expect(helpBox).not.toBeNull();
    expect(Math.abs(shareBox.y - helpBox.y)).toBeLessThan(2);
  });
}
