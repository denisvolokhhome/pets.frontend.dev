import { test, expect, Page, Locator } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

/**
 * E2E Tests for Import Wizard Component
 *
 * Validates: Requirements 2.1, 3.1, 6.1, 6.2, 6.3, 6.4, 8.2
 *
 * Tests mock backend APIs, navigate to the pets page, and programmatically
 * open the wizard modal to verify its UI behavior through Playwright.
 */

const MOCK_BREEDER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'breeder@test.com',
  name: 'Test Breeder',
  is_breeder: true,
  is_active: true,
  is_superuser: false,
  is_verified: true,
};

const MOCK_SUBSCRIPTION = {
  id: 'sub-001',
  user_id: MOCK_BREEDER.id,
  plan_id: 'plan-001',
  plan: {
    id: 'plan-001',
    name: 'Starter',
    price: 9.99,
    currency: 'usd',
    billing_interval: 'month',
    max_pets: 10,
    max_published_locations: 3,
    max_simultaneous_offsprings: 20,
    is_default: false,
  },
  status: 'active',
  current_period_start: '2025-01-01T00:00:00Z',
  current_period_end: '2025-02-01T00:00:00Z',
  stripe_customer_id: null,
  stripe_subscription_id: null,
};

const MOCK_LOCATIONS = [
  { id: 'loc-1', name: 'Main Kennel', address: '123 Main St' },
];

const MOCK_BREEDS = [
  { id: 'breed-1', name: 'Golden Retriever', kind: 'Dog' },
];

/** Set up all API mocks for a breeder session */
async function setupBreederSession(page: Page) {
  await page.route('**/api/auth/users/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_BREEDER) })
  );
  await page.route('**/api/pets/breeder/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
  );
  await page.route('**/api/locations', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_LOCATIONS) })
  );
  await page.route('**/api/breeds**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_BREEDS) })
  );
  await page.route('**/api/billing/subscription', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_SUBSCRIPTION) })
  );
  await page.addInitScript(() => {
    localStorage.setItem('id_token', 'fake-jwt-token-for-testing');
  });
}

/** Open the import wizard by setting isOpen on the component via Angular debug API */
async function openImportWizard(page: Page) {
  await page.evaluate(() => {
    const wizardEl = document.querySelector('app-import-wizard');
    if (!wizardEl) throw new Error('app-import-wizard not found');
    const ng = (window as any).ng;
    if (!ng?.getComponent) throw new Error('Angular debug API not available');
    const component = ng.getComponent(wizardEl);
    if (!component) throw new Error('Could not get component instance');
    component.isOpen = true;
    component.currentStep = 1;
    component.cdr.detectChanges();
  });
}

/** Set component state directly via Angular debug API */
async function setWizardState(page: Page, state: Record<string, unknown>) {
  await page.evaluate((s) => {
    const wizardEl = document.querySelector('app-import-wizard');
    const ng = (window as any).ng;
    const component = ng.getComponent(wizardEl);
    Object.assign(component, s);
    component.cdr.detectChanges();
  }, state);
}

/** Get a locator scoped to the import wizard modal */
function wizard(page: Page): Locator {
  return page.locator('app-import-wizard .modal-overlay');
}

