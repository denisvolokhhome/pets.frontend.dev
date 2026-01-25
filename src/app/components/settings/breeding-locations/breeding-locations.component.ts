import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { ILocation } from '../../../models/location';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-breeding-locations',
  templateUrl: './breeding-locations.component.html',
  styleUrls: ['./breeding-locations.component.css']
})
export class BreedingLocationsComponent implements OnInit {
  locations: ILocation[] = [];
  showForm = false;
  editingLocation: ILocation | null = null;
  locationForm: FormGroup;
  isLoading: boolean = false;
  saveSuccess: boolean = false;
  saveError: string | null = null;
  showDeleteConfirm: boolean = false;
  locationToDelete: ILocation | null = null;
  deleteErrorPets: string[] = [];

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private toastr: ToastrService
  ) {
    this.locationForm = this.fb.group({
      name: ['', Validators.required],
      address1: ['', Validators.required],
      address2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      country: ['', Validators.required],
      zipcode: ['', Validators.required],
      location_type: ['user', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadLocations();
  }

  async loadLocations(): Promise<void> {
    this.isLoading = true;
    this.dataService.getLocations().subscribe({
      next: (locations) => {
        this.locations = locations;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading locations:', error);
        this.saveError = 'Failed to load locations';
        this.toastr.error('Failed to load locations', 'Error');
        this.isLoading = false;
      }
    });
  }

  showAddForm(): void {
    this.editingLocation = null;
    this.locationForm.reset({ location_type: 'user' });
    this.showForm = true;
    this.saveError = null;
    this.saveSuccess = false;
  }

  editLocation(location: ILocation): void {
    this.editingLocation = location;
    this.locationForm.patchValue({
      name: location.name,
      address1: location.address1,
      address2: location.address2,
      city: location.city,
      state: location.state,
      country: location.country,
      zipcode: location.zipcode,
      location_type: location.location_type
    });
    this.showForm = true;
    this.saveError = null;
    this.saveSuccess = false;
  }

  async saveLocation(): Promise<void> {
    if (this.locationForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.locationForm.controls).forEach(key => {
        this.locationForm.get(key)?.markAsTouched();
      });
      this.toastr.warning('Please fill in all required fields', 'Validation Error');
      return;
    }

    this.isLoading = true;
    this.saveSuccess = false;
    this.saveError = null;

    const locationData = this.locationForm.value;

    if (this.editingLocation) {
      // Update existing location
      this.dataService.updateLocation(this.editingLocation.id!, locationData).subscribe({
        next: (response) => {
          this.saveSuccess = true;
          this.isLoading = false;
          this.showForm = false;
          this.toastr.success('Location updated successfully', 'Success');
          this.loadLocations();
          setTimeout(() => {
            this.saveSuccess = false;
          }, 3000);
        },
        error: (error) => {
          console.error('Error updating location:', error);
          this.saveError = error.error?.detail || 'Failed to update location';
          const errorMessage = error.error?.detail || 'Failed to update location';
          this.toastr.error(errorMessage, 'Error');
          this.isLoading = false;
        }
      });
    } else {
      // Create new location
      this.dataService.createLocation(locationData).subscribe({
        next: (response) => {
          this.saveSuccess = true;
          this.isLoading = false;
          this.showForm = false;
          this.toastr.success('Location created successfully', 'Success');
          this.loadLocations();
          setTimeout(() => {
            this.saveSuccess = false;
          }, 3000);
        },
        error: (error) => {
          console.error('Error creating location:', error);
          this.saveError = error.error?.detail || 'Failed to create location';
          const errorMessage = error.error?.detail || 'Failed to create location';
          this.toastr.error(errorMessage, 'Error');
          this.isLoading = false;
        }
      });
    }
  }

  confirmDelete(location: ILocation): void {
    this.locationToDelete = location;
    this.deleteErrorPets = [];
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.locationToDelete = null;
    this.deleteErrorPets = [];
    this.showDeleteConfirm = false;
  }

  async deleteLocation(): Promise<void> {
    if (!this.locationToDelete) {
      return;
    }

    this.isLoading = true;
    this.saveError = null;
    this.deleteErrorPets = [];

    this.dataService.deleteLocation(this.locationToDelete.id!).subscribe({
      next: () => {
        this.isLoading = false;
        this.showDeleteConfirm = false;
        this.locationToDelete = null;
        this.deleteErrorPets = [];
        this.toastr.success('Location deleted successfully', 'Success');
        this.loadLocations();
      },
      error: (error) => {
        console.error('=== DELETE LOCATION ERROR ===');
        console.error('Full error object:', error);
        console.error('Error status:', error.status);
        console.error('Error.error:', error.error);
        console.error('Error.error.detail:', error.error?.detail);
        
        this.isLoading = false;
        
        if (error.status === 409) {
          // Handle the enhanced error response with pet names
          const errorDetail = error.error?.detail;
          
          console.log('=== PROCESSING 409 ERROR ===');
          console.log('errorDetail:', errorDetail);
          console.log('errorDetail type:', typeof errorDetail);
          
          if (errorDetail && typeof errorDetail === 'object') {
            console.log('errorDetail.pet_names:', errorDetail.pet_names);
            console.log('errorDetail.message:', errorDetail.message);
            console.log('errorDetail.pet_count:', errorDetail.pet_count);
            
            if (errorDetail.pet_names && Array.isArray(errorDetail.pet_names)) {
              this.deleteErrorPets = [...errorDetail.pet_names];
              this.saveError = errorDetail.message || 'Cannot delete location with associated pets';
              
              console.log('=== SET VALUES ===');
              console.log('this.deleteErrorPets:', this.deleteErrorPets);
              console.log('this.saveError:', this.saveError);
              console.log('this.showDeleteConfirm:', this.showDeleteConfirm);
              
              this.toastr.error(
                `Cannot delete location. ${errorDetail.pet_count} pet(s) are using this location: ${errorDetail.pet_names.join(', ')}`,
                'Cannot Delete',
                { timeOut: 8000 }
              );
              // Keep modal open - don't change showDeleteConfirm or locationToDelete
              return;
            }
          }
          
          // Fallback
          this.saveError = 'Cannot delete location with associated pets';
          this.toastr.error(this.saveError, 'Error');
        } else {
          const errorMessage = error.error?.detail?.message || error.error?.detail || 'Failed to delete location';
          this.saveError = errorMessage;
          this.toastr.error(errorMessage, 'Error');
          this.showDeleteConfirm = false;
          this.locationToDelete = null;
          this.deleteErrorPets = [];
        }
      }
    });
  }

  cancelForm(): void {
    this.showForm = false;
    this.locationForm.reset();
    this.editingLocation = null;
    this.saveError = null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.locationForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}
