import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { SearchService } from '../../services/search.service';
import { ToastService } from '../../services/toast.service';
import { MapComponent } from '../map/map.component';
import { 
  Coordinates, 
  Breed, 
  BreederSearchResult, 
  BreederMarker,
  toBreederMarkers,
  SearchValidators
} from '../../models/search';

/**
 * Main container component for the Pet Search with Map feature
 * Orchestrates search functionality and coordinates child components
 */
@Component({
  standalone: false,
  selector: 'app-search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.css']
})
export class SearchPageComponent implements OnInit {
  // Reference to map component for programmatic control
  @ViewChild(MapComponent) mapComponent!: MapComponent;

  // Search state
  zipCode: string = '';
  selectedBreed: Breed | null = null;
  radius: number = 40; // Default 40 miles
  mapCenter: Coordinates = { latitude: 39.8283, longitude: -98.5795 }; // Center of US
  searchResults: BreederSearchResult[] = [];
  breederMarkers: BreederMarker[] = [];
  highlightedBreederId: string | null = null;

  // UI state
  isLoading: boolean = false;
  error: string | null = null;
  geolocationError: string | null = null;
  hasSearched: boolean = false;

  constructor(
    private searchService: SearchService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Request geolocation permission on component initialization
    // Don't show loading overlay for geolocation - only show it during actual search
    this.requestGeolocation();
  }

  /**
   * Request browser geolocation permission and detect user location
   * Requirement 2.1: Request geolocation permission on page load
   * Requirement 2.2: Retrieve user's coordinates if permission granted
   */
  private requestGeolocation(): void {
    if (!navigator.geolocation) {
      this.geolocationError = 'Geolocation is not supported by your browser. Please enter your ZIP code manually.';
      return;
    }

    // Don't set isLoading here - it blocks the map from showing
    this.error = null;

    navigator.geolocation.getCurrentPosition(
      (position) => this.handleGeolocationSuccess(position),
      (error) => this.handleGeolocationError(error),
      {
        timeout: 10000, // 10 second timeout
        enableHighAccuracy: false
      }
    );
  }

  /**
   * Handle successful geolocation
   * Requirement 2.3: Convert coordinates to ZIP code using geocoding service
   * Requirement 2.4: Populate ZIP input field with detected ZIP code
   */
  private handleGeolocationSuccess(position: GeolocationPosition): void {
    const coordinates: Coordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };

    // Update map center to user's location
    this.mapCenter = coordinates;
    
    // Force change detection to update map
    this.cdr.detectChanges();

    // Convert coordinates to ZIP code using reverse geocoding
    this.searchService.reverseGeocode(coordinates.latitude, coordinates.longitude)
      .subscribe({
        next: (address) => {
          if (address.zip_code) {
            // Populate ZIP input field
            this.zipCode = address.zip_code;
            
            // Force change detection to update input field
            this.cdr.detectChanges();
            
            // Automatically perform initial search with detected location
            // performSearch will set isLoading = true
            this.performSearch(coordinates);
          } else {
            const message = 'Could not determine ZIP code from your location. Please enter it manually.';
            this.geolocationError = message;
            this.toastService.warning(message);
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          const message = err.message || 'Failed to convert location to ZIP code. Please enter your ZIP code manually.';
          this.geolocationError = message;
          this.toastService.error(message);
          this.cdr.detectChanges();
          console.error('Reverse geocoding error:', err);
        }
      });
  }

  /**
   * Handle geolocation errors
   * Requirement 2.5: Display error message if permission denied
   * Requirement 2.6: Enable manual ZIP entry on geolocation failure
   * Requirement 11.2: Handle geolocation permission denied
   */
  private handleGeolocationError(error: GeolocationPositionError): void {
    let errorMessage = '';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied. Please enter your ZIP code to search.';
        this.toastService.warning(errorMessage);
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable. Please enter your ZIP code to search.';
        this.toastService.error(errorMessage);
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Please enter your ZIP code to search.';
        this.toastService.warning(errorMessage);
        break;
      default:
        errorMessage = 'Unable to detect your location. Please enter your ZIP code to search.';
        this.toastService.info(errorMessage);
    }
    
