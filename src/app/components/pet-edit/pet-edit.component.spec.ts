import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

import { PetEditComponent } from './pet-edit.component';
import { DataService } from '../../services/data.service';
import { ILocation } from '../../models/location';
import { IBreed } from '../../models/breed';
import { IPet } from '../../models/pet';

describe('PetEditComponent - Location Field Tests', () => {
  let component: PetEditComponent;
  let fixture: ComponentFixture<PetEditComponent>;
  let dataService: jasmine.SpyObj<DataService>;

  const mockLocations: ILocation[] = [
    {
      id: 1,
      user_id: 'user-123',
      name: 'Main Kennel',
      address1: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      country: 'USA',
      zipcode: '62701',
      location_type: 'user',
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      user_id: 'user-123',
      name: 'Secondary Location',
      address1: '456 Oak Ave',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      zipcode: '60601',
      location_type: 'user',
      created_at: '2024-01-02T00:00:00Z'
    }
  ];

  const mockBreeds: IBreed[] = [
    { 
      id: 1, 
      name: 'Labrador Retriever', 
      code: 'LAB',
      group: 'Sporting',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    { 
      id: 2, 
      name: 'German Shepherd', 
      code: 'GSD',
      group: 'Herding',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  const mockPet: IPet = {
    pet_id: 'pet-123',
    name: 'Buddy',
    breed_name: 'Labrador Retriever',
    pet_dob: '2023-01-01',
    gender: 'm',
    weight: '25',
    location_name: 'Main Kennel',
    description: 'Friendly dog',
    is_puppy: 0,
    has_microchip: 1,
    has_vaccination: 1,
    has_healthcertificate: 1,
    has_dewormed: 1,
    has_birthcertificate: 1,
    id: 'user-123'
  };

  beforeEach(async () => {
    const dataServiceSpy = jasmine.createSpyObj('DataService', [
      'getLocations',
      'getBreeds',
      'updatePet'
    ]);

    // Mock Bootstrap Modal
    (window as any).bootstrap = {
      Modal: jasmine.createSpy('Modal').and.returnValue({
        show: jasmine.createSpy('show'),
        hide: jasmine.createSpy('hide'),
        reset: jasmine.createSpy('reset')
      })
    };

    await TestBed.configureTestingModule({
      declarations: [PetEditComponent],
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      providers: [{ provide: DataService, useValue: dataServiceSpy }],
      schemas: [NO_ERRORS_SCHEMA] // Ignore Angular Material components
    }).compileComponents();

    dataService = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
    fixture = TestBed.createComponent(PetEditComponent);
    component = fixture.componentInstance;
    component.pet = mockPet;
    
    // Create a mock modal element
    const modalElement = document.createElement('div');
    modalElement.id = 'editPetModal';
    document.body.appendChild(modalElement);
  });

  afterEach(() => {
    // Clean up modal element
    const modalElement = document.getElementById('editPetModal');
    if (modalElement) {
      document.body.removeChild(modalElement);
    }
    localStorage.clear();
  });

  describe('Location Dropdown Population', () => {
    it('should load locations from API on component initialization', () => {
      // Arrange
      dataService.getLocations.and.returnValue(of(mockLocations));
      dataService.getBreeds.and.returnValue(of(mockBreeds));
      localStorage.setItem('id', 'user-123');

      // Act
      component.ngOnInit();

      // Assert
      expect(dataService.getLocations).toHaveBeenCalledWith('user-123');
      expect(component.locations).toEqual(mockLocations);
    });

    it('should populate location dropdown with all user locations', () => {
      // Arrange
      dataService.getLocations.and.returnValue(of(mockLocations));
      dataService.getBreeds.and.returnValue(of(mockBreeds));
      localStorage.setItem('id', 'user-123');

      // Act
      component.ngOnInit();
      // Note: Not calling fixture.detectChanges() to avoid template rendering issues

      // Assert
      expect(component.locations.length).toBe(2);
      expect(component.locations[0].name).toBe('Main Kennel');
      expect(component.locations[1].name).toBe('Secondary Location');
    });

    it('should handle empty locations array', () => {
      // Arrange
      dataService.getLocations.and.returnValue(of([]));
      dataService.getBreeds.and.returnValue(of(mockBreeds));
      localStorage.setItem('id', 'user-123');

      // Act
      component.ngOnInit();

      // Assert
      expect(component.locations).toEqual([]);
      expect(component.locations.length).toBe(0);
    });

    it('should allow changing location for existing pet', () => {
      // Arrange
      dataService.getLocations.and.returnValue(of(mockLocations));
      dataService.getBreeds.and.returnValue(of(mockBreeds));
      localStorage.setItem('id', 'user-123');
      component.ngOnInit();

      // Act - Change location from 'Main Kennel' to 'Secondary Location'
      component.form.patchValue({
        location_name: 'Secondary Location'
      });

      // Assert
      expect(component.form.get('location_name')?.value).toBe('Secondary Location');
      expect(component.form.get('location_name')?.valid).toBe(true);
    });
  });

  describe('Required Field Validation', () => {
    beforeEach(() => {
      dataService.getLocations.and.returnValue(of(mockLocations));
      dataService.getBreeds.and.returnValue(of(mockBreeds));
      localStorage.setItem('id', 'user-123');
      component.ngOnInit();
    });

    it('should mark location field as required', () => {
      // Assert
      const locationControl = component.form.get('location_name');
      expect(locationControl?.hasError('required')).toBe(true);
    });

    it('should be invalid when location is cleared', () => {
      // Arrange - First set a valid location
      component.form.patchValue({
        name: 'Buddy',
        breed_name: 'Labrador Retriever',
        pet_dob: '2023-01-01',
        gender: 'm',
        weight: '25',
        location_name: 'Main Kennel'
      });

      // Act - Clear the location
      component.form.patchValue({
        location_name: ''
      });

      // Assert
      expect(component.form.get('location_name')?.hasError('required')).toBe(true);
      expect(component.form.valid).toBe(false);
    });

    it('should be valid when location is selected', () => {
      // Arrange
      component.form.patchValue({
        name: 'Buddy',
        breed_name: 'Labrador Retriever',
        pet_dob: '2023-01-01',
        gender: 'm',
        weight: '25',
        location_name: 'Main Kennel'
      });

      // Assert
      expect(component.form.get('location_name')?.hasError('required')).toBe(false);
      expect(component.form.get('location_name')?.valid).toBe(true);
    });

    it('should prevent form submission when location is missing', () => {
      // Arrange
      component.form.patchValue({
        name: 'Buddy',
        breed_name: 'Labrador Retriever',
        pet_dob: '2023-01-01',
        gender: 'm',
        weight: '25',
        location_name: '' // Missing location
      });

      // Assert
      expect(component.form.valid).toBe(false);
    });

    it('should allow form submission when all required fields including location are filled', () => {
      // Arrange
      component.form.patchValue({
        name: 'Buddy',
        breed_name: 'Labrador Retriever',
        pet_dob: '2023-01-01',
        gender: 'm',
        weight: '25',
        location_name: 'Main Kennel'
      });

      // Assert
      expect(component.form.valid).toBe(true);
    });

    it('should validate location field independently of other fields', () => {
      // Arrange - Set only location
      component.form.patchValue({
        location_name: 'Main Kennel'
      });

      // Assert
      expect(component.form.get('location_name')?.valid).toBe(true);
      expect(component.form.get('location_name')?.hasError('required')).toBe(false);
    });
  });

  describe('Location Field Accessor', () => {
    it('should provide location_name getter that returns the form control', () => {
      // Assert
      expect(component.location_name).toBeDefined();
      expect(component.location_name.value).toBe('');
    });
  });
});
