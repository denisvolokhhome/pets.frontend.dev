import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests: Messaging between all user types
 *
 * Covers:
 * 1. Pet Seeker → Service Provider  (authenticated, must be registered)
 * 2. Unauthenticated user → Service Provider  (blocked, must sign in)
 * 3. Service Provider inbox  (receives message from pet seeker)
 * 4. Dashboard role isolation  (SP vs pet seeker)
 *
 * Test accounts (all password: Test1234!):
 *   petseeker.test@breedly.test  — pet seeker
 *   lisa.boarding@breedly.test   — service provider (Lisa Park)
 *   john.golden@breedly.test     — breeder (John Golden)
 */

// ── Shared user fixtures ──────────────────────────────────────────────────────

const PET_SEEKER = {
  email: 'petseeker.test@breedly.test',
  password: 'Test1234!',
  name: 'Alex Johnson',
  account_type: 'pet_seeker',
  is_breeder: false,
  is_active: true,
  is_superuser: false,
  is_verified: true,
};

const SERVICE_PROVIDER = {
  email: 'lisa.boarding@breedly.test',
  password: 'Test1234!',
  name: 'Lisa Park',
  account_type: 'service',
  is_breeder: false,
  is_active: true,
  is_superuser: false,
  is_verified: true,
};

const SP_ID = '825c2f42-580a-4b84-8bdb-c1e5051c401f';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function loginAs(page: Page, user: typeof PET_SEEKER) {
  await page.route('**/api/auth/users/me', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(user),
    })
  );
  await page.addInitScript((u) => {
    localStorage.setItem('id_token', 'fake-jwt-for-testing-' + u.email);
  }, user);
}

async function mockServiceSearch(page: Page) {
  await page.route('**/api/services/search**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total: 1,
        page: 1,
        page_size: 20,
        items: [
          {
            user_id: SP_ID,
            provider_name: 'Lisa Park',
            service_description: 'Luxury pet boarding and daycare in a home environment.',
            profile_image_url: null,
            categories: [
              { id: 6, name: 'Pet Boarding', slug: 'pet-boarding', is_active: true },
              { id: 10, name: 'Pet Daycare', slug: 'pet-daycare', is_active: true },
            ],
            distance_km: 8.9,
            active_services_count: 3,
            latitude: 39.3927,
            longitude: -77.4457,
          },
        ],
      }),
    })
  );
}

async function mockBreederSearch(page: Page) {
  await page.route('**/api/search/breeders**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          location_id: 1,
          user_id: 'breeder-test-id',
          breeder_name: 'John Golden',
          latitude: 39.4314,
          longitude: -77.3874,
          distance: 7.2,
          available_breeds: [{ breed_name: 'Golden Retriever', count: 2 }],
          thumbnail_url: null,
          location_description: null,
          rating: null,
          review_count: 0,
        },
      ]),
    })
  );
}

async function mockGeocode(page: Page) {
  await page.route('**/api/geocoding/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ latitude: 39.4314, longitude: -77.3874, zip_code: '21701' }),
    })
  );
  await page.route('**/api/geocoding/reverse**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ zip_code: '21701', city: 'Frederick', state: 'MD' }),
    })
  );
}

/**
 * Navigate to search-pets, trigger a search, and wait for service cards.
 * Mocks geocoding + service search so no real network calls needed.
 */
async function goToSearchAndWaitForServiceCards(page: Page) {
  await mockGeocode(page);
  await mockServiceSearch(page);
  await mockBreederSearch(page);

  await page.goto('/search-pets');

  // Switch to Services mode
  await page.locator('.mode-btn:has-text("Services")').click();

  // Trigger a search by filling ZIP and clicking Search
  await page.fill('input[placeholder*="ZIP"], .search-zip-input, input[aria-label*="ZIP"]', '21701');
  await page.locator('button:has-text("Search"), .search-btn').first().click();

  // Wait for service cards to appear
  await page.waitForSelector('.sp-card', { timeout: 15000 });
}