    this.geolocationError = errorMessage;
  }

  /**
   * Handle search button click from SearchControlsComponent
   * Requirement 7.1: Query backend API for matching breeding locations
   * Requirement 11.5: Handle API request failures
   */
  onSearch(): void {
    // Validate ZIP code
    if (!SearchValidators.isValidZipCode(this.zipCode)) {
      const message = 'Please enter a valid 5-digit ZIP code';
      this.error = message;
      this.toastService.error(message);
      return;
    }

    // Clear previous error
    this.error = null;
    this.isLoading = true;

    // Convert ZIP code to coordinates
    this.searchService.geocodeZipCode(this.zipCode)
      .subscribe({
        next: (coordinates) => {
          // Update map center
          this.mapCenter = coordinates;
          
          // Perform search with coordinates
          this.performSearch(coordinates);
        },
        error: (err) => {
          this.isLoading = false;
          const message = err.message || 'Failed to geocode ZIP code. Please try again.';
          this.error = message;
          this.toastService.error(message);
          console.error('Geocoding error:', err);
        }
      });
  }

  /**
   * Perform breeder search with coordinates
   * @param coordinates - Center point for search
   * Requirement 11.1: Display "No results found" message
   * Requirement 11.5: Handle API request failures
   */
  private performSearch(coordinates: Coordinates): void {
    // Set loading state and force immediate UI update
    this.isLoading = true;
    this.error = null;
    this.cdr.detectChanges();

    // Call search service with coordinates, radius, and optional breed filter
    this.searchService.searchBreeders(
      coordinates.latitude,
      coordinates.longitude,
      this.radius,
      this.selectedBreed?.id
    ).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.breederMarkers = toBreederMarkers(results);
        this.hasSearched = true;
        
        // Clear loading state
        this.isLoading = false;

        // Clear any previous errors
        this.error = null;
        this.geolocationError = null;

        // Force change detection to update UI
        this.cdr.detectChanges();

        // Show success message with result count
        if (results.length > 0) {
          this.toastService.success(`Found ${results.length} breeder${results.length > 1 ? 's' : ''} near you`);
        }
      },
      error: (err) => {
        // Clear loading state
        this.isLoading = false;
        
        const message = err.message || 'Failed to search for breeders. Please try again.';
        this.error = message;
        this.searchResults = [];
        this.breederMarkers = [];
        
        // Force change detection to update UI
        this.cdr.detectChanges();
        
        this.toastService.error(message);
        console.error('Search error:', err);
      }
    });
  }

  /**
   * Handle marker click from MapComponent
   * Requirement 9.1: Highlight corresponding breeder card when marker is clicked
   */
  onMarkerClick(breederId: string): void {
    this.highlightedBreederId = breederId;
  }

  /**
   * Handle marker hover from MapComponent
   * Requirement 9.4: Highlight corresponding card when marker is hovered
   */
  onMarkerHover(breederId: string): void {
    this.highlightedBreederId = breederId;
  }

  /**
   * Handle card click from BreederCardListComponent
   * Requirement 9.2: Zoom map to marker when card is clicked
   */
  onCardClick(breederId: string): void {
    if (this.mapComponent) {
      this.mapComponent.zoomToMarker(breederId);
    }
    this.highlightedBreederId = breederId;
  }

  /**
   * Handle card hover from BreederCardListComponent
   * Requirement 9.3: Trigger bounce animation on marker when card is hovered
   */
  onCardHover(breederId: string): void {
    if (this.mapComponent) {
      this.mapComponent.bounceMarker(breederId);
    }
    this.highlightedBreederId = breederId;
  }

  /**
   * Check if there are no search results
   */
  hasNoResults(): boolean {
    return this.hasSearched && !this.isLoading && this.searchResults.length === 0;
  }

  /**
   * Retry search after error
   * Requirement 11.5: Provide retry button for failed requests
   */
  retrySearch(): void {
    this.error = null;
    this.toastService.info('Retrying search...');
    this.onSearch();
  }

  /**
   * Clear geolocation error message
   */
  dismissGeolocationError(): void {
    this.geolocationError = null;
  }
}
