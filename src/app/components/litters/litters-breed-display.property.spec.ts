import { TestBed } from '@angular/core/testing';
import { LittersComponent } from './litters.component';
import { DataService } from 'src/app/services/data.service';
import { ModalService } from 'src/app/services/modal.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ILitter } from 'src/app/models/litter';
import { IPet } from 'src/app/models/pet';

/**
 * Property-Based Tests for Breed Display Formatting
 * Feature: litters-management
 * Property 1 & 2: Breed Display Format
 * Validates: Requirements 1.2, 1.3
 */
describe('LittersComponent - Breed Display Properties', () => {
  let component: LittersComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LittersComponent],
      imports: [HttpClientTestingModule],
      providers: [DataService, ModalService]
    });
    const fixture = TestBed.createComponent(LittersComponent);
    component = fixture.componentInstance;
  });

  // Helper function to create a test pet
  function createTestPet(id: string, breedName: string, breedId: number): IPet {
    return {
      id: id,
      name: `Pet ${id}`,
      breed_name: breedName,
      breed_id: breedId,
      location_name: 'Test Location',
      pet_dob: '2020-01-01',
      gender: 'm',
      weight: '10',
      description: 'Test pet',
      is_puppy: 0,
      has_microchip: 0,
      has_vaccination: 0,
      has_healthcertificate: 0,
      has_dewormed: 0,
      has_birthcertificate: 0
    };
  }

  /**
   * Property 1: Same-Breed Display Format
   * For any litter with two parent pets of the same breed,
   * the breed display should show only the single breed name without duplication
   */
  it('should display single breed name for same-breed litters (Property 1) - 100 iterations', () => {
    const breedNames = [
      'Labrador Retriever', 'German Shepherd', 'Golden Retriever', 'Bulldog',
      'Beagle', 'Poodle', 'Rottweiler', 'Yorkshire Terrier', 'Boxer', 'Dachshund',
      'Siberian Husky', 'Great Dane', 'Doberman', 'Shih Tzu', 'Boston Terrier',
      'Pomeranian', 'Havanese', 'Shetland Sheepdog', 'Brittany', 'Pembroke Welsh Corgi'
    ];

    // Run 100 iterations with random breed names
    for (let i = 0; i < 100; i++) {
      const breedName = breedNames[Math.floor(Math.random() * breedNames.length)];
      const breedId = Math.floor(Math.random() * 1000) + 1;

      // Create two parent pets with the same breed
      const parentPet1 = createTestPet(`pet-${i}-1`, breedName, breedId);
      const parentPet2 = createTestPet(`pet-${i}-2`, breedName, breedId);

      const litter: ILitter = {
        id: `litter-${i}`,
        description: 'Test litter',
        status: 'InProcess' as any,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        parent_pets: [parentPet1, parentPet2]
      };

      // Get breed display
      const breedDisplay = component.getBreedDisplay(litter);

      // Verify: Should display single breed name (not duplicated)
      expect(breedDisplay).toBe(breedName, `Iteration ${i}: Expected single breed name "${breedName}"`);
      expect(breedDisplay).not.toContain('+', `Iteration ${i}: Should not contain plus sign for same breed`);
    }
  });

  /**
   * Property 2: Mixed-Breed Display Format
   * For any litter with two parent pets of different breeds,
   * the breed display should show both breed names separated by a plus sign
   */
  it('should display both breed names with plus sign for mixed-breed litters (Property 2) - 100 iterations', () => {
    const breedNames = [
      'Labrador Retriever', 'German Shepherd', 'Golden Retriever', 'Bulldog',
      'Beagle', 'Poodle', 'Rottweiler', 'Yorkshire Terrier', 'Boxer', 'Dachshund',
      'Siberian Husky', 'Great Dane', 'Doberman', 'Shih Tzu', 'Boston Terrier',
      'Pomeranian', 'Havanese', 'Shetland Sheepdog', 'Brittany', 'Pembroke Welsh Corgi'
    ];

    // Run 100 iterations with random different breed pairs
    for (let i = 0; i < 100; i++) {
      // Select two different breeds
      const index1 = Math.floor(Math.random() * breedNames.length);
      let index2 = Math.floor(Math.random() * breedNames.length);
      while (index2 === index1) {
        index2 = Math.floor(Math.random() * breedNames.length);
      }

      const breedName1 = breedNames[index1];
      const breedName2 = breedNames[index2];
      const breedId1 = Math.floor(Math.random() * 1000) + 1;
      const breedId2 = Math.floor(Math.random() * 1000) + 1001;

      // Create two parent pets with different breeds
      const parentPet1 = createTestPet(`pet-${i}-1`, breedName1, breedId1);
      const parentPet2 = createTestPet(`pet-${i}-2`, breedName2, breedId2);

      const litter: ILitter = {
        id: `litter-${i}`,
        description: 'Test litter',
        status: 'InProcess' as any,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        parent_pets: [parentPet1, parentPet2]
      };

      // Get breed display
      const breedDisplay = component.getBreedDisplay(litter);

      // Verify: Should contain both breed names separated by ' + '
      expect(breedDisplay).toContain('+', `Iteration ${i}: Should contain plus sign for mixed breeds`);
      expect(breedDisplay).toContain(breedName1, `Iteration ${i}: Should contain first breed "${breedName1}"`);
      expect(breedDisplay).toContain(breedName2, `Iteration ${i}: Should contain second breed "${breedName2}"`);
      
      // Verify format is exactly "breed1 + breed2" or "breed2 + breed1"
      const expectedFormat1 = `${breedName1} + ${breedName2}`;
      const expectedFormat2 = `${breedName2} + ${breedName1}`;
      const isValidFormat = breedDisplay === expectedFormat1 || breedDisplay === expectedFormat2;
      expect(isValidFormat).toBe(true, 
        `Iteration ${i}: Expected "${expectedFormat1}" or "${expectedFormat2}", got "${breedDisplay}"`);
    }
  });

  /**
   * Edge Case: Empty parent pets array
   * Should display '-' when no parent pets are assigned
   */
  it('should display "-" when litter has no parent pets', () => {
    const litter: ILitter = {
      id: 'litter-1',
      description: 'Test litter',
      status: 'Started' as any,
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
      parent_pets: []
    };

    const breedDisplay = component.getBreedDisplay(litter);
    expect(breedDisplay).toBe('-');
  });

  /**
   * Edge Case: Undefined parent pets
   * Should display '-' when parent_pets is undefined
   */
  it('should display "-" when parent_pets is undefined', () => {
    const litter: ILitter = {
      id: 'litter-1',
      description: 'Test litter',
      status: 'Started' as any,
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    };

    const breedDisplay = component.getBreedDisplay(litter);
    expect(breedDisplay).toBe('-');
  });
});
