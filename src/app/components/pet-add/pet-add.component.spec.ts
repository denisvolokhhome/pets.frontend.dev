import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

import { PetAddComponent } from './pet-add.component';
import { DataService } from '../../services/data.service';
import { ILocation } from '../../models/location';
import { IBreed } from '../../models/breed';
import { ToastrService } from 'ngx-toastr';

describe('PetAddComponent - Location Field Tests', () => {
  let component: PetAddComponent;
  let fixture: ComponentFixture<PetAddComponent>;
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

  beforeEach(async () => {
    const dataServiceSpy = jasmine.createSpyObj('DataService', [
      'getLocations',
      'getBreeds',
      'createPet'
    ]);
    const toastrServiceSpy = jasmine.createSpyObj('ToastrService', ['success', 'error', 'info', 'warning']);

    // Mock Bootstrap Modal
    (window as any).bootstrap = {
      Modal: jasmine.createSpy('Modal').and.returnValue({
        show: jasmine.createSpy('show'),
        hide: jasmine.createSpy('hide')
      })
    };

    await TestBed.configureTestingModule({
      declarations: [PetAddComponent],
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        { provide: DataService, useValue: dataServiceSpy },
        { provide: ToastrService, useValue: toastrServiceSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    dataService = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
    fixture = TestBed.createComponent(PetAddComponent);
    component = fixture.componentInstance;
    
    // Create a mock modal element
    const modalElement = document.createElement('div');
    modalElement.id = 'addPetModal';
    document.body.appendChild(modalElement);
  });

  afterEach(() => {
    // Clean up modal element
    const modalElement = document.getElementById('addPetModal');
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
      fixture.detectChanges();

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

    it('should be invalid when location is not selected', () => {
      // Arrange
      component.form.patchValue({
        name: 'Buddy',
        breed_name: 'Labrador Retriever',
        pet_dob: '2023-01-01',
        gender: 'm',
        weight: '25',
        location_name: '' // Empty location
      });

      // Assert
      expect(component.form.valid).toBe(false);
      expect(component.form.get('location_name')?.hasError('required')).toBe(true);
    });

    it('should be valid when location is selected', () => {
      // Arrange
      component.form.patchValue({
        name: 'Buddy',
        breed_name: 'Labrador Retriever',
        pet_dob: '2023-01-01',
        gender: 'm',
        weight: '25',
        location_name: 'Main Kennel' // Valid location
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
      // The submit button should be disabled when form is invalid
    });

    it('should allow form submission when all required fields including location are filled', () => {
      // Arrange
      component.form.patchValue({
        name: 'Buddy',
        breed_name: 'Labrador Retriever',
        pet_dob: '2023-01-01',
        gender: 'm',
        weight: '25',
        location_name: 'Main Kennel' // Valid location
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
