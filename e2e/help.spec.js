import { test, expect } from '@playwright/test';

import { loadManifests } from '../src/tools/loadManifests.mjs';

const tools = (await loadManifests()).sort((a, b) => a.id.localeCompare(b.id));

for (const tool of tools) {
  test(`${tool.id} opens its documentation-backed help`, async ({ page }) => {
    await page.goto(tool.path);

    const trigger = page.locator('[data-tool-actions]').getByRole('button', { name: 'Help' });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: `${tool.title} help` })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Quick start' })).toBeVisible();

    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
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
    const help = page.locator('[data-tool-actions]').getByRole('button', { name: 'Help' });
    await expect(share).toBeVisible();
    await expect(help).toBeVisible();

    const [shareBox, helpBox] = await Promise.all([share.boundingBox(), help.boundingBox()]);
    expect(shareBox).not.toBeNull();
    expect(helpBox).not.toBeNull();
    expect(Math.abs(shareBox.y - helpBox.y)).toBeLessThan(2);
  });
}