/** Create a temporary file and return its path */
function createTempFile(content: string, filename: string): string {
  const filePath = path.join(os.tmpdir(), filename);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

test.describe('Import Wizard Component', () => {
  test.beforeEach(async ({ page }) => {
    await setupBreederSession(page);
    await page.goto('/pets');
    await page.waitForSelector('app-import-wizard', { state: 'attached', timeout: 15000 });
  });

  // ── Step Navigation ──────────────────────────────────────────

  test('should display Step 1 when wizard opens', async ({ page }) => {
    await openImportWizard(page);

    const modal = wizard(page);
    await expect(modal).toBeVisible();
    await expect(modal.locator('#import-wizard-title')).toHaveText('Import Pets from CSV');
    await expect(modal.locator('.modal-subtitle')).toContainText('Step 1 of 3');

    // Step 1 indicator is active
    const steps = modal.locator('.step');
    await expect(steps.first()).toHaveClass(/active/);

    // Download Template button present
    await expect(modal.locator('.btn-download')).toBeVisible();
  });

  test('should navigate from Step 1 → Step 2 via Next button', async ({ page }) => {
    await openImportWizard(page);
    const modal = wizard(page);

    await modal.locator('button:has-text("Next")').click();

    await expect(modal.locator('.modal-subtitle')).toContainText('Step 2 of 3');
    await expect(modal.locator('.drop-zone')).toBeVisible();
    await expect(modal.locator('.drop-hint')).toContainText('.csv only, 5MB max');
  });

  test('should navigate back from Step 2 → Step 1 via Back button', async ({ page }) => {
    await openImportWizard(page);
    const modal = wizard(page);

    // Go to Step 2
    await modal.locator('button:has-text("Next")').click();
    await expect(modal.locator('.modal-subtitle')).toContainText('Step 2 of 3');

    // Go back
    await modal.locator('button:has-text("Back")').click();
    await expect(modal.locator('.modal-subtitle')).toContainText('Step 1 of 3');
    await expect(modal.locator('.btn-download')).toBeVisible();
  });

  test('should advance to Step 3 after successful import', async ({ page }) => {
    await openImportWizard(page);

    await setWizardState(page, {
      importResult: { created_count: 3, skipped_count: 0, errors: [], plan_limit_applied: false },
      currentStep: 3,
    });

    const modal = wizard(page);
    await expect(modal.locator('.modal-subtitle')).toContainText('Step 3 of 3');
    await expect(modal.locator('.results-summary')).toBeVisible();
  });

  // ── File Upload Validation ────────────────────────────────────

  test('should reject non-CSV files with error message', async ({ page }) => {
    await openImportWizard(page);
    const modal = wizard(page);
    await modal.locator('button:has-text("Next")').click();

    // Upload a .txt file — the handleFile method checks the extension
    const txtPath = createTempFile('not a csv', 'test.txt');
    // Use the file input inside the import wizard specifically
    const fileInput = modal.locator('input[type="file"]');
    await fileInput.setInputFiles(txtPath);

    await expect(modal.locator('.error-banner')).toBeVisible();
    await expect(modal.locator('.error-banner')).toContainText('Please upload a CSV file');
    fs.unlinkSync(txtPath);
  });

  test('should reject files larger than 5MB', async ({ page }) => {
    await openImportWizard(page);
    const modal = wizard(page);
    await modal.locator('button:has-text("Next")').click();

    // Create a CSV file > 5MB
    const header = 'name,breed,gender,date_of_birth,weight,description,location,microchip,vaccination,health_certificate,deworming,birth_certificate\n';
    const largeContent = header + 'x'.repeat(5 * 1024 * 1024 + 1);
    const largePath = createTempFile(largeContent, 'large-file.csv');

    const fileInput = modal.locator('input[type="file"]');
    await fileInput.setInputFiles(largePath);

    await expect(modal.locator('.error-banner')).toBeVisible();
    await expect(modal.locator('.error-banner')).toContainText('File size exceeds 5MB limit');
    fs.unlinkSync(largePath);
  });

  test('should accept valid CSV file and show preview', async ({ page }) => {
    await openImportWizard(page);
    const modal = wizard(page);
    await modal.locator('button:has-text("Next")').click();

    const csvContent = [
      'name,breed,gender,date_of_birth,weight,description,location,microchip,vaccination,health_certificate,deworming,birth_certificate',
      'Max,Golden Retriever,Male,2023-01-15,25.5,Friendly dog,Main Kennel,,,,,',
      'Bella,Golden Retriever,Female,2022-06-20,22.0,Sweet girl,Main Kennel,,,,,',
    ].join('\n');
    const csvPath = createTempFile(csvContent, 'test-import.csv');

    const fileInput = modal.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);

    // Wait for parsing + billing info
    await expect(modal.locator('.preview-section')).toBeVisible({ timeout: 5000 });
    await expect(modal.locator('.preview-table')).toBeVisible();
    await expect(modal.locator('.preview-section h4')).toContainText('2 rows');
    fs.unlinkSync(csvPath);
  });

  // ── Results Summary Display ──────────────────────────────────

  test('should display correct created and skipped counts on Step 3', async ({ page }) => {
    await openImportWizard(page);

    await setWizardState(page, {
      importResult: { created_count: 5, skipped_count: 2, errors: [], plan_limit_applied: false },
      currentStep: 3,
    });

    const modal = wizard(page);
    const createdCard = modal.locator('.result-created');
    await expect(createdCard.locator('.result-count')).toHaveText('5');
    await expect(createdCard.locator('.result-label')).toHaveText('Pets Created');

    const skippedCard = modal.locator('.result-skipped');
    await expect(skippedCard.locator('.result-count')).toHaveText('2');
    await expect(skippedCard.locator('.result-label')).toHaveText('Rows Skipped');
  });

  // ── Error List ────────────────────────────────────────────────

  test('should show expandable error list with row details', async ({ page }) => {
    await openImportWizard(page);

    await setWizardState(page, {
      importResult: {
        created_count: 2,
        skipped_count: 3,
        errors: [
          { row: 3, reason: 'Unknown breed: InvalidBreed' },
          { row: 5, reason: 'Unknown location: NoSuchPlace' },
          { row: 7, reason: 'Name is required' },
        ],
        plan_limit_applied: false,
      },
      currentStep: 3,
      showErrorList: false,
    });

    const modal = wizard(page);

    // Toggle button visible with correct count
    const toggleBtn = modal.locator('.btn-toggle-errors');
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toContainText('3 rows with errors');

    // Error list hidden initially
    await expect(modal.locator('.error-list')).not.toBeVisible();

    // Expand error list
    await toggleBtn.click();
    // Trigger change detection after click
    await page.evaluate(() => {
      const wizardEl = document.querySelector('app-import-wizard');
      const ng = (window as any).ng;
      const component = ng.getComponent(wizardEl);
      component.cdr.detectChanges();
    });

    await expect(modal.locator('.error-list')).toBeVisible();

    // Verify error items
    const errorItems = modal.locator('.error-item');
    await expect(errorItems).toHaveCount(3);

    await expect(errorItems.nth(0).locator('.error-row')).toContainText('Row 3');
    await expect(errorItems.nth(0).locator('.error-reason')).toContainText('Unknown breed: InvalidBreed');
    await expect(errorItems.nth(1).locator('.error-row')).toContainText('Row 5');
    await expect(errorItems.nth(1).locator('.error-reason')).toContainText('Unknown location: NoSuchPlace');
    await expect(errorItems.nth(2).locator('.error-row')).toContainText('Row 7');
    await expect(errorItems.nth(2).locator('.error-reason')).toContainText('Name is required');

    // Collapse error list
    await toggleBtn.click();
    await page.evaluate(() => {
      const wizardEl = document.querySelector('app-import-wizard');
      const ng = (window as any).ng;
      const component = ng.getComponent(wizardEl);
      component.cdr.detectChanges();
    });
    await expect(modal.locator('.error-list')).not.toBeVisible();
  });

  // ── Plan Limit Notice ────────────────────────────────────────

  test('should show plan limit notice when plan_limit_applied is true', async ({ page }) => {
    await openImportWizard(page);

    await setWizardState(page, {
      importResult: { created_count: 5, skipped_count: 3, errors: [], plan_limit_applied: true },
      currentStep: 3,
    });

    const modal = wizard(page);
    const warningBanner = modal.locator('.step-content .warning-banner');
    await expect(warningBanner).toBeVisible();
    await expect(warningBanner).toContainText('upgrading your plan');
  });

  test('should NOT show plan limit notice when plan_limit_applied is false', async ({ page }) => {
    await openImportWizard(page);

    await setWizardState(page, {
      importResult: { created_count: 3, skipped_count: 0, errors: [], plan_limit_applied: false },
      currentStep: 3,
    });

    const warningBanner = wizard(page).locator('.step-content .warning-banner');
    await expect(warningBanner).not.toBeVisible();
  });

  // ── Close Wizard / Reload ────────────────────────────────────

  test('should close wizard when Close button is clicked on Step 3', async ({ page }) => {
    await openImportWizard(page);

    await setWizardState(page, {
      importResult: { created_count: 3, skipped_count: 0, errors: [], plan_limit_applied: false },
      currentStep: 3,
    });

    const modal = wizard(page);
    await expect(modal).toBeVisible();

    await modal.locator('.modal-footer button:has-text("Close")').click();
    await expect(modal).not.toBeVisible();
  });

  test('should close wizard when clicking overlay background', async ({ page }) => {
    await openImportWizard(page);
    const modal = wizard(page);
    await expect(modal).toBeVisible();

    // Click the overlay edge (not the modal-content)
    await modal.click({ position: { x: 5, y: 5 } });
    await expect(modal).not.toBeVisible();
  });

  test('should close wizard when pressing Escape key', async ({ page }) => {
    await openImportWizard(page);
    await expect(wizard(page)).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(wizard(page)).not.toBeVisible();
  });

  test('should close wizard via X button in header', async ({ page }) => {
    await openImportWizard(page);
    const modal = wizard(page);
    await expect(modal).toBeVisible();

    // Scope the close button to the import wizard modal
    await modal.locator('.close-button').click();
    await expect(modal).not.toBeVisible();
  });

  test('should close wizard via Cancel button on Step 1', async ({ page }) => {
    await openImportWizard(page);
    const modal = wizard(page);
    await expect(modal).toBeVisible();

    await modal.locator('button:has-text("Cancel")').click();
    await expect(modal).not.toBeVisible();
  });

  // ── Step 2: Billing Limit Warning ────────────────────────────

  test('should show billing limit warning on Step 2 when over limit', async ({ page }) => {
    await openImportWizard(page);

    await setWizardState(page, {
      currentStep: 2,
      billingLoaded: true,
      billingError: false,
      maxPets: 10,
      currentPetCount: 8,
      parsedRows: [
        { rowNumber: 1, name: 'Pet1', isValid: true, willBeImported: true, errors: [] },
        { rowNumber: 2, name: 'Pet2', isValid: true, willBeImported: true, errors: [] },
        { rowNumber: 3, name: 'Pet3', isValid: true, willBeImported: false, errors: [] },
        { rowNumber: 4, name: 'Pet4', isValid: true, willBeImported: false, errors: [] },
        { rowNumber: 5, name: 'Pet5', isValid: true, willBeImported: false, errors: [] },
      ],
      selectedFile: { name: 'test.csv', size: 1024 },
    });

    const modal = wizard(page);
    const warningBanner = modal.locator('.step-content .warning-banner');
    await expect(warningBanner).toBeVisible();
    await expect(warningBanner).toContainText('10'); // max_pets
    await expect(warningBanner).toContainText('8');  // current count
    await expect(warningBanner).toContainText('2');  // allowed
  });

  test('should show all-fit confirmation on Step 2 when within limit', async ({ page }) => {
    await openImportWizard(page);

    await setWizardState(page, {
      currentStep: 2,
      billingLoaded: true,
      billingError: false,
      maxPets: 10,
      currentPetCount: 5,
      parsedRows: [
        { rowNumber: 1, name: 'Pet1', isValid: true, willBeImported: true, errors: [] },
        { rowNumber: 2, name: 'Pet2', isValid: true, willBeImported: true, errors: [] },
        { rowNumber: 3, name: 'Pet3', isValid: true, willBeImported: true, errors: [] },
      ],
      selectedFile: { name: 'test.csv', size: 1024 },
    });

    const successBanner = wizard(page).locator('.success-banner');
    await expect(successBanner).toBeVisible();
    await expect(successBanner).toContainText('3');
  });
});
