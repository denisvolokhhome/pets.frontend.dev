import { Component, OnInit } from '@angular/core';
import { IPet } from 'src/app/models/pet';
import { ILocation } from 'src/app/models/location';
import { DataService } from 'src/app/services/data.service';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  selector: 'app-pets',
  templateUrl: './pets.component.html',
  styleUrls: ['./pets.component.css']
})
export class PetsComponent implements OnInit {

  constructor(
    public DataService: DataService,
    public ModalService: ModalService
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
  }

  loadPets(): void {
    this.DataService.getPetsByBreeder(localStorage.getItem('id')).subscribe((pets) => {
      this.pets = pets;
      this.applyFilters();
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

  changeLayout(emittedName: string) {
    this.view = emittedName;
    console.log('Layout change clicked.');
  }

  searchPets(emittedSearch: string){
    this.term = emittedSearch;
    console.log('searching... ' + emittedSearch);
  }

  deletePet(emittedPetId: any){
    this.petId = emittedPetId;
    console.log('deleting pet id: ' + emittedPetId);
  }

  editPet(emittedPet: any){
    this.pet = emittedPet;
  }

}
