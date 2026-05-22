import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests: Service Account — Mobile Bottom Navigation
 *
 * Validates: Requirements 8.4, 8.5
 *
 * At 390×844 viewport (iPhone 14 size):
 * - Service provider accounts show the Services tab in the mobile bottom nav
 * - Service provider accounts do NOT show Pets or Breedings tabs
 * - Breeder accounts show the Pets tab and do NOT show the Services tab
 */

const MOCK_SERVICE_PROVIDER = {
  id: '00000000-0000-0000-0000-000000000010',
  email: 'provider@test.com',
  name: 'Test Service Provider',
  is_breeder: false,
  is_active: true,
  is_superuser: false,
  is_verified: true,
  account_type: 'service',
};

const MOCK_BREEDER = {
  id: '00000000-0000-0000-0000-000000000020',
  email: 'breeder@test.com',
  name: 'Test Breeder',
  is_breeder: true,
  is_active: true,
  is_superuser: false,
  is_verified: true,
  account_type: 'breeder',
};

async function setupAuthSession(page: Page, user: typeof MOCK_SERVICE_PROVIDER | typeof MOCK_BREEDER) {
  await page.route('**/api/auth/users/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    })
  );

  await page.addInitScript(() => {
    localStorage.setItem('id_token', 'fake-jwt-token-for-testing');
  });
}

async function navigateToDashboard(page: Page) {
  await page.goto('/dashboard');
  await page.waitForSelector('.mobile-bottom-nav', { state: 'attached', timeout: 15000 });
}

test.describe('Service Account — Mobile Bottom Navigation (390×844)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.describe('Service Provider account', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthSession(page, MOCK_SERVICE_PROVIDER);
      await navigateToDashboard(page);
    });

    test('should show the Services tab in the mobile bottom nav', async ({ page }) => {
      const mobileNav = page.locator('.mobile-bottom-nav');
      await expect(mobileNav).toBeVisible();
      const servicesLink = mobileNav.locator('a[aria-label="Services"], a:has-text("Services")');
      await expect(servicesLink).toBeVisible();
    });

    test('should NOT show the Pets tab in the mobile bottom nav', async ({ page }) => {
      const mobileNav = page.locator('.mobile-bottom-nav');
      await expect(mobileNav).toBeVisible();
      const petsLink = mobileNav.locator('a[aria-label="Pets"], a:has-text("Pets")');
      await expect(petsLink).not.toBeVisible();
    });

    test('should NOT show the Breedings tab in the mobile bottom nav', async ({ page }) => {
      const mobileNav = page.locator('.mobile-bottom-nav');
      await expect(mobileNav).toBeVisible();
      const breedingsLink = mobileNav.locator('a[aria-label="Breedings"], a:has-text("Breedings")');
      await expect(breedingsLink).not.toBeVisible();
    });

    test('should show Home, Services, Messages, and Settings tabs', async ({ page }) => {
      const mobileNav = page.locator('.mobile-bottom-nav');
      await expect(mobileNav).toBeVisible();
      await expect(mobileNav.locator('a[aria-label="Dashboard"], a:has-text("Home")')).toBeVisible();
      await expect(mobileNav.locator('a[aria-label="Services"], a:has-text("Services")')).toBeVisible();
      await expect(mobileNav.locator('a[aria-label="Messages"], a:has-text("Messages")')).toBeVisible();
      await expect(mobileNav.locator('a[aria-label="Settings"], a:has-text("Settings")')).toBeVisible();
    });
  });

  test.describe('Breeder account', () => {
    test.beforeEach(async ({ page }) => {
      await setupAuthSession(page, MOCK_BREEDER);
      await navigateToDashboard(page);
    });

    test('should show the Pets tab in the mobile bottom nav', async ({ page }) => {
      const mobileNav = page.locator('.mobile-bottom-nav');
      await expect(mobileNav).toBeVisible();
      const petsLink = mobileNav.locator('a[aria-label="Pets"], a:has-text("Pets")');
      await expect(petsLink).toBeVisible();
    });

    test('should NOT show the Services tab in the mobile bottom nav', async ({ page }) => {
      const mobileNav = page.locator('.mobile-bottom-nav');
      await expect(mobileNav).toBeVisible();
      const servicesLink = mobileNav.locator('a[aria-label="Services"], a:has-text("Services")');
      await expect(servicesLink).not.toBeVisible();
    });

    test('should show Home, Pets, Breedings, Messages, and Settings tabs', async ({ page }) => {
      const mobileNav = page.locator('.mobile-bottom-nav');
      await expect(mobileNav).toBeVisible();
      await expect(mobileNav.locator('a[aria-label="Dashboard"], a:has-text("Home")')).toBeVisible();
      await expect(mobileNav.locator('a[aria-label="Pets"], a:has-text("Pets")')).toBeVisible();
      await expect(mobileNav.locator('a[aria-label="Breedings"], a:has-text("Breedings")')).toBeVisible();
      await expect(mobileNav.locator('a[aria-label="Messages"], a:has-text("Messages")')).toBeVisible();
      await expect(mobileNav.locator('a[aria-label="Settings"], a:has-text("Settings")')).toBeVisible();
    });
  });
});
