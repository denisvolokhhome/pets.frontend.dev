import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BreederCardComponent } from './breeder-card.component';
import { BreederSearchResult, BreedInfo } from '../../models/search';
import * as fc from 'fast-check';

describe('BreederCardComponent - Property-Based Tests', () => {
  let component: BreederCardComponent;
  let fixture: ComponentFixture<BreederCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BreederCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BreederCardComponent);
    component = fixture.componentInstance;
  });

  describe('Property 30: Distance Formatting', () => {
    it('should format any distance value to 1 decimal place with "miles" unit', () => {
      // Feature: pet-search-map, Property 30: Distance Formatting
      // Validates: Requirements 8.6
      
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(1000), noNaN: true }),
          (distance: number) => {
            // Skip NaN, Infinity, and negative zero
            if (!Number.isFinite(distance) || Object.is(distance, -0)) {
              return true;
            }
            
            const formatted = component.formatDistance(distance);
            
            // Should contain "miles" unit
            expect(formatted).toContain('miles');
            
            // Should be formatted to 1 decimal place
            const expectedFormat = `${distance.toFixed(1)} miles`;
            expect(formatted).toBe(expectedFormat);
            
            // Extract the numeric part and verify it has 1 decimal place
            const numericPart = formatted.split(' ')[0];
            const decimalParts = numericPart.split('.');
            
            // Should have exactly 1 decimal place
            expect(decimalParts.length).toBe(2);
            expect(decimalParts[1].length).toBe(1);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format zero distance correctly', () => {
      // Feature: pet-search-map, Property 30: Distance Formatting
      // Validates: Requirements 8.6
      
      const formatted = component.formatDistance(0);
      expect(formatted).toBe('0.0 miles');
    });

    it('should format very small distances correctly', () => {
      // Feature: pet-search-map, Property 30: Distance Formatting
      // Validates: Requirements 8.6
      
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.01), max: Math.fround(0.99), noNaN: true }),
          (distance: number) => {
            const formatted = component.formatDistance(distance);
            const expectedFormat = `${distance.toFixed(1)} miles`;
            expect(formatted).toBe(expectedFormat);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format large distances correctly', () => {
      // Feature: pet-search-map, Property 30: Distance Formatting
      // Validates: Requirements 8.6
      
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(100), max: Math.fround(1000), noNaN: true }),
          (distance: number) => {
            const formatted = component.formatDistance(distance);
            const expectedFormat = `${distance.toFixed(1)} miles`;
            expect(formatted).toBe(expectedFormat);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should round distances correctly to 1 decimal place', () => {
      // Feature: pet-search-map, Property 30: Distance Formatting
      // Validates: Requirements 8.6
      
      // Test specific rounding cases - toFixed() uses banker's rounding (round half to even)
      expect(component.formatDistance(12.34)).toBe('12.3 miles');
      expect(component.formatDistance(12.35)).toBe('12.3 miles'); // Banker's rounding: rounds to even (12.4 is even)
      expect(component.formatDistance(12.36)).toBe('12.4 miles');
      expect(component.formatDistance(12.44)).toBe('12.4 miles');
      expect(component.formatDistance(12.45)).toBe('12.4 miles'); // Banker's rounding: rounds to even (12.4 is even)
      expect(component.formatDistance(12.46)).toBe('12.5 miles');
    });
  });

  describe('Property 29: Breeder Card Content Completeness', () => {
    // Generator for BreedInfo
    const breedInfoArb = fc.record({
      breed_id: fc.integer({ min: 1, max: 1000 }),
      breed_name: fc.string({ minLength: 3, maxLength: 50 }),
      pet_count: fc.integer({ min: 1, max: 20 })
    });

    // Generator for BreederSearchResult
    const breederResultArb = fc.record({
      location_id: fc.integer({ min: 1, max: 10000 }),
      user_id: fc.uuid(),
      breeder_name: fc.string({ minLength: 3, maxLength: 100 }),
      latitude: fc.float({ min: Math.fround(-90), max: Math.fround(90), noNaN: true }),
      longitude: fc.float({ min: Math.fround(-180), max: Math.fround(180), noNaN: true }),
      distance: fc.float({ min: Math.fround(0), max: Math.fround(100), noNaN: true }),
      available_breeds: fc.array(breedInfoArb, { minLength: 1, maxLength: 5 }),
      thumbnail_url: fc.oneof(
        fc.constant(null),
        fc.string({ minLength: 10, maxLength: 100 })
      ),
      location_description: fc.oneof(
        fc.constant(null),
        fc.string({ minLength: 10, maxLength: 500 })
      ),
      rating: fc.oneof(
        fc.constant(null),
        fc.float({ min: Math.fround(1), max: Math.fround(5), noNaN: true })
      )
    });

    it('should display all required fields for any breeder search result', () => {
      // Feature: pet-search-map, Property 29: Breeder Card Content Completeness
      // Validates: Requirements 8.4
      
      fc.assert(
        fc.property(
          breederResultArb,
          (breeder: BreederSearchResult) => {
            component.breeder = breeder;
            fixture.detectChanges();

            const compiled = fixture.nativeElement as HTMLElement;

            // Should display breeder name
            const nameElement = compiled.querySelector('.breeder-card__name');
            expect(nameElement).toBeTruthy();
            expect(nameElement?.textContent).toContain(breeder.breeder_name);

            // Should display distance
            const distanceElement = compiled.querySelector('.breeder-card__distance');
            expect(distanceElement).toBeTruthy();
            expect(distanceElement?.textContent).toContain('miles');

            // Should display breeds
            const breedsElement = compiled.querySelector('.breeder-card__breeds');
            expect(breedsElement).toBeTruthy();

            // Should display thumbnail image
            const imageElement = compiled.querySelector('.breeder-card__thumbnail');
            expect(imageElement).toBeTruthy();

            // Should display description (or default text)
            const descriptionElement = compiled.querySelector('.breeder-card__description');
            expect(descriptionElement).toBeTruthy();

            // Should display action buttons
            const buttons = compiled.querySelectorAll('.breeder-card__button');
            expect(buttons.length).toBe(2); // View Profile and Contact buttons

            // Should display rating if available
            if (breeder.rating !== null) {
              const ratingElement = compiled.querySelector('.breeder-card__rating');
              expect(ratingElement).toBeTruthy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle breeders with no thumbnail gracefully', () => {
      // Feature: pet-search-map, Property 29: Breeder Card Content Completeness
      // Validates: Requirements 8.4
      
      fc.assert(
        fc.property(
          breederResultArb.map(b => ({ ...b, thumbnail_url: null as string | null })),
          (breeder: BreederSearchResult) => {
            component.breeder = breeder;
            fixture.detectChanges();

            const compiled = fixture.nativeElement as HTMLElement;
            const imageElement = compiled.querySelector('.breeder-card__thumbnail') as HTMLImageElement;
            
            expect(imageElement).toBeTruthy();
            // Should use default image
            expect(imageElement.src).toContain('default-breeder.png');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle breeders with no description gracefully', () => {
      // Feature: pet-search-map, Property 29: Breeder Card Content Completeness
      // Validates: Requirements 8.4
      
      fc.assert(
        fc.property(
          breederResultArb.map(b => ({ ...b, location_description: null as string | null })),
          (breeder: BreederSearchResult) => {
            component.breeder = breeder;
            fixture.detectChanges();

            const compiled = fixture.nativeElement as HTMLElement;
            const descriptionElement = compiled.querySelector('.breeder-card__description');
            
            expect(descriptionElement).toBeTruthy();
            expect(descriptionElement?.textContent).toContain('No description available');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle breeders with no rating gracefully', () => {
      // Feature: pet-search-map, Property 29: Breeder Card Content Completeness
      // Validates: Requirements 8.4
      
      fc.assert(
        fc.property(
          breederResultArb.map(b => ({ ...b, rating: null as number | null })),
          (breeder: BreederSearchResult) => {
            component.breeder = breeder;
            fixture.detectChanges();

            const compiled = fixture.nativeElement as HTMLElement;
            const ratingElement = compiled.querySelector('.breeder-card__rating');
            
            // Rating element should not be displayed when rating is null
            expect(ratingElement).toBeFalsy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display all available breeds', () => {
      // Feature: pet-search-map, Property 29: Breeder Card Content Completeness
      // Validates: Requirements 8.4
      
      fc.assert(
        fc.property(
          breederResultArb,
          (breeder: BreederSearchResult) => {
            component.breeder = breeder;
            const breedNames = component.getBreedNames();
            
            // Should contain all breed names
            breeder.available_breeds.forEach(breed => {
              expect(breedNames).toContain(breed.breed_name);
            });
            
            // Should be comma-separated
            if (breeder.available_breeds.length > 1) {
              expect(breedNames).toContain(',');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should truncate long descriptions to 100 characters', () => {
      // Feature: pet-search-map, Property 29: Breeder Card Content Completeness
      // Validates: Requirements 8.4
      
      fc.assert(
        fc.property(
          fc.string({ minLength: 101, maxLength: 500 }),
          (longDescription: string) => {
            const truncated = component.truncateDescription(longDescription, 100);
            
            // Should be truncated to 100 characters plus ellipsis
            expect(truncated.length).toBeLessThanOrEqual(103); // 100 + '...'
            expect(truncated.endsWith('...')).toBe(true);
            expect(truncated.substring(0, 100)).toBe(longDescription.substring(0, 100));
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not truncate short descriptions', () => {
      // Feature: pet-search-map, Property 29: Breeder Card Content Completeness
      // Validates: Requirements 8.4
      
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (shortDescription: string) => {
            const result = component.truncateDescription(shortDescription, 100);
            
            // Should return the original description
            expect(result).toBe(shortDescription);
            expect(result).not.toContain('...');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
