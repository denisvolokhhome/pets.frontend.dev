import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { IPet } from 'src/app/models/pet';
import { IBreed } from 'src/app/models/breed';
import { DataService } from 'src/app/services/data.service';
import { ModalService } from 'src/app/services/modal.service';
import { AuthService } from 'src/app/services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Router } from '@angular/router';
import { calculatePetAge } from 'src/app/utils/pet-utils';
import { environment } from 'src/environments/environment';

@Component({
  standalone: false,
  selector: 'app-quick-breeding-add',
  templateUrl: './quick-breeding-add.component.html',
  styleUrls: ['./quick-breeding-add.component.css']
})
export class QuickBreedingAddComponent implements OnInit, OnChanges {
  @Input() selectedPet: IPet | null = null;

  // Stepper
  currentStep: number = 1;
  totalSteps: number = 2;

  // Pet selection
  availablePets: IPet[] = [];
  filteredPets: IPet[] = [];
  searchTerm: string = '';
  selectedPartnerPet: IPet | null = null;

  // Breeding data
  description: string = '';

  // Loading states
  isLoadingPets: boolean = false;
  isSaving: boolean = false;

  // Breeds for validation
  breeds: IBreed[] = [];

  // API configuration
  apihost = environment.API_HOST;

  constructor(
    private dataService: DataService,
    private modalService: ModalService,
    private authService: AuthService,
    private toastr: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('QuickBreedingAddComponent initialized');
    console.log('Selected pet on init:', this.selectedPet);
    // Don't load pets on init - wait for modal to open and selectedPet to be set
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('QuickBreedingAddComponent changes:', changes);
    if (changes['selectedPet'] && changes['selectedPet'].currentValue) {
      console.log('Selected pet changed:', changes['selectedPet'].currentValue);
      // Only load if we have a valid selected pet
      if (this.selectedPet && this.selectedPet.id) {
        this.loadAvailablePets();
      }
    }
  }

