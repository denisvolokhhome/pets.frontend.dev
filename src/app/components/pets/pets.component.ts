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

@Component({
  standalone: false,
  selector: 'app-pets',
  templateUrl: './pets.component.html',
  styleUrls: ['./pets.component.css']
})
export class PetsComponent implements OnInit {

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
      return;
    }
    
    this.DataService.getPetsByBreeder(userId).subscribe((pets) => {
      console.log('All pets loaded:', pets);
      console.log('Pets with is_puppy values:', pets.map(p => ({ name: p.name, is_puppy: p.is_puppy, type: typeof p.is_puppy })));
      this.pets = pets;
      this.applyFilters();
      this.cdr.detectChanges();
    });
  }

  loadLocations(): void {
    this.DataService.getLocations().subscribe((locations) => {
      this.locations = locations;
    });
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

  changeLayout(viewType: string) {
    this.view = viewType;
    console.log('Layout changed to: ' + viewType);
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

}