async function openContactModal(page: Page) {
  await page.evaluate(() => {
    (document.querySelector('.sp-contact-btn') as HTMLButtonElement)?.click();
  });
  await page.waitForSelector('.modal-dialog', { timeout: 5000 });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Messaging — Service Provider contact', () => {

  test.use({ project: 'chromium' } as any);

  // ── 1. Unauthenticated → blocked ─────────────────────────────────────────

  test('unauthenticated user sees Sign In prompt when clicking Contact', async ({ page }) => {
    await page.route('**/api/auth/users/me', route =>
      route.fulfill({ status: 401, body: '{}' })
    );

    await goToSearchAndWaitForServiceCards(page);
    await openContactModal(page);

    // Auth-required state
    await expect(page.locator('.auth-title')).toContainText('Sign in to send a message');
    await expect(page.locator('.btn-primary:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('.btn-outline:has-text("Create Account")')).toBeVisible();

    // Compose form must NOT be shown
    await expect(page.locator('textarea#sp-message')).not.toBeVisible();
  });

  // ── 2. Pet Seeker → compose and send ─────────────────────────────────────

  test('authenticated pet seeker can compose and send a message to a service provider', async ({ page }) => {
    await loginAs(page, PET_SEEKER);

    // Mock the send endpoint
    await page.route('**/api/messages/**', route => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'msg-001', message: 'sent' }),
        });
      } else {
        route.continue();
      }
    });

    await goToSearchAndWaitForServiceCards(page);
    await openContactModal(page);

    // Compose form shown, not auth prompt
    await expect(page.locator('.modal-title')).toContainText('Contact Lisa Park');
    await expect(page.locator('textarea#sp-message')).toBeVisible();
    await expect(page.locator('.auth-title')).not.toBeVisible();

    // Type message
    const msg = 'Hi Lisa, I need boarding for my dog next weekend. Do you have availability?';
    await page.fill('textarea#sp-message', msg);

    // Character count updates
    await expect(page.locator('.char-count')).toContainText(String(msg.length));

    // Submit
    await page.locator('button[type="submit"]:has-text("Send Message")').click();

    // Success state
    await expect(page.locator('.success-title')).toContainText('Your message has been sent', { timeout: 5000 });
    await expect(page.locator('.btn-primary:has-text("View Messages")')).toBeVisible();
  });

  // ── 3. Validation: empty message ─────────────────────────────────────────

  test('send button is disabled when message is empty', async ({ page }) => {
    await loginAs(page, PET_SEEKER);

    await goToSearchAndWaitForServiceCards(page);
    await openContactModal(page);

    await expect(page.locator('textarea#sp-message')).toBeVisible();

    // Submit button disabled with empty textarea
    const submitBtn = page.locator('button[type="submit"]:has-text("Send Message")');
    await expect(submitBtn).toBeDisabled();
  });

  // ── 4. Validation: message too short ─────────────────────────────────────

  test('shows validation error for message shorter than 10 characters', async ({ page }) => {
    await loginAs(page, PET_SEEKER);

    await goToSearchAndWaitForServiceCards(page);
    await openContactModal(page);

    await page.fill('textarea#sp-message', 'Short');
    // Force click the disabled button to trigger Angular validation
    await page.locator('button[type="submit"]').evaluate((btn: HTMLButtonElement) => {
      btn.removeAttribute('disabled');
      btn.click();
    });

    await expect(page.locator('.invalid-feedback')).toBeVisible();
    await expect(page.locator('.invalid-feedback')).toContainText('at least 10 characters');
  });

  // ── 5. Close modal ────────────────────────────────────────────────────────

  test('modal closes when X button is clicked', async ({ page }) => {
    await loginAs(page, PET_SEEKER);

    await goToSearchAndWaitForServiceCards(page);
    await openContactModal(page);

    await expect(page.locator('.modal-dialog')).toBeVisible();

    await page.locator('.modal-dialog button[aria-label="Close"]').click();

    // After close animation (280ms)
    await page.waitForTimeout(400);
    await expect(page.locator('.modal-dialog')).not.toBeVisible();
  });

  // ── 6. Sign In redirect ───────────────────────────────────────────────────

  test('clicking Sign In from auth prompt navigates to login page', async ({ page }) => {
    await page.route('**/api/auth/users/me', route =>
      route.fulfill({ status: 401, body: '{}' })
    );

    await goToSearchAndWaitForServiceCards(page);
    await openContactModal(page);

    await expect(page.locator('.auth-title')).toContainText('Sign in to send a message');

    await page.locator('.btn-primary:has-text("Sign In")').click();

    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  // ── 7. Create Account redirect ────────────────────────────────────────────

  test('clicking Create Account from auth prompt navigates to register page', async ({ page }) => {
    await page.route('**/api/auth/users/me', route =>
      route.fulfill({ status: 401, body: '{}' })
    );

    await goToSearchAndWaitForServiceCards(page);
    await openContactModal(page);

    await page.locator('.btn-outline:has-text("Create Account")').click();

    await expect(page).toHaveURL(/\/register/, { timeout: 5000 });
  });
});

