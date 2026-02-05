import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { IPet } from 'src/app/models/pet';
import { ILocation } from 'src/app/models/location';
import { DataService } from 'src/app/services/data.service';
import { ModalService } from 'src/app/services/modal.service';

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
    private router: Router
  ){}

  pets: IPet [] = [];
  filteredPets: IPet[] = [];
  locations: ILocation[] = [];
  pet: IPet;
  view: string = 'cards';
  title: string = 'Pets';
  term: string = '';
  petId: string = '';
  
  // Filter states
  selectedLocation: string = '';
  selectedGender: string = '';
  selectedHealthFilters = {
    vaccination: false,
    microchip: false,
    healthcertificate: false,
    dewormed: false,
    birthcertificate: false
  };

  ngOnInit(): void {
    this.loadPets();
    this.loadLocations();
    
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
    this.DataService.getPetsByBreeder(localStorage.getItem('id')).subscribe((pets) => {
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

  applyFilters(): void {
    this.filteredPets = this.pets.filter(pet => {
      // Always exclude puppies from the pets screen
      // Check for truthy values: 1, true, or any truthy value
      if (pet.is_puppy) {
        console.log('Filtering out puppy:', pet.name, 'is_puppy:', pet.is_puppy);
        return false;
      }

      // Location filter
      if (this.selectedLocation && pet.location_name !== this.selectedLocation) {
        return false;
      }

      // Gender filter
      if (this.selectedGender && pet.gender !== this.selectedGender) {
        return false;
      }

      // Health filters - pet must have ALL selected health records
      if (this.selectedHealthFilters.vaccination && !pet.has_vaccination) {
        return false;
      }
      if (this.selectedHealthFilters.microchip && !pet.has_microchip) {
        return false;
      }
      if (this.selectedHealthFilters.healthcertificate && !pet.has_healthcertificate) {
        return false;
      }
      if (this.selectedHealthFilters.dewormed && !pet.has_dewormed) {
        return false;
      }
      if (this.selectedHealthFilters.birthcertificate && !pet.has_birthcertificate) {
        return false;
      }

      return true;
    });
    console.log('Filtered pets count:', this.filteredPets.length);
  }

  onLocationFilterChange(location: string): void {
    this.selectedLocation = location;
    this.applyFilters();
  }

  onGenderFilterChange(gender: string): void {
    this.selectedGender = gender;
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedLocation = '';
    this.selectedGender = '';
    this.selectedHealthFilters = {
      vaccination: false,
      microchip: false,
      healthcertificate: false,
      dewormed: false,
      birthcertificate: false
    };
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.selectedLocation ||
      this.selectedGender ||
      Object.values(this.selectedHealthFilters).some(v => v)
    );
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

}
