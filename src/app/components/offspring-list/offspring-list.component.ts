import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { OffspringService, OffspringRead } from 'src/app/services/offspring.service';
import { ToastService } from 'src/app/services/toast.service';
import { PageHeaderConfig } from '../page-header/page-header.component';
import { FilterConfig, FilterValues } from '../shared/filter-widget/filter-widget.component';
import { IBreed } from 'src/app/models/breed';

@Component({
  standalone: false,
  selector: 'app-offspring-list',
  templateUrl: './offspring-list.component.html',
  styleUrls: ['./offspring-list.component.css']
})
export class OffspringListComponent implements OnInit {
  headerConfig: PageHeaderConfig = {
    title: 'My Offsprings',
    icon: 'bi bi-heart-fill',
    iconColor: '#ec4899',
    showLayoutSwitcher: false,
    showSearch: true,
    searchPlaceholder: 'Search offsprings...',
    showActionButton: false
  };
  
  // Filter widget configuration
  filterConfig: FilterConfig = {
    showLocation: false,
    showGender: true,
    showPetType: false,
    showStatus: true,
    showBreed: true,
    showHealthRecords: false,
    statusOptions: [
      { value: 'Available', label: 'Available' },
      { value: 'Reserved', label: 'Reserved' },
      { value: 'Sold', label: 'Sold' },
      { value: 'Archived', label: 'Archived' }
    ]
  };
  
  // Current filter values
  currentFilters: FilterValues = {};
  
