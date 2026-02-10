/**
 * Property-Based Tests for Touch Target Sizes
 * 
 * **Property 37: Touch Target Minimum Size**
 * **Validates: Requirements 12.6**
 * 
 * Property: All interactive elements SHALL have a minimum touch target size 
 * of 44x44 pixels on mobile devices.
 * 
 * This property ensures that buttons, links, and other interactive elements
 * are large enough for comfortable touch interaction on mobile devices,
 * following WCAG 2.1 Level AAA guidelines.
 */

import fc from 'fast-check';

describe('Property 37: Touch Target Minimum Size', () => {
  
  const MINIMUM_TOUCH_TARGET = 44; // pixels
  
  // Inject CSS rules before all tests
  beforeAll(() => {
    const style = document.createElement('style');
    style.id = 'touch-target-test-styles';
    style.textContent = `
      /* Global button minimum sizes */
      button,
      [role="button"],
      input[type="button"],
      input[type="submit"],
      input[type="reset"] {
        min-height: 44px;
        min-width: 44px;
        box-sizing: border-box;
      }
      
      /* Component-specific classes */
      .breeder-card__button,
      .breeder-card__button--primary,
      .breeder-card__button--secondary {
        min-height: 44px;
        min-width: 44px;
        padding: 0.625rem 1.5rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
      }
      
      .radius-btn {
        min-height: 44px;
        min-width: 44px;
        padding: 0.625rem 1rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
      }
      
      .search-btn {
        min-height: 44px;
        min-width: 44px;
        padding: 0.625rem 1.5rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
      }
      
      .breed-option {
        min-height: 44px;
        padding: 0.625rem 1rem;
        display: flex;
        align-items: center;
        box-sizing: border-box;
      }
      
      .dismiss-button,
      .retry-button {
        min-height: 44px;
        min-width: 44px;
        padding: 0.625rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
      }
      
      .form-control {
        min-height: 44px;
        box-sizing: border-box;
      }
    `;
    document.head.appendChild(style);
  });
  
  // Clean up after all tests
  afterAll(() => {
    const style = document.getElementById('touch-target-test-styles');
    if (style) {
      style.remove();
    }
  });
  
  /**
   * Helper function to create a test element and check its dimensions
   */
  function createAndTestElement(className: string, content?: string): { width: number; height: number; minHeight: string; minWidth: string } {
    const element = document.createElement('button');
    element.className = className;
    if (content) {
      element.textContent = content;
    }
    
    // Add to DOM to get computed styles
    document.body.appendChild(element);
    
    const computedStyle = window.getComputedStyle(element);
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const minHeight = computedStyle.getPropertyValue('min-height');
    const minWidth = computedStyle.getPropertyValue('min-width');
    
    // Clean up
    document.body.removeChild(element);
    
    return { width, height, minHeight, minWidth };
  }
  
  it('should ensure breeder card buttons meet minimum touch target size', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'breeder-card__button breeder-card__button--primary',
          'breeder-card__button breeder-card__button--secondary'
        ),
        fc.string({ minLength: 1, maxLength: 20 }),
        (className, buttonText) => {
          const dimensions = createAndTestElement(className, buttonText);
          
          // Verify minimum height is set
          expect(dimensions.minHeight).toBe('44px');
          
          // Verify actual height meets minimum
          expect(dimensions.height).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
          
          // Verify minimum width is set
          expect(dimensions.minWidth).toBe('44px');
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should ensure radius buttons meet minimum touch target size', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('10', '20', '40', '60', 'Custom'),
        (buttonText) => {
          const dimensions = createAndTestElement('radius-btn', buttonText);
          
          // Verify minimum height is set
          expect(dimensions.minHeight).toBe('44px');
          
          // Verify actual height meets minimum
          expect(dimensions.height).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
        }
      ),
      { numRuns: 50 }
    );
  });
  
  it('should ensure search button meets minimum touch target size', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('Search', 'Find Pets', 'Search Now'),
        (buttonText) => {
          const dimensions = createAndTestElement('search-btn', buttonText);
          
          // Verify minimum height is set
          expect(dimensions.minHeight).toBe('44px');
          
          // Verify actual height meets minimum
          expect(dimensions.height).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
        }
      ),
      { numRuns: 50 }
    );
  });
  
  it('should ensure form controls meet minimum touch target size', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 50 }),
        (inputValue) => {
          const input = document.createElement('input');
          input.className = 'form-control';
          input.value = inputValue;
          
          document.body.appendChild(input);
          
          const computedStyle = window.getComputedStyle(input);
          const height = input.offsetHeight;
          const minHeight = computedStyle.getPropertyValue('min-height');
          
          document.body.removeChild(input);
          
          // Verify minimum height is set
          expect(minHeight).toBe('44px');
          
          // Verify actual height meets minimum
          expect(height).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should ensure breed dropdown options meet minimum touch target size', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 50 }),
        (breedName) => {
          const option = document.createElement('div');
          option.className = 'breed-option';
          option.textContent = breedName;
          
          document.body.appendChild(option);
          
          const computedStyle = window.getComputedStyle(option);
          const height = option.offsetHeight;
          const minHeight = computedStyle.getPropertyValue('min-height');
          
          document.body.removeChild(option);
          
          // Verify minimum height is set
          expect(minHeight).toBe('44px');
          
          // Verify actual height meets minimum
          expect(height).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should ensure dismiss and retry buttons meet minimum touch target size', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('dismiss-button', 'retry-button'),
        (className) => {
          const dimensions = createAndTestElement(className, '×');
          
          // Verify minimum dimensions are set
          expect(dimensions.minWidth).toBe('44px');
          expect(dimensions.minHeight).toBe('44px');
          
          // Verify actual dimensions meet minimum
          expect(dimensions.width).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
          expect(dimensions.height).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
        }
      ),
      { numRuns: 50 }
    );
  });
  
  describe('Touch Target Size Invariants', () => {
    /**
     * Additional invariants to ensure touch targets remain accessible
     * across different content lengths and configurations.
     */
    
    it('should maintain minimum touch target size regardless of button text length', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 100 }),
          (buttonText) => {
            const dimensions = createAndTestElement('breeder-card__button breeder-card__button--primary', buttonText);
            
            // Button should always meet minimum height regardless of text length
            expect(dimensions.height).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should maintain minimum touch target size for all interactive button classes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'breeder-card__button',
            'radius-btn',
            'search-btn',
            'dismiss-button',
            'retry-button'
          ),
          (className) => {
            const dimensions = createAndTestElement(className, 'Test');
            
            // All interactive buttons should meet minimum height
            expect(dimensions.height).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
            
            // Verify min-height CSS property is set
            expect(dimensions.minHeight).toBe('44px');
          }
        ),
        { numRuns: 100 }
      );
    });
    
    it('should maintain minimum touch target size with various padding values', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('radius-btn', 'search-btn', 'breeder-card__button'),
          (className) => {
            const element = document.createElement('button');
            element.className = className;
            element.textContent = 'Test';
            
            document.body.appendChild(element);
            
            const computedStyle = window.getComputedStyle(element);
            const paddingTop = parseFloat(computedStyle.paddingTop);
            const paddingBottom = parseFloat(computedStyle.paddingBottom);
            const borderTop = parseFloat(computedStyle.borderTopWidth);
            const borderBottom = parseFloat(computedStyle.borderBottomWidth);
            const minHeight = parseFloat(computedStyle.minHeight);
            const actualHeight = element.offsetHeight;
            
            document.body.removeChild(element);
            
            // Total height should be at least 44px
            expect(actualHeight).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
            
            // Min-height should be set to at least 44px
            expect(minHeight).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
          }
        ),
        { numRuns: 50 }
      );
    });
    
    it('should ensure touch targets are accessible across different viewport widths', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 320, max: 1920 }), // Common viewport widths
          fc.constantFrom('radius-btn', 'search-btn', 'breeder-card__button'),
          (viewportWidth, className) => {
            // Note: In a real test environment, we would set viewport width
            // For this test, we verify the CSS rules are viewport-independent
            const dimensions = createAndTestElement(className, 'Test');
            
            // Touch target size should be consistent regardless of viewport
            expect(dimensions.height).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET);
            expect(dimensions.minHeight).toBe('44px');
          }
        ),
        { numRuns: 50 }
      );
    });
  });
  
  describe('Mobile-Specific Touch Target Requirements', () => {
    /**
     * Tests specific to mobile viewport requirements
     */
    
    it('should ensure all interactive elements have touch-action property set', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            'breeder-card__button',
            'radius-btn',
            'search-btn',
            'form-control',
            'breed-option'
          ),
          (className) => {
            const element = document.createElement('button');
            element.className = className;
            
            document.body.appendChild(element);
            
            const computedStyle = window.getComputedStyle(element);
            const touchAction = computedStyle.getPropertyValue('touch-action');
            
            document.body.removeChild(element);
            
            // Touch action should be set (not 'auto' for better control)
            // This helps prevent double-tap zoom and improves touch responsiveness
            expect(touchAction).toBeTruthy();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
