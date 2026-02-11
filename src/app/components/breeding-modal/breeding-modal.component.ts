import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { IBreeding } from 'src/app/models/breeding';
import { IPet } from 'src/app/models/pet';
import { DataService } from 'src/app/services/data.service';
import { ModalService } from 'src/app/services/modal.service';
import { AuthService } from 'src/app/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-breeding-modal',
  templateUrl: './breeding-modal.component.html',
  styleUrls: ['./breeding-modal.component.css']
})
export class BreedingModalComponent implements OnInit, OnChanges {
  @Input() mode: 'create' | 'update' | 'view' = 'create';
  @Input() breeding: IBreeding | null = null;
  @Output() breedingSaved = new EventEmitter<IBreeding>();

  isOpen = false;
  formData = {
    description: ''
  };

  // Pet selection for create mode
  availablePets: IPet[] = [];
  filteredPets: IPet[] = [];
  selectedPet1: string = '';
  selectedPet2: string = '';
  locationError: string = '';
  isLoadingPets: boolean = false;
  isSaving: boolean = false;

  constructor(
    private dataService: DataService,
    private modalService: ModalService,
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('BreedingModalComponent ngOnInit');
    this.modalService.isVisible$.subscribe(isVisible => {
      console.log('Modal visibility changed:', isVisible);
      this.isOpen = isVisible;
      
      // Load pets when modal opens in create mode
      if (isVisible && this.mode === 'create') {
        this.loadAvailablePets();
      }
      
      this.cdr.detectChanges();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['breeding'] && this.breeding) {
      this.populateForm();
    }
  }

  populateForm(): void {
    if (this.breeding) {
      this.formData.description = this.breeding.description || '';
    }
  }

  getTitle(): string {
    switch (this.mode) {
      case 'create':
        return 'Create New Breeding';
      case 'update':
        return 'Update Breeding';
      case 'view':
        return 'View Breeding Details';
      default:
        return 'Breeding';
    }
  }

  hasParentPets(): boolean {
    return !!(this.breeding?.parent_pets && this.breeding.parent_pets.length > 0);
  }

  onPetsAssigned(pets: IPet[]): void {
    // Reload breeding data after pets are assigned
    if (this.breeding?.id) {
      this.dataService.getLitter(this.breeding.id).subscribe({
        next: (updatedBreeding: any) => {
          this.breeding = updatedBreeding as IBreeding;
          this.breedingSaved.emit(updatedBreeding);
        },
        error: (error) => {
          console.error('Error reloading breeding:', error);
        }
      });
    }
  }

  onPuppiesAdded(puppies: IPet[]): void {
    // Reload breeding data after puppies are added
    if (this.breeding?.id) {
      this.dataService.getLitter(this.breeding.id).subscribe({
        next: (updatedBreeding: any) => {
          this.breeding = updatedBreeding as IBreeding;
          this.breedingSaved.emit(updatedBreeding);
        },
        error: (error) => {
          console.error('Error reloading breeding:', error);
        }
      });
    }
  }

  save(): void {
    if (this.mode === 'create') {
      // Validate pet selection
      if (!this.selectedPet1 || !this.selectedPet2) {
        this.toastr.error('Please select both parent pets', 'Validation Error');
        return;
      }

      // Validate same location
      const pet1 = this.availablePets.find(p => p.id === this.selectedPet1);
      const pet2 = this.availablePets.find(p => p.id === this.selectedPet2);
      
      if (pet1 && pet2 && pet1.location_name !== pet2.location_name) {
        this.locationError = 'Both pets must be from the same location';
        this.toastr.error('Both pets must be from the same location', 'Validation Error');
        return;
      }

      this.isSaving = true;
      
      // Create new breeding
      this.dataService.createBreeding(this.formData.description || undefined).subscribe({
        next: (newBreeding: any) => {
          // Automatically assign the selected pets
          this.dataService.assignPetsToBreeding(newBreeding.id, [this.selectedPet1, this.selectedPet2]).subscribe({
            next: (updatedBreeding: any) => {
              this.isSaving = false;
              this.toastr.success('Breeding created and pets assigned successfully', 'Success');
              this.breedingSaved.emit(updatedBreeding);
              this.close();
              
              // Navigate to the breeding detail page
              setTimeout(() => {
                this.router.navigate(['/breeding', newBreeding.id]);
              }, 100);
            },
            error: (error) => {
              this.isSaving = false;
              console.error('Error assigning pets:', error);
              const errorMsg = error.message || 'Failed to assign pets to breeding';
              this.toastr.error(errorMsg, 'Error');
              // Still emit the breeding even if assignment failed
              this.breedingSaved.emit(newBreeding);
            }
          });
        },
        error: (error) => {
          this.isSaving = false;
          console.error('Error creating breeding:', error);
          this.toastr.error('Failed to create breeding. Please try again.', 'Error');
        }
      });
    } else if (this.mode === 'update' && this.breeding?.id) {
      this.isSaving = true;
      
      // Update existing breeding
      this.dataService.updateBreeding(this.breeding.id, { description: this.formData.description }).subscribe({
        next: (updatedBreeding: any) => {
          this.isSaving = false;
          this.toastr.success('Breeding updated successfully', 'Success');
          this.breedingSaved.emit(updatedBreeding);
          this.close();
        },
        error: (error) => {
          this.isSaving = false;
          console.error('Error updating breeding:', error);
          this.toastr.error('Failed to update breeding. Please try again.', 'Error');
        }
      });
    }
  }

  close(): void {
    this.modalService.close();
    this.formData.description = '';
    this.selectedPet1 = '';
    this.selectedPet2 = '';
    this.locationError = '';
    this.filteredPets = [];
  }

  loadAvailablePets(): void {
    this.isLoadingPets = true;
    
    // Get current user first, then load their pets
    this.authService.IsLoggedIn().subscribe({
      next: (user) => {
        if (user && user.id) {
          this.dataService.getPetsByBreeder(user.id).subscribe({
            next: (pets) => {
              // Filter out puppies - only adult pets can be parents
              this.availablePets = pets.filter(pet => !pet.is_puppy);
              
              if (this.availablePets.length === 0 && pets.length > 0) {
                this.locationError = 'No adult pets available. All your pets are marked as puppies. Only adult pets can be assigned as parents.';
                this.toastr.warning('All your pets are marked as puppies. Edit a pet and uncheck "Is Puppy" to mark it as an adult.', 'No Adult Pets');
              } else if (pets.length === 0) {
                this.locationError = 'No pets found. Please add adult pets first.';
                this.toastr.warning('No pets found. Please add adult pets first.', 'Warning');
              } else if (this.availablePets.length < 2) {
                this.locationError = 'You need at least 2 adult pets to create a breeding.';
                this.toastr.warning('You need at least 2 adult pets to create a breeding.', 'Insufficient Pets');
              }
              
              this.isLoadingPets = false;
              this.cdr.detectChanges();
            },
            error: (error) => {
              console.error('Error loading pets:', error);
              this.locationError = 'Failed to load available pets';
              this.toastr.error('Failed to load available pets', 'Error');
              this.isLoadingPets = false;
              this.cdr.detectChanges();
            }
          });
        } else {
          this.locationError = 'User not authenticated';
          this.toastr.error('User not authenticated', 'Error');
          this.isLoadingPets = false;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error getting user:', error);
        this.locationError = 'Failed to authenticate user';
        this.toastr.error('Failed to authenticate user', 'Error');
        this.isLoadingPets = false;
        this.cdr.detectChanges();
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
        
        if (this.filteredPets.length === 0) {
          this.locationError = `No other adult pets found at location "${firstPet.location_name}". Both parent pets must be at the same location.`;
          this.toastr.warning(`No other adult pets at "${firstPet.location_name}"`, 'Location Mismatch');
        }
      }
    } else {
      this.filteredPets = [];
    }
    
    this.cdr.detectChanges();
  }

  canSave(): boolean {
    if (this.mode === 'create') {
      return this.selectedPet1 !== '' && this.selectedPet2 !== '' && !this.locationError && !this.isSaving;
    }
    return !this.isSaving;
  }
}