  calculateAge(dateOfBirth: string): string {
    return calculatePetAge(dateOfBirth);
  }

  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) return '';
    
    // Backend returns 'app/filename.png', just prepend storage URL
    return `${this.apihost}/storage/${imagePath}`;
  }

  getOppositeGender(): string {
    if (!this.selectedPet) return '';
    return this.selectedPet.gender === 'Male' ? 'Female' : 'Male';
  }

  loadAvailablePets(): void {
    // Guard: Don't proceed if no selected pet
    if (!this.selectedPet || !this.selectedPet.id) {
      console.log('No selected pet, skipping load');
      return;
    }

    this.isLoadingPets = true;
    
    // Load breeds first for validation
    this.dataService.getBreeds().subscribe({
      next: (breeds) => {
        this.breeds = breeds;
        
        this.authService.IsLoggedIn().subscribe({
          next: (user) => {
            if (!user || !user.id) {
              console.log('No authenticated user, skipping pet load');
              this.isLoadingPets = false;
              return;
            }

            console.log('Loading pets for user:', user.id);
            this.dataService.getPetsByBreeder(user.id).subscribe({
              next: (pets) => {
                console.log('All pets loaded:', pets);
                console.log('Selected pet:', this.selectedPet);
                
                // Get the selected pet's breed kind
                const selectedPetBreed = this.breeds.find(b => b.id === this.selectedPet?.breed_id);
                const selectedPetKind = selectedPetBreed?.kind;
                
                // Filter: opposite gender, not puppy, not the selected pet, same kind
                const selectedGender = this.selectedPet?.gender;
                console.log('Selected pet gender:', selectedGender);
                console.log('Selected pet kind:', selectedPetKind);
                
                // Determine opposite gender (Male/Female only)
                const oppositeGender = selectedGender === 'Male' ? 'Female' : 'Male';
                
                console.log('Looking for opposite gender:', oppositeGender);
                
                this.availablePets = pets.filter(pet => {
                  const isPuppy = pet.is_puppy === 1 || pet.is_puppy === true;
                  const isSamePet = pet.id === this.selectedPet?.id;
                  const petGender = pet.gender;
                  const isOppositeGender = petGender === oppositeGender;
                  
                  // Check if pet has the same kind as selected pet
                  const petBreed = this.breeds.find(b => b.id === pet.breed_id);
                  const isSameKind = petBreed?.kind === selectedPetKind;
                  
                  console.log(`Pet ${pet.name}: isPuppy=${isPuppy}, isSamePet=${isSamePet}, gender=${petGender}, isOppositeGender=${isOppositeGender}, kind=${petBreed?.kind}, isSameKind=${isSameKind}`);
                  
                  return !isSamePet && !isPuppy && isOppositeGender && isSameKind;
                });
                
                console.log('Available pets after filtering:', this.availablePets);
                
                this.filteredPets = [...this.availablePets];
                
                if (this.availablePets.length === 0) {
                  console.log('No pets found - showing warning');
                  const kindLabel = selectedPetKind ? selectedPetKind.charAt(0).toUpperCase() + selectedPetKind.slice(1) : 'same kind';
                  this.toastr.warning(
                    `No ${this.getOppositeGender().toLowerCase()} adult ${kindLabel}s found for breeding`,
                    'No Available Pets'
                  );
                } else {
                  console.log(`Found ${this.availablePets.length} available pets`);
                }
                
                this.isLoadingPets = false;
                this.cdr.detectChanges();
              },
              error: (error) => {
                console.error('Error loading pets:', error);
                // Don't show error toast if it's just an auth issue
                if (error.status !== 401) {
                  this.toastr.error('Failed to load available pets', 'Error');
                }
                this.isLoadingPets = false;
                this.cdr.detectChanges();
              }
            });
          },
          error: (error) => {
            console.error('Error getting user:', error);
            // Don't show error toast if it's just an auth issue
            if (error.status !== 401) {
              this.toastr.error('Failed to authenticate user', 'Error');
            }
            this.isLoadingPets = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (error) => {
        console.error('Error loading breeds:', error);
        this.toastr.error('Failed to load breed information', 'Error');
        this.isLoadingPets = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterPets(): void {
    console.log('Filtering pets with search term:', this.searchTerm);
    console.log('Available pets:', this.availablePets);
    
    // Handle undefined or null searchTerm
    if (!this.searchTerm) {
      this.filteredPets = [...this.availablePets];
      console.log('No search term, showing all available pets:', this.filteredPets.length);
      return;
    }
    
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredPets = [...this.availablePets];
      console.log('Empty search term after trim, showing all available pets:', this.filteredPets.length);
      return;
    }
    
    this.filteredPets = this.availablePets.filter(pet => {
      const nameMatch = pet.name && pet.name.toLowerCase().includes(term);
      const breedMatch = pet.breed_name && pet.breed_name.toLowerCase().includes(term);
      return nameMatch || breedMatch;
    });
    
    console.log(`Filtered to ${this.filteredPets.length} pets matching "${term}"`);
  }

  selectPartnerPet(pet: IPet): void {
    this.selectedPartnerPet = pet;
  }

  nextStep(): void {
    if (this.currentStep === 1 && !this.selectedPartnerPet) {
      this.toastr.error('Please select a partner pet', 'Validation Error');
      return;
    }
    
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (step === 1 || (step === 2 && this.selectedPartnerPet)) {
      this.currentStep = step;
    }
  }

  createBreeding(): void {
    if (!this.selectedPet || !this.selectedPartnerPet) {
      this.toastr.error('Please select both parent pets', 'Validation Error');
      return;
    }

    // Validate that both pets are of the same kind
    const selectedPetBreed = this.breeds.find(b => b.id === this.selectedPet?.breed_id);
    const partnerPetBreed = this.breeds.find(b => b.id === this.selectedPartnerPet?.breed_id);
    
    if (selectedPetBreed && partnerPetBreed && selectedPetBreed.kind !== partnerPetBreed.kind) {
      const selectedKind = selectedPetBreed.kind.charAt(0).toUpperCase() + selectedPetBreed.kind.slice(1);
      const partnerKind = partnerPetBreed.kind.charAt(0).toUpperCase() + partnerPetBreed.kind.slice(1);
      this.toastr.error(
        `Cannot breed different animal kinds: ${selectedKind} and ${partnerKind}`,
        'Invalid Breeding'
      );
      return;
    }

    this.isSaving = true;
    
    this.dataService.createBreeding(this.description || undefined).subscribe({
      next: (newBreeding: any) => {
        // Assign the selected pets
        this.dataService.assignPetsToBreeding(
          newBreeding.id, 
          [this.selectedPet!.id, this.selectedPartnerPet!.id]
        ).subscribe({
          next: (updatedBreeding: any) => {
            this.isSaving = false;
            
            // Show success message
            this.toastr.success(
              'Redirecting to breeding details...',
              'Breeding Created Successfully',
              { timeOut: 3000 }
            );
            
            this.close();
            
            // Navigate to the breeding detail page
            setTimeout(() => {
              this.router.navigate(['/breeding', newBreeding.id]);
            }, 500);
          },
          error: (error) => {
            this.isSaving = false;
            console.error('Error assigning pets:', error);
            const errorMsg = error.message || 'Failed to assign pets to breeding';
            this.toastr.error(errorMsg, 'Error');
          }
        });
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error creating breeding:', error);
        this.toastr.error('Failed to create breeding. Please try again.', 'Error');
      }
    });
  }

  close(): void {
    this.modalService.close('quickBreedingModal');
    this.resetForm();
  }

  resetForm(): void {
    this.currentStep = 1;
    this.selectedPartnerPet = null;
    this.description = '';
    this.searchTerm = '';
    this.filteredPets = [];
  }
}
