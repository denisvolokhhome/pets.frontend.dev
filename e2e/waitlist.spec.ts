import { test, expect, Page, Route } from '@playwright/test';

/**
 * E2E: Breeder waitlists & deposits.
 *
 * The feature flag is build-time (environment.enableWaitlist), so:
 *  - the flow test needs a flag-on build. Serve one with
 *      npx ng serve --configuration waitlist --port 4300
 *    and run with WAITLIST_BASE_URL=http://localhost:4300. It is skipped otherwise.
 *  - the flag-off smoke runs against the normal build.
 * The API is fully mocked (like the other e2e specs), so no backend is needed.
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

const SEEKER = {
  id: '00000000-0000-0000-0000-000000000030',
  email: 'seeker@test.com',
  name: 'Sam Seeker',
  is_breeder: false,
  is_active: true,
  is_superuser: false,
  is_verified: true,
  account_type: 'pet_seeker',
};

const OFFSPRING_ID = 'off-1';
const BREEDING_ID = 11;

const OFFSPRING = {
  id: OFFSPRING_ID,
  name: 'Biscuit',
  gender: 'Female',
  status: 'Available',
  user_id: BREEDER.id,
  breeding_id: BREEDING_ID,
  breed_id: 1,
  breed_name: 'Airedale Terrier',
  description: 'A sweet girl.',
  price: '2500.00',
  images: [],
  is_favorited: false,
  created_at: '2026-10-01T12:00:00Z',
  updated_at: '2026-10-01T12:00:00Z',
};

const BREEDING = {
  id: BREEDING_ID,
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
  puppies: [OFFSPRING],
  application_form: null,
};

const EMPTY_PLANNER = {
  breeding_id: BREEDING_ID, stage: 'Planned', status: 'InProcess', kind: 'dog',
  ovulation_date: null, anchor_date: null, anchored_on_ovulation: false,
  due_date: null, due_window_start: null, due_window_end: null, gestation_day: null,
  allowed_stage_targets: [], matings: [], progesterone_tests: [], milestones: [],
};

const INFO = {
  breeder_id: BREEDER.id,
  breedery_name: 'Happy Tails',
  deposit_amount: '300.00',
  deposit_policy: 'Refundable until the litter is born.',
  application_form: null,
  has_active_entry: false,
};

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

type Call = { method: string; path: string; body: any };

/** Mocks the API. `state.role` picks who /auth/users/me returns; waitlist state advances with calls. */
async function mockApi(page: Page) {
  const calls: Call[] = [];
  const state = {
    role: 'seeker' as 'seeker' | 'breeder',
    entry: null as any,
    offspringStatus: 'Available',
  };
  const entryBase = () => ({
    id: 'e1',
    breeder_id: BREEDER.id,
    user_id: SEEKER.id,
    source: 'request',
    display_name: SEEKER.name,
    contact_email: SEEKER.email,
    contact_phone: null,
    breeding_id: null,
    breeding_label: null,
    request_breeding_id: BREEDING_ID,
    status: 'pending',
    sex_preference: 'Any',
    preference_notes: null,
    application_answers: null,
    queue_date: null,
    position: null,
    position_override: null,
    override_note: null,
    deposit_status: 'none',
    deposit_amount: null,
    deposit_received_on: null,
    deposit_method: null,
    offspring_id: null,
    possible_duplicate: false,
    created_at: '2026-10-10T12:00:00Z',
  });

  await page.addInitScript(() => localStorage.setItem('id_token', 'fake-jwt-token-for-testing'));
  await page.route('**/api/**', async route => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const method = req.method();
    const body = req.postDataJSON?.() ?? null;
    if (path.includes('/waitlist/') && method !== 'GET') calls.push({ method, path, body });

    if (path === '/api/auth/users/me') return json(route, state.role === 'breeder' ? BREEDER : SEEKER);
    if (path === `/api/offsprings/public/${OFFSPRING_ID}`) return json(route, OFFSPRING);
    if (path.startsWith('/api/offsprings/public/breeder')) return json(route, { offsprings: [], items: [], total: 0 });
    if (path === `/api/breedings/${BREEDING_ID}`) {
      return json(route, { ...BREEDING, puppies: [{ ...OFFSPRING, status: state.offspringStatus }] });
    }
    if (path === `/api/breedings/${BREEDING_ID}/planner`) return json(route, EMPTY_PLANNER);
    if (path === '/api/breedings') return json(route, [BREEDING]);

    // ── waitlist ──
    if (path === `/api/waitlist/breeders/${BREEDER.id}/info`) return json(route, INFO);
    if (path === `/api/waitlist/breeders/${BREEDER.id}/requests` && method === 'POST') {
      state.entry = { ...entryBase(), request_breeding_id: body.request_breeding_id, sex_preference: body.sex_preference };
      return json(route, { id: 'e1', breeder_id: BREEDER.id, status: 'pending', list_label: 'Request pending',
        position: null, sex_preference: body.sex_preference, deposit_status: 'none', deposit_amount: null }, 201);
    }
    if (path === '/api/waitlist' && method === 'GET') {
      const e = state.entry;
      return json(route, {
        pending: e?.status === 'pending' ? [e] : [],
        general: e?.status === 'active' && e.breeding_id === null ? [e] : [],
        deposits_to_settle: [],
      });
    }
    if (path === `/api/waitlist/breedings/${BREEDING_ID}` && method === 'GET') {
      const e = state.entry;
      return json(route, { breeding_id: BREEDING_ID, entries: e?.status === 'active' && e.breeding_id === BREEDING_ID ? [e] : [] });
    }
    if (path === '/api/waitlist/entries/e1/approve' && method === 'POST') {
      state.entry = { ...state.entry, status: 'active', position: 1, queue_date: '2026-10-10' };
      return json(route, state.entry);
    }
    if (path === '/api/waitlist/entries/e1/deposit' && method === 'PUT') {
      state.entry = {
        ...state.entry,
        deposit_status: body.deposit_status,
        deposit_amount: body.deposit_amount,
        deposit_received_on: body.deposit_received_on,
        deposit_method: body.deposit_method,
      };
      return json(route, state.entry);
    }
    if (path === '/api/waitlist/entries/e1/move' && method === 'POST') {
      state.entry = {
        ...state.entry,
        breeding_id: body.breeding_id,
        breeding_label: body.breeding_id ? BREEDING.description : null,
      };
      return json(route, state.entry);
    }
    if (path === '/api/waitlist/entries/e1/match' && method === 'POST') {
      state.entry = { ...state.entry, status: 'matched', offspring_id: body.offspring_id };
      state.offspringStatus = 'Reserved';
      return json(route, state.entry);
    }
    return json(route, []);
  });
  return { calls, state, entryBase };
}

