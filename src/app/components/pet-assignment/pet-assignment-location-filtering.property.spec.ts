import { TestBed, ComponentFixture } from '@angular/core/testing';
import { PetAssignmentComponent } from './pet-assignment.component';
import { DataService } from 'src/app/services/data.service';
import { AuthService } from 'src/app/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { IPet } from 'src/app/models/pet';
import { ILitter } from 'src/app/models/litter';
import { of } from 'rxjs';

/**
 * Property-Based Tests for Location-Based Pet Filtering
 * Feature: litters-management
 * Property 5: Location-Based Pet Filtering
 * Validates: Requirements 3.2
 */
describe('PetAssignmentComponent - Location Filtering Properties', () => {
  let component: PetAssignmentComponent;
  let fixture: ComponentFixture<PetAssignmentComponent>;
  let dataService: DataService;
  let authService: AuthService;
  let toastrService: jasmine.SpyObj<ToastrService>;

  beforeEach(() => {
    const toastrServiceSpy = jasmine.createSpyObj('ToastrService', ['success', 'error', 'info', 'warning']);

    TestBed.configureTestingModule({
      declarations: [PetAssignmentComponent],
      imports: [HttpClientTestingModule, FormsModule],
      providers: [
        DataService, 
        AuthService,
        { provide: ToastrService, useValue: toastrServiceSpy }
      ]
    });
    fixture = TestBed.createComponent(PetAssignmentComponent);
    component = fixture.componentInstance;
    dataService = TestBed.inject(DataService);
    authService = TestBed.inject(AuthService);
    toastrService = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;

    // Mock litter input
    component.litter = {
      id: 'test-litter-1',
      description: 'Test litter',
      status: 'Started' as any,
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    };
  });

  // Helper function to create a test pet
  function createTestPet(
    id: string, 
    name: string, 
    breedName: string, 
    locationName: string,
    isPuppy: number = 0
  ): IPet {
    return {
      id: id,
      name: name,
      breed_name: breedName,
      breed_id: Math.floor(Math.random() * 1000) + 1,
      location_name: locationName,
      pet_dob: '2020-01-01',
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
      weight: (Math.random() * 50 + 10).toFixed(1),
      description: `Test pet ${name}`,
      is_puppy: isPuppy,
      has_microchip: Math.random() > 0.5 ? 1 : 0,
      has_vaccination: Math.random() > 0.5 ? 1 : 0,
      has_healthcertificate: Math.random() > 0.5 ? 1 : 0,
      has_dewormed: Math.random() > 0.5 ? 1 : 0,
      has_birthcertificate: Math.random() > 0.5 ? 1 : 0
    };
  }

  /**
   * Property 5: Location-Based Pet Filtering
   * For any litter with one assigned parent pet, the available pets for the second assignment
   * should include only pets from the same location as the first pet
   */
  it('should filter second pet list to only show pets from same location as first pet (Property 5) - 100 iterations', () => {
    const locations = [
      'New York Kennel', 'Los Angeles Facility', 'Chicago Breeding Center', 
      'Houston Ranch', 'Phoenix Farm', 'Philadelphia Estate', 'San Antonio Lodge',
      'San Diego Kennels', 'Dallas Breeding Grounds', 'San Jose Facility'
    ];

    const breeds = [
      'Labrador Retriever', 'German Shepherd', 'Golden Retriever', 'Bulldog',
      'Beagle', 'Poodle', 'Rottweiler', 'Yorkshire Terrier', 'Boxer', 'Dachshund'
    ];

    // Run 100 iterations with random pet configurations
    for (let i = 0; i < 100; i++) {
      // Generate random number of pets (5-20 pets)
      const numPets = Math.floor(Math.random() * 16) + 5;
      const allPets: IPet[] = [];

      // Create pets with random locations
      for (let j = 0; j < numPets; j++) {
        const location = locations[Math.floor(Math.random() * locations.length)];
        const breed = breeds[Math.floor(Math.random() * breeds.length)];
        const pet = createTestPet(`pet-${i}-${j}`, `Pet ${j}`, breed, location, 0);
        allPets.push(pet);
      }

      // Mock the auth and data services to return our test data
      spyOn(authService, 'IsLoggedIn').and.returnValue(of({ id: 'test-user-id', email: 'test@example.com' }));
      spyOn(dataService, 'getPetsByBreeder').and.returnValue(of(allPets));

      // Initialize component
      component.ngOnInit();

      // Select a random first pet
      const firstPetIndex = Math.floor(Math.random() * allPets.length);
      const firstPet = allPets[firstPetIndex];
      component.selectedPet1 = firstPet.id;

      // Trigger the filtering logic
      component.onFirstPetSelected();

      // Verify: All filtered pets should be from the same location as the first pet
      expect(component.filteredPets.length).toBeGreaterThanOrEqual(0, 
        `Iteration ${i}: Filtered pets array should exist`);

      // Count how many pets are actually from the same location (excluding the first pet)
      const expectedFilteredPets = allPets.filter(
        pet => pet.location_name === firstPet.location_name && pet.id !== firstPet.id
      );

      expect(component.filteredPets.length).toBe(expectedFilteredPets.length,
        `Iteration ${i}: Expected ${expectedFilteredPets.length} pets from location "${firstPet.location_name}", got ${component.filteredPets.length}`);

      // Verify each filtered pet is from the correct location
      component.filteredPets.forEach((pet, index) => {
        expect(pet.location_name).toBe(firstPet.location_name,
          `Iteration ${i}, Pet ${index}: Expected location "${firstPet.location_name}", got "${pet.location_name}"`);
        
        // Verify the first pet is not in the filtered list
        expect(pet.id).not.toBe(firstPet.id,
          `Iteration ${i}, Pet ${index}: First pet should not appear in filtered list`);
      });

      // Verify no pets from other locations are included
      const otherLocationPets = component.filteredPets.filter(
        pet => pet.location_name !== firstPet.location_name
      );
      expect(otherLocationPets.length).toBe(0,
        `Iteration ${i}: No pets from other locations should be included. Found ${otherLocationPets.length}`);
    }
  });

  /**
   * Edge Case: Single location with multiple pets
   * When all pets are from the same location, filtering should still work correctly
   */
  it('should handle case where all pets are from the same location', () => {
    const singleLocation = 'Test Kennel';
    const pets: IPet[] = [];

    // Create 10 pets all from the same location
    for (let i = 0; i < 10; i++) {
      pets.push(createTestPet(`pet-${i}`, `Pet ${i}`, 'Labrador', singleLocation, 0));
    }

    spyOn(authService, 'IsLoggedIn').and.returnValue(of({ id: 'test-user-id', email: 'test@example.com' }));
    spyOn(dataService, 'getPetsByBreeder').and.returnValue(of(pets));

    component.ngOnInit();
    component.selectedPet1 = pets[0].id;
    component.onFirstPetSelected();

    // Should have 9 pets in filtered list (all except the first one)
    expect(component.filteredPets.length).toBe(9);
    component.filteredPets.forEach(pet => {
      expect(pet.location_name).toBe(singleLocation);
      expect(pet.id).not.toBe(pets[0].id);
    });
  });

  /**
   * Edge Case: Each pet in a different location
   * When each pet is from a different location, filtered list should be empty
   */
  it('should return empty filtered list when first pet is the only one at its location', () => {
    const locations = ['Location A', 'Location B', 'Location C', 'Location D', 'Location E'];
    const pets: IPet[] = [];

    // Create 5 pets, each from a different location
    for (let i = 0; i < 5; i++) {
      pets.push(createTestPet(`pet-${i}`, `Pet ${i}`, 'Beagle', locations[i], 0));
    }

    spyOn(authService, 'IsLoggedIn').and.returnValue(of({ id: 'test-user-id', email: 'test@example.com' }));
    spyOn(dataService, 'getPetsByBreeder').and.returnValue(of(pets));

    component.ngOnInit();
    component.selectedPet1 = pets[0].id;
    component.onFirstPetSelected();

    // Should have 0 pets in filtered list (no other pets at Location A)
    expect(component.filteredPets.length).toBe(0);
  });

  /**
   * Edge Case: Puppies should be excluded from available pets
   * Only adult pets (is_puppy = 0) should be available for assignment
   */
  it('should exclude puppies from available pets list', () => {
    const pets: IPet[] = [
      createTestPet('pet-1', 'Adult Dog 1', 'Labrador', 'Kennel A', 0),
      createTestPet('pet-2', 'Puppy 1', 'Labrador', 'Kennel A', 1),
      createTestPet('pet-3', 'Adult Dog 2', 'Labrador', 'Kennel A', 0),
      createTestPet('pet-4', 'Puppy 2', 'Labrador', 'Kennel A', 1),
    ];

    spyOn(authService, 'IsLoggedIn').and.returnValue(of({ id: 'test-user-id', email: 'test@example.com' }));
    spyOn(dataService, 'getPetsByBreeder').and.returnValue(of(pets));

    component.ngOnInit();

    // Should only have 2 adult pets in available list
    expect(component.availablePets.length).toBe(2);
    component.availablePets.forEach(pet => {
      expect(pet.is_puppy).toBe(0);
    });
  });

  /**
   * Edge Case: Clearing first pet selection should clear filtered list
   */
  it('should clear filtered pets when first pet selection is cleared', () => {
    const pets: IPet[] = [
      createTestPet('pet-1', 'Dog 1', 'Labrador', 'Kennel A', 0),
      createTestPet('pet-2', 'Dog 2', 'Labrador', 'Kennel A', 0),
      createTestPet('pet-3', 'Dog 3', 'Beagle', 'Kennel B', 0),
    ];

    spyOn(authService, 'IsLoggedIn').and.returnValue(of({ id: 'test-user-id', email: 'test@example.com' }));
    spyOn(dataService, 'getPetsByBreeder').and.returnValue(of(pets));

    component.ngOnInit();
    
    // Select first pet
    component.selectedPet1 = pets[0].id;
    component.onFirstPetSelected();
    expect(component.filteredPets.length).toBeGreaterThan(0);

    // Clear first pet selection
    component.selectedPet1 = '';
    component.onFirstPetSelected();
    
    // Filtered list should be empty
    expect(component.filteredPets.length).toBe(0);
    expect(component.selectedPet2).toBe('');
  });
});
