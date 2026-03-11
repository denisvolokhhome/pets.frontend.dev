import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OffspringService, OffspringRead, OffspringCreate, OffspringUpdate, OffspringImage } from 'src/app/services/offspring.service';
import { DataService } from 'src/app/services/data.service';
import { ToastService } from 'src/app/services/toast.service';
import { IBreeding } from 'src/app/models/breeding';

@Component({
  standalone: false,
  selector: 'app-offspring-form',
  templateUrl: './offspring-form.component.html',
  styleUrls: ['./offspring-form.component.css']
})
export class OffspringFormComponent implements OnInit {
  offspringForm: FormGroup;
  mode: 'create' | 'edit' = 'create';
  offspringId: string | null = null;
  offspring: OffspringRead | null = null;
  
  breedings: IBreeding[] = [];
  uploadedImages: OffspringImage[] = [];
  
  isLoading: boolean = false;
  isSaving: boolean = false;
  isLoadingBreedings: boolean = false;
  isUploadingImage: boolean = false;

  maxDate: Date = new Date();

  statusOptions = [
    { label: 'Available', value: 'Available' },
    { label: 'Reserved', value: 'Reserved' },
    { label: 'Sold', value: 'Sold' },
    { label: 'Archived', value: 'Archived' }
  ];

  genderOptions = [
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' }
  ];

  constructor(
    private fb: FormBuilder,
    private offspringService: OffspringService,
    private dataService: DataService,
    private toastr: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.offspringForm = this.fb.group({
      breeding_id: [null, Validators.required],
      name: [''],
      gender: ['Male', Validators.required],
      date_of_birth: [null, Validators.required],
      status: ['Available', Validators.required],
      price: [null, [Validators.min(0)]],
      description: [''],
      color_markings: ['']
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.mode = 'edit';
        this.offspringId = params['id'];
        this.loadOffspring();
      }
    });