test.describe('Waitlist flow (flag on)', () => {
  test.use({ baseURL: process.env.WAITLIST_BASE_URL });
  test.skip(
    !process.env.WAITLIST_BASE_URL,
    'Needs a flag-on build: run `ng serve --configuration waitlist --port 4300` and set WAITLIST_BASE_URL=http://localhost:4300',
  );

  test('seeker requests a spot, breeder approves, records a deposit, moves to a litter and matches', async ({ page }) => {
    const { calls, state } = await mockApi(page);
    const post = (suffix: string) => calls.find(c => c.path.endsWith(suffix));

    // 1. Pet seeker requests a spot from the offspring page.
    await page.goto(`/offspring/${OFFSPRING_ID}`);
    await page.getByTestId('join-waitlist').click();
    const joinModal = page.getByRole('dialog', { name: 'Join waitlist' });
    await expect(joinModal).toContainText('Refundable until the litter is born.');
    await joinModal.getByTestId('submit').click();
    await expect(joinModal).toBeHidden();
    await expect(page.getByText('Request sent')).toBeVisible();
    await expect.poll(() => post('/requests')?.body).toEqual(expect.objectContaining({
      request_breeding_id: BREEDING_ID, sex_preference: 'Any',
    }));

    // 2. Breeder approves the request.
    state.role = 'breeder';
    await page.goto('/waitlist');
    await expect(page.locator('.request-card')).toContainText('Sam Seeker');
    await page.getByTestId('approve').click();
    await expect.poll(() => post('/entries/e1/approve')).toBeTruthy();
    await expect(page.locator('.request-card')).toHaveCount(0);

    // 3. Records the deposit on the general list.
    await page.getByTestId('tab-general').click();
    const row = page.getByTestId('general-row');
    await expect(row).toContainText('Sam Seeker');
    await row.getByTestId('deposit-btn').click();
    const depositModal = page.getByRole('dialog', { name: 'Record deposit' });
    await depositModal.locator('#dep-status').selectOption('received');
    await depositModal.locator('#dep-amount').fill('300');
    await depositModal.locator('#dep-date').fill('2026-10-10');
    await depositModal.getByTestId('save').click();
    await expect(depositModal).toBeHidden();
    await expect.poll(() => post('/entries/e1/deposit')?.body).toEqual(expect.objectContaining({
      deposit_status: 'received', deposit_received_on: '2026-10-10',
    }));
    await expect(row.getByTestId('deposit-badge')).toContainText('Deposit received');

    // 4. Moves them to the litter.
    await row.getByTestId('move-btn').click();
    await page.getByTestId('move-select').selectOption({ label: BREEDING.description });
    await page.getByTestId('move-confirm').click();
    await expect.poll(() => post('/entries/e1/move')?.body).toEqual({ breeding_id: BREEDING_ID });
    await expect(page.getByTestId('general-row')).toHaveCount(0);

    // 5. On the litter page, matches them to an offspring.
    await page.goto(`/breeding/${BREEDING_ID}`);
    const litterRow = page.getByTestId('wl-row');
    await expect(litterRow).toContainText('Sam Seeker');
    await litterRow.getByTestId('match-select').selectOption({ label: 'Biscuit (Female)' });
    await expect(page.locator('p-table tbody')).toContainText('Available');
    await litterRow.getByTestId('match-btn').click();
    await expect.poll(() => post('/entries/e1/match')?.body).toEqual({ offspring_id: OFFSPRING_ID });
    await expect(page.getByTestId('wl-row')).toHaveCount(0);
    // The breeding page refreshes its offspring list after a match: Biscuit is now Reserved.
    await expect(page.locator('p-table tbody')).toContainText('Reserved');
    await expect(page.locator('p-table tbody')).not.toContainText('Available');
  });

  test('general list fits a 390px phone with every row action on screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const { state, entryBase } = await mockApi(page);
    state.role = 'breeder';
    state.entry = { ...entryBase(), display_name: 'Samantha Longname-Seeker', contact_email: 'samantha.longname@example.com',
      contact_phone: '555-123-4567', status: 'active', position: 1, queue_date: '2026-10-10', deposit_status: 'received' };
    await page.goto('/waitlist');
    await page.getByTestId('tab-general').click();
    const row = page.getByTestId('general-row');
    await expect(row).toContainText('Samantha');
    await expect(row.getByTestId('deposit-badge-sm')).toBeVisible();
    await expect(row.getByTestId('deposit-badge')).toBeHidden();
    const docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(docWidth).toBeLessThanOrEqual(390);
    for (const id of ['deposit-btn', 'move-btn', 'history-btn', 'withdraw-btn']) {
      const box = (await row.getByTestId(id).boundingBox())!;
      expect(box.x + box.width).toBeLessThanOrEqual(390);
      expect(box.width).toBeGreaterThanOrEqual(42);
      expect(box.height).toBeGreaterThanOrEqual(42);
    }
  });
});

test.describe('Waitlist flag off (default build)', () => {
  test('a breeder visiting /waitlist is redirected to the dashboard', async ({ page }) => {
    const { state } = await mockApi(page);
    state.role = 'breeder';
    await page.goto('/waitlist');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('a pet seeker sees no "Join waitlist" button on an offspring page', async ({ page }) => {
    await mockApi(page);
    await page.goto(`/offspring/${OFFSPRING_ID}`);
    await expect(page.getByText('Biscuit').first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('join-waitlist')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Join waitlist' })).toHaveCount(0);
  });
});
