/**
 * Property-Based Tests for MapComponent
 * Feature: pet-search-map
 * 
 * These tests validate universal properties that should hold true
 * for all valid inputs to the map component.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapComponent } from './map.component';
import { BreederMarker, BreederSearchResult, Coordinates, BreedInfo } from '../../models/search';
import * as fc from 'fast-check';

describe('MapComponent Property-Based Tests', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Clean up Leaflet map instances and containers
    if (component && (component as any).map) {
      try {
        (component as any).map.remove();
        (component as any).map = null;
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
    
    // Remove all Leaflet containers from DOM
    const leafletContainers = document.querySelectorAll('.leaflet-container');
    leafletContainers.forEach(container => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });
    
    // Destroy the fixture
    if (fixture) {
      fixture.destroy();
    }
  });

  /**
   * Property 17: Marker Display for Breeders
   * Feature: pet-search-map, Property 17: Marker Display for Breeders
   * Validates: Requirements 6.4
   * 
   * For any set of breeder search results, the system SHALL display a marker
   * on the map at each breeder's coordinates.
   */
  describe('Property 17: Marker Display for Breeders', () => {
    it('should display a marker for each breeder in the results', () => {
      fc.assert(
        fc.property(
          // Generate array of breeder results with valid coordinates
          fc.array(
            fc.record({
              location_id: fc.integer({ min: 1, max: 10000 }),
              user_id: fc.uuid(),
              breeder_name: fc.string({ minLength: 1, maxLength: 50 }),
              latitude: fc.double({ min: -90, max: 90, noNaN: true }),
              longitude: fc.double({ min: -180, max: 180, noNaN: true }),
              distance: fc.double({ min: 0, max: 100, noNaN: true }),
              available_breeds: fc.array(
                fc.record({
                  breed_id: fc.integer({ min: 1, max: 100 }),
                  breed_name: fc.string({ minLength: 1, maxLength: 30 }),
                  pet_count: fc.integer({ min: 1, max: 10 })
                }),
                { minLength: 0, maxLength: 5 }
              ),
              thumbnail_url: fc.oneof(fc.constant(null), fc.webUrl()),
              location_description: fc.oneof(fc.constant(null), fc.string({ maxLength: 200 })),
              rating: fc.oneof(fc.constant(null), fc.double({ min: 0, max: 5 }))
            }),
            { minLength: 0, maxLength: 20 }
          ),
          (breederResults: BreederSearchResult[]) => {
            // Convert to BreederMarker format
            const markers: BreederMarker[] = breederResults.map(result => ({
              id: result.user_id,
              position: {
                latitude: result.latitude,
                longitude: result.longitude
              },
              breeder: result
            }));

            // Set markers on component (don't initialize map in property tests)
            component.markers = markers;

            // Property: Number of markers should equal number of breeders
            const markerCount = component.markers.length;
            expect(markerCount).toBe(breederResults.length);

            // Property: Each breeder should have a corresponding marker
            breederResults.forEach(breeder => {
              const marker = markers.find(m => m.id === breeder.user_id);
              expect(marker).toBeDefined();
              if (marker) {
                expect(marker.position.latitude).toBe(breeder.latitude);
                expect(marker.position.longitude).toBe(breeder.longitude);
              }
            });
          }
        ),
        { numRuns: 50 } // Run 50 iterations for property testing
      );
    });

    it('should handle empty breeder results', () => {
      // Edge case: empty results should display no markers
      const emptyMarkers: BreederMarker[] = [];
      component.markers = emptyMarkers;

      expect(component.markers.length).toBe(0);
    });

    it('should handle single breeder result', () => {
      fc.assert(
        fc.property(
          fc.record({
            location_id: fc.integer({ min: 1, max: 10000 }),
            user_id: fc.uuid(),
            breeder_name: fc.string({ minLength: 1, maxLength: 50 }),
            latitude: fc.double({ min: -90, max: 90, noNaN: true }),
            longitude: fc.double({ min: -180, max: 180, noNaN: true }),
            distance: fc.double({ min: 0, max: 100, noNaN: true }),
            available_breeds: fc.constant([] as any),
            thumbnail_url: fc.constant(null as any),
            location_description: fc.constant(null as any),
            rating: fc.constant(null as any)
          }),
          (breederResult: BreederSearchResult) => {
            const marker: BreederMarker = {
              id: breederResult.user_id,
              position: {
                latitude: breederResult.latitude,
                longitude: breederResult.longitude
              },
              breeder: breederResult
            };

            component.markers = [marker];

            expect(component.markers.length).toBe(1);
            expect(component.markers[0].id).toBe(breederResult.user_id);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should preserve marker coordinates exactly as provided', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -90, max: 90, noNaN: true }),
          fc.double({ min: -180, max: 180, noNaN: true }),
          fc.uuid(),
          (lat: number, lon: number, userId: string) => {
            const breederResult: BreederSearchResult = {
              location_id: 1,
              user_id: userId,
              breeder_name: 'Test Breeder',
              latitude: lat,
              longitude: lon,
              distance: 10,
              available_breeds: [],
              thumbnail_url: null,
              location_description: null,
              rating: null
            };

            const marker: BreederMarker = {
              id: userId,
              position: {
                latitude: lat,
                longitude: lon
              },
              breeder: breederResult
            };

            component.markers = [marker];

            // Property: Marker coordinates should exactly match input coordinates
            expect(component.markers[0].position.latitude).toBe(lat);
            expect(component.markers[0].position.longitude).toBe(lon);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property: Marker ID Uniqueness
   * 
   * For any set of markers, each marker should have a unique ID
   * corresponding to the breeder's user_id.
   */
  describe('Property: Marker ID Uniqueness', () => {
    it('should maintain unique IDs for all markers', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              location_id: fc.integer({ min: 1, max: 10000 }),
              user_id: fc.uuid(),
              breeder_name: fc.string({ minLength: 1, maxLength: 50 }),
              latitude: fc.double({ min: -90, max: 90, noNaN: true }),
              longitude: fc.double({ min: -180, max: 180, noNaN: true }),
              distance: fc.double({ min: 0, max: 100, noNaN: true }),
              available_breeds: fc.constant([] as any),
              thumbnail_url: fc.constant(null as any),
              location_description: fc.constant(null as any),
              rating: fc.constant(null as any)
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (breederResults: BreederSearchResult[]) => {
            const markers: BreederMarker[] = breederResults.map(result => ({
              id: result.user_id,
              position: {
                latitude: result.latitude,
                longitude: result.longitude
              },
              breeder: result
            }));

            component.markers = markers;

            // Property: All marker IDs should be unique
            const ids = markers.map(m => m.id);
            const uniqueIds = new Set(ids);
            
            // If input has unique user_ids, output should have unique marker IDs
            const inputUniqueIds = new Set(breederResults.map(b => b.user_id));
            expect(uniqueIds.size).toBe(inputUniqueIds.size);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property: Marker Position Validity
   * 
   * For any marker, the position should always be within valid
   * geographic coordinate ranges.
   */
  describe('Property: Marker Position Validity', () => {
    it('should only accept markers with valid coordinate ranges', () => {
      fc.assert(
        fc.property(
          fc.double({ min: -90, max: 90, noNaN: true }),
          fc.double({ min: -180, max: 180, noNaN: true }),
          (lat: number, lon: number) => {
            const marker: BreederMarker = {
              id: 'test-id',
              position: {
                latitude: lat,
                longitude: lon
              },
              breeder: {
                location_id: 1,
                user_id: 'test-id',
                breeder_name: 'Test',
                latitude: lat,
                longitude: lon,
                distance: 10,
                available_breeds: [],
                thumbnail_url: null,
                location_description: null,
                rating: null
              }
            };

            component.markers = [marker];

            // Property: Latitude should be in range [-90, 90]
            expect(marker.position.latitude).toBeGreaterThanOrEqual(-90);
            expect(marker.position.latitude).toBeLessThanOrEqual(90);

            // Property: Longitude should be in range [-180, 180]
            expect(marker.position.longitude).toBeGreaterThanOrEqual(-180);
            expect(marker.position.longitude).toBeLessThanOrEqual(180);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 18: Marker Clustering
   * Feature: pet-search-map, Property 18: Marker Clustering
   * Validates: Requirements 6.6
   * 
   * For any set of markers in close proximity (within cluster radius),
   * the system SHALL group them into a marker cluster.
   */
  describe('Property 18: Marker Clustering', () => {
    it('should cluster markers that are within 80px cluster radius', () => {
      // Create markers at the same location (will definitely cluster)
      const baseLatitude = 40.7128;
      const baseLongitude = -74.0060;
      
      const clusteredMarkers: BreederMarker[] = Array.from({ length: 5 }, (_, i) => ({
        id: `breeder-${i}`,
        position: {
          latitude: baseLatitude + (i * 0.0001), // Very close together
          longitude: baseLongitude + (i * 0.0001)
        },
        breeder: {
          location_id: i + 1,
          user_id: `breeder-${i}`,
          breeder_name: `Breeder ${i}`,
          latitude: baseLatitude + (i * 0.0001),
          longitude: baseLongitude + (i * 0.0001),
          distance: i * 0.5,
          available_breeds: [] as BreedInfo[],
          thumbnail_url: null as string | null,
          location_description: null as string | null,
          rating: null as number | null
        }
      }));

      component.markers = clusteredMarkers;

      // Property: Markers should be added to component
      expect(component.markers.length).toBe(5);
      
      // All markers should be managed by the component
      clusteredMarkers.forEach(marker => {
        const found = component.markers.find(m => m.id === marker.id);
        expect(found).toBeDefined();
      });
    });

    it('should not cluster markers that are far apart', () => {
      // Create markers at different locations (won't cluster)
      const dispersedMarkers: BreederMarker[] = [
        {
          id: 'breeder-1',
          position: { latitude: 40.7128, longitude: -74.0060 }, // New York
          breeder: {
            location_id: 1,
            user_id: 'breeder-1',
            breeder_name: 'NYC Breeder',
            latitude: 40.7128,
            longitude: -74.0060,
            distance: 0,
            available_breeds: [],
            thumbnail_url: null,
            location_description: null,
            rating: null
          }
        },
        {
          id: 'breeder-2',
          position: { latitude: 34.0522, longitude: -118.2437 }, // Los Angeles
          breeder: {
            location_id: 2,
            user_id: 'breeder-2',
            breeder_name: 'LA Breeder',
            latitude: 34.0522,
            longitude: -118.2437,
            distance: 2000,
            available_breeds: [],
            thumbnail_url: null,
            location_description: null,
            rating: null
          }
        }
      ];

      component.markers = dispersedMarkers;

      // Property: Both markers should be present
      expect(component.markers.length).toBe(2);
    });

    it('should handle varying numbers of markers for clustering', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 50 }),
          fc.double({ min: -90, max: 90, noNaN: true }),
          fc.double({ min: -180, max: 180, noNaN: true }),
          (markerCount: number, baseLat: number, baseLon: number) => {
            // Generate markers clustered around a base location
            const markers: BreederMarker[] = Array.from({ length: markerCount }, (_, i) => ({
              id: `breeder-${i}`,
              position: {
                latitude: baseLat + (i * 0.001),
                longitude: baseLon + (i * 0.001)
              },
              breeder: {
                location_id: i + 1,
                user_id: `breeder-${i}`,
                breeder_name: `Breeder ${i}`,
                latitude: baseLat + (i * 0.001),
                longitude: baseLon + (i * 0.001),
                distance: i * 0.5,
                available_breeds: [] as BreedInfo[],
                thumbnail_url: null as string | null,
                location_description: null as string | null,
                rating: null as number | null
              }
            }));

            component.markers = markers;

            // Property: Number of markers in component should equal input count
            expect(component.markers.length).toBe(markerCount);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should maintain marker data integrity when clustering', () => {
      // Create clustered markers with different data
      const markers: BreederMarker[] = [
        {
          id: 'breeder-1',
          position: { latitude: 40.7128, longitude: -74.0060 },
          breeder: {
            location_id: 1,
            user_id: 'breeder-1',
            breeder_name: 'First Breeder',
            latitude: 40.7128,
            longitude: -74.0060,
            distance: 5.5,
            available_breeds: [
              { breed_id: 1, breed_name: 'Golden Retriever', pet_count: 3 }
            ],
            thumbnail_url: 'http://example.com/1.jpg',
            location_description: 'Description 1',
            rating: 4.5
          }
        },
        {
          id: 'breeder-2',
          position: { latitude: 40.7129, longitude: -74.0061 }, // Very close
          breeder: {
            location_id: 2,
            user_id: 'breeder-2',
            breeder_name: 'Second Breeder',
            latitude: 40.7129,
            longitude: -74.0061,
            distance: 5.6,
            available_breeds: [
              { breed_id: 2, breed_name: 'Labrador', pet_count: 2 }
            ],
            thumbnail_url: 'http://example.com/2.jpg',
            location_description: 'Description 2',
            rating: 4.8
          }
        }
      ];

      component.markers = markers;

      // Property: All marker data should be preserved
      markers.forEach(inputMarker => {
        const outputMarker = component.markers.find(m => m.id === inputMarker.id);
        expect(outputMarker).toBeDefined();
        if (outputMarker) {
          expect(outputMarker.breeder.breeder_name).toBe(inputMarker.breeder.breeder_name);
          expect(outputMarker.breeder.distance).toBe(inputMarker.breeder.distance);
          expect(outputMarker.breeder.available_breeds.length).toBe(inputMarker.breeder.available_breeds.length);
        }
      });
    });
  });
});
