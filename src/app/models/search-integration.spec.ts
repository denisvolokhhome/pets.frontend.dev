/**
 * Integration tests for search models
 * These tests verify that all interfaces work together correctly
 */

import {
  Coordinates,
  Address,
  Breed,
  BreedInfo,
  BreederSearchResult,
  BreederMarker,
  SearchFilters,
  SearchValidators,
  toBreederMarker,
  toBreederMarkers
} from './search';

describe('Search Models Integration', () => {
  it('should create a complete search workflow', () => {
    // Step 1: User enters ZIP code
    const zipCode = '12345';
    expect(SearchValidators.isValidZipCode(zipCode)).toBe(true);

    // Step 2: Geocode ZIP to coordinates
    const coordinates: Coordinates = {
      latitude: 45.5231,
      longitude: -122.6765
    };
    expect(SearchValidators.isValidCoordinates(coordinates)).toBe(true);

    // Step 3: User selects breed
    const breed: Breed = {
      id: 1,
      name: 'Golden Retriever',
      code: 'GR'
    };

    // Step 4: User sets radius
    const radius = 40;
    expect(SearchValidators.isValidRadius(radius)).toBe(true);

    // Step 5: Create search filters
    const filters: SearchFilters = {
      zipCode,
      coordinates,
      breed,
      radius
    };

    // Step 6: Validate filters
    const validation = SearchValidators.validateSearchFilters(filters);
    expect(validation.valid).toBe(true);
    expect(validation.error).toBe(null);

    // Step 7: Receive search results
    const searchResults: BreederSearchResult[] = [
      {
        location_id: 1,
        user_id: 'user-123',
        breeder_name: 'Happy Paws Kennel',
        latitude: 45.5,
        longitude: -122.5,
        distance: 12.5,
        available_breeds: [
          {
            breed_id: 1,
            breed_name: 'Golden Retriever',
            pet_count: 3
          }
        ],
        thumbnail_url: 'http://example.com/image.jpg',
        location_description: 'Family-owned kennel',
        rating: 4.5
      },
      {
        location_id: 2,
        user_id: 'user-456',
        breeder_name: 'Sunshine Breeders',
        latitude: 45.6,
        longitude: -122.7,
        distance: 25.3,
        available_breeds: [
          {
            breed_id: 1,
            breed_name: 'Golden Retriever',
            pet_count: 2
          },
          {
            breed_id: 2,
            breed_name: 'Labrador Retriever',
            pet_count: 1
          }
        ],
        thumbnail_url: null,
        location_description: null,
        rating: null
      }
    ];

    // Step 8: Convert to markers for map display
    const markers: BreederMarker[] = toBreederMarkers(searchResults);
    expect(markers.length).toBe(2);
    expect(markers[0].id).toBe('user-123');
    expect(markers[0].position.latitude).toBe(45.5);
    expect(markers[0].breeder.breeder_name).toBe('Happy Paws Kennel');

    // Step 9: Format distances for display
    const formattedDistance1 = SearchValidators.formatDistance(searchResults[0].distance);
    const formattedDistance2 = SearchValidators.formatDistance(searchResults[1].distance);
    expect(formattedDistance1).toBe('12.5 miles');
    expect(formattedDistance2).toBe('25.3 miles');
  });

  it('should handle search without breed filter', () => {
    const filters: SearchFilters = {
      zipCode: '98101',
      coordinates: { latitude: 47.6062, longitude: -122.3321 },
      breed: null, // No breed filter
      radius: 20
    };

    const validation = SearchValidators.validateSearchFilters(filters);
    expect(validation.valid).toBe(true);
  });

  it('should handle invalid search scenarios', () => {
    // Invalid ZIP code
    const invalidZip: SearchFilters = {
      zipCode: '123', // Too short
      coordinates: null,
      breed: null,
      radius: 40
    };
    expect(SearchValidators.validateSearchFilters(invalidZip).valid).toBe(false);

    // Invalid radius
    const invalidRadius: SearchFilters = {
      zipCode: '12345',
      coordinates: null,
      breed: null,
      radius: 0 // Must be positive
    };
    expect(SearchValidators.validateSearchFilters(invalidRadius).valid).toBe(false);

    // Invalid coordinates
    const invalidCoords: SearchFilters = {
      zipCode: '12345',
      coordinates: { latitude: 91, longitude: 0 }, // Latitude out of range
      breed: null,
      radius: 40
    };
    expect(SearchValidators.validateSearchFilters(invalidCoords).valid).toBe(false);
  });

  it('should handle address from reverse geocoding', () => {
    const address: Address = {
      zip_code: '12345',
      city: 'Portland',
      state: 'Oregon',
      country: 'United States'
    };

    expect(address.zip_code).toBe('12345');
    expect(address.city).toBe('Portland');
  });

  it('should handle breed info with multiple breeds at location', () => {
    const breedInfo: BreedInfo[] = [
      {
        breed_id: 1,
        breed_name: 'Golden Retriever',
        pet_count: 3
      },
      {
        breed_id: 2,
        breed_name: 'Labrador Retriever',
        pet_count: 2
      }
    ];

    expect(breedInfo.length).toBe(2);
    expect(breedInfo[0].pet_count).toBe(3);
    expect(breedInfo[1].pet_count).toBe(2);
  });

  it('should convert single result to marker', () => {
    const result: BreederSearchResult = {
      location_id: 1,
      user_id: 'user-789',
      breeder_name: 'Test Breeder',
      latitude: 40.7128,
      longitude: -74.0060,
      distance: 5.2,
      available_breeds: [],
      thumbnail_url: null,
      location_description: null,
      rating: null
    };

    const marker = toBreederMarker(result);
    expect(marker.id).toBe('user-789');
    expect(marker.position.latitude).toBe(40.7128);
    expect(marker.position.longitude).toBe(-74.0060);
    expect(marker.breeder).toBe(result);
  });
});
