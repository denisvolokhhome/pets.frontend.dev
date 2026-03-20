import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { IPet } from 'src/app/models/pet';
import { ILocation } from 'src/app/models/location';
import { IBreed } from 'src/app/models/breed';
import { IPetType, PET_TYPES } from 'src/app/models/pet-type';
import { DataService } from 'src/app/services/data.service';
import { ModalService } from 'src/app/services/modal.service';
import { AuthService } from 'src/app/services/auth.service';
import { FilterConfig, FilterValues } from '../shared/filter-widget/filter-widget.component';
import { PageHeaderConfig } from '../page-header/page-header.component';

@Component({
  standalone: false,
  selector: 'app-pets',
  templateUrl: './pets.component.html',
  styleUrls: ['./pets.component.css']
})
export class PetsComponent implements OnInit {
  
  headerConfig: PageHeaderConfig = {
    title: 'Pets Management',
    icon: 'bi bi-heart-fill',
    iconColor: '#ec4899',
    showLayoutSwitcher: true,
    showSearch: true,
    searchPlaceholder: 'Search pets...',
    showActionButton: true,
    actionButtonIcon: 'bi bi-plus-circle',
    actionButtonColor: 'var(--success-color)',
    actionButtonTitle: 'Add Pet',
    actionButtonDisabled: true
  };

  constructor(
    public DataService: DataService,
    public ModalService: ModalService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService
  ){}

  pets: IPet [] = [];
  filteredPets: IPet[] = [];
  locations: ILocation[] = [];
  breeds: IBreed[] = [];
  pet: IPet;
  view: string = 'cards';
  title: string = 'Pets';
  term: string = '';
  petId: string = '';
  selectedPetForBreeding: IPet | null = null;
  selectedPetForDocuments: IPet | null = null;
  isLoading: boolean = true;
  locationsLoaded: boolean = false;
  
  // Filter widget configuration
  filterConfig: FilterConfig = {
    showLocation: true,
    showGender: true,
    showPetType: true,
    showStatus: false,
    showBreed: false,
    showHealthRecords: true
  };
  
  // Current filter values
  currentFilters: FilterValues = {};

  ngOnInit(): void {
    this.loadPets();
    this.loadLocations();
    this.loadBreeds();
    
    // Reload pets when navigating back to this component
    // This ensures newly added puppies from litter flow are displayed
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Only reload if we're on the pets route
      if (this.router.url.includes('/pets')) {
        this.loadPets();
      }
    });
  }

  loadPets(): void {
    const userId = this.authService.currentUser?.id;
    if (!userId) {
      console.error('No user ID available');
      this.isLoading = false;
      return;
    }
    
    this.isLoading = true;
    this.DataService.getPetsByBreeder(userId).subscribe({
      next: (pets) => {
        console.log('All pets loaded:', pets);
        console.log('Pets with is_puppy values:', pets.map(p => ({ name: p.name, is_puppy: p.is_puppy, type: typeof p.is_puppy })));
        this.pets = pets;
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading pets:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadLocations(): void {
    this.DataService.getLocations().subscribe((locations) => {
      this.locations = locations;
      this.locationsLoaded = true;
      this.updateAddPetButton();
    });
  }

  updateAddPetButton(): void {
    const hasLocations = this.locationsLoaded && this.locations && this.locations.length > 0;
    this.headerConfig = {
      ...this.headerConfig,
      actionButtonDisabled: this.locationsLoaded && !hasLocations,
      actionButtonTooltip: hasLocations
        ? 'Add Pet'
        : 'You need to create at least one location in Settings before adding pets'
    };
    this.cdr.detectChanges();
  }

  loadBreeds(): void {
    this.DataService.getBreeds().subscribe((breeds) => {
      this.breeds = breeds;
    });
  }

  onFilterChange(filters: FilterValues): void {
    this.currentFilters = filters;
    this.applyFilters();
  }

  onClearFilters(): void {
    this.currentFilters = {};
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredPets = this.pets.filter(pet => {
      // Always exclude puppies from the pets screen
      if (pet.is_puppy) {
        return false;
      }

      // Location filter
      if (this.currentFilters.location && pet.location_name !== this.currentFilters.location) {
        return false;
      }

      // Gender filter
      if (this.currentFilters.gender && pet.gender !== this.currentFilters.gender) {
        return false;
      }

      // Pet type filter - match pet's breed_id with breeds array and check kind
      if (this.currentFilters.petType) {
        const breed = this.breeds.find(b => b.id === pet.breed_id);
        if (!breed || breed.kind !== this.currentFilters.petType) {
          return false;
        }
      }

      // Health filters - pet must have ALL selected health records
      if (this.currentFilters.healthFilters) {
        if (this.currentFilters.healthFilters.vaccination && !pet.has_vaccination) {
          return false;
        }
        if (this.currentFilters.healthFilters.microchip && !pet.has_microchip) {
          return false;
        }
        if (this.currentFilters.healthFilters.healthcertificate && !pet.has_healthcertificate) {
          return false;
        }
        if (this.currentFilters.healthFilters.dewormed && !pet.has_dewormed) {
          return false;
        }
        if (this.currentFilters.healthFilters.birthcertificate && !pet.has_birthcertificate) {
          return false;
        }
      }

      return true;
    });
  }

  hasActiveFilters(): boolean {
    return this.currentFilters && Object.keys(this.currentFilters).length > 0;
  }

  changeLayout(viewType: string) {
    this.view = viewType;
    console.log('Layout changed to: ' + viewType);
  }
  
  onLayoutChange(layout: 'table' | 'cards') {
    this.view = layout;
  }
  
  onSearchTermChange(term: string) {
    this.term = term;
  }
  
  onAddPetClick() {
    this.openAddPetModal();
  }

  searchPets(event: any){
    this.term = event.target.value;
    console.log('searching... ' + this.term);
  }

  openAddPetModal(): void {
    this.ModalService.open('addPetModal');
  }

  deletePet(emittedPetId: any){
    this.petId = emittedPetId;
    this.ModalService.open('deletePetModal');
    console.log('deleting pet id: ' + emittedPetId);
  }

  editPet(emittedPet: any){
    this.pet = emittedPet;
    this.ModalService.open('editPetModal');
  }

  openQuickBreeding(emittedPet: IPet): void {
    this.selectedPetForBreeding = emittedPet;
    this.ModalService.open('quickBreedingModal');
    console.log('Opening quick breeding for pet:', emittedPet.name);
  }
  openPetDocuments(emittedPet: IPet): void {
    this.selectedPetForDocuments = emittedPet;
    this.ModalService.open('petDocumentsModal');
  }

  onPetUpdated(): void {
    // Reload pets list after update
    this.loadPets();
  }

}
