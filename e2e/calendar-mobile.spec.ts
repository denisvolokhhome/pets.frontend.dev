import { test, expect, Page, Route } from '@playwright/test';

/**
 * E2E: the breeder calendar at phone width.
 *
 * Below 768px the big page-header card gives way to a compact sticky bar (title + round
 * Add button), and the content keeps a side gutter instead of touching the screen edges.
 * The API is mocked.
 */

const BREEDER = { id: '00000000-0000-0000-0000-000000000040', email: 'breeder@test.com', name: 'Test Breeder',
  is_breeder: true, is_active: true, is_superuser: false, is_verified: true, account_type: 'breeder' };
const PETS = ['Honey', 'Rex', 'Bella', 'Luna', 'Daisy', 'Molly', 'Coco', 'Ruby', 'Rosie', 'Maple', 'Hazel']
  .map((name, i) => ({ id: `pet-${i}`, name, gender: 'Female' }));
const CALENDAR = {
  start: '2026-11-01', end: '2026-12-05', pets: PETS,
  events: [{ id: 'e1', type: 'heat_start', date: '2026-11-16', pet_id: 'pet-0', pet_name: 'Honey',
             cycle_id: 'c1', reminder_id: null, in_progress: true, note: null }],
  in_heat: [{ cycle_id: 'c1', pet_id: 'pet-0', pet_name: 'Honey', start_date: '2026-11-16', end_date: null, in_progress: true }],
};

function json(route: Route, body: unknown) {
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
}

async function mockApi(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('id_token', 'fake-jwt-token-for-testing');
    localStorage.setItem('cookies_accepted', '1');
  });
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/auth/users/me' || path === '/api/users/me') return json(route, BREEDER);
    if (path.endsWith('/calendar')) return json(route, CALENDAR);
    return json(route, []);
  });
}

test.describe('Breeder calendar (phone)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('compact header bar and a side gutter', async ({ page }) => {
    await mockApi(page);
    await page.goto('/calendar');

    const bar = page.locator('.cal-mobile-bar');
    await expect(bar).toBeVisible();
    await expect(bar.getByRole('heading', { name: 'Calendar' })).toBeVisible();
    await expect(page.locator('app-page-header')).toBeHidden();

    // One slim row instead of the stacked card
    expect((await bar.boundingBox())!.height).toBeLessThanOrEqual(64);

    // The grid and the legend keep a gutter and stay on screen
    const grid = (await page.locator('.cal-grid--compact').boundingBox())!;
    expect(grid.x).toBeGreaterThanOrEqual(12);
    expect(grid.x + grid.width).toBeLessThanOrEqual(390 - 12);
    const legend = (await page.locator('.cal-legend').boundingBox())!;
    expect(legend.x + legend.width).toBeLessThanOrEqual(390 - 12);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

    // The round Add button is the same action as the desktop "Add event"
    const add = bar.getByRole('button', { name: 'Add event' });
    await expect(add).toBeEnabled();
    await add.click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
