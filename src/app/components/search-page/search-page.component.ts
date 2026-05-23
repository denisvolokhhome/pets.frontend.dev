import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Subject, Subscription, forkJoin, of } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { SearchService } from '../../services/search.service';
import { ServiceProviderService } from '../../services/service-provider.service';
import { ToastService } from '../../services/toast.service';
import { MapComponent } from '../map/map.component';
import { IPetType, PET_TYPES } from '../../models/pet-type';
import { 
  Coordinates, 
  Breed, 
  BreederSearchResult, 
  BreederMarker,
  toBreederMarkers,
  SearchValidators
} from '../../models/search';

export type SearchMode = 'breeders' | 'services' | 'both';

/**
 * Main container component for the Pet Search with Map feature
 * Airbnb-style split layout: map on left, breeder list on right
 */
@Component({
  standalone: false,
  selector: 'app-search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.css']
})
export class SearchPageComponent implements OnInit, OnDestroy {
  @ViewChild(MapComponent) mapComponent!: MapComponent;

  // Search state
  zipCode: string = '';
  selectedBreed: Breed | null = null;
  selectedAnimalKind: string = '';
  radius: number = 40;
  mapCenter: Coordinates = { latitude: 39.8283, longitude: -98.5795 };
  searchResults: BreederSearchResult[] = [];
  breederMarkers: BreederMarker[] = [];
  serviceResults: any[] = [];
  highlightedBreederId: string | null = null;

  // Search mode: breeders only, services only, or both
  searchMode: SearchMode = 'both';

  // UI state
  isLoading: boolean = false;
  error: string | null = null;
  geolocationError: string | null = null;
  hasSearched: boolean = false;
  isMapFullscreen: boolean = false;
  mobileActiveTab: 'map' | 'list' = 'map';

  // Mobile filter drawer state
  isMobileFilterOpen: boolean = false;
  drawerBreedTerm: string = '';
  drawerBreedSuggestions: Breed[] = [];
  drawerBreedOpen: boolean = false;
  private drawerBreedSearch$ = new Subject<string>();
  private drawerBreedSub!: Subscription;

  // Pet types for filter
  petTypes: IPetType[] = PET_TYPES;