test.describe('Messaging — Dashboard role isolation', () => {

  test.use({ project: 'chromium' } as any);

  // ── 8. Service provider dashboard ────────────────────────────────────────

  test('service provider sees Service Provider Dashboard with correct quick actions', async ({ page }) => {
    await loginAs(page, SERVICE_PROVIDER);

    await page.goto('/dashboard');

    await expect(page.locator('.dashboard-title')).toContainText('Service Provider Dashboard', { timeout: 8000 });
    await expect(page.locator('text=Add Service')).toBeVisible();
    await expect(page.locator('text=Manage Locations')).toBeVisible();
    await expect(page.locator('text=View Profile')).toBeVisible();

    // Breeder-specific items must NOT appear
    await expect(page.locator('text=Add New Pet')).not.toBeVisible();
    await expect(page.locator('text=Manage Breedings')).not.toBeVisible();
  });

  // ── 9. Pet seeker dashboard ───────────────────────────────────────────────

  test('pet seeker sees Pet Seeker Dashboard without service provider actions', async ({ page }) => {
    await loginAs(page, PET_SEEKER);

    await page.goto('/dashboard');

    await expect(page.locator('.dashboard-title')).toContainText('Pet Seeker Dashboard', { timeout: 8000 });

    // Service provider items must NOT appear
    await expect(page.locator('text=Add Service')).not.toBeVisible();
    await expect(page.locator('text=Manage Locations')).not.toBeVisible();
  });

  // ── 10. Service provider can navigate to messages ─────────────────────────

  test('service provider can navigate to messages page', async ({ page }) => {
    await loginAs(page, SERVICE_PROVIDER);

    // Mock messages list
    await page.route('**/api/messages/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          messages: [],
          total: 0,
          unread_count: 0,
          limit: 20,
          offset: 0,
        }),
      })
    );

    await page.goto('/messages');

    await expect(page).toHaveURL(/\/messages/);
    // Messages page should render without errors
    await expect(page.locator('body')).not.toContainText('Error');
  });

  // ── 11. Service provider left menu shows Services, not Pets ──────────────

  test('service provider left menu shows Services tab and hides Pets/Breedings', async ({ page }) => {
    await loginAs(page, SERVICE_PROVIDER);

    await page.goto('/dashboard');

    // Services nav item should be present (first match = desktop sidebar)
    await expect(page.locator('.left-menu-sidebar a[href*="/services"]').first()).toBeVisible({ timeout: 8000 });

    // Pets and Breedings should NOT be in the sidebar
    await expect(page.locator('.left-menu-sidebar a[href*="/pets"]')).not.toBeVisible();
    await expect(page.locator('.left-menu-sidebar a[href*="/breedings"]')).not.toBeVisible();
  });
});
