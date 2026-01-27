import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { PetAssignmentComponent } from './pet-assignment.component';
import { DataService } from 'src/app/services/data.service';
import { AuthService } from 'src/app/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { IPet } from 'src/app/models/pet';
import { ILitter } from 'src/app/models/litter';

/**
 * Unit Tests for PetAssignmentComponent
 * Validates: Requirements 3.1, 3.2, 5.1
 */
describe('PetAssignmentComponent', () => {
  let component: PetAssignmentComponent;
  let fixture: ComponentFixture<PetAssignmentComponent>;
  let dataService: jasmine.SpyObj<DataService>;
  let authService: jasmine.SpyObj<AuthService>;
  let toastrService: jasmine.SpyObj<ToastrService>;

  const mockUser = { id: 'user-123', email: 'test@example.com', name: 'Test User' };
  
  const mockPets: IPet[] = [
    {
      id: 'pet-1',
      name: 'Max',
      breed_name: 'Labrador',
      breed_id: 1,
      location_name: 'Kennel A',
      pet_dob: '2020-01-01',
      gender: 'Male',
      weight: '30',
      description: 'Adult dog',
      is_puppy: 0,
      has_microchip: 1,
      has_vaccination: 1,
      has_healthcertificate: 1,
      has_dewormed: 1,
      has_birthcertificate: 1
    },
    {
      id: 'pet-2',
      name: 'Bella',
      breed_name: 'Golden Retriever',
      breed_id: 2,
      location_name: 'Kennel A',
      pet_dob: '2019-06-15',
      gender: 'Female',
      weight: '28',
      description: 'Adult dog',
      is_puppy: 0,
      has_microchip: 1,
      has_vaccination: 1,
      has_healthcertificate: 1,
      has_dewormed: 1,
      has_birthcertificate: 1
    },
    {
      id: 'pet-3',
      name: 'Charlie',
      breed_name: 'Beagle',
      breed_id: 3,
      location_name: 'Kennel B',
      pet_dob: '2021-03-20',
      gender: 'Male',
      weight: '15',
      description: 'Adult dog',
      is_puppy: 0,
      has_microchip: 1,
      has_vaccination: 1,
      has_healthcertificate: 0,
      has_dewormed: 1,
      has_birthcertificate: 1
    },
    {
      id: 'pet-4',
      name: 'Puppy',
      breed_name: 'Labrador',
      breed_id: 1,
      location_name: 'Kennel A',
      pet_dob: '2023-11-01',
      gender: 'Male',
      weight: '5',
      description: 'Puppy',
      is_puppy: 1,
      has_microchip: 0,
      has_vaccination: 0,
      has_healthcertificate: 0,
      has_dewormed: 1,
      has_birthcertificate: 0
    }
  ];

  const mockLitter: ILitter = {
    id: 'litter-1',
    description: 'Test litter',
    status: 'Started' as any,
    created_at: '2023-01-01',
    updated_at: '2023-01-01'
  };

  beforeEach(async () => {
    const dataServiceSpy = jasmine.createSpyObj('DataService', ['getPetsByBreeder', 'assignPets']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['IsLoggedIn']);
    const toastrServiceSpy = jasmine.createSpyObj('ToastrService', ['success', 'error', 'info', 'warning']);

    await TestBed.configureTestingModule({
      declarations: [PetAssignmentComponent],
      imports: [FormsModule, HttpClientTestingModule],
      providers: [
        { provide: DataService, useValue: dataServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastrService, useValue: toastrServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PetAssignmentComponent);
    component = fixture.componentInstance;
    dataService = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    toastrService = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;

    component.litter = mockLitter;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Test: Pet Loading
   * Validates: Requirements 5.1
   */
  describe('loadAvailablePets', () => {
    it('should load available pets on initialization', () => {
      authService.IsLoggedIn.and.returnValue(of(mockUser));
      dataService.getPetsByBreeder.and.returnValue(of(mockPets));

      component.ngOnInit();

      expect(authService.IsLoggedIn).toHaveBeenCalled();
      expect(dataService.getPetsByBreeder).toHaveBeenCalledWith(mockUser.id);
      expect(component.availablePets.length).toBe(3); // Should exclude puppy
      expect(component.isLoading).toBe(false);
    });

    it('should filter out puppies from available pets', () => {
      authService.IsLoggedIn.and.returnValue(of(mockUser));
      dataService.getPetsByBreeder.and.returnValue(of(mockPets));

      component.ngOnInit();

      expect(component.availablePets.length).toBe(3);
      component.availablePets.forEach(pet => {
        expect(pet.is_puppy).toBe(0);
      });
    });

    it('should handle error when loading pets fails', () => {
      authService.IsLoggedIn.and.returnValue(of(mockUser));
      dataService.getPetsByBreeder.and.returnValue(
        throwError(() => ({ message: 'Failed to load pets' }))
      );

      component.ngOnInit();

      expect(component.locationError).toBe('Failed to load available pets');
      expect(component.isLoading).toBe(false);
    });

    it('should handle error when user authentication fails', () => {
      authService.IsLoggedIn.and.returnValue(
        throwError(() => ({ message: 'Not authenticated' }))
      );

      component.ngOnInit();

      expect(component.locationError).toBe('Failed to authenticate user');
      expect(component.isLoading).toBe(false);
    });
  });

  /**
   * Test: Location-Based Filtering
   * Validates: Requirements 3.2
   */
  describe('onFirstPetSelected', () => {
    beforeEach(() => {
      authService.IsLoggedIn.and.returnValue(of(mockUser));
      dataService.getPetsByBreeder.and.returnValue(of(mockPets));
      component.ngOnInit();
    });

    it('should filter second pet list by location of first pet', () => {
      component.selectedPet1 = 'pet-1'; // Max from Kennel A
      component.onFirstPetSelected();

      expect(component.filteredPets.length).toBe(1); // Only Bella from Kennel A
      expect(component.filteredPets[0].id).toBe('pet-2');
      expect(component.filteredPets[0].location_name).toBe('Kennel A');
    });

    it('should exclude the first selected pet from filtered list', () => {
      component.selectedPet1 = 'pet-1';
      component.onFirstPetSelected();

      const firstPetInFiltered = component.filteredPets.find(p => p.id === 'pet-1');
      expect(firstPetInFiltered).toBeUndefined();
    });

    it('should clear second pet selection when first pet changes', () => {
      component.selectedPet1 = 'pet-1';
      component.selectedPet2 = 'pet-2';
      component.onFirstPetSelected();

      expect(component.selectedPet2).toBe('');
    });

    it('should clear filtered pets when first pet selection is cleared', () => {
      component.selectedPet1 = 'pet-1';
      component.onFirstPetSelected();
      expect(component.filteredPets.length).toBeGreaterThan(0);

      component.selectedPet1 = '';
      component.onFirstPetSelected();

      expect(component.filteredPets.length).toBe(0);
    });

    it('should clear location error when first pet is selected', () => {
      component.locationError = 'Previous error';
      component.selectedPet1 = 'pet-1';
      component.onFirstPetSelected();

      expect(component.locationError).toBe('');
    });
  });

  /**
   * Test: Validation Logic
   * Validates: Requirements 3.1, 5.1
   */
  describe('canAssign', () => {
    it('should return false when no pets are selected', () => {
      component.selectedPet1 = '';
      component.selectedPet2 = '';

      expect(component.canAssign()).toBe(false);
    });

    it('should return false when only first pet is selected', () => {
      component.selectedPet1 = 'pet-1';
      component.selectedPet2 = '';

      expect(component.canAssign()).toBe(false);
    });

    it('should return false when only second pet is selected', () => {
      component.selectedPet1 = '';
      component.selectedPet2 = 'pet-2';

      expect(component.canAssign()).toBe(false);
    });

    it('should return false when there is a location error', () => {
      component.selectedPet1 = 'pet-1';
      component.selectedPet2 = 'pet-2';
      component.locationError = 'Location mismatch';

      expect(component.canAssign()).toBe(false);
    });

    it('should return true when both pets are selected and no error', () => {
      component.selectedPet1 = 'pet-1';
      component.selectedPet2 = 'pet-2';
      component.locationError = '';

      expect(component.canAssign()).toBe(true);
    });
  });

  /**
   * Test: Pet Assignment
   * Validates: Requirements 3.1, 5.1
   */
  describe('assignPets', () => {
    beforeEach(() => {
      authService.IsLoggedIn.and.returnValue(of(mockUser));
      dataService.getPetsByBreeder.and.returnValue(of(mockPets));
      component.ngOnInit();
    });

    it('should not assign pets if validation fails', () => {
      component.selectedPet1 = 'pet-1';
      component.selectedPet2 = '';

      component.assignPets();

      expect(dataService.assignPets).not.toHaveBeenCalled();
    });

    it('should call assignPets API with correct pet IDs', () => {
      const updatedLitter: ILitter = {
        ...mockLitter,
        status: 'InProcess' as any,
        parent_pets: [mockPets[0], mockPets[1]]
      };
      dataService.assignPets.and.returnValue(of(updatedLitter));

      component.selectedPet1 = 'pet-1';
      component.selectedPet2 = 'pet-2';
      component.assignPets();

      expect(dataService.assignPets).toHaveBeenCalledWith('litter-1', ['pet-1', 'pet-2']);
    });

    it('should emit petsAssigned event on successful assignment', (done) => {
      const updatedLitter: ILitter = {
        ...mockLitter,
        status: 'InProcess' as any,
        parent_pets: [mockPets[0], mockPets[1]]
      };
      dataService.assignPets.and.returnValue(of(updatedLitter));

      component.petsAssigned.subscribe((pets) => {
        expect(pets).toEqual(updatedLitter.parent_pets || []);
        done();
      });

      component.selectedPet1 = 'pet-1';
      component.selectedPet2 = 'pet-2';
      component.assignPets();
    });

    it('should clear location error on successful assignment', () => {
      const updatedLitter: ILitter = {
        ...mockLitter,
        status: 'InProcess' as any,
        parent_pets: [mockPets[0], mockPets[1]]
      };
      dataService.assignPets.and.returnValue(of(updatedLitter));

      component.locationError = 'Previous error';
      component.selectedPet1 = 'pet-1';
      component.selectedPet2 = 'pet-2';
      component.assignPets();

      expect(component.locationError).toBe('');
    });

    /**
     * Test: Error Display
     * Validates: Requirements 3.1
     */
    it('should display error message when assignment fails', () => {
      const errorResponse = {
        message: 'Both pets must be from the same location',
        error: { detail: 'Location mismatch' }
      };
      dataService.assignPets.and.returnValue(throwError(() => errorResponse));

      component.selectedPet1 = 'pet-1';
      component.selectedPet2 = 'pet-3'; // Different location
      component.assignPets();

      expect(component.locationError).toBe('Both pets must be from the same location');
      expect(component.isLoading).toBe(false);
    });

    it('should display generic error when no specific message is provided', () => {
      dataService.assignPets.and.returnValue(throwError(() => ({})));

      component.selectedPet1 = 'pet-1';
      component.selectedPet2 = 'pet-2';
      component.assignPets();

      expect(component.locationError).toBe('Failed to assign pets. Please try again.');
    });

    it('should prevent assignment when pets are from different locations', () => {
      authService.IsLoggedIn.and.returnValue(of(mockUser));
      dataService.getPetsByBreeder.and.returnValue(of(mockPets));
      component.ngOnInit();

      // Manually set pets from different locations (bypassing UI filtering)
      component.selectedPet1 = 'pet-1'; // Kennel A
      component.selectedPet2 = 'pet-3'; // Kennel B
      component.availablePets = mockPets.filter(p => p.is_puppy === 0);

      component.assignPets();

      expect(component.locationError).toBe('Both pets must be from the same location');
      expect(dataService.assignPets).not.toHaveBeenCalled();
    });
  });
});
