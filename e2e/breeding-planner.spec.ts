import { test, expect, Page, Route } from '@playwright/test';

/**
 * E2E: Breeding cycle planner on the breeding detail page.
 *
 * Log a mating → due date + milestones appear → confirm pregnancy → complete a milestone.
 * The API is mocked (like the other e2e specs), so no backend is needed.
 */

const BREEDER = {
  id: '00000000-0000-0000-0000-000000000020',
  email: 'breeder@test.com',
  name: 'Test Breeder',
  is_breeder: true,
  is_active: true,
  is_superuser: false,
  is_verified: true,
  account_type: 'breeder',
};

const BREEDING = {
  id: 11,
  description: 'Honey x Rex — fall litter',
  status: 'InProcess',
  stage: 'Planned',
  due_date: null,
  created_at: '2026-10-01T12:00:00Z',
  updated_at: '2026-10-01T12:00:00Z',
  parent_pets: [
    { id: 'dam-1', name: 'Honey', gender: 'Female', breed_name: 'Airedale Terrier' },
    { id: 'sire-1', name: 'Rex', gender: 'Male', breed_name: 'Airedale Terrier' },
  ],
  puppies: null,
  application_form: null,
};

const EMPTY_PLANNER = {
  breeding_id: 11, stage: 'Planned', status: 'InProcess', kind: 'dog',
  ovulation_date: null, anchor_date: null, anchored_on_ovulation: false,
  due_date: null, due_window_start: null, due_window_end: null, gestation_day: null,
  allowed_stage_targets: [], matings: [], progesterone_tests: [], milestones: [],
};

function milestone(id: string, key: string, title: string, due_on: string, completed_at: string | null = null) {
  return { id, key, title, due_on, remind_on: due_on, completed_at, is_custom: false, is_overdue: false };
}

function matedPlanner(stage: 'Mated' | 'Confirmed', ultrasoundDone = false) {
  return {
    ...EMPTY_PLANNER,
    stage,
    anchor_date: '2026-09-10',
    due_date: '2026-11-12',
    due_window_start: '2026-11-07',
    due_window_end: '2026-11-17',
    gestation_day: 30,
    allowed_stage_targets: stage === 'Mated' ? ['Confirmed', 'Missed'] : ['Mated', 'Missed'],
    matings: [{
      id: 'm1', mated_on: '2026-09-10', method: 'Natural', sire_id: 'sire-1',
      sire_name: 'Rex', outside_sire_name: null, notes: null,
    }],
    milestones: [
      milestone('x1', 'ultrasound', 'Ultrasound — confirm pregnancy', '2026-10-08', ultrasoundDone ? '2026-10-10T12:00:00Z' : null),
      milestone('x2', 'xray', 'X-ray — count the litter', '2026-11-04'),
      milestone('x5', 'due', 'Due date', '2026-11-12'),
    ],
  };
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function mockApi(page: Page) {
  const calls: { method: string; path: string; body: any }[] = [];
  await page.addInitScript(() => localStorage.setItem('id_token', 'fake-jwt-token-for-testing'));
  await page.route('**/api/**', async route => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const method = req.method();
    if (path.includes('/planner') || path.includes('/matings') || path.includes('/milestones')) {
      calls.push({ method, path, body: req.postDataJSON?.() ?? null });
    }
    if (path === '/api/auth/users/me') return json(route, BREEDER);
    if (path === '/api/breedings/11') return json(route, BREEDING);
    if (path === '/api/breedings/11/planner' && method === 'GET') return json(route, EMPTY_PLANNER);
    if (path === '/api/breedings/11/matings' && method === 'POST') return json(route, matedPlanner('Mated'), 201);
    if (path === '/api/breedings/11/planner' && method === 'PATCH') return json(route, matedPlanner('Confirmed'));
    if (path === '/api/breedings/11/milestones/x1' && method === 'PATCH') return json(route, matedPlanner('Confirmed', true));
    return json(route, []);
  });
  return calls;
}

test.describe('Breeding planner', () => {
  test('log a mating, confirm the pregnancy and complete a milestone', async ({ page }) => {
    const calls = await mockApi(page);
    await page.goto('/breeding/11');

    const planner = page.locator('app-breeding-planner');
    await expect(planner).toContainText('Log a mating to get a due date and reminders.');

    await planner.getByRole('button', { name: 'Log mating' }).click();
    await page.fill('#mating-date', '2026-09-10');
    await expect(page.locator('#mating-sire')).toHaveValue('sire-1');
    await page.locator('.planner-modal').getByRole('button', { name: 'Save', exact: true }).click();

    await expect(planner).toContainText('Due Nov 12, 2026');
    await expect(planner).toContainText('X-ray — count the litter');
    expect(calls.find(c => c.method === 'POST')?.body).toEqual(expect.objectContaining({
      mated_on: '2026-09-10', method: 'Natural', sire_id: 'sire-1',
    }));

    await planner.getByRole('button', { name: 'Confirm pregnancy' }).click();
    await expect(planner.locator('.planner-heading')).toContainText('Confirmed');

    await planner.locator('label.milestone-check', { hasText: 'Ultrasound' }).click();
    await expect(planner.locator('.milestone.is-done')).toContainText('Ultrasound');
    expect(calls.some(c => c.method === 'PATCH' && c.path.endsWith('/milestones/x1') && c.body?.completed === true)).toBe(true);
  });
});
