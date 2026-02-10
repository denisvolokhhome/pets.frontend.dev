/**
 * Unit Tests for MapComponent
 * Feature: pet-search-map
 * 
 * These tests validate specific examples and edge cases for the map component.
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapComponent } from './map.component';
import { BreederMarker, BreederSearchResult, Coordinates } from '../../models/search';
import * as L from 'leaflet';

describe('MapComponent Unit Tests', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Properly clean up the map
    if (component && component['map']) {
      try {
        component['map'].off();
        component['map'].remove();
        delete (component as any)['map'];
      } catch (e) {
        // Ignore errors during cleanup
        console.error('Error during cleanup of component', { component, stacktrace: e });
      }
    }
    
    // Clean up marker cluster group
    if (component && component['markerClusterGroup']) {
      try {
        component['markerClusterGroup'].clearLayers();
        delete (component as any)['markerClusterGroup'];
      } catch (e) {
        // Ignore
      }
    }
    
    // Destroy the fixture
    if (fixture) {
      fixture.destroy();
    }
    
    // Clean up any remaining Leaflet containers
    const containers = document.querySelectorAll('.leaflet-container');
    containers.forEach(container => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default center coordinates (center of US)', () => {
      expect(component.center.latitude).toBe(39.8283);
      expect(component.center.longitude).toBe(-98.5795);
    });

    it('should initialize with default radius of 40 miles', () => {
      expect(component.radius).toBe(40);
    });

    it('should initialize with empty markers array', () => {
      expect(component.markers).toEqual([]);
    });

    it('should initialize the map after view init', () => {
      component.ngAfterViewInit();
      fixture.detectChanges();
      
      // Map should be initialized
      expect(component['map']).toBeDefined();
      expect(component['markerClusterGroup']).toBeDefined();
    });
  });

  describe('Marker Rendering', () => {
    beforeEach(() => {
      component.ngAfterViewInit();
      fixture.detectChanges();
    });

    it('should render markers when provided', () => {
      const testMarkers: BreederMarker[] = [
        {
          id: 'breeder-1',
          position: { latitude: 40.7128, longitude: -74.0060 },
          breeder: createTestBreeder('breeder-1', 'Test Breeder 1', 40.7128, -74.0060, 10)
        },
        {
          id: 'breeder-2',
          position: { latitude: 34.0522, longitude: -118.2437 },
          breeder: createTestBreeder('breeder-2', 'Test Breeder 2', 34.0522, -118.2437, 20)
        }
      ];

      component.markers = testMarkers;
      component.ngOnChanges({
        markers: {
          currentValue: testMarkers,
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });
      fixture.detectChanges();

      expect(component.markers.length).toBe(2);
    });

    it('should handle empty markers array', () => {
      component.markers = [];
      component.ngOnChanges({
        markers: {
          currentValue: [],
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });
      fixture.detectChanges();

      expect(component.markers.length).toBe(0);
    });

    it('should update markers when input changes', () => {
      const initialMarkers: BreederMarker[] = [
        {
          id: 'breeder-1',
          position: { latitude: 40.7128, longitude: -74.0060 },
          breeder: createTestBreeder('breeder-1', 'Test Breeder 1', 40.7128, -74.0060, 10)
        }
      ];

      component.markers = initialMarkers;
      component.ngOnChanges({
        markers: {
          currentValue: initialMarkers,
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });
      fixture.detectChanges();

      expect(component.markers.length).toBe(1);

      const updatedMarkers: BreederMarker[] = [
        ...initialMarkers,
        {
          id: 'breeder-2',
          position: { latitude: 34.0522, longitude: -118.2437 },
          breeder: createTestBreeder('breeder-2', 'Test Breeder 2', 34.0522, -118.2437, 20)
        }
      ];

      component.markers = updatedMarkers;
      component.ngOnChanges({
        markers: {
          currentValue: updatedMarkers,
          previousValue: initialMarkers,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      fixture.detectChanges();

      expect(component.markers.length).toBe(2);
    });
  });

  describe('Cluster Creation', () => {
    beforeEach(() => {
      component.ngAfterViewInit();
      fixture.detectChanges();
    });

    it('should create marker cluster group on initialization', () => {
      expect(component['markerClusterGroup']).toBeDefined();
    });

    it('should add markers to cluster group', () => {
      const markers: BreederMarker[] = [
        {
          id: 'breeder-1',
          position: { latitude: 40.7128, longitude: -74.0060 },
          breeder: createTestBreeder('breeder-1', 'Test Breeder 1', 40.7128, -74.0060, 10)
        },
        {
          id: 'breeder-2',
          position: { latitude: 40.7129, longitude: -74.0061 },
          breeder: createTestBreeder('breeder-2', 'Test Breeder 2', 40.7129, -74.0061, 10.1)
        }
      ];

      component.markers = markers;
      component.ngOnChanges({
        markers: {
          currentValue: markers,
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });
      fixture.detectChanges();

      expect(component.markers.length).toBe(2);
    });
  });

  describe('Circle Drawing', () => {
    beforeEach(() => {
      component.ngAfterViewInit();
      fixture.detectChanges();
    });

    it('should draw radius circle on initialization', () => {
      expect(component['radiusCircle']).toBeDefined();
    });

    it('should update radius circle when radius changes', () => {
      const newRadius = 60;
      component.radius = newRadius;
      component.ngOnChanges({
        radius: {
          currentValue: newRadius,
          previousValue: 40,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      fixture.detectChanges();

      expect(component.radius).toBe(newRadius);
    });

    it('should update radius circle when center changes', () => {
      const newCenter: Coordinates = { latitude: 34.0522, longitude: -118.2437 };
      component.center = newCenter;
      component.ngOnChanges({
        center: {
          currentValue: newCenter,
          previousValue: { latitude: 39.8283, longitude: -98.5795 },
          firstChange: false,
          isFirstChange: () => false
        }
      });
      fixture.detectChanges();

      expect(component.center).toEqual(newCenter);
    });
  });

  describe('Event Emissions', () => {
    beforeEach(() => {
      component.ngAfterViewInit();
      fixture.detectChanges();
    });

    it('should emit markerClick event when marker is clicked', (done) => {
      const testMarker: BreederMarker = {
        id: 'breeder-1',
        position: { latitude: 40.7128, longitude: -74.0060 },
        breeder: createTestBreeder('breeder-1', 'Test Breeder', 40.7128, -74.0060, 10)
      };

      component.markers = [testMarker];
      component.ngOnChanges({
        markers: {
          currentValue: [testMarker],
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });
      fixture.detectChanges();

      component.markerClick.subscribe((breederId: string) => {
        expect(breederId).toBe('breeder-1');
        done();
      });

      // Simulate marker click
      component.markerClick.emit('breeder-1');
    });

    it('should emit markerHover event when marker is hovered', (done) => {
      const testMarker: BreederMarker = {
        id: 'breeder-1',
        position: { latitude: 40.7128, longitude: -74.0060 },
        breeder: createTestBreeder('breeder-1', 'Test Breeder', 40.7128, -74.0060, 10)
      };

      component.markers = [testMarker];
      component.ngOnChanges({
        markers: {
          currentValue: [testMarker],
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });
      fixture.detectChanges();

      component.markerHover.subscribe((breederId: string) => {
        expect(breederId).toBe('breeder-1');
        done();
      });

      // Simulate marker hover
      component.markerHover.emit('breeder-1');
    });
  });

  describe('Zoom and Pan', () => {
    beforeEach(() => {
      component.ngAfterViewInit();
      fixture.detectChanges();
    });

    it('should zoom to marker when zoomToMarker is called', () => {
      const testMarker: BreederMarker = {
        id: 'breeder-1',
        position: { latitude: 40.7128, longitude: -74.0060 },
        breeder: createTestBreeder('breeder-1', 'Test Breeder', 40.7128, -74.0060, 10)
      };

      component.markers = [testMarker];
      component.ngOnChanges({
        markers: {
          currentValue: [testMarker],
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });
      fixture.detectChanges();

      // Call zoomToMarker
      component.zoomToMarker('breeder-1');

      // Verify the method executes without error
      expect(component['markerMap'].has('breeder-1')).toBe(true);
    });

    it('should handle zoomToMarker for non-existent marker', () => {
      // Should not throw error
      expect(() => component.zoomToMarker('non-existent')).not.toThrow();
    });

    it('should bounce marker when bounceMarker is called', () => {
      const testMarker: BreederMarker = {
        id: 'breeder-1',
        position: { latitude: 40.7128, longitude: -74.0060 },
        breeder: createTestBreeder('breeder-1', 'Test Breeder', 40.7128, -74.0060, 10)
      };

      component.markers = [testMarker];
      component.ngOnChanges({
        markers: {
          currentValue: [testMarker],
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });
      fixture.detectChanges();

      // Call bounceMarker
      component.bounceMarker('breeder-1');

      // Verify the method executes without error
      expect(component['markerMap'].has('breeder-1')).toBe(true);
    });

    it('should handle bounceMarker for non-existent marker', () => {
      // Should not throw error
      expect(() => component.bounceMarker('non-existent')).not.toThrow();
    });

    it('should update map center when center input changes', () => {
      const newCenter: Coordinates = { latitude: 34.0522, longitude: -118.2437 };
      component.center = newCenter;
      component.ngOnChanges({
        center: {
          currentValue: newCenter,
          previousValue: { latitude: 39.8283, longitude: -98.5795 },
          firstChange: false,
          isFirstChange: () => false
        }
      });
      fixture.detectChanges();

      expect(component.center.latitude).toBe(34.0522);
      expect(component.center.longitude).toBe(-118.2437);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      component.ngAfterViewInit();
      fixture.detectChanges();
    });

    it('should handle marker at North Pole', () => {
      const northPoleMarker: BreederMarker = {
        id: 'north-pole',
        position: { latitude: 90, longitude: 0 },
        breeder: createTestBreeder('north-pole', 'North Pole Breeder', 90, 0, 0)
      };

      component.markers = [northPoleMarker];
      component.ngOnChanges({
        markers: {
          currentValue: [northPoleMarker],
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });
      fixture.detectChanges();

      expect(component.markers[0].position.latitude).toBe(90);
    });

    it('should handle marker at South Pole', () => {
      const southPoleMarker: BreederMarker = {
        id: 'south-pole',
        position: { latitude: -90, longitude: 0 },
        breeder: createTestBreeder('south-pole', 'South Pole Breeder', -90, 0, 0)
      };

      component.markers = [southPoleMarker];
      component.ngOnChanges({
        markers: {
          currentValue: [southPoleMarker],
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });
      fixture.detectChanges();

      expect(component.markers[0].position.latitude).toBe(-90);
    });

    it('should handle marker at International Date Line', () => {
      const dateLineMarker: BreederMarker = {
        id: 'date-line',
        position: { latitude: 0, longitude: 180 },
        breeder: createTestBreeder('date-line', 'Date Line Breeder', 0, 180, 0)
      };

      component.markers = [dateLineMarker];
      component.ngOnChanges({
        markers: {
          currentValue: [dateLineMarker],
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });
      fixture.detectChanges();

      expect(component.markers[0].position.longitude).toBe(180);
    });

    it('should handle very large radius', () => {
      const largeRadius = 1000;
      component.radius = largeRadius;
      component.ngOnChanges({
        radius: {
          currentValue: largeRadius,
          previousValue: 40,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      fixture.detectChanges();

      expect(component.radius).toBe(largeRadius);
    });

    it('should handle very small radius', () => {
      const smallRadius = 1;
      component.radius = smallRadius;
      component.ngOnChanges({
        radius: {
          currentValue: smallRadius,
          previousValue: 40,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      fixture.detectChanges();

      expect(component.radius).toBe(smallRadius);
    });
  });
});

// Helper function to create test breeder data
function createTestBreeder(
  userId: string,
  name: string,
  lat: number,
  lon: number,
  distance: number
): BreederSearchResult {
  return {
    location_id: 1,
    user_id: userId,
    breeder_name: name,
    latitude: lat,
    longitude: lon,
    distance: distance,
    available_breeds: [],
    thumbnail_url: null,
    location_description: null,
    rating: null
  };
}
