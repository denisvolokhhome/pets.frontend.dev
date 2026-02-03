import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { IBreeding } from '../../models/breeding';
import { IPet } from '../../models/pet';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  standalone: false,
  selector: 'app-pet-assignment',
  templateUrl: './pet-assignment.component.html',
  styleUrls: ['./pet-assignment.component.css']
})
export class PetAssignmentComponent implements OnInit {
  @Input() litter!: IBreeding;
  @Output() petsAssigned = new EventEmitter<IPet[]>();

  availablePets: IPet[] = [];
  filteredPets: IPet[] = [];
  selectedPet1: string = '';
  selectedPet2: string = '';
  locationError: string = '';
  isLoading: boolean = false;

  constructor(
    private dataService: DataService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadAvailablePets();
  }

  loadAvailablePets(): void {
    this.isLoading = true;
    
    // Get current user first, then load their pets
    this.authService.IsLoggedIn().subscribe({
      next: (user) => {
        if (user && user.id) {
          this.dataService.getPetsByBreeder(user.id).subscribe({
            next: (pets) => {
              console.log('All pets loaded:', pets);
              console.log('Pet details:', pets.map(p => ({ 
                name: p.name, 
                is_puppy: p.is_puppy,
                is_puppy_type: typeof p.is_puppy,
                litter_id: p.litter_id ?? null,
                location: p.location_name 
              })));
              
              // Filter out puppies - only adult pets can be parents
              // is_puppy is a number: 0 = adult, 1 = puppy
              // Note: litter_id just tracks where a pet was born, not whether it's currently a puppy
              this.availablePets = pets.filter(pet => pet.is_puppy === 0);
              console.log('Available adult pets:', this.availablePets);
              
              if (this.availablePets.length === 0 && pets.length > 0) {
                this.locationError = 'No adult pets available. All your pets are marked as puppies. Only adult pets can be assigned as parents. You can edit a pet and uncheck "Is Puppy" to mark it as an adult.';
                this.toastr.warning('All your pets are marked as puppies. Edit a pet and uncheck "Is Puppy" to mark it as an adult.', 'No Adult Pets');
              } else if (pets.length === 0) {
                this.locationError = 'No pets found. Please add adult pets first.';
                this.toastr.warning('No pets found. Please add adult pets first.', 'Warning');
              }
              
              this.isLoading = false;
            },
            error: (error) => {
              console.error('Error loading pets:', error);
              this.locationError = 'Failed to load available pets';
              this.toastr.error('Failed to load available pets', 'Error');
              this.isLoading = false;
            }
          });
        } else {
          this.locationError = 'User not authenticated';
          this.toastr.error('User not authenticated', 'Error');
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error getting user:', error);
        this.locationError = 'Failed to authenticate user';
        this.toastr.error('Failed to authenticate user', 'Error');
        this.isLoading = false;
      }
    });
  }

  onFirstPetSelected(): void {
    this.locationError = '';
    this.selectedPet2 = '';
    
    if (this.selectedPet1) {
      const firstPet = this.availablePets.find(p => p.id === this.selectedPet1);
      
      if (firstPet) {
        // Filter second pet list to only show pets from the same location
        this.filteredPets = this.availablePets.filter(
          pet => pet.location_name === firstPet.location_name && pet.id !== this.selectedPet1
        );
      }
    } else {
      this.filteredPets = [];
    }
  }

  canAssign(): boolean {
    return this.selectedPet1 !== '' && this.selectedPet2 !== '' && !this.locationError;
  }

  assignPets(): void {
    if (!this.canAssign()) {
      return;
    }

    const pet1 = this.availablePets.find(p => p.id === this.selectedPet1);
    const pet2 = this.availablePets.find(p => p.id === this.selectedPet2);

    // Double-check location match (should already be filtered, but safety check)
    if (pet1 && pet2 && pet1.location_name !== pet2.location_name) {
      this.locationError = 'Both pets must be from the same location';
      this.toastr.error('Both pets must be from the same location', 'Validation Error');
      return;
    }

    this.isLoading = true;
    this.dataService.assignPets(this.litter.id, [this.selectedPet1, this.selectedPet2]).subscribe({
      next: (updatedLitter) => {
        this.isLoading = false;
        this.toastr.success('Pets assigned successfully', 'Success');
        this.petsAssigned.emit(updatedLitter.parent_pets || []);
        this.locationError = '';
      },
      error: (error) => {
        this.isLoading = false;
        // Extract error message from the error response
        let errorMsg = 'Failed to assign pets. Please try again.';
        if (error.message) {
          errorMsg = error.message;
        } else if (error.error?.detail) {
          errorMsg = error.error.detail;
        }
        this.locationError = errorMsg;
        this.toastr.error(errorMsg, 'Error');
        console.error('Error assigning pets:', error);
      }
    });
  }
}
