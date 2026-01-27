import { Component, OnInit } from '@angular/core';
import { ILitter, LitterStatus } from 'src/app/models/litter';
import { ILocation } from 'src/app/models/location';
import { IBreed } from 'src/app/models/breed';
import { DataService } from 'src/app/services/data.service';
import { ModalService } from 'src/app/services/modal.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-litters',
  templateUrl: './litters.component.html',
  styleUrls: ['./litters.component.css']
})
export class LittersComponent implements OnInit {

  constructor(
    public dataService: DataService,
    public modalService: ModalService,
    private toastr: ToastrService
  ) {}

  litters: ILitter[] = [];
  filteredLitters: ILitter[] = [];
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
  selectedLitter: ILitter | null = null;
  modalMode: 'create' | 'update' | 'view' = 'create';
  
  // Status enum for template
  LitterStatus = LitterStatus;

  ngOnInit(): void {
    this.loadLitters();
    this.loadLocations();
    this.loadBreeds();
  }

  loadLitters(): void {
    this.isLoading = true;
    this.dataService.getLitters().subscribe({
      next: (litters) => {
        this.litters = litters;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading litters:', error);
        this.toastr.error('Failed to load litters', 'Error');
        this.isLoading = false;
      }
    });
  }

  loadLocations(): void {
    this.dataService.getLocations().subscribe({
      next: (locations) => {
        this.locations = locations;
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
      },
      error: (error) => {
        console.error('Error loading breeds:', error);
        this.toastr.error('Failed to load breeds', 'Error');
      }
    });
  }

  applyFilters(): void {
    this.filteredLitters = this.litters.filter(litter => {
      // Search filter - search in description
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        const description = litter.description?.toLowerCase() || '';
        if (!description.includes(searchLower)) {
          return false;
        }
      }

      // Location filter - compare by location name since location_id isn't in IPet
      if (this.selectedLocationId) {
        const selectedLocation = this.locations.find(loc => loc.id?.toString() === this.selectedLocationId);
        const litterLocation = this.getLocationName(litter);
        if (selectedLocation && litterLocation !== selectedLocation.name) {
          return false;
        }
      }

      // Status filter
      if (this.selectedStatus && litter.status !== this.selectedStatus) {
        return false;
      }

      // Breed filter - compare by breed ID
      if (this.selectedBreedId) {
        const litterBreeds = this.getBreedIds(litter);
        const selectedBreedIdNum = parseInt(this.selectedBreedId);
        if (!litterBreeds.includes(selectedBreedIdNum)) {
          return false;
        }
      }

      return true;
    });
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

  getLocationName(litter: ILitter): string {
    if (!litter.parent_pets || litter.parent_pets.length === 0) {
      return '-';
    }
    // Get location from first parent pet
    return litter.parent_pets[0].location_name || '-';
  }

  getLocationId(litter: ILitter): string | null {
    if (!litter.parent_pets || litter.parent_pets.length === 0) {
      return null;
    }
    // Since location_id doesn't exist in IPet, we'll use location_name for filtering
    // This is a workaround - ideally the backend should provide location_id
    return litter.parent_pets[0].location_name || null;
  }

  getBreedDisplay(litter: ILitter): string {
    if (!litter.parent_pets || litter.parent_pets.length === 0) {
      return '-';
    }

    // Get unique breed names from parent pets
    const breedNames = litter.parent_pets
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

  getBreedIds(litter: ILitter): (number | undefined)[] {
    if (!litter.parent_pets || litter.parent_pets.length === 0) {
      return [];
    }
    // Get unique breed IDs from parent pets
    return litter.parent_pets
      .map(pet => pet.breed_id)
      .filter((id, index, self) => id && self.indexOf(id) === index);
  }

  getPuppiesCount(litter: ILitter): number {
    if (!litter.puppies || litter.puppies.length === 0) {
      return 0;
    }
    return litter.puppies.length;
  }

  addLitter(): void {
    console.log('addLitter called');
    console.log('modalService:', this.modalService);
    this.selectedLitter = null;
    this.modalMode = 'create';
    console.log('Opening modal with mode:', this.modalMode);
    this.modalService.open();
    console.log('Modal service open() called');
  }

  viewLitter(litter: ILitter): void {
    this.selectedLitter = litter;
    this.modalMode = 'view';
    this.modalService.open();
  }

  updateLitter(litter: ILitter): void {
    this.selectedLitter = litter;
    this.modalMode = 'update';
    this.modalService.open();
  }

  voidLitter(litter: ILitter): void {
    if (confirm('Are you sure you want to void this litter? This action cannot be undone.')) {
      this.isVoiding[litter.id] = true;
      this.dataService.voidLitter(litter.id).subscribe({
        next: () => {
          this.toastr.success('Litter voided successfully', 'Success');
          this.isVoiding[litter.id] = false;
          this.loadLitters();
        },
        error: (error) => {
          console.error('Error voiding litter:', error);
          const errorMessage = error.error?.detail || error.message || 'Unknown error';
          this.toastr.error('Failed to void litter: ' + errorMessage, 'Error');
          this.isVoiding[litter.id] = false;
        }
      });
    }
  }

  onLitterSaved(litter: ILitter): void {
    // Reload litters after save
    this.loadLitters();
    if (this.modalMode === 'create') {
      this.toastr.success('Litter created successfully', 'Success');
    } else if (this.modalMode === 'update') {
      this.toastr.success('Litter updated successfully', 'Success');
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  getStatusBadgeClass(status: LitterStatus): string {
    switch (status) {
      case LitterStatus.Started:
        return 'badge-started';
      case LitterStatus.InProcess:
        return 'badge-inprocess';
      case LitterStatus.Done:
        return 'badge-done';
      case LitterStatus.Voided:
        return 'badge-voided';
      default:
        return '';
    }
  }

}