    this.loadBreedings();
  }

  loadBreedings(): void {
    this.isLoadingBreedings = true;
    this.dataService.getBreedings().subscribe({
      next: (breedings) => {
        this.breedings = breedings;
        this.isLoadingBreedings = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading breedings:', error);
        this.toastr.error('Failed to load breedings', 'Error');
        this.isLoadingBreedings = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadOffspring(): void {
    if (!this.offspringId) return;

    this.isLoading = true;
    this.offspringService.getOffspring(this.offspringId).subscribe({
      next: (offspring) => {
        this.offspring = offspring;
        this.uploadedImages = offspring.images || [];
        this.populateForm(offspring);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading offspring:', error);
        this.toastr.error(error.message || 'Failed to load offspring', 'Error');
        this.isLoading = false;
        this.router.navigate(['/offsprings']);
      }
    });
  }

  populateForm(offspring: OffspringRead): void {
    // In edit mode, breeding_id is immutable
    this.offspringForm.patchValue({
      breeding_id: offspring.breeding_id,
      name: offspring.name || '',
      gender: offspring.gender,
      date_of_birth: offspring.date_of_birth,
      status: offspring.status,
      price: offspring.price,
      description: offspring.description || '',
      color_markings: offspring.color_markings || ''
    });

    // Disable breeding_id in edit mode
    this.offspringForm.get('breeding_id')?.disable();
    this.offspringForm.get('gender')?.disable();
    this.offspringForm.get('date_of_birth')?.disable();
  }

  onBreedingChange(event: any): void {
    const breedingId = event.value;
    const breeding = this.breedings.find(b => b.id === breedingId);
    
    if (breeding) {
      // Auto-populate breed information is handled by backend
      this.toastr.info('Breed will be auto-populated from breeding', 'Info');
    }
  }

  onFileSelect(event: any): void {
    const files = event.files;
    
    if (!this.offspringId) {
      this.toastr.warning('Please save the offspring first before uploading images', 'Warning');
      return;
    }

    for (let file of files) {
      this.uploadImage(file);
    }
  }

  uploadImage(file: File): void {
    if (!this.offspringId) return;

    this.isUploadingImage = true;
    this.offspringService.uploadOffspringImage(this.offspringId, file).subscribe({
      next: (image) => {
        this.uploadedImages.push(image);
        this.toastr.success('Image uploaded successfully', 'Success');
        this.isUploadingImage = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error uploading image:', error);
        this.toastr.error(error.message || 'Failed to upload image', 'Error');
        this.isUploadingImage = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteImage(image: OffspringImage): void {
    if (!this.offspringId) return;

    if (confirm('Are you sure you want to delete this image?')) {
      this.offspringService.deleteOffspringImage(this.offspringId, image.id).subscribe({
        next: () => {
          this.uploadedImages = this.uploadedImages.filter(img => img.id !== image.id);
          this.toastr.success('Image deleted successfully', 'Success');
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error deleting image:', error);
          this.toastr.error(error.message || 'Failed to delete image', 'Error');
        }
      });
    }
  }

  setPrimaryImage(image: OffspringImage): void {
    if (!this.offspringId) return;

    this.offspringService.setPrimaryImage(this.offspringId, image.id).subscribe({
      next: (updatedImage) => {
        // Update all images - set the selected one as primary, others as not primary
        this.uploadedImages = this.uploadedImages.map(img => ({
          ...img,
          is_primary: img.id === updatedImage.id
        }));
        this.toastr.success('Primary image set successfully', 'Success');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error setting primary image:', error);
        this.toastr.error(error.message || 'Failed to set primary image', 'Error');
      }
    });
  }

  onImageReorder(event: any): void {
    if (!this.offspringId) return;

    // Get the new order of image IDs
    const imageIds = this.uploadedImages.map(img => img.id);

    this.offspringService.reorderImages(this.offspringId, imageIds).subscribe({
      next: (updatedImages) => {
        this.uploadedImages = updatedImages;
        this.toastr.success('Images reordered successfully', 'Success');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error reordering images:', error);
        this.toastr.error(error.message || 'Failed to reorder images', 'Error');
      }
    });
  }

  moveImageUp(index: number): void {
    if (index > 0) {
      const temp = this.uploadedImages[index];
      this.uploadedImages[index] = this.uploadedImages[index - 1];
      this.uploadedImages[index - 1] = temp;
      this.onImageReorder(null);
    }
  }

  moveImageDown(index: number): void {
    if (index < this.uploadedImages.length - 1) {
      const temp = this.uploadedImages[index];
      this.uploadedImages[index] = this.uploadedImages[index + 1];
      this.uploadedImages[index + 1] = temp;
      this.onImageReorder(null);
    }
  }

  save(): void {
    if (this.offspringForm.invalid) {
      this.toastr.error('Please fill in all required fields', 'Validation Error');
      return;
    }

    this.isSaving = true;

    if (this.mode === 'create') {
      this.createOffspring();
    } else {
      this.updateOffspring();
    }
  }

  createOffspring(): void {
    const formValue = this.offspringForm.getRawValue();
    
    const offspringData: OffspringCreate = {
      breeding_id: formValue.breeding_id,
      name: formValue.name || null,
      gender: formValue.gender,
      date_of_birth: formValue.date_of_birth,
      status: formValue.status,
      price: formValue.price || null,
      description: formValue.description || null,
      color_markings: formValue.color_markings || null
    };

    this.offspringService.createOffspring(offspringData).subscribe({
      next: (offspring) => {
        this.toastr.success('Offspring created successfully', 'Success');
        this.isSaving = false;
        
        // Navigate to edit mode to allow image uploads
        this.router.navigate(['/offsprings', offspring.id, 'edit']);
      },
      error: (error) => {
        console.error('Error creating offspring:', error);
        this.toastr.error(error.message || 'Failed to create offspring', 'Error');
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateOffspring(): void {
    if (!this.offspringId) return;

    const formValue = this.offspringForm.getRawValue();
    
    const offspringData: OffspringUpdate = {
      name: formValue.name || null,
      status: formValue.status,
      price: formValue.price || null,
      description: formValue.description || null,
      color_markings: formValue.color_markings || null
    };

    this.offspringService.updateOffspring(this.offspringId, offspringData).subscribe({
      next: (offspring) => {
        this.toastr.success('Offspring updated successfully', 'Success');
        this.isSaving = false;
        this.router.navigate(['/offsprings']);
      },
      error: (error) => {
        console.error('Error updating offspring:', error);
        this.toastr.error(error.message || 'Failed to update offspring', 'Error');
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/offsprings']);
  }

  getBreedingDisplay(breeding: IBreeding): string {
    if (!breeding) {
      return 'Unknown Breeding';
    }
    
    if (!breeding.parent_pets || breeding.parent_pets.length === 0) {
      return `Breeding #${breeding.id}`;
    }

    const breedNames = breeding.parent_pets
      .map(pet => pet.breed_name)
      .filter((name, index, self) => name && self.indexOf(name) === index);

    if (breedNames.length === 0) {
      return `Breeding #${breeding.id}`;
    } else if (breedNames.length === 1) {
      return `Breeding #${breeding.id} - ${breedNames[0]}`;
    } else {
      return `Breeding #${breeding.id} - ${breedNames.join(' + ')}`;
    }
  }

  getBreedingById(breedingId: number): IBreeding | undefined {
    return this.breedings.find(b => String(b.id) === String(breedingId));
  }

  getTitle(): string {
    return this.mode === 'create' ? 'Create New Offspring' : 'Edit Offspring';
  }
}
