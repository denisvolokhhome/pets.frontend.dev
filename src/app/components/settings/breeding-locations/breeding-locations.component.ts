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
    const userId = localStorage.getItem('user_id');
    if (userId) {
      this.dataService.getLocations(userId).subscribe({
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
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.locationToDelete = null;
    this.showDeleteConfirm = false;
  }

  async deleteLocation(): Promise<void> {
    if (!this.locationToDelete) {
      return;
    }

    this.isLoading = true;
    this.saveError = null;

    this.dataService.deleteLocation(this.locationToDelete.id!).subscribe({
      next: () => {
        this.isLoading = false;
        this.showDeleteConfirm = false;
        this.locationToDelete = null;
        this.toastr.success('Location deleted successfully', 'Success');
        this.loadLocations();
      },
      error: (error) => {
        console.error('Error deleting location:', error);
        if (error.status === 409) {
          this.saveError = 'Cannot delete location with associated pets';
          this.toastr.error('Cannot delete location with associated pets', 'Error');
        } else {
          this.saveError = error.error?.detail || 'Failed to delete location';
          const errorMessage = error.error?.detail || 'Failed to delete location';
          this.toastr.error(errorMessage, 'Error');
        }
        this.isLoading = false;
        this.showDeleteConfirm = false;
        this.locationToDelete = null;
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
