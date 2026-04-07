/**
 * Data models and interfaces for Pet Search with Map feature
 */

/**
 * Geographic coordinates (latitude and longitude)
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Address information from geocoding
 */
export interface Address {
  zip_code: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

/**
 * Breed information for autocomplete
 */
export interface Breed {
  id: number;
  name: string;
  code: string | null;
}

/**
 * Information about a breed available at a location
 */
export interface BreedInfo {
  breed_id: number;
  breed_name: string;
  breed_kind: string;
  pet_count: number;
}

/**
 * Breeder search result from API
 */
export interface BreederSearchResult {
  location_id: number;
  user_id: string;
  breeder_name: string;
  latitude: number;
  longitude: number;
  distance: number; // in miles
  available_breeds: BreedInfo[];
  thumbnail_url: string | null;
  location_description: string | null;
  rating: number | null;
  review_count: number;
}

/**
 * Marker data for map display
 * Extends BreederSearchResult with map-specific properties
 */
export interface BreederMarker {
  id: string; // user_id for unique identification
  position: Coordinates;
  breeder: BreederSearchResult;
}

/**
 * Search filter parameters
 */
export interface SearchFilters {
  zipCode: string;
  coordinates: Coordinates | null;
  breed: Breed | null;
  radius: number; // in miles
}

/**
 * Validation helpers
 */
export class SearchValidators {
  /**
   * Validates ZIP code format (5 digits)
   * @param zipCode - ZIP code string to validate
   * @returns true if valid, false otherwise
   */
  static isValidZipCode(zipCode: string): boolean {
    if (!zipCode) {
      return false;
    }
    // Must be exactly 5 numeric characters
    const zipRegex = /^\d{5}$/;
    return zipRegex.test(zipCode);
  }

  /**
   * Validates that ZIP code contains only numeric characters
   * @param zipCode - ZIP code string to validate
   * @returns true if contains only digits, false otherwise
   */
  static isNumericOnly(zipCode: string): boolean {
    if (!zipCode) {
      return true; // Empty is valid for partial input
    }
    const numericRegex = /^\d+$/;
    return numericRegex.test(zipCode);
  }

  /**
   * Validates latitude value
   * @param latitude - Latitude value to validate
   * @returns true if valid (-90 to 90), false otherwise
   */
  static isValidLatitude(latitude: number): boolean {
    return typeof latitude === 'number' && 
           !isNaN(latitude) && 
           latitude >= -90 && 
           latitude <= 90;
  }

  /**
   * Validates longitude value
   * @param longitude - Longitude value to validate
   * @returns true if valid (-180 to 180), false otherwise
   */
  static isValidLongitude(longitude: number): boolean {
    return typeof longitude === 'number' && 
           !isNaN(longitude) && 
           longitude >= -180 && 
           longitude <= 180;
  }

  /**
   * Validates coordinates object
   * @param coordinates - Coordinates object to validate
   * @returns true if both latitude and longitude are valid, false otherwise
   */
  static isValidCoordinates(coordinates: Coordinates | null): boolean {
    if (!coordinates) {
      return false;
    }
    return this.isValidLatitude(coordinates.latitude) && 
           this.isValidLongitude(coordinates.longitude);
  }

  /**
   * Validates search radius
   * @param radius - Radius value in miles
   * @returns true if valid (positive number <= 100), false otherwise
   */
  static isValidRadius(radius: number): boolean {
    return typeof radius === 'number' && 
           !isNaN(radius) && 
           radius > 0 && 
           radius <= 100;
  }

  /**
   * Formats distance to one decimal place with "miles" unit
   * @param distance - Distance value in miles
   * @returns Formatted distance string (e.g., "12.5 miles")
   */
  static formatDistance(distance: number): string {
    return `${distance.toFixed(1)} miles`;
  }

  /**
   * Validates search filters
   * @param filters - SearchFilters object to validate
   * @returns Object with validation result and error message if invalid
   */
  static validateSearchFilters(filters: SearchFilters): { 
    valid: boolean; 
    error: string | null 
  } {
    // ZIP code is required
    if (!filters.zipCode || !this.isValidZipCode(filters.zipCode)) {
      return {
        valid: false,
        error: 'Valid 5-digit ZIP code is required'
      };
    }

    // Radius must be valid
    if (!this.isValidRadius(filters.radius)) {
      return {
        valid: false,
        error: 'Radius must be a positive number up to 100 miles'
      };
    }

    // Coordinates are optional but must be valid if provided
    if (filters.coordinates && !this.isValidCoordinates(filters.coordinates)) {
      return {
        valid: false,
        error: 'Invalid coordinates'
      };
    }

    return {
      valid: true,
      error: null
    };
  }
}

/**
 * Type guard to check if an object is a valid Coordinates
 */
export function isCoordinates(obj: any): obj is Coordinates {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  return typeof obj.latitude === 'number' &&
         typeof obj.longitude === 'number' &&
         SearchValidators.isValidCoordinates(obj);
}

/**
 * Type guard to check if an object is a valid BreederSearchResult
 */
export function isBreederSearchResult(obj: any): obj is BreederSearchResult {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  return typeof obj.location_id === 'number' &&
         typeof obj.user_id === 'string' &&
         typeof obj.breeder_name === 'string' &&
         typeof obj.latitude === 'number' &&
         typeof obj.longitude === 'number' &&
         typeof obj.distance === 'number' &&
         Array.isArray(obj.available_breeds);
}

/**
 * Helper function to convert BreederSearchResult to BreederMarker
 */
export function toBreederMarker(result: BreederSearchResult): BreederMarker {
  return {
    id: result.user_id,
    position: {
      latitude: result.latitude,
      longitude: result.longitude
    },
    breeder: result
  };
}

/**
 * Helper function to convert multiple BreederSearchResults to BreederMarkers
 */
export function toBreederMarkers(results: BreederSearchResult[]): BreederMarker[] {
  return results.map(toBreederMarker);
}
