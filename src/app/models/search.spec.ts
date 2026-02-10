import { 
  SearchValidators, 
  isCoordinates, 
  isBreederSearchResult,
  toBreederMarker,
  toBreederMarkers,
  Coordinates,
  BreederSearchResult,
  SearchFilters
} from './search';

describe('SearchValidators', () => {
  describe('isValidZipCode', () => {
    it('should return true for valid 5-digit ZIP codes', () => {
      expect(SearchValidators.isValidZipCode('12345')).toBe(true);
      expect(SearchValidators.isValidZipCode('00000')).toBe(true);
      expect(SearchValidators.isValidZipCode('99999')).toBe(true);
    });

    it('should return false for invalid ZIP codes', () => {
      expect(SearchValidators.isValidZipCode('')).toBe(false);
      expect(SearchValidators.isValidZipCode('1234')).toBe(false);
      expect(SearchValidators.isValidZipCode('123456')).toBe(false);
      expect(SearchValidators.isValidZipCode('abcde')).toBe(false);
      expect(SearchValidators.isValidZipCode('12a45')).toBe(false);
      expect(SearchValidators.isValidZipCode('12 345')).toBe(false);
    });
  });

  describe('isNumericOnly', () => {
    it('should return true for numeric strings', () => {
      expect(SearchValidators.isNumericOnly('12345')).toBe(true);
      expect(SearchValidators.isNumericOnly('0')).toBe(true);
      expect(SearchValidators.isNumericOnly('999')).toBe(true);
      expect(SearchValidators.isNumericOnly('')).toBe(true); // Empty is valid for partial input
    });

    it('should return false for non-numeric strings', () => {
      expect(SearchValidators.isNumericOnly('abc')).toBe(false);
      expect(SearchValidators.isNumericOnly('12a45')).toBe(false);
      expect(SearchValidators.isNumericOnly('12 34')).toBe(false);
      expect(SearchValidators.isNumericOnly('12.34')).toBe(false);
      expect(SearchValidators.isNumericOnly('12-34')).toBe(false);
    });
  });

  describe('isValidLatitude', () => {
    it('should return true for valid latitudes', () => {
      expect(SearchValidators.isValidLatitude(0)).toBe(true);
      expect(SearchValidators.isValidLatitude(45.5)).toBe(true);
      expect(SearchValidators.isValidLatitude(-45.5)).toBe(true);
      expect(SearchValidators.isValidLatitude(90)).toBe(true);
      expect(SearchValidators.isValidLatitude(-90)).toBe(true);
    });

    it('should return false for invalid latitudes', () => {
      expect(SearchValidators.isValidLatitude(91)).toBe(false);
      expect(SearchValidators.isValidLatitude(-91)).toBe(false);
      expect(SearchValidators.isValidLatitude(NaN)).toBe(false);
      expect(SearchValidators.isValidLatitude(Infinity)).toBe(false);
    });
  });

  describe('isValidLongitude', () => {
    it('should return true for valid longitudes', () => {
      expect(SearchValidators.isValidLongitude(0)).toBe(true);
      expect(SearchValidators.isValidLongitude(122.5)).toBe(true);
      expect(SearchValidators.isValidLongitude(-122.5)).toBe(true);
      expect(SearchValidators.isValidLongitude(180)).toBe(true);
      expect(SearchValidators.isValidLongitude(-180)).toBe(true);
    });

    it('should return false for invalid longitudes', () => {
      expect(SearchValidators.isValidLongitude(181)).toBe(false);
      expect(SearchValidators.isValidLongitude(-181)).toBe(false);
      expect(SearchValidators.isValidLongitude(NaN)).toBe(false);
      expect(SearchValidators.isValidLongitude(Infinity)).toBe(false);
    });
  });

  describe('isValidCoordinates', () => {
    it('should return true for valid coordinates', () => {
      expect(SearchValidators.isValidCoordinates({ latitude: 45.5, longitude: -122.5 })).toBe(true);
      expect(SearchValidators.isValidCoordinates({ latitude: 0, longitude: 0 })).toBe(true);
      expect(SearchValidators.isValidCoordinates({ latitude: 90, longitude: 180 })).toBe(true);
    });

    it('should return false for invalid coordinates', () => {
      expect(SearchValidators.isValidCoordinates(null)).toBe(false);
      expect(SearchValidators.isValidCoordinates({ latitude: 91, longitude: 0 })).toBe(false);
      expect(SearchValidators.isValidCoordinates({ latitude: 0, longitude: 181 })).toBe(false);
      expect(SearchValidators.isValidCoordinates({ latitude: NaN, longitude: 0 })).toBe(false);
    });
  });

  describe('isValidRadius', () => {
    it('should return true for valid radius values', () => {
      expect(SearchValidators.isValidRadius(10)).toBe(true);
      expect(SearchValidators.isValidRadius(40)).toBe(true);
      expect(SearchValidators.isValidRadius(100)).toBe(true);
      expect(SearchValidators.isValidRadius(0.5)).toBe(true);
    });

    it('should return false for invalid radius values', () => {
      expect(SearchValidators.isValidRadius(0)).toBe(false);
      expect(SearchValidators.isValidRadius(-10)).toBe(false);
      expect(SearchValidators.isValidRadius(101)).toBe(false);
      expect(SearchValidators.isValidRadius(NaN)).toBe(false);
      expect(SearchValidators.isValidRadius(Infinity)).toBe(false);
    });
  });

  describe('formatDistance', () => {
    it('should format distance to one decimal place', () => {
      expect(SearchValidators.formatDistance(12.5)).toBe('12.5 miles');
      expect(SearchValidators.formatDistance(12.56)).toBe('12.6 miles');
      expect(SearchValidators.formatDistance(12.54)).toBe('12.5 miles');
      expect(SearchValidators.formatDistance(0.5)).toBe('0.5 miles');
      expect(SearchValidators.formatDistance(100)).toBe('100.0 miles');
    });
  });

  describe('validateSearchFilters', () => {
    it('should return valid for correct filters', () => {
      const filters: SearchFilters = {
        zipCode: '12345',
        coordinates: { latitude: 45.5, longitude: -122.5 },
        breed: null,
        radius: 40
      };
      const result = SearchValidators.validateSearchFilters(filters);
      expect(result.valid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should return invalid for missing ZIP code', () => {
      const filters: SearchFilters = {
        zipCode: '',
        coordinates: null,
        breed: null,
        radius: 40
      };
      const result = SearchValidators.validateSearchFilters(filters);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Valid 5-digit ZIP code is required');
    });

    it('should return invalid for invalid ZIP code', () => {
      const filters: SearchFilters = {
        zipCode: '1234',
        coordinates: null,
        breed: null,
        radius: 40
      };
      const result = SearchValidators.validateSearchFilters(filters);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Valid 5-digit ZIP code is required');
    });

    it('should return invalid for invalid radius', () => {
      const filters: SearchFilters = {
        zipCode: '12345',
        coordinates: null,
        breed: null,
        radius: 0
      };
      const result = SearchValidators.validateSearchFilters(filters);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Radius must be a positive number up to 100 miles');
    });

    it('should return invalid for invalid coordinates', () => {
      const filters: SearchFilters = {
        zipCode: '12345',
        coordinates: { latitude: 91, longitude: 0 },
        breed: null,
        radius: 40
      };
      const result = SearchValidators.validateSearchFilters(filters);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid coordinates');
    });
  });
});

describe('Type Guards', () => {
  describe('isCoordinates', () => {
    it('should return true for valid Coordinates objects', () => {
      expect(isCoordinates({ latitude: 45.5, longitude: -122.5 })).toBe(true);
      expect(isCoordinates({ latitude: 0, longitude: 0 })).toBe(true);
    });

    it('should return false for invalid objects', () => {
      expect(isCoordinates(null)).toBe(false);
      expect(isCoordinates(undefined)).toBe(false);
      expect(isCoordinates({})).toBe(false);
      expect(isCoordinates({ latitude: 45.5 })).toBe(false);
      expect(isCoordinates({ longitude: -122.5 })).toBe(false);
      expect(isCoordinates({ latitude: 'invalid', longitude: -122.5 })).toBe(false);
      expect(isCoordinates({ latitude: 91, longitude: 0 })).toBe(false);
    });
  });

  describe('isBreederSearchResult', () => {
    it('should return true for valid BreederSearchResult objects', () => {
      const result: BreederSearchResult = {
        location_id: 1,
        user_id: 'user-123',
        breeder_name: 'Test Breeder',
        latitude: 45.5,
        longitude: -122.5,
        distance: 12.5,
        available_breeds: [],
        thumbnail_url: null,
        location_description: null,
        rating: null
      };
      expect(isBreederSearchResult(result)).toBe(true);
    });

    it('should return false for invalid objects', () => {
      expect(isBreederSearchResult(null)).toBe(false);
      expect(isBreederSearchResult({})).toBe(false);
      expect(isBreederSearchResult({ location_id: 1 })).toBe(false);
      expect(isBreederSearchResult({ 
        location_id: 'invalid', 
        user_id: 'user-123',
        breeder_name: 'Test',
        latitude: 45.5,
        longitude: -122.5,
        distance: 12.5,
        available_breeds: []
      })).toBe(false);
    });
  });
});

describe('Helper Functions', () => {
  describe('toBreederMarker', () => {
    it('should convert BreederSearchResult to BreederMarker', () => {
      const result: BreederSearchResult = {
        location_id: 1,
        user_id: 'user-123',
        breeder_name: 'Test Breeder',
        latitude: 45.5,
        longitude: -122.5,
        distance: 12.5,
        available_breeds: [
          { breed_id: 1, breed_name: 'Golden Retriever', pet_count: 3 }
        ],
        thumbnail_url: 'http://example.com/image.jpg',
        location_description: 'Test location',
        rating: 4.5
      };

      const marker = toBreederMarker(result);

      expect(marker.id).toBe('user-123');
      expect(marker.position.latitude).toBe(45.5);
      expect(marker.position.longitude).toBe(-122.5);
      expect(marker.breeder).toBe(result);
    });
  });

  describe('toBreederMarkers', () => {
    it('should convert array of BreederSearchResults to BreederMarkers', () => {
      const results: BreederSearchResult[] = [
        {
          location_id: 1,
          user_id: 'user-123',
          breeder_name: 'Test Breeder 1',
          latitude: 45.5,
          longitude: -122.5,
          distance: 12.5,
          available_breeds: [],
          thumbnail_url: null,
          location_description: null,
          rating: null
        },
        {
          location_id: 2,
          user_id: 'user-456',
          breeder_name: 'Test Breeder 2',
          latitude: 46.5,
          longitude: -123.5,
          distance: 25.3,
          available_breeds: [],
          thumbnail_url: null,
          location_description: null,
          rating: null
        }
      ];

      const markers = toBreederMarkers(results);

      expect(markers.length).toBe(2);
      expect(markers[0].id).toBe('user-123');
      expect(markers[1].id).toBe('user-456');
      expect(markers[0].position.latitude).toBe(45.5);
      expect(markers[1].position.latitude).toBe(46.5);
    });

    it('should return empty array for empty input', () => {
      const markers = toBreederMarkers([]);
      expect(markers).toEqual([]);
    });
  });
});