  constructor(
    private searchService: SearchService,
    private serviceProviderService: ServiceProviderService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Try to restore previous search state (e.g. when navigating back from offspring page)
    const restored = this.restoreSearchState();

    if (!restored) {
      // No saved state — request geolocation for a fresh search
      this.requestGeolocation();
    }

    // Drawer breed autocomplete
    this.drawerBreedSub = this.drawerBreedSearch$.pipe(
      debounceTime(350),
      switchMap(term => {
        if (term.length < 2) return of([]);
        return this.searchService.searchBreeds(term, this.selectedAnimalKind || undefined).pipe(
          catchError(() => of([]))
        );
      })
    ).subscribe(breeds => {
      this.drawerBreedSuggestions = breeds;
      this.drawerBreedOpen = breeds.length > 0;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.drawerBreedSub?.unsubscribe();
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
            // No toast — the inline banner is sufficient
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          // Geocoding failed - that's okay, user can enter ZIP manually
          const message = 'Could not detect your location automatically. Please enter your ZIP code to search.';
          this.geolocationError = message;
          // No toast — the inline banner is sufficient
          // Auto-populate ZIP from last successful search if available
          const lastZip = localStorage.getItem('last_zip_code');
          if (lastZip && !this.zipCode) {
            this.zipCode = lastZip;
          }
          this.cdr.detectChanges();
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
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable. Please enter your ZIP code to search.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Please enter your ZIP code to search.';
        break;
      default:
        errorMessage = 'Unable to detect your location. Please enter your ZIP code to search.';
    }
    // Show inline banner only — no toast for geolocation errors (banner is sufficient)
    this.geolocationError = errorMessage;

    // Auto-populate ZIP from last successful search if available
    const lastZip = localStorage.getItem('last_zip_code');
    if (lastZip && !this.zipCode) {
      this.zipCode = lastZip;
      this.cdr.detectChanges();
    }
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
   * Perform search with coordinates — fetches breeders and/or services based on searchMode
   */
  private performSearch(coordinates: Coordinates): void {
    this.isLoading = true;
    this.error = null;
    this.cdr.detectChanges();

    const radiusKm = this.radius * 1.60934; // miles → km

    const breeders$ = (this.searchMode === 'breeders' || this.searchMode === 'both')
      ? this.searchService.searchBreeders(
          coordinates.latitude, coordinates.longitude, this.radius,
          this.selectedBreed?.id, this.selectedAnimalKind || undefined
        ).pipe(catchError(() => of([])))
      : of([]);

    const services$ = (this.searchMode === 'services' || this.searchMode === 'both')
      ? this.serviceProviderService.searchServices({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          radius_km: radiusKm,
          page: 1,
          page_size: 50,
        }).pipe(catchError(() => of({ items: [] })))
      : of({ items: [] });

    forkJoin({ breeders: breeders$, services: services$ }).subscribe({
      next: ({ breeders, services }) => {
        this.searchResults = breeders as BreederSearchResult[];
        this.serviceResults = (services as any).items || [];

        // Build breeder markers (red/default)
        const breederMarkers = toBreederMarkers(this.searchResults);

        // Build service provider markers (teal) — reuse BreederMarker shape
        const serviceMarkers: BreederMarker[] = this.serviceResults
          .filter((sp: any) => sp.latitude && sp.longitude)
          .map((sp: any) => ({
            id: sp.user_id,
            latitude: sp.latitude,
            longitude: sp.longitude,
            name: sp.provider_name,
            isService: true,
          }));

        this.breederMarkers = [...breederMarkers, ...serviceMarkers];
        this.hasSearched = true;
        this.isLoading = false;
        this.error = null;
        this.geolocationError = null;
        this.cdr.detectChanges();

        const total = this.searchResults.length + this.serviceResults.length;
        if (total > 0) {
          this.toastService.success(`Found ${this.searchResults.length} breeder${this.searchResults.length !== 1 ? 's' : ''} and ${this.serviceResults.length} service provider${this.serviceResults.length !== 1 ? 's' : ''}`);
          if (window.innerWidth <= 768) this.mobileActiveTab = 'list';
        }

        this.saveSearchState();
        localStorage.setItem('last_zip_code', this.zipCode);
      },
      error: (err) => {
        this.isLoading = false;
        const message = err.message || 'Search failed. Please try again.';
        this.error = message;
        this.searchResults = [];
        this.serviceResults = [];
        this.breederMarkers = [];
        this.cdr.detectChanges();
        this.toastService.error(message);
      }
    });
  }

  setSearchMode(mode: SearchMode): void {
    this.searchMode = mode;
    if (this.hasSearched && this.zipCode) {
      this.onSearch();
    }
  }

  /**
   * Set the active tab on mobile (map or list)
   */
  setMobileTab(tab: 'map' | 'list'): void {
    this.mobileActiveTab = tab;
    // Invalidate map size when switching back to map tab
    if (tab === 'map') {
      setTimeout(() => {
        if (this.mapComponent && (this.mapComponent as any).map) {
          (this.mapComponent as any).map.invalidateSize();
        }
      }, 50);
    }
  }

  /**
   * Handle marker click from MapComponent
   * Requirement 9.1: Highlight corresponding breeder card when marker is clicked
   */
  onMarkerClick(breederId: string): void {
    this.highlightedBreederId = breederId;
    // On mobile, switch to list tab so the card is visible
    this.mobileActiveTab = 'list';
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
    return this.hasSearched && !this.isLoading &&
      this.searchResults.length === 0 && this.serviceResults.length === 0;
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

  /**
   * Toggle fullscreen map mode
   */
  toggleFullscreenMap(): void {
    this.isMapFullscreen = !this.isMapFullscreen;
    // Trigger map resize after layout change
    setTimeout(() => {
      if (this.mapComponent && (this.mapComponent as any).map) {
        (this.mapComponent as any).map.invalidateSize();
      }
    }, 300);
  }

  /**
   * Handle animal kind filter change
   */
  onAnimalKindChange(kind: string): void {
    this.selectedAnimalKind = this.selectedAnimalKind === kind ? '' : kind;
    // Re-search if we already have results
    if (this.hasSearched && this.zipCode) {
      this.onSearch();
    }
  }

  // ─── Mobile filter drawer ────────────────────────────────────────────────

  openMobileFilters(): void {
    this.isMobileFilterOpen = true;
    // Sync drawer breed term with current selection
    this.drawerBreedTerm = this.selectedBreed?.name ?? '';
    document.body.style.overflow = 'hidden';
  }

  closeMobileFilters(): void {
    this.isMobileFilterOpen = false;
    document.body.style.overflow = '';
  }

  applyMobileFilters(): void {
    this.closeMobileFilters();
    this.onSearch();
  }

  clearMobileFilters(): void {
    this.selectedBreed = null;
    this.selectedAnimalKind = '';
    this.radius = 40;
    this.drawerBreedTerm = '';
    this.drawerBreedSuggestions = [];
  }

  hasActiveFilters(): boolean {
    return !!this.selectedBreed || !!this.selectedAnimalKind || this.radius !== 40;
  }

  radiusChange(miles: number): void {
    this.radius = miles;
  }

  // Drawer breed autocomplete
  onDrawerBreedInput(value: string): void {
    this.drawerBreedTerm = value;
    if (!value) {
      this.selectedBreed = null;
      this.drawerBreedSuggestions = [];
      this.drawerBreedOpen = false;
      return;
    }
    this.drawerBreedSearch$.next(value);
  }

  onDrawerBreedBlur(): void {
    setTimeout(() => { this.drawerBreedOpen = false; }, 200);
  }

  selectDrawerBreed(breed: Breed): void {
    this.selectedBreed = breed;
    this.drawerBreedTerm = breed.name;
    this.drawerBreedSuggestions = [];
    this.drawerBreedOpen = false;
  }

  clearDrawerBreed(): void {
    this.selectedBreed = null;
    this.drawerBreedTerm = '';
    this.drawerBreedSuggestions = [];
    this.drawerBreedOpen = false;
  }

  // ─── Search state persistence (survive back-navigation) ─────────────────

  private saveSearchState(): void {
    const state = {
      zipCode: this.zipCode,
      selectedBreed: this.selectedBreed,
      selectedAnimalKind: this.selectedAnimalKind,
      radius: this.radius,
      searchMode: this.searchMode,
      mapCenter: this.mapCenter,
      searchResults: this.searchResults,
      serviceResults: this.serviceResults,
      breederMarkers: this.breederMarkers,
      hasSearched: this.hasSearched,
      mobileActiveTab: this.mobileActiveTab,
      drawerBreedTerm: this.drawerBreedTerm,
    };
    sessionStorage.setItem('search_page_state', JSON.stringify(state));
  }

  private restoreSearchState(): boolean {
    const raw = sessionStorage.getItem('search_page_state');
    if (!raw) return false;
    try {
      const state = JSON.parse(raw);
      this.zipCode = state.zipCode ?? '';
      this.selectedBreed = state.selectedBreed ?? null;
      this.selectedAnimalKind = state.selectedAnimalKind ?? '';
      this.radius = state.radius ?? 40;
      this.searchMode = state.searchMode ?? 'both';
      this.mapCenter = state.mapCenter ?? { latitude: 39.8283, longitude: -98.5795 };
      this.searchResults = state.searchResults ?? [];
      this.serviceResults = state.serviceResults ?? [];
      this.breederMarkers = state.breederMarkers ?? [];
      this.hasSearched = state.hasSearched ?? false;
      this.mobileActiveTab = state.mobileActiveTab ?? 'list';
      this.drawerBreedTerm = state.drawerBreedTerm ?? '';
      this.cdr.detectChanges();
      return this.hasSearched;
    } catch {
      return false;
    }
  }
}
