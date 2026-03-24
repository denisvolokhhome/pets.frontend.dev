import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, retryWhen, mergeMap, finalize } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

// Interfaces for search-related data models
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  zip_code: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

export interface BreedInfo {
  breed_id: number;
  breed_name: string;
  breed_kind: string;
  pet_count: number;
}

export interface BreederSearchResult {
  location_id: number;
  user_id: string;
  breeder_name: string;
  latitude: number;
  longitude: number;
  distance: number;
  available_breeds: BreedInfo[];
  thumbnail_url: string | null;
  location_description: string | null;
  rating: number | null;
}

export interface BreedAutocomplete {
  id: number;
  name: string;
  code: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiUrl = environment.API_URL;
  private maxRetries = 2;
  private retryDelay = 1000; // 1 second

  constructor(private http: HttpClient) {}

  /**
   * Search for breeders within a radius of a location
   * @param latitude - Center point latitude
   * @param longitude - Center point longitude
   * @param radius - Search radius in miles
   * @param breedId - Optional breed filter
   * @returns Observable of breeder search results
   */
  searchBreeders(
    latitude: number,
    longitude: number,
    radius: number,
    breedId?: number,
    animalKind?: string
  ): Observable<BreederSearchResult[]> {
    let params = new HttpParams()
      .set('latitude', latitude.toString())
      .set('longitude', longitude.toString())
      .set('radius', radius.toString());

    if (breedId !== undefined && breedId !== null) {
      params = params.set('breed_id', breedId.toString());
    }

    if (animalKind) {
      params = params.set('animal_kind', animalKind);
    }

    return this.http.get<BreederSearchResult[]>(
      `${this.apiUrl}/search/breeders`,
      { params }
    ).pipe(
      retry(this.maxRetries),
      catchError(this.handleError)
    );
  }

  /**
   * Search breeds for autocomplete
   * @param searchTerm - Partial breed name to search for
   * @returns Observable of matching breeds
   */
  searchBreeds(searchTerm: string, kind?: string): Observable<BreedAutocomplete[]> {
    if (!searchTerm || searchTerm.length < 2) {
      return throwError(() => new Error('Search term must be at least 2 characters'));
    }

    let params = new HttpParams().set('search_term', searchTerm);
    if (kind) {
      params = params.set('kind', kind);
    }

    return this.http.get<BreedAutocomplete[]>(
      `${this.apiUrl}/breeds/autocomplete`,
      { params }
    ).pipe(
      retry(this.maxRetries),
      catchError(this.handleError)
    );
  }

  /**
   * Convert ZIP code to coordinates using geocoding service
   * @param zipCode - 5-digit US ZIP code
   * @returns Observable of coordinates
   */
  geocodeZipCode(zipCode: string): Observable<Coordinates> {
    if (!this.isValidZipCode(zipCode)) {
      return throwError(() => new Error('Invalid ZIP code format. Must be 5 digits.'));
    }

    const params = new HttpParams().set('zip', zipCode);

    return this.http.get<Coordinates>(
      `${this.apiUrl}/geocode/zip`,
      { params }
    ).pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, index) => {
            // Retry on network errors or 5xx errors, but not on 4xx errors
            if (index >= this.maxRetries) {
              return throwError(() => error);
            }
            if (error.status >= 400 && error.status < 500) {
              return throwError(() => error);
            }
            return timer(this.retryDelay * (index + 1));
          })
        )
      ),
      catchError(this.handleError)
    );
  }

  /**
   * Convert coordinates to address using reverse geocoding
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @returns Observable of address information
   */
  reverseGeocode(latitude: number, longitude: number): Observable<Address> {
    if (!this.isValidCoordinate(latitude, longitude)) {
      return throwError(() => new Error('Invalid coordinates'));
    }

    const params = new HttpParams()
      .set('lat', latitude.toString())
      .set('lon', longitude.toString());

    return this.http.get<Address>(
      `${this.apiUrl}/geocode/reverse`,
      { params }
    ).pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, index) => {
            // Retry on network errors or 5xx errors, but not on 4xx errors
            if (index >= this.maxRetries) {
              return throwError(() => error);
            }
            if (error.status >= 400 && error.status < 500) {
              return throwError(() => error);
            }
            return timer(this.retryDelay * (index + 1));
          })
        )
      ),
      catchError(this.handleError)
    );
  }

  /**
   * Validate ZIP code format (5 digits)
   * @param zipCode - ZIP code to validate
   * @returns true if valid, false otherwise
   */
  private isValidZipCode(zipCode: string): boolean {
    return /^\d{5}$/.test(zipCode);
  }

  /**
   * Validate coordinate values
   * @param latitude - Latitude to validate
   * @param longitude - Longitude to validate
   * @returns true if valid, false otherwise
   */
  private isValidCoordinate(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }

  /**
   * Handle HTTP errors with user-friendly messages
   * @param error - HTTP error response
   * @returns Observable error with formatted message
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Network error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = error.error?.detail || 'Invalid request parameters';
          break;
        case 404:
          errorMessage = error.error?.detail || 'Resource not found';
          break;
        case 429:
          errorMessage = 'Too many requests. Please try again later.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        case 502:
        case 503:
          errorMessage = 'Geocoding service temporarily unavailable';
          break;
          break;
        case 503:
          errorMessage = 'Service temporarily unavailable. Please try again.';
          break;
        case 504:
          errorMessage = 'Request timeout. Please try again.';
          break;
        default:
          errorMessage = error.error?.detail || `Error: ${error.status} - ${error.statusText}`;
      }
    }

    return throwError(() => ({
      ...error,
      message: errorMessage
    }));
  }
}