  breeds: IBreed[] = [];
  offsprings: OffspringRead[] = [];
  filteredOffsprings: OffspringRead[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  isDeleting: { [key: string]: boolean } = {};
  isUpdatingStatus: { [key: string]: boolean } = {};

  // Pagination
  totalRecords: number = 0;
  rows: number = 50;
  first: number = 0;

  // Status options
  statusOptions = [
    { label: 'Available', value: 'Available' },
    { label: 'Reserved', value: 'Reserved' },
    { label: 'Sold', value: 'Sold' },
    { label: 'Archived', value: 'Archived' }
  ];

  constructor(
    private offspringService: OffspringService,
    private toastr: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOffsprings();
  }
  
  loadBreeds(): void {
    // Extract unique breeds from offsprings
    const uniqueBreeds = new Map<number, IBreed>();
    
    this.offsprings.forEach(offspring => {
      if (offspring.breed && offspring.breed.id) {
        uniqueBreeds.set(offspring.breed.id, offspring.breed);
      }
    });
    
    // Convert map to array and sort by name
    this.breeds = Array.from(uniqueBreeds.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    
    this.cdr.detectChanges();
  }

  loadOffsprings(): void {
    console.log('Loading all offsprings');
    this.isLoading = true;
    // Load all offsprings at once (max limit is 100)
    this.offspringService.getOffsprings(undefined, undefined, 100, 0).subscribe({
      next: (response) => {
        console.log('Offsprings loaded:', response.offsprings.length);
        this.offsprings = response.offsprings;
        this.filteredOffsprings = response.offsprings;
        this.totalRecords = response.total;
        this.isLoading = false;
        
        // Load breeds after offsprings are loaded
        this.loadBreeds();
        
        this.applySearch();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading offsprings:', error);
        this.toastr.error(error.message || 'Failed to load offsprings', 'Error');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearchChange(): void {
    this.applySearch();
  }

  onSearchTermChange(term: string): void {
    this.searchTerm = term;
    this.applySearch();
  }

  applySearch(): void {
    let filtered = this.offsprings;
    
    // Apply search filter
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(offspring => {
        const name = (offspring.name || '').toLowerCase();
        const fatherName = (offspring.father?.name || '').toLowerCase();
        const motherName = (offspring.mother?.name || '').toLowerCase();
        
        return name.includes(searchLower) || 
               fatherName.includes(searchLower) || 
               motherName.includes(searchLower);
      });
    }
    
    // Apply status filter
    if (this.currentFilters.status) {
      filtered = filtered.filter(offspring => offspring.status === this.currentFilters.status);
    }
    
    // Apply gender filter
    if (this.currentFilters.gender) {
      filtered = filtered.filter(offspring => offspring.gender === this.currentFilters.gender);
    }
    
    // Apply breed filter
    if (this.currentFilters.breed) {
      filtered = filtered.filter(offspring => {
        const breedName = offspring.breed?.name || '';
        return breedName === this.currentFilters.breed;
      });
    }
    
    this.filteredOffsprings = filtered;
    this.totalRecords = filtered.length;
    this.first = 0; // Reset to first page when filtering
    this.cdr.detectChanges();
  }
  
  onFilterChange(filters: FilterValues): void {
    this.currentFilters = filters;
    this.applySearch();
  }
  
  onClearFilters(): void {
    this.currentFilters = {};
    this.applySearch();
  }
  
  hasActiveFilters(): boolean {
    return Object.keys(this.currentFilters).length > 0;
  }

  onPageChange(event: any): void {
    // Client-side pagination only - no need to reload data
    console.log('Page change event (client-side only):', event);
    this.first = event.first;
    this.rows = event.rows;
  }

  addOffspring(): void {
    this.router.navigate(['/offsprings/new']);
  }

  viewOffspring(offspring: OffspringRead): void {
    this.router.navigate(['/offsprings', offspring.id]);
  }

  editOffspring(offspring: OffspringRead): void {
    this.router.navigate(['/offsprings', offspring.id, 'edit']);
  }

  deleteOffspring(offspring: OffspringRead): void {
    if (confirm(`Are you sure you want to delete offspring "${offspring.name || 'Unnamed'}"? This action cannot be undone.`)) {
      this.isDeleting[offspring.id] = true;
      this.offspringService.deleteOffspring(offspring.id).subscribe({
        next: () => {
          this.toastr.success('Offspring deleted successfully', 'Success');
          this.isDeleting[offspring.id] = false;
          this.loadOffsprings();
        },
        error: (error) => {
          console.error('Error deleting offspring:', error);
          this.toastr.error(error.message || 'Failed to delete offspring', 'Error');
          this.isDeleting[offspring.id] = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onStatusChange(offspring: OffspringRead, newStatus: string): void {
    this.isUpdatingStatus[offspring.id] = true;
    this.offspringService.updateOffspring(offspring.id, { status: newStatus as any }).subscribe({
      next: (updatedOffspring) => {
        offspring.status = updatedOffspring.status;
        this.toastr.success('Status updated successfully', 'Success');
        this.isUpdatingStatus[offspring.id] = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.toastr.error(error.message || 'Failed to update status', 'Error');
        this.isUpdatingStatus[offspring.id] = false;
        this.cdr.detectChanges();
      }
    });
  }

  viewMessages(offspring: OffspringRead): void {
    // Navigate to messages view filtered by offspring
    this.router.navigate(['/messages'], { queryParams: { offspring_id: offspring.id } });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Available':
        return 'badge-available';
      case 'Reserved':
        return 'badge-reserved';
      case 'Sold':
        return 'badge-sold';
      case 'Archived':
        return 'badge-archived';
      default:
        return '';
    }
  }

  getThumbnailUrl(offspring: OffspringRead): string {
    if (offspring.primary_image) {
      return `http://breedly.com:8000${offspring.primary_image.image_url}`;
    }
    if (offspring.images && offspring.images.length > 0) {
      return `http://breedly.com:8000${offspring.images[0].image_url}`;
    }
    // Return a data URL for a simple gray placeholder instead of trying to load a file
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
  }

  getBreedName(offspring: OffspringRead): string {
    return offspring.breed?.name || '-';
  }

  getBreedingReference(offspring: OffspringRead): string {
    return offspring.breeding?.id?.toString() || '-';
  }

  getFatherName(offspring: OffspringRead): string {
    return offspring.father?.name || '-';
  }

  getMotherName(offspring: OffspringRead): string {
    return offspring.mother?.name || '-';
  }

  navigateToBreeding(offspring: OffspringRead): void {
    if (offspring.breeding_id) {
      this.router.navigate(['/breeding', offspring.breeding_id]);
    }
  }

  navigateToPet(petId: string): void {
    if (petId) {
      this.router.navigate(['/pets', petId]);
    }
  }
}
