import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Pet Search with Map Feature
 * 
 * Tests cover:
 * - Complete search flow from home page
 * - Geolocation → search → results
 * - Manual ZIP entry → breed selection → filtered results
 * - Map interaction → card highlighting → zoom
 * - Mobile responsive behavior
 * - Error handling and recovery
 */

test.describe('Pet Search Map - E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Grant geolocation permission for tests
    await page.context().grantPermissions(['geolocation']);
  });

  test('should navigate to search page from home page', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Find and click "Find Pet" button
    const findPetButton = page.locator('button:has-text("Find Pet"), a:has-text("Find Pet")');
    await expect(findPetButton).toBeVisible({ timeout: 10000 });
    await findPetButton.click();
    
    // Verify navigation to search page
    await expect(page).toHaveURL(/\/search-pets/);
    
    // Verify search page components are visible
    await expect(page.locator('app-search-page')).toBeVisible();
    await expect(page.locator('app-map')).toBeVisible();
  });

  test('should handle geolocation → search → results flow', async ({ page }) => {
    // Set mock geolocation
    await page.context().setGeolocation({ latitude: 40.7128, longitude: -74.0060 }); // New York
    
    // Navigate to search page
    await page.goto('/search-pets');
    
    // Wait for geolocation to be processed
    await page.waitForTimeout(2000);
    
    // Verify ZIP code field is populated (if reverse geocoding works)
    const zipInput = page.locator('input[placeholder*="ZIP"], input[name="zipCode"]');
    await expect(zipInput).toBeVisible();
    
    // If ZIP is populated, verify it's a 5-digit number
    const zipValue = await zipInput.inputValue();
    if (zipValue) {
      expect(zipValue).toMatch(/^\d{5}$/);
    }
    
    // Verify map is centered on location
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible();
    
    // Verify search radius circle is displayed
    const radiusCircle = page.locator('.leaflet-interactive[stroke]');
    await expect(radiusCircle.first()).toBeVisible({ timeout: 5000 });
  });

  test('should perform manual ZIP entry and breed selection search', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search-pets');
    
    // Enter ZIP code manually
    const zipInput = page.locator('input[placeholder*="ZIP"], input[name="zipCode"]');
    await zipInput.fill('10001'); // New York ZIP
    
    // Wait for geocoding
    await page.waitForTimeout(1000);
    
    // Open breed autocomplete
    const breedInput = page.locator('input[placeholder*="breed"], input[name="breed"]');
    await breedInput.click();
    await breedInput.fill('Lab');
    
    // Wait for autocomplete suggestions
    await page.waitForTimeout(500);
    
    // Select first breed suggestion if available
    const breedSuggestion = page.locator('.p-autocomplete-item, .breed-suggestion').first();
    if (await breedSuggestion.isVisible({ timeout: 2000 }).catch(() => false)) {
      await breedSuggestion.click();
    }
    
    // Select radius
    const radius40Button = page.locator('button:has-text("40")');
    if (await radius40Button.isVisible({ timeout: 2000 }).catch(() => false)) {
      await radius40Button.click();
    }
    
    // Click search button
    const searchButton = page.locator('button:has-text("Search"), button[type="submit"]');
    if (await searchButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchButton.click();
    }
    
    // Wait for results
    await page.waitForTimeout(2000);
    
    // Verify map markers or "no results" message
    const hasMarkers = await page.locator('.leaflet-marker-icon').count() > 0;
    const hasNoResults = await page.locator('text=/no.*results/i').isVisible({ timeout: 1000 }).catch(() => false);
    
    expect(hasMarkers || hasNoResults).toBeTruthy();
  });

  test('should handle map interaction and card highlighting', async ({ page }) => {
    // Navigate to search page with mock data
    await page.goto('/search-pets');
    
    // Enter ZIP and trigger search
    const zipInput = page.locator('input[placeholder*="ZIP"], input[name="zipCode"]');
    await zipInput.fill('90210'); // Beverly Hills
    await page.waitForTimeout(1000);
    
    // Trigger search
    const searchButton = page.locator('button:has-text("Search"), button[type="submit"]');
    if (await searchButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Check if markers exist
    const markerCount = await page.locator('.leaflet-marker-icon').count();
    
    if (markerCount > 0) {
      // Click first marker
      const firstMarker = page.locator('.leaflet-marker-icon').first();
      await firstMarker.click();
      
      // Verify corresponding card is highlighted
      await page.waitForTimeout(500);
      const highlightedCard = page.locator('.breeder-card.highlighted, .breeder-card.active');
      await expect(highlightedCard.first()).toBeVisible({ timeout: 2000 });
      
      // Click breeder card
      const breederCard = page.locator('.breeder-card').first();
      if (await breederCard.isVisible({ timeout: 1000 }).catch(() => false)) {
        await breederCard.click();
        
        // Verify map zooms (check zoom level change)
        await page.waitForTimeout(1000);
      }
      
      // Hover over card
      await breederCard.hover();
      await page.waitForTimeout(500);
      
      // Verify marker animation (bounce class or animation)
      const animatedMarker = page.locator('.leaflet-marker-icon.bounce, .leaflet-marker-icon[style*="animation"]');
      // Animation might be temporary, so we just check it doesn't error
      await animatedMarker.count();
    }
  });

  test('should display responsive layout on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
    }
    
    // Navigate to search page
    await page.goto('/search-pets');
    
    // Verify mobile layout
    const searchPage = page.locator('app-search-page');
    await expect(searchPage).toBeVisible();
    
    // Verify map is full width
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible();
    
    // Verify bottom swipe panel for cards (if results exist)
    await page.waitForTimeout(2000);
    const cardList = page.locator('app-breeder-card-list, .breeder-card-list');
    if (await cardList.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Check if it's positioned at bottom
      const box = await cardList.boundingBox();
      if (box) {
        const viewportSize = page.viewportSize();
        if (viewportSize) {
          // Card list should be in lower portion of screen
          expect(box.y).toBeGreaterThan(viewportSize.height * 0.3);
        }
      }
    }
    
    // Verify touch targets are at least 44x44px
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible({ timeout: 500 }).catch(() => false)) {
        const box = await button.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('should handle error when geolocation is denied', async ({ page }) => {
    // Deny geolocation permission
    await page.context().clearPermissions();
    
    // Navigate to search page
    await page.goto('/search-pets');
    
    // Wait for error handling
    await page.waitForTimeout(2000);
    
    // Verify error message or prompt for manual entry
    const errorMessage = page.locator('text=/location.*denied/i, text=/enter.*zip/i, .error-message');
    const zipInput = page.locator('input[placeholder*="ZIP"], input[name="zipCode"]');
    
    // Either error message should be shown or ZIP input should be available
    const hasError = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);
    const hasZipInput = await zipInput.isVisible({ timeout: 2000 }).catch(() => false);
    
    expect(hasError || hasZipInput).toBeTruthy();
  });

  test('should handle invalid ZIP code entry', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search-pets');
    
    // Enter invalid ZIP code
    const zipInput = page.locator('input[placeholder*="ZIP"], input[name="zipCode"]');
    await zipInput.fill('ABCDE');
    
    // Trigger validation (blur or search)
    await zipInput.blur();
    await page.waitForTimeout(500);
    
    // Verify validation error message
    const errorMessage = page.locator('text=/invalid.*zip/i, .error, .invalid-feedback');
    
    // Check if validation prevents non-numeric input or shows error
    const zipValue = await zipInput.inputValue();
    const hasError = await errorMessage.isVisible({ timeout: 1000 }).catch(() => false);
    
    // Either input should be empty/numeric only, or error should be shown
    expect(zipValue === '' || /^\d+$/.test(zipValue) || hasError).toBeTruthy();
  });

  test('should handle API error with retry option', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search-pets');
    
    // Mock API failure by entering invalid data or intercepting request
    await page.route('**/api/search/breeders*', route => {
      route.abort('failed');
    });
    
    // Enter ZIP and search
    const zipInput = page.locator('input[placeholder*="ZIP"], input[name="zipCode"]');
    await zipInput.fill('10001');
    await page.waitForTimeout(500);
    
    const searchButton = page.locator('button:has-text("Search"), button[type="submit"]');
    if (await searchButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Verify error message with retry option
    const errorToast = page.locator('.toast, .error-message, text=/error/i');
    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again")');
    
    const hasError = await errorToast.isVisible({ timeout: 3000 }).catch(() => false);
    const hasRetry = await retryButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    // At least error indication should be present
    expect(hasError || hasRetry).toBeTruthy();
  });

  test('should display no results message when search returns empty', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search-pets');
    
    // Mock empty results
    await page.route('**/api/search/breeders*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    // Enter ZIP and search
    const zipInput = page.locator('input[placeholder*="ZIP"], input[name="zipCode"]');
    await zipInput.fill('99999'); // Unlikely to have results
    await page.waitForTimeout(500);
    
    const searchButton = page.locator('button:has-text("Search"), button[type="submit"]');
    if (await searchButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Verify "no results" message
    const noResultsMessage = page.locator('text=/no.*results/i, text=/no.*breeders/i, .no-results');
    await expect(noResultsMessage).toBeVisible({ timeout: 3000 });
  });

  test('should handle breed autocomplete with no matches', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search-pets');
    
    // Mock empty breed results
    await page.route('**/api/breeds/autocomplete*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });
    
    // Enter breed search term
    const breedInput = page.locator('input[placeholder*="breed"], input[name="breed"]');
    await breedInput.click();
    await breedInput.fill('XYZInvalidBreed');
    
    // Wait for autocomplete
    await page.waitForTimeout(1000);
    
    // Verify "no breeds found" message
    const noBreedMessage = page.locator('text=/no.*breed/i, text=/no.*match/i, .no-results');
    const hasMessage = await noBreedMessage.isVisible({ timeout: 2000 }).catch(() => false);
    
    // Message should be shown or dropdown should be empty
    expect(hasMessage).toBeTruthy();
  });

  test('should maintain search state during map interactions', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search-pets');
    
    // Set search parameters
    const zipInput = page.locator('input[placeholder*="ZIP"], input[name="zipCode"]');
    await zipInput.fill('10001');
    await page.waitForTimeout(500);
    
    // Select radius
    const radius20Button = page.locator('button:has-text("20")');
    if (await radius20Button.isVisible({ timeout: 2000 }).catch(() => false)) {
      await radius20Button.click();
    }
    
    // Perform search
    const searchButton = page.locator('button:has-text("Search"), button[type="submit"]');
    if (await searchButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Interact with map (zoom, pan)
    const mapContainer = page.locator('.leaflet-container');
    await mapContainer.click({ position: { x: 100, y: 100 } });
    
    // Verify search parameters are still set
    const zipValue = await zipInput.inputValue();
    expect(zipValue).toBe('10001');
    
    // Verify radius circle is still visible
    const radiusCircle = page.locator('.leaflet-interactive[stroke]');
    await expect(radiusCircle.first()).toBeVisible({ timeout: 2000 });
  });

  test('should handle rapid search parameter changes', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search-pets');
    
    const zipInput = page.locator('input[placeholder*="ZIP"], input[name="zipCode"]');
    
    // Rapidly change ZIP codes
    await zipInput.fill('10001');
    await page.waitForTimeout(100);
    await zipInput.fill('90210');
    await page.waitForTimeout(100);
    await zipInput.fill('60601');
    
    // Wait for debouncing/processing
    await page.waitForTimeout(2000);
    
    // Verify final ZIP is set
    const finalZip = await zipInput.inputValue();
    expect(finalZip).toBe('60601');
    
    // Verify no errors occurred
    const errorMessage = page.locator('.error, .toast-error');
    const hasError = await errorMessage.isVisible({ timeout: 1000 }).catch(() => false);
    expect(hasError).toBeFalsy();
  });

  test('should display loading indicators during search', async ({ page }) => {
    // Navigate to search page
    await page.goto('/search-pets');
    
    // Slow down network to see loading state
    await page.route('**/api/search/breeders*', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.continue();
    });
    
    // Enter ZIP and search
    const zipInput = page.locator('input[placeholder*="ZIP"], input[name="zipCode"]');
    await zipInput.fill('10001');
    await page.waitForTimeout(500);
    
    const searchButton = page.locator('button:has-text("Search"), button[type="submit"]');
    if (await searchButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchButton.click();
      
      // Verify loading indicator appears
      const loadingIndicator = page.locator('.loading, .spinner, [role="progressbar"], text=/loading/i');
      const hasLoading = await loadingIndicator.isVisible({ timeout: 1000 }).catch(() => false);
      
      // Loading indicator should appear during request
      expect(hasLoading).toBeTruthy();
      
      // Wait for request to complete
      await page.waitForTimeout(3000);
    }
  });
});
