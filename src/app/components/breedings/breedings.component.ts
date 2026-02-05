import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { IBreeding, BreedingStatus } from 'src/app/models/breeding';
import { ILocation } from 'src/app/models/location';
import { IBreed } from 'src/app/models/breed';
import { DataService } from 'src/app/services/data.service';
import { ModalService } from 'src/app/services/modal.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  standalone: false,
  selector: 'app-breedings',
  templateUrl: './breedings.component.html',
  styleUrls: ['./breedings.component.css']
})
export class BreedingsComponent implements OnInit, AfterViewInit {
  @ViewChild('tableContainer') tableContainer?: ElementRef;

  constructor(
    public dataService: DataService,
    public modalService: ModalService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  breedings: IBreeding[] = [];
  filteredBreedings: IBreeding[] = [];
  locations: ILocation[] = [];
  breeds: IBreed[] = [];
  
  // Filter properties
  selectedLocationId: string = '';
  selectedStatus: string = '';
  selectedBreedId: string = '';
  searchTerm: string = '';
  
  // Loading states
  isLoading: boolean = false;
  isVoiding: { [key: string]: boolean } = {};
  
  // Modal properties
  selectedBreeding: IBreeding | null = null;
  modalMode: 'create' | 'update' | 'view' = 'create';
  
  // Status enum for template
  BreedingStatus = BreedingStatus;

  ngOnInit(): void {
    this.loadBreedings();
    this.loadLocations();
    this.loadBreeds();
  }

  ngAfterViewInit(): void {
    this.checkTableScroll();
  }

  checkTableScroll(): void {
    setTimeout(() => {
      if (this.tableContainer) {
        const element = this.tableContainer.nativeElement;
        if (element.scrollWidth > element.clientWidth) {
          element.classList.add('has-scroll');
        } else {
          element.classList.remove('has-scroll');
        }
      }
    }, 100);
  }

  loadBreedings(): void {
    this.isLoading = true;
    this.dataService.getLitters().subscribe({
      next: (breedings: any) => {
        this.breedings = breedings as IBreeding[];
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading breedings:', error);
        this.toastr.error('Failed to load breedings', 'Error');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadLocations(): void {
    this.dataService.getLocations().subscribe({
      next: (locations) => {
        this.locations = locations;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading locations:', error);
        this.toastr.error('Failed to load locations', 'Error');
      }
    });
  }

  loadBreeds(): void {
    this.dataService.getBreeds().subscribe({
      next: (breeds) => {
        this.breeds = breeds;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading breeds:', error);
        this.toastr.error('Failed to load breeds', 'Error');
      }
    });
  }

  applyFilters(): void {
    this.filteredBreedings = this.breedings.filter(breeding => {
      // Search filter - search in description
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        const description = breeding.description?.toLowerCase() || '';
        if (!description.includes(searchLower)) {
          return false;
        }
      }

      // Location filter - compare by location name since location_id isn't in IPet
      if (this.selectedLocationId) {
        const selectedLocation = this.locations.find(loc => loc.id?.toString() === this.selectedLocationId);
        const breedingLocation = this.getLocationName(breeding);
        if (selectedLocation && breedingLocation !== selectedLocation.name) {
          return false;
        }
      }

      // Status filter
      if (this.selectedStatus && breeding.status !== this.selectedStatus) {
        return false;
      }

      // Breed filter - compare by breed ID
      if (this.selectedBreedId) {
        const breedingBreeds = this.getBreedIds(breeding);
        const selectedBreedIdNum = parseInt(this.selectedBreedId);
        if (!breedingBreeds.includes(selectedBreedIdNum)) {
          return false;
        }
      }

      return true;
    });
    
    // Check scroll after filters are applied
    this.checkTableScroll();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedLocationId = '';
    this.selectedStatus = '';
    this.selectedBreedId = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedLocationId || this.selectedStatus || this.selectedBreedId || this.searchTerm);
  }

  getLocationName(breeding: IBreeding): string {
    if (!breeding.parent_pets || breeding.parent_pets.length === 0) {
      return '-';
    }
    // Get location from first parent pet
    return breeding.parent_pets[0].location_name || '-';
  }

  getLocationId(breeding: IBreeding): string | null {
    if (!breeding.parent_pets || breeding.parent_pets.length === 0) {
      return null;
    }
    // Since location_id doesn't exist in IPet, we'll use location_name for filtering
    // This is a workaround - ideally the backend should provide location_id
    return breeding.parent_pets[0].location_name || null;
  }

  getBreedDisplay(breeding: IBreeding): string {
    if (!breeding.parent_pets || breeding.parent_pets.length === 0) {
      return '-';
    }

    // Get unique breed names from parent pets
    const breedNames = breeding.parent_pets
      .map(pet => pet.breed_name)
      .filter((name, index, self) => name && self.indexOf(name) === index);

    if (breedNames.length === 0) {
      return '-';
    } else if (breedNames.length === 1) {
      // Same breed - display single breed name
      return breedNames[0];
    } else {
      // Mixed breed - display both breeds separated by plus sign
      return breedNames.join(' + ');
    }
  }

  getBreedIds(breeding: IBreeding): (number | undefined)[] {
    if (!breeding.parent_pets || breeding.parent_pets.length === 0) {
      return [];
    }
    // Get unique breed IDs from parent pets
    return breeding.parent_pets
      .map(pet => pet.breed_id)
      .filter((id, index, self) => id && self.indexOf(id) === index);
  }

  getPuppiesCount(breeding: IBreeding): number {
    if (!breeding.puppies || breeding.puppies.length === 0) {
      return 0;
    }
    return breeding.puppies.length;
  }

  addBreeding(): void {
    console.log('addBreeding called');
    console.log('modalService:', this.modalService);
    this.selectedBreeding = null;
    this.modalMode = 'create';
    console.log('Opening modal with mode:', this.modalMode);
    this.modalService.open();
    console.log('Modal service open() called');
  }

  viewBreeding(breeding: IBreeding): void {
    this.selectedBreeding = breeding;
    this.modalMode = 'view';
    this.modalService.open();
  }

  updateBreeding(breeding: IBreeding): void {
    this.selectedBreeding = breeding;
    this.modalMode = 'update';
    this.modalService.open();
  }

  voidBreeding(breeding: IBreeding): void {
    if (confirm('Are you sure you want to void this breeding? This action cannot be undone.')) {
      this.isVoiding[breeding.id] = true;
      this.dataService.voidLitter(breeding.id).subscribe({
        next: () => {
          this.toastr.success('Breeding voided successfully', 'Success');
          this.isVoiding[breeding.id] = false;
          this.loadBreedings();
        },
        error: (error) => {
          console.error('Error voiding breeding:', error);
          const errorMessage = error.error?.detail || error.message || 'Unknown error';
          this.toastr.error('Failed to void breeding: ' + errorMessage, 'Error');
          this.isVoiding[breeding.id] = false;
        }
      });
    }
  }

  onBreedingSaved(breeding: any): void {
    // Reload breedings after save
    this.loadBreedings();
    if (this.modalMode === 'create') {
      this.toastr.success('Breeding created successfully', 'Success');
    } else if (this.modalMode === 'update') {
      this.toastr.success('Breeding updated successfully', 'Success');
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  getStatusBadgeClass(status: BreedingStatus): string {
    switch (status) {
      case BreedingStatus.Started:
        return 'badge-started';
      case BreedingStatus.InProcess:
        return 'badge-inprocess';
      case BreedingStatus.Done:
        return 'badge-done';
      case BreedingStatus.Voided:
        return 'badge-voided';
      default:
        return '';
    }
  }

}
