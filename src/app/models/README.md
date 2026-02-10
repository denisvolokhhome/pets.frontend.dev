# Data Models

This directory contains TypeScript interfaces and models for the application.

## Search Models (`search.ts`)

Data models and interfaces for the Pet Search with Map feature.

### Core Interfaces

#### `Coordinates`
Geographic coordinates (latitude and longitude).
```typescript
interface Coordinates {
  latitude: number;  // -90 to 90
  longitude: number; // -180 to 180
}
```

#### `Address`
Address information from geocoding services.
```typescript
interface Address {
  zip_code: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}
```

#### `Breed`
Breed information for autocomplete.
```typescript
interface Breed {
  id: number;
  name: string;
  code: string | null;
}
```

#### `BreedInfo`
Information about a breed available at a specific location.
```typescript
interface BreedInfo {
  breed_id: number;
  breed_name: string;
  pet_count: number;
}
```

#### `BreederSearchResult`
Complete breeder search result from the API.
```typescript
interface BreederSearchResult {
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
}
```

#### `BreederMarker`
Marker data for map display.
```typescript
interface BreederMarker {
  id: string; // user_id for unique identification
  position: Coordinates;
  breeder: BreederSearchResult;
}
```

#### `SearchFilters`
Search filter parameters.
```typescript
interface SearchFilters {
  zipCode: string;
  coordinates: Coordinates | null;
  breed: Breed | null;
  radius: number; // in miles
}
```

### Validation Helpers

The `SearchValidators` class provides static methods for validating search-related data:

- `isValidZipCode(zipCode: string): boolean` - Validates 5-digit ZIP codes
- `isNumericOnly(zipCode: string): boolean` - Checks if string contains only digits
- `isValidLatitude(latitude: number): boolean` - Validates latitude (-90 to 90)
- `isValidLongitude(longitude: number): boolean` - Validates longitude (-180 to 180)
- `isValidCoordinates(coordinates: Coordinates | null): boolean` - Validates coordinate object
- `isValidRadius(radius: number): boolean` - Validates radius (0 to 100 miles)
- `formatDistance(distance: number): string` - Formats distance to "X.X miles"
- `validateSearchFilters(filters: SearchFilters)` - Validates complete search filters

### Type Guards

- `isCoordinates(obj: any): obj is Coordinates` - Type guard for Coordinates
- `isBreederSearchResult(obj: any): obj is BreederSearchResult` - Type guard for BreederSearchResult

### Helper Functions

- `toBreederMarker(result: BreederSearchResult): BreederMarker` - Converts search result to marker
- `toBreederMarkers(results: BreederSearchResult[]): BreederMarker[]` - Converts array of results to markers

### Usage Examples

```typescript
import { 
  SearchValidators, 
  toBreederMarkers,
  SearchFilters 
} from './models/search';

// Validate ZIP code
if (SearchValidators.isValidZipCode('12345')) {
  console.log('Valid ZIP code');
}

// Validate search filters
const filters: SearchFilters = {
  zipCode: '12345',
  coordinates: { latitude: 45.5, longitude: -122.5 },
  breed: null,
  radius: 40
};

const validation = SearchValidators.validateSearchFilters(filters);
if (validation.valid) {
  // Proceed with search
} else {
  console.error(validation.error);
}

// Convert search results to markers
const searchResults: BreederSearchResult[] = [...];
const markers = toBreederMarkers(searchResults);

// Format distance
const formattedDistance = SearchValidators.formatDistance(12.5);
console.log(formattedDistance); // "12.5 miles"
```

## Other Models

- `breed.ts` - Breed model (IBreed)
- `breeding.ts` - Breeding/Litter model
- `location.ts` - Location model (ILocation)
- `pet.ts` - Pet model
- `user.ts` - User model
