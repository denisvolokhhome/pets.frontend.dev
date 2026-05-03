import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { OffspringService, OffspringRead } from 'src/app/services/offspring.service';
import { ToastService } from 'src/app/services/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  standalone: false,
  selector: 'app-offspring-grid',
  templateUrl: './offspring-grid.component.html',
  styleUrls: ['./offspring-grid.component.css']
})
export class OffspringGridComponent implements OnInit {
  @Input() breederId!: string;

  offsprings: OffspringRead[] = [];
  isLoading: boolean = true;
  breederInfo: any = null;
  
  // Pagination
  totalOffsprings: number = 0;
  currentPage: number = 0;
  pageSize: number = 12;
  
  // Filters
  selectedBreedId: number | undefined;
  selectedGender: string | undefined;
  selectedStatus: string | undefined;

  // Mobile filter drawer
  isMobileFilterOpen: boolean = false;
  
  // Filter options
  breeds: any[] = [];
  genders = [
    { label: 'All', value: undefined },
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' }
  ];
  statuses = [
    { label: 'All', value: undefined },
    { label: 'Available', value: 'Available' },
    { label: 'Reserved', value: 'Reserved' },
    { label: 'Sold', value: 'Sold' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private offspringService: OffspringService,
    private toastr: ToastService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Get breederId from route if not provided as input
    if (!this.breederId) {
      this.route.params.subscribe(params => {
        // Route parameter is 'id', not 'breederId'
        this.breederId = params['id'];
        if (this.breederId) {
          this.loadFiltersFromSession();
          this.loadOffsprings();
          this.loadBreederInfo();
        } else {
          console.error('Breeder ID not found in route parameters');
          this.isLoading = false;
        }
      });
    } else {
      this.loadFiltersFromSession();
      this.loadOffsprings();
      this.loadBreederInfo();
    }
  }

  /**
   * Load offsprings with current filters and pagination
   */
  loadOffsprings(): void {
    if (!this.breederId) {
      console.error('Breeder ID is required');
      return;
    }

    this.isLoading = true;
    const offset = this.currentPage * this.pageSize;

    // Save filters to session storage
    this.saveFiltersToSession();

    this.offspringService.getPublicOffspringsByBreeder(
      this.breederId,
      this.selectedBreedId,
      this.selectedGender,
      this.selectedStatus,
      this.pageSize,
      offset
    ).subscribe({
      next: (response) => {
        this.offsprings = response.offsprings || [];
        this.totalOffsprings = response.total || 0;
        this.extractBreeds();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading offsprings:', error);
        this.toastr.error(error.message || 'Failed to load offsprings', 'Error');
        this.offsprings = [];
        this.totalOffsprings = 0;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Extract unique breeds from offsprings for filter dropdown
   */
  extractBreeds(): void {
    const breedMap = new Map<number, string>();
    
    // Safely iterate over offsprings array
    if (this.offsprings && Array.isArray(this.offsprings)) {
      this.offsprings.forEach(offspring => {
        if (offspring.breed_id && offspring.breed?.name) {
          breedMap.set(offspring.breed_id, offspring.breed.name);
        }
      });
    }

    this.breeds = [
      { label: 'All Breeds', value: undefined },
      ...Array.from(breedMap.entries()).map(([id, name]) => ({
        label: name,
        value: id
      }))
    ];
  }

  /**
   * Apply breed filter
   */
  onBreedFilterChange(breedId: number | undefined): void {
    this.selectedBreedId = breedId;
    this.currentPage = 0;
    this.loadOffsprings();
  }

  /**
   * Apply gender filter
   */
  onGenderFilterChange(gender: string | undefined): void {
    this.selectedGender = gender;
    this.currentPage = 0;
    this.loadOffsprings();
  }

  /**
   * Apply status filter
   */
  onStatusFilterChange(status: string | undefined): void {
    this.selectedStatus = status;
    this.currentPage = 0;
    this.loadOffsprings();
  }

  /**
   * Apply filters from mobile drawer and close it
   */
  applyMobileFilters(): void {
    this.isMobileFilterOpen = false;
    this.currentPage = 0;
    this.loadOffsprings();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.selectedBreedId = undefined;
    this.selectedGender = undefined;
    this.selectedStatus = undefined;
    this.currentPage = 0;
    sessionStorage.removeItem('offspring_filters');
    this.loadOffsprings();
  }

  /**
   * Check if any filters are active
   */
  hasActiveFilters(): boolean {
    return !!(this.selectedBreedId || this.selectedGender || this.selectedStatus);
  }

  /**
   * Handle page change
   */
  onPageChange(event: any): void {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.loadOffsprings();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Handle favorite toggle from card
   */
  onFavoriteToggled(offspringId: string): void {
    // Refresh the offspring to get updated favorite status
    const offspring = this.offsprings.find(o => o.id === offspringId);
    if (offspring) {
      // The card component already updated the is_favorited flag
      this.cdr.detectChanges();
    }
  }

  /**
   * Get total pages
   */
  getTotalPages(): number {
    return Math.ceil(this.totalOffsprings / this.pageSize);
  }

  /**
   * Check if there are offsprings to display
   */
  hasOffsprings(): boolean {
    return !!(this.offsprings && this.offsprings.length > 0);
  }

  /**
   * Save filter selections to session storage
   */
  private saveFiltersToSession(): void {
    const filters = {
      breedId: this.selectedBreedId,
      gender: this.selectedGender,
      status: this.selectedStatus
    };
    sessionStorage.setItem('offspring_filters', JSON.stringify(filters));
  }

  /**
   * Load filter selections from session storage
   */
  private loadFiltersFromSession(): void {
    const savedFilters = sessionStorage.getItem('offspring_filters');
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        this.selectedBreedId = filters.breedId;
        this.selectedGender = filters.gender;
        this.selectedStatus = filters.status;
      } catch (error) {
        console.error('Error loading filters from session storage:', error);
      }
    }
  }

  private loadBreederInfo(): void {
    if (!this.breederId) return;
    this.http.get<any>(`${environment.API_URL}/users/breeder/${this.breederId}/public`).subscribe({
      next: (info) => { this.breederInfo = info; this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  getBreederImageUrl(): string | null {
    return this.breederInfo?.profile_image_url
      ? `${environment.API_HOST}${this.breederInfo.profile_image_url}`
      : null;
  }

  goToSearch(): void {
    this.router.navigate(['/search-pets']);
  }

  getBreederLocation(): string {
    const loc = this.breederInfo?.location;
    if (!loc) return '';
    const parts = [loc.city, loc.state].filter(Boolean);
    return parts.join(', ');
  }
}
