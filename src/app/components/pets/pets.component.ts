import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
    private cdr: ChangeDetectorRef
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
  selectedAgeType: string = ''; // '' = all, 'adult' = adults only, 'young' = young only
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
  }

  loadPets(): void {
    this.DataService.getPetsByBreeder(localStorage.getItem('id')).subscribe((pets) => {
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
      // Location filter
      if (this.selectedLocation && pet.location_name !== this.selectedLocation) {
        return false;
      }

      // Gender filter
      if (this.selectedGender && pet.gender !== this.selectedGender) {
        return false;
      }

      // Age Type filter
      if (this.selectedAgeType === 'adult' && pet.is_puppy === 1) {
        return false;
      }
      if (this.selectedAgeType === 'young' && pet.is_puppy === 0) {
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
  }

  onLocationFilterChange(location: string): void {
    this.selectedLocation = location;
    this.applyFilters();
  }

  onGenderFilterChange(gender: string): void {
    this.selectedGender = gender;
    this.applyFilters();
  }

  onAgeTypeFilterChange(ageType: string): void {
    this.selectedAgeType = ageType;
    this.applyFilters();
  }

  clearFilters(): void {
    this.selectedLocation = '';
    this.selectedGender = '';
    this.selectedAgeType = '';
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
      this.selectedAgeType ||
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

  deletePet(emittedPetId: any){
    this.petId = emittedPetId;
    console.log('deleting pet id: ' + emittedPetId);
  }

  editPet(emittedPet: any){
    this.pet = emittedPet;
  }

}
