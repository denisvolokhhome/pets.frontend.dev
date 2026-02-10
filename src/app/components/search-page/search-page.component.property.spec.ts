import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import * as fc from 'fast-check';
import { SearchPageComponent } from './search-page.component';
import { SearchService } from '../../services/search.service';
import { MapComponent } from '../map/map.component';
import { SearchControlsComponent } from '../search-controls/search-controls.component';
import { BreederCardListComponent } from '../breeder-card-list/breeder-card-list.component';
import { Coordinates, Address } from '../../models/search';

/**
 * Property-Based Tests for SearchPageComponent
 * Feature: pet-search-map
 * 
 * These tests validate universal properties that should hold true
 * across all valid inputs using property-based testing with fast-check.
 */

/**
 * Helper function to create a mock GeolocationPosition
 */
function createMockPosition(latitude: number, longitude: number): GeolocationPosition {
  return {
    coords: {
      latitude,
      longitude,
      accuracy: 100,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON: () => ({})
    },
    timestamp: Date.now(),
    toJSON: () => ({})
  };
}

describe('SearchPageComponent - Property-Based Tests', () => {
  let component: SearchPageComponent;
  let searchService: jasmine.SpyObj<SearchService>;
  let mockGeolocation: jasmine.SpyObj<Geolocation>;

  beforeEach(() => {
    const searchServiceSpy = jasmine.createSpyObj('SearchService', [
      'searchBreeders',
      'searchBreeds',
      'geocodeZipCode',
      'reverseGeocode'
    ]);

    mockGeolocation = jasmine.createSpyObj('Geolocation', ['getCurrentPosition']);

    TestBed.configureTestingModule({
      declarations: [
        SearchPageComponent,
        MapComponent,
        SearchControlsComponent,
        BreederCardListComponent
      ],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: SearchService, useValue: searchServiceSpy }
      ]
    });

    searchService = TestBed.inject(SearchService) as jasmine.SpyObj<SearchService>;

    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true
    });

    const fixture = TestBed.createComponent(SearchPageComponent);
    component = fixture.componentInstance;
  });

  /**
   * Property 1: Geocoding Service Invocation
   * Feature: pet-search-map, Property 1: Geocoding Service Invocation
   * 
   * For any valid coordinates obtained from geolocation, 
   * the system SHALL invoke the Geocoding Service to convert them to a ZIP code.
   * 
   * Validates: Requirements 2.3
   */
  describe('Property 1: Geocoding Service Invocation', () => {
    it('should invoke reverse geocoding for any valid coordinates from geolocation', () => {
      fc.assert(
        fc.property(
          // Generate valid latitude (-90 to 90)
          fc.double({ min: -90, max: 90, noNaN: true }),
          // Generate valid longitude (-180 to 180)
          fc.double({ min: -180, max: 180, noNaN: true }),
          (latitude, longitude) => {
            // Reset spy
            searchService.reverseGeocode.calls.reset();
            searchService.searchBreeders.calls.reset();

            const mockPosition = createMockPosition(latitude, longitude);

            const mockAddress: Address = {
              zip_code: '12345',
              city: 'Test City',
              state: 'TS',
              country: 'USA'
            };

            searchService.reverseGeocode.and.returnValue(of(mockAddress));
            searchService.searchBreeders.and.returnValue(of([]));

            // Simulate geolocation success
            mockGeolocation.getCurrentPosition.and.callFake((success) => {
              success(mockPosition);
            });

            component.ngOnInit();

            // Property: Geocoding service MUST be invoked with the coordinates
            expect(searchService.reverseGeocode).toHaveBeenCalledWith(latitude, longitude);
            expect(searchService.reverseGeocode).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle coordinates at boundary values', () => {
      const boundaryCoordinates = [
        { lat: -90, lon: -180 },  // Southwest corner
        { lat: -90, lon: 180 },   // Southeast corner
        { lat: 90, lon: -180 },   // Northwest corner
        { lat: 90, lon: 180 },    // Northeast corner
        { lat: 0, lon: 0 },       // Equator/Prime Meridian
        { lat: 0, lon: -180 },    // Equator/Date Line West
        { lat: 0, lon: 180 }      // Equator/Date Line East
      ];

      boundaryCoordinates.forEach(({ lat, lon }) => {
        searchService.reverseGeocode.calls.reset();

        const mockPosition = createMockPosition(lat, lon);

        const mockAddress: Address = {
          zip_code: '12345',
          city: 'Test City',
          state: 'TS',
          country: 'USA'
        };

        searchService.reverseGeocode.and.returnValue(of(mockAddress));
        searchService.searchBreeders.and.returnValue(of([]));

        mockGeolocation.getCurrentPosition.and.callFake((success) => {
          success(mockPosition);
        });

        component.ngOnInit();

        expect(searchService.reverseGeocode).toHaveBeenCalledWith(lat, lon);
      });
    });
  });

  /**
   * Property 2: ZIP Field Population
   * Feature: pet-search-map, Property 2: ZIP Field Population
   * 
   * For any ZIP code retrieved from geocoding, 
   * the system SHALL populate the ZIP input field with that value.
   * 
   * Validates: Requirements 2.4
   */
  describe('Property 2: ZIP Field Population', () => {
    it('should populate ZIP field with any valid ZIP code from geocoding', () => {
      fc.assert(
        fc.property(
          // Generate valid 5-digit ZIP codes
          fc.integer({ min: 10000, max: 99999 }).map(n => n.toString()),
          // Generate valid coordinates
          fc.double({ min: -90, max: 90, noNaN: true }),
          fc.double({ min: -180, max: 180, noNaN: true }),
          (zipCode, latitude, longitude) => {
            // Reset component state
            component.zipCode = '';
            searchService.reverseGeocode.calls.reset();
            searchService.searchBreeders.calls.reset();

            const mockPosition = createMockPosition(latitude, longitude);

            const mockAddress: Address = {
              zip_code: zipCode,
              city: 'Test City',
              state: 'TS',
              country: 'USA'
            };

            searchService.reverseGeocode.and.returnValue(of(mockAddress));
            searchService.searchBreeders.and.returnValue(of([]));

            mockGeolocation.getCurrentPosition.and.callFake((success) => {
              success(mockPosition);
            });

            component.ngOnInit();

            // Property: ZIP field MUST be populated with the geocoded ZIP code
            expect(component.zipCode).toBe(zipCode);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle ZIP codes with leading zeros', () => {
      const zipCodesWithLeadingZeros = [
        '00501', // Holtsville, NY
        '01001', // Agawam, MA
        '02101', // Boston, MA
        '03031', // Amherst, NH
        '04001', // Acton, ME
        '05001', // White River Junction, VT
        '06001', // Avon, CT
        '07001', // Avenel, NJ
        '08001', // Alloway, NJ
        '09001'  // (hypothetical)
      ];

      zipCodesWithLeadingZeros.forEach(zipCode => {
        component.zipCode = '';
        searchService.reverseGeocode.calls.reset();

        const mockPosition = createMockPosition(40.7128, -74.0060);

        const mockAddress: Address = {
          zip_code: zipCode,
          city: 'Test City',
          state: 'TS',
          country: 'USA'
        };

        searchService.reverseGeocode.and.returnValue(of(mockAddress));
        searchService.searchBreeders.and.returnValue(of([]));

        mockGeolocation.getCurrentPosition.and.callFake((success) => {
          success(mockPosition);
        });

        component.ngOnInit();

        expect(component.zipCode).toBe(zipCode);
        expect(component.zipCode.length).toBe(5);
      });
    });

    it('should not populate ZIP field if geocoding returns null', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -90, max: 90, noNaN: true }),
          fc.double({ min: -180, max: 180, noNaN: true }),
          (latitude, longitude) => {
            component.zipCode = '';
            searchService.reverseGeocode.calls.reset();

            const mockPosition = createMockPosition(latitude, longitude);

            const mockAddress: Address = {
              zip_code: null,
              city: 'Test City',
              state: 'TS',
              country: 'USA'
            };

            searchService.reverseGeocode.and.returnValue(of(mockAddress));

            mockGeolocation.getCurrentPosition.and.callFake((success) => {
              success(mockPosition);
            });

            component.ngOnInit();

            // Property: ZIP field should remain empty if geocoding returns null
            expect(component.zipCode).toBe('');
            expect(component.geolocationError).toContain('Could not determine ZIP code');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Additional Property: Geolocation Flow Completeness
   * 
   * For any successful geolocation, the complete flow should execute:
   * 1. Coordinates obtained
   * 2. Reverse geocoding called
   * 3. ZIP code populated
   * 4. Map center updated
   */
  describe('Property: Geolocation Flow Completeness', () => {
    it('should complete entire geolocation flow for any valid coordinates', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -90, max: 90, noNaN: true }),
          fc.double({ min: -180, max: 180, noNaN: true }),
          fc.integer({ min: 10000, max: 99999 }).map(n => n.toString()),
          (latitude, longitude, zipCode) => {
            // Reset state
            component.zipCode = '';
            component.mapCenter = { latitude: 39.8283, longitude: -98.5795 };
            searchService.reverseGeocode.calls.reset();
            searchService.searchBreeders.calls.reset();

            const mockPosition = createMockPosition(latitude, longitude);

            const mockAddress: Address = {
              zip_code: zipCode,
              city: 'Test City',
              state: 'TS',
              country: 'USA'
            };

            searchService.reverseGeocode.and.returnValue(of(mockAddress));
            searchService.searchBreeders.and.returnValue(of([]));

            mockGeolocation.getCurrentPosition.and.callFake((success) => {
              success(mockPosition);
            });

            component.ngOnInit();

            // Property: All steps of the flow must complete
            // 1. Reverse geocoding was called
            expect(searchService.reverseGeocode).toHaveBeenCalledWith(latitude, longitude);
            
            // 2. ZIP code was populated
            expect(component.zipCode).toBe(zipCode);
            
            // 3. Map center was updated to user's location
            expect(component.mapCenter.latitude).toBe(latitude);
            expect(component.mapCenter.longitude).toBe(longitude);
            
            // 4. Search was automatically triggered
            expect(searchService.searchBreeders).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 31: Marker Click Highlights Card
   * Feature: pet-search-map, Property 31: Marker Click Highlights Card
   * 
   * For any marker clicked on the map, 
   * the system SHALL highlight the corresponding breeder card.
   * 
   * Validates: Requirements 9.1
   */
  describe('Property 31: Marker Click Highlights Card', () => {
    it('should highlight card for any valid breeder ID when marker is clicked', () => {
      fc.assert(
        fc.property(
          // Generate random breeder IDs (UUIDs or simple strings)
          fc.uuid(),
          (breederId) => {
            // Reset state
            component.highlightedBreederId = null;

            // Simulate marker click
            component.onMarkerClick(breederId);

            // Property: The breeder card MUST be highlighted
            expect(component.highlightedBreederId).toBe(breederId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update highlighted card when different markers are clicked sequentially', () => {
      fc.assert(
        fc.property(
          fc.array(fc.uuid(), { minLength: 2, maxLength: 10 }),
          (breederIds) => {
            // Click each marker in sequence
            breederIds.forEach(breederId => {
              component.onMarkerClick(breederId);
              
              // Property: The most recently clicked marker's card should be highlighted
              expect(component.highlightedBreederId).toBe(breederId);
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 32: Card Click Zooms to Marker
   * Feature: pet-search-map, Property 32: Card Click Zooms to Marker
   * 
   * For any breeder card clicked, 
   * the system SHALL zoom the map to center on the corresponding marker.
   * 
   * Validates: Requirements 9.2
   */
  describe('Property 32: Card Click Zooms to Marker', () => {
    beforeEach(() => {
      // Mock the map component
      component.mapComponent = jasmine.createSpyObj('MapComponent', [
        'zoomToMarker',
        'bounceMarker'
      ]);
    });

    it('should zoom to marker for any valid breeder ID when card is clicked', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (breederId) => {
            // Reset spy
            (component.mapComponent.zoomToMarker as jasmine.Spy).calls.reset();

            // Simulate card click
            component.onCardClick(breederId);

            // Property: Map MUST zoom to the corresponding marker
            expect(component.mapComponent.zoomToMarker).toHaveBeenCalledWith(breederId);
            expect(component.mapComponent.zoomToMarker).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should highlight card when clicked', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (breederId) => {
            // Reset state
            component.highlightedBreederId = null;

            // Simulate card click
            component.onCardClick(breederId);

            // Property: Card MUST also be highlighted when clicked
            expect(component.highlightedBreederId).toBe(breederId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple card clicks in sequence', () => {
      fc.assert(
        fc.property(
          fc.array(fc.uuid(), { minLength: 2, maxLength: 10 }),
          (breederIds) => {
            (component.mapComponent.zoomToMarker as jasmine.Spy).calls.reset();

            // Click each card in sequence
            breederIds.forEach(breederId => {
              component.onCardClick(breederId);
            });

            // Property: Map should have zoomed for each click
            expect(component.mapComponent.zoomToMarker).toHaveBeenCalledTimes(breederIds.length);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 33: Card Hover Animates Marker
   * Feature: pet-search-map, Property 33: Card Hover Animates Marker
   * 
   * For any breeder card hovered over, 
   * the system SHALL trigger a bounce animation on the corresponding marker.
   * 
   * Validates: Requirements 9.3
   */
  describe('Property 33: Card Hover Animates Marker', () => {
    beforeEach(() => {
      // Mock the map component
      component.mapComponent = jasmine.createSpyObj('MapComponent', [
        'zoomToMarker',
        'bounceMarker'
      ]);
    });

    it('should bounce marker for any valid breeder ID when card is hovered', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (breederId) => {
            // Reset spy
            (component.mapComponent.bounceMarker as jasmine.Spy).calls.reset();

            // Simulate card hover
            component.onCardHover(breederId);

            // Property: Marker MUST bounce when card is hovered
            expect(component.mapComponent.bounceMarker).toHaveBeenCalledWith(breederId);
            expect(component.mapComponent.bounceMarker).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should highlight card when hovered', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (breederId) => {
            // Reset state
            component.highlightedBreederId = null;

            // Simulate card hover
            component.onCardHover(breederId);

            // Property: Card MUST also be highlighted when hovered
            expect(component.highlightedBreederId).toBe(breederId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle rapid hover events', () => {
      fc.assert(
        fc.property(
          fc.array(fc.uuid(), { minLength: 5, maxLength: 20 }),
          (breederIds) => {
            (component.mapComponent.bounceMarker as jasmine.Spy).calls.reset();

            // Simulate rapid hovering over multiple cards
            breederIds.forEach(breederId => {
              component.onCardHover(breederId);
            });

            // Property: Each hover should trigger a bounce
            expect(component.mapComponent.bounceMarker).toHaveBeenCalledTimes(breederIds.length);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 34: Marker Hover Highlights Card
   * Feature: pet-search-map, Property 34: Marker Hover Highlights Card
   * 
   * For any marker hovered over, 
   * the system SHALL highlight the corresponding breeder card with a visual indicator.
   * 
   * Validates: Requirements 9.4
   */
  describe('Property 34: Marker Hover Highlights Card', () => {
    it('should highlight card for any valid breeder ID when marker is hovered', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          (breederId) => {
            // Reset state
            component.highlightedBreederId = null;

            // Simulate marker hover
            component.onMarkerHover(breederId);

            // Property: The breeder card MUST be highlighted
            expect(component.highlightedBreederId).toBe(breederId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update highlighted card when hovering over different markers', () => {
      fc.assert(
        fc.property(
          fc.array(fc.uuid(), { minLength: 2, maxLength: 10 }),
          (breederIds) => {
            // Hover over each marker in sequence
            breederIds.forEach(breederId => {
              component.onMarkerHover(breederId);
              
              // Property: The most recently hovered marker's card should be highlighted
              expect(component.highlightedBreederId).toBe(breederId);
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Additional Property: Bidirectional Synchronization
   * 
   * For any interaction (click or hover) on either map or card,
   * the corresponding element should be synchronized.
   */
  describe('Property: Bidirectional Map-Card Synchronization', () => {
    beforeEach(() => {
      component.mapComponent = jasmine.createSpyObj('MapComponent', [
        'zoomToMarker',
        'bounceMarker'
      ]);
    });

    it('should maintain synchronization for any sequence of interactions', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              breederId: fc.uuid(),
              action: fc.constantFrom('markerClick', 'markerHover', 'cardClick', 'cardHover')
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (interactions) => {
            // Reset state
            component.highlightedBreederId = null;
            (component.mapComponent.zoomToMarker as jasmine.Spy).calls.reset();
            (component.mapComponent.bounceMarker as jasmine.Spy).calls.reset();

            // Perform each interaction
            interactions.forEach(({ breederId, action }) => {
              switch (action) {
                case 'markerClick':
                  component.onMarkerClick(breederId);
                  // Property: Card should be highlighted
                  expect(component.highlightedBreederId).toBe(breederId);
                  break;
                case 'markerHover':
                  component.onMarkerHover(breederId);
                  // Property: Card should be highlighted
                  expect(component.highlightedBreederId).toBe(breederId);
                  break;
                case 'cardClick':
                  component.onCardClick(breederId);
                  // Property: Map should zoom and card should be highlighted
                  expect(component.highlightedBreederId).toBe(breederId);
                  break;
                case 'cardHover':
                  component.onCardHover(breederId);
                  // Property: Marker should bounce and card should be highlighted
                  expect(component.highlightedBreederId).toBe(breederId);
                  break;
              }
            });

            // Property: The last interaction's breeder should be highlighted
            if (interactions.length > 0) {
              const lastInteraction = interactions[interactions.length - 1];
              expect(component.highlightedBreederId).toBe(lastInteraction.breederId);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
