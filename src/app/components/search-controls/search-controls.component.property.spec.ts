import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchControlsComponent } from './search-controls.component';
import { SearchService } from '../../services/search.service';
import { of } from 'rxjs';
import * as fc from 'fast-check';

describe('SearchControlsComponent - Property-Based Tests', () => {
  let component: SearchControlsComponent;
  let fixture: ComponentFixture<SearchControlsComponent>;
  let mockSearchService: jasmine.SpyObj<SearchService>;

  beforeEach(async () => {
    mockSearchService = jasmine.createSpyObj('SearchService', ['searchBreeds']);
    mockSearchService.searchBreeds.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [SearchControlsComponent],
      providers: [
        { provide: SearchService, useValue: mockSearchService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Property 3: ZIP Validation - Numeric Only', () => {
    it('should accept only numeric strings for ZIP code input', () => {
      // Feature: pet-search-map, Property 3: ZIP Validation - Numeric Only
      // Validates: Requirements 3.2
      
      fc.assert(
        fc.property(
          fc.string(),
          (input: string) => {
            // Reset error state
            component.zipError = null;
            
            // Call the validation method
            component.onZipCodeInput(input);
            
            // Check if input contains only digits
            const isNumeric = /^\d*$/.test(input);
            
            if (isNumeric && input.length <= 5) {
              // Should accept numeric input
              expect(component.zipError).toBeNull();
              expect(component.zipCode).toBe(input);
            } else if (!isNumeric) {
              // Should reject non-numeric input
              expect(component.zipError).toEqual('ZIP code must contain only numbers');
            } else if (input.length > 5) {
              // Should reject input longer than 5 digits
              expect(component.zipError).toEqual('ZIP code must be 5 digits');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept any 5-digit numeric string', () => {
      // Feature: pet-search-map, Property 3: ZIP Validation - Numeric Only
      // Validates: Requirements 3.2
      
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 99999 }).map(n => n.toString().padStart(5, '0')),
          (zipCode: string) => {
            component.zipError = null;
            component.onZipCodeInput(zipCode);
            
            expect(component.zipError).toBeNull();
            expect(component.zipCode).toBe(zipCode);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject strings containing non-numeric characters', () => {
      // Feature: pet-search-map, Property 3: ZIP Validation - Numeric Only
      // Validates: Requirements 3.2
      
      fc.assert(
        fc.property(
          fc.string().filter(s => s.length > 0 && !/^\d*$/.test(s)),
          (input: string) => {
            component.zipError = null;
            component.onZipCodeInput(input);
            
            expect(component.zipError).toEqual('ZIP code must contain only numbers');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty string input', () => {
      // Feature: pet-search-map, Property 3: ZIP Validation - Numeric Only
      // Validates: Requirements 3.2
      
      component.zipError = null;
      component.onZipCodeInput('');
      
      expect(component.zipError).toBeNull();
      expect(component.zipCode).toBe('');
    });
  });

  describe('Property 12: Custom Radius Validation', () => {
    it('should validate that radius is a positive number', () => {
      // Feature: pet-search-map, Property 12: Custom Radius Validation
      // Validates: Requirements 5.5
      
      fc.assert(
        fc.property(
          fc.oneof(
            fc.double().map(n => Math.fround(n)),
            fc.integer(),
            fc.constant('abc'),
            fc.constant(''),
            fc.constant('-10'),
            fc.constant('0')
          ),
          (value: any) => {
            component.radiusError = null;
            const stringValue = String(value);
            component.onCustomRadiusInput(stringValue);
            
            const numValue = parseFloat(stringValue);
            
            if (isNaN(numValue) || numValue <= 0) {
              // Should reject non-positive numbers
              expect(component.radiusError).toEqual('Radius must be a positive number');
            } else if (numValue > 100) {
              // Should reject values over 100
              expect(component.radiusError).toEqual('Radius cannot exceed 100 miles');
            } else {
              // Should accept valid positive numbers <= 100
              expect(component.radiusError).toBeNull();
              expect(component.radius).toBe(numValue);
              expect(component.customRadiusInput).toBe(numValue);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept any positive number up to 100', () => {
      // Feature: pet-search-map, Property 12: Custom Radius Validation
      // Validates: Requirements 5.5
      
      fc.assert(
        fc.property(
          fc.double({ min: 0.1, max: 100, noNaN: true }).map(n => Math.fround(n)),
          (radius: number) => {
            component.radiusError = null;
            component.onCustomRadiusInput(radius.toString());
            
            expect(component.radiusError).toBeNull();
            expect(component.radius).toBeCloseTo(radius, 5);
            expect(component.customRadiusInput).toBeCloseTo(radius, 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject negative numbers', () => {
      // Feature: pet-search-map, Property 12: Custom Radius Validation
      // Validates: Requirements 5.5
      
      fc.assert(
        fc.property(
          fc.double({ max: -0.1, noNaN: true }).map(n => Math.fround(n)),
          (radius: number) => {
            component.radiusError = null;
            component.onCustomRadiusInput(radius.toString());
            
            expect(component.radiusError).toEqual('Radius must be a positive number');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject zero', () => {
      // Feature: pet-search-map, Property 12: Custom Radius Validation
      // Validates: Requirements 5.5
      
      component.radiusError = null;
      component.onCustomRadiusInput('0');
      
      expect(component.radiusError).toEqual('Radius must be a positive number');
    });

    it('should reject values over 100 miles', () => {
      // Feature: pet-search-map, Property 12: Custom Radius Validation
      // Validates: Requirements 5.5
      
      fc.assert(
        fc.property(
          fc.double({ min: 100.1, max: 1000, noNaN: true }).map(n => Math.fround(n)),
          (radius: number) => {
            component.radiusError = null;
            component.onCustomRadiusInput(radius.toString());
            
            expect(component.radiusError).toEqual('Radius cannot exceed 100 miles');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject non-numeric strings', () => {
      // Feature: pet-search-map, Property 12: Custom Radius Validation
      // Validates: Requirements 5.5
      
      fc.assert(
        fc.property(
          fc.string().filter(s => isNaN(parseFloat(s))),
          (input: string) => {
            component.radiusError = null;
            component.onCustomRadiusInput(input);
            
            expect(component.radiusError).toEqual('Radius must be a positive number');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
