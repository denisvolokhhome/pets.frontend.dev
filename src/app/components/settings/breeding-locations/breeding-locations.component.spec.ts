import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { BreedingLocationsComponent } from './breeding-locations.component';
import { DataService } from '../../../services/data.service';
import { ILocation } from '../../../models/location';

describe('BreedingLocationsComponent', () => {
  let component: BreedingLocationsComponent;
  let fixture: ComponentFixture<BreedingLocationsComponent>;
  let dataService: jasmine.SpyObj<DataService>;
  let toastrService: jasmine.SpyObj<ToastrService>;

  const mockLocations: ILocation[] = [
    {
      id: 1,
      name: 'Main Kennel',
      address1: '123 Main St',
      address2: '',
      city: 'Springfield',
      state: 'IL',
      country: 'USA',
      zipcode: '62701',
      location_type: 'user',
      user_id: 'user-123',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: 'Secondary Location',
      address1: '456 Oak Ave',
      address2: 'Suite 100',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      zipcode: '60601',
      location_type: 'user',
      user_id: 'user-123',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    }
  ];

  beforeEach(async () => {
    const dataServiceSpy = jasmine.createSpyObj('DataService', [
      'getLocations',
      'createLocation',
      'updateLocation',
      'deleteLocation'
    ]);
    const toastrServiceSpy = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
      'warning'
    ]);

    await TestBed.configureTestingModule({
      declarations: [ BreedingLocationsComponent ],
      imports: [ ReactiveFormsModule, HttpClientTestingModule ],
      providers: [
        { provide: DataService, useValue: dataServiceSpy },
        { provide: ToastrService, useValue: toastrServiceSpy }
      ]
    })
    .compileComponents();

    dataService = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
    toastrService = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;
    
    // Set up default spy behavior
    dataService.getLocations.and.returnValue(of(mockLocations));
    
    // Mock localStorage
    spyOn(localStorage, 'getItem').and.returnValue('user-123');

    fixture = TestBed.createComponent(BreedingLocationsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Location List Loading', () => {
    it('should load locations on init', () => {
      fixture.detectChanges();
      
      expect(dataService.getLocations).toHaveBeenCalledWith('user-123');
      expect(component.locations).toEqual(mockLocations);
      expect(component.isLoading).toBeFalse();
    });

    it('should handle error when loading locations', () => {
      dataService.getLocations.and.returnValue(throwError(() => new Error('Network error')));
      
      fixture.detectChanges();
      
      expect(component.saveError).toBe('Failed to load locations');
      expect(component.isLoading).toBeFalse();
    });

    it('should display empty state when no locations', () => {
      dataService.getLocations.and.returnValue(of([]));
      
      fixture.detectChanges();
      
      expect(component.locations.length).toBe(0);
    });
  });

  describe('Add Location Form', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show add form when showAddForm is called', () => {
      component.showAddForm();
      
      expect(component.showForm).toBeTrue();
      expect(component.editingLocation).toBeNull();
      expect(component.locationForm.value.location_type).toBe('user');
    });

    it('should create new location with valid data', async () => {
      const newLocation: ILocation = {
        id: 3,
        name: 'New Kennel',
        address1: '789 Pine St',
        address2: '',
        city: 'Peoria',
        state: 'IL',
        country: 'USA',
        zipcode: '61602',
        location_type: 'user',
        user_id: 'user-123',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z'
      };

      dataService.createLocation.and.returnValue(of(newLocation));
      dataService.getLocations.and.returnValue(of([...mockLocations, newLocation]));

      component.showAddForm();
      component.locationForm.patchValue({
        name: 'New Kennel',
        address1: '789 Pine St',
        address2: '',
        city: 'Peoria',
        state: 'IL',
        country: 'USA',
        zipcode: '61602',
        location_type: 'user'
      });

      await component.saveLocation();

      expect(dataService.createLocation).toHaveBeenCalled();
      expect(component.saveSuccess).toBeTrue();
      expect(component.showForm).toBeFalse();
    });

    it('should not submit form with missing required fields', async () => {
      component.showAddForm();
      component.locationForm.patchValue({
        name: '',
        address1: '',
        city: '',
        state: '',
        country: '',
        zipcode: ''
      });

      await component.saveLocation();

      expect(dataService.createLocation).not.toHaveBeenCalled();
      expect(component.locationForm.invalid).toBeTrue();
    });

    it('should handle error when creating location', async () => {
      dataService.createLocation.and.returnValue(
        throwError(() => ({ error: { detail: 'Creation failed' } }))
      );

      component.showAddForm();
      component.locationForm.patchValue({
        name: 'New Kennel',
        address1: '789 Pine St',
        city: 'Peoria',
        state: 'IL',
        country: 'USA',
        zipcode: '61602'
      });

      await component.saveLocation();

      expect(component.saveError).toBe('Creation failed');
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('Edit Location Form', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should populate form when editing location', () => {
      const locationToEdit = mockLocations[0];
      
      component.editLocation(locationToEdit);
      
      expect(component.showForm).toBeTrue();
      expect(component.editingLocation).toEqual(locationToEdit);
      expect(component.locationForm.value.name).toBe(locationToEdit.name);
      expect(component.locationForm.value.address1).toBe(locationToEdit.address1);
    });

    it('should update existing location', async () => {
      const updatedLocation = { ...mockLocations[0], name: 'Updated Kennel' };
      dataService.updateLocation.and.returnValue(of(updatedLocation));
      dataService.getLocations.and.returnValue(of([updatedLocation, mockLocations[1]]));

      component.editLocation(mockLocations[0]);
      component.locationForm.patchValue({ name: 'Updated Kennel' });

      await component.saveLocation();

      expect(dataService.updateLocation).toHaveBeenCalledWith(
        mockLocations[0].id!,
        jasmine.objectContaining({ name: 'Updated Kennel' })
      );
      expect(component.saveSuccess).toBeTrue();
      expect(component.showForm).toBeFalse();
    });

    it('should handle error when updating location', async () => {
      dataService.updateLocation.and.returnValue(
        throwError(() => ({ error: { detail: 'Update failed' } }))
      );

      component.editLocation(mockLocations[0]);
      component.locationForm.patchValue({ name: 'Updated Kennel' });

      await component.saveLocation();

      expect(component.saveError).toBe('Update failed');
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('Delete Location', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show delete confirmation modal', () => {
      component.confirmDelete(mockLocations[0]);
      
      expect(component.showDeleteConfirm).toBeTrue();
      expect(component.locationToDelete).toEqual(mockLocations[0]);
    });

    it('should cancel delete confirmation', () => {
      component.confirmDelete(mockLocations[0]);
      component.cancelDelete();
      
      expect(component.showDeleteConfirm).toBeFalse();
      expect(component.locationToDelete).toBeNull();
    });

    it('should delete location successfully', async () => {
      dataService.deleteLocation.and.returnValue(of(void 0));
      dataService.getLocations.and.returnValue(of([mockLocations[1]]));

      component.confirmDelete(mockLocations[0]);
      await component.deleteLocation();

      expect(dataService.deleteLocation).toHaveBeenCalledWith(mockLocations[0].id!);
      expect(component.showDeleteConfirm).toBeFalse();
      expect(component.locationToDelete).toBeNull();
    });

    it('should handle error when location has associated pets', async () => {
      dataService.deleteLocation.and.returnValue(
        throwError(() => ({ status: 409, error: { detail: 'Has pets' } }))
      );

      component.confirmDelete(mockLocations[0]);
      await component.deleteLocation();

      expect(component.saveError).toBe('Cannot delete location with associated pets');
      expect(component.showDeleteConfirm).toBeFalse();
    });

    it('should handle general delete error', async () => {
      dataService.deleteLocation.and.returnValue(
        throwError(() => ({ status: 500, error: { detail: 'Server error' } }))
      );

      component.confirmDelete(mockLocations[0]);
      await component.deleteLocation();

      expect(component.saveError).toBe('Server error');
      expect(component.showDeleteConfirm).toBeFalse();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.showAddForm();
    });

    it('should validate required fields', () => {
      expect(component.locationForm.get('name')?.hasError('required')).toBeTrue();
      expect(component.locationForm.get('address1')?.hasError('required')).toBeTrue();
      expect(component.locationForm.get('city')?.hasError('required')).toBeTrue();
      expect(component.locationForm.get('state')?.hasError('required')).toBeTrue();
      expect(component.locationForm.get('country')?.hasError('required')).toBeTrue();
      expect(component.locationForm.get('zipcode')?.hasError('required')).toBeTrue();
    });

    it('should mark fields as touched when submitting invalid form', async () => {
      await component.saveLocation();
      
      expect(component.locationForm.get('name')?.touched).toBeTrue();
      expect(component.locationForm.get('address1')?.touched).toBeTrue();
      expect(component.locationForm.get('city')?.touched).toBeTrue();
    });

    it('should identify invalid fields correctly', () => {
      component.locationForm.get('name')?.markAsTouched();
      
      expect(component.isFieldInvalid('name')).toBeTrue();
      
      component.locationForm.patchValue({ name: 'Valid Name' });
      
      expect(component.isFieldInvalid('name')).toBeFalse();
    });

    it('should allow optional address2 field', () => {
      component.locationForm.patchValue({
        name: 'Test',
        address1: '123 St',
        address2: '',
        city: 'City',
        state: 'State',
        country: 'Country',
        zipcode: '12345'
      });

      expect(component.locationForm.valid).toBeTrue();
    });
  });

  describe('Form Cancel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form when cancelled', () => {
      component.showAddForm();
      component.locationForm.patchValue({ name: 'Test' });
      
      component.cancelForm();
      
      expect(component.showForm).toBeFalse();
      expect(component.locationForm.value.name).toBeNull();
      expect(component.editingLocation).toBeNull();
    });
  });

  describe('Error Handling and User Feedback', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display error toast when loading locations fails', () => {
      dataService.getLocations.and.returnValue(throwError(() => new Error('Network error')));
      
      component.loadLocations();
      
      expect(toastrService.error).toHaveBeenCalledWith(
        'Failed to load locations',
        'Error'
      );
    });

    it('should display warning toast when form is invalid on save', async () => {
      component.showAddForm();
      
      await component.saveLocation();
      
      expect(toastrService.warning).toHaveBeenCalledWith(
        'Please fill in all required fields',
        'Validation Error'
      );
    });

    it('should display success toast when location is created', async () => {
      const newLocation: ILocation = {
        id: 3,
        name: 'New Kennel',
        address1: '789 Pine St',
        address2: '',
        city: 'Peoria',
        state: 'IL',
        country: 'USA',
        zipcode: '61602',
        location_type: 'user',
        user_id: 'user-123',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z'
      };

      dataService.createLocation.and.returnValue(of(newLocation));
      dataService.getLocations.and.returnValue(of([...mockLocations, newLocation]));

      component.showAddForm();
      component.locationForm.patchValue({
        name: 'New Kennel',
        address1: '789 Pine St',
        city: 'Peoria',
        state: 'IL',
        country: 'USA',
        zipcode: '61602'
      });

      await component.saveLocation();

      expect(toastrService.success).toHaveBeenCalledWith(
        'Location created successfully',
        'Success'
      );
    });

    it('should display error toast when location creation fails', async () => {
      dataService.createLocation.and.returnValue(
        throwError(() => ({ error: { detail: 'Creation failed' } }))
      );

      component.showAddForm();
      component.locationForm.patchValue({
        name: 'New Kennel',
        address1: '789 Pine St',
        city: 'Peoria',
        state: 'IL',
        country: 'USA',
        zipcode: '61602'
      });

      await component.saveLocation();

      expect(toastrService.error).toHaveBeenCalledWith(
        'Creation failed',
        'Error'
      );
    });

    it('should display success toast when location is updated', async () => {
      const updatedLocation = { ...mockLocations[0], name: 'Updated Kennel' };
      dataService.updateLocation.and.returnValue(of(updatedLocation));
      dataService.getLocations.and.returnValue(of([updatedLocation, mockLocations[1]]));

      component.editLocation(mockLocations[0]);
      component.locationForm.patchValue({ name: 'Updated Kennel' });

      await component.saveLocation();

      expect(toastrService.success).toHaveBeenCalledWith(
        'Location updated successfully',
        'Success'
      );
    });

    it('should display error toast when location update fails', async () => {
      dataService.updateLocation.and.returnValue(
        throwError(() => ({ error: { detail: 'Update failed' } }))
      );

      component.editLocation(mockLocations[0]);
      component.locationForm.patchValue({ name: 'Updated Kennel' });

      await component.saveLocation();

      expect(toastrService.error).toHaveBeenCalledWith(
        'Update failed',
        'Error'
      );
    });

    it('should display success toast when location is deleted', async () => {
      dataService.deleteLocation.and.returnValue(of(void 0));
      dataService.getLocations.and.returnValue(of([mockLocations[1]]));

      component.confirmDelete(mockLocations[0]);
      await component.deleteLocation();

      expect(toastrService.success).toHaveBeenCalledWith(
        'Location deleted successfully',
        'Success'
      );
    });

    it('should display specific error toast when deleting location with pets', async () => {
      dataService.deleteLocation.and.returnValue(
        throwError(() => ({ status: 409, error: { detail: 'Has pets' } }))
      );

      component.confirmDelete(mockLocations[0]);
      await component.deleteLocation();

      expect(toastrService.error).toHaveBeenCalledWith(
        'Cannot delete location with associated pets',
        'Error'
      );
    });

    it('should display generic error toast when delete fails', async () => {
      dataService.deleteLocation.and.returnValue(
        throwError(() => ({ status: 500, error: { detail: 'Server error' } }))
      );

      component.confirmDelete(mockLocations[0]);
      await component.deleteLocation();

      expect(toastrService.error).toHaveBeenCalledWith(
        'Server error',
        'Error'
      );
    });

    it('should display generic error message when error detail is not provided', async () => {
      dataService.createLocation.and.returnValue(
        throwError(() => ({ error: {} }))
      );

      component.showAddForm();
      component.locationForm.patchValue({
        name: 'New Kennel',
        address1: '789 Pine St',
        city: 'Peoria',
        state: 'IL',
        country: 'USA',
        zipcode: '61602'
      });

      await component.saveLocation();

      expect(toastrService.error).toHaveBeenCalledWith(
        'Failed to create location',
        'Error'
      );
    });
  });
});
