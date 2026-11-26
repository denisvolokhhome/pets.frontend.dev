import { test, expect, Page, Route } from '@playwright/test';

/**
 * E2E: the signed-in mobile menu (hamburger panel below lg).
 *
 * The panel clips its content, so the account block must be laid out inline
 * (avatar, name, Log out) rather than the desktop avatar dropdown, which used to
 * open off-screen and show only a cut-off sliver. The API is mocked.
 */

const BREEDER = {
  id: '00000000-0000-0000-0000-000000000030',
  email: 'breeder@test.com',
  name: 'Test Breeder',
  is_breeder: true,
  is_active: true,
  is_superuser: false,
  is_verified: true,
  account_type: 'breeder',
};

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function mockApi(page: Page) {
  const calls: string[] = [];
  await page.addInitScript(() => localStorage.setItem('id_token', 'fake-jwt-token-for-testing'));
  await page.route('**/api/**', async route => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    calls.push(`${req.method()} ${path}`);
    if (path === '/api/auth/users/me' || path === '/api/users/me') return json(route, BREEDER);
    if (path === '/api/auth/jwt/logout') return route.fulfill({ status: 204 });
    return json(route, []);
  });
  return calls;
}

test.describe('Mobile menu (signed in)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('shows the account inline with a reachable Log out', async ({ page }) => {
    const calls = await mockApi(page);
    await page.goto('/dashboard');

    await page.getByRole('button', { name: 'Toggle navigation menu' }).click();
    const panel = page.locator('#navbarNav');
    // Wait for the max-height open transition to finish before measuring
    await expect.poll(() => panel.evaluate(el => el.getAnimations().length === 0 && el.clientHeight > 0)).toBe(true);

    // Every link has its icon, Dashboard included
    await expect(panel.locator('a[href="/dashboard"] i.bi-speedometer2')).toBeVisible();

    // Inline account block, no popover dropdown inside the panel
    await expect(panel.locator('.profile-menu-inline')).toContainText('Test Breeder');
    await expect(panel.locator('.profile-menu-inline')).toContainText('breeder@test.com');
    await expect(panel.locator('.profile-menu-container')).toHaveCount(0);

    // Log out sits fully inside the visible panel and the viewport
    const logout = panel.getByRole('button', { name: 'Log out' });
    await expect(logout).toBeVisible();
    const box = (await logout.boundingBox())!;
    const panelBox = (await panel.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    expect(box.y + box.height).toBeLessThanOrEqual(panelBox.y + panelBox.height + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(844);

    await logout.click();
    await expect.poll(() => calls.includes('POST /api/auth/jwt/logout')).toBe(true);
    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => localStorage.getItem('id_token'))).toBeNull();
  });
});
