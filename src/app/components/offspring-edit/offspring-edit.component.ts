import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OffspringService, OffspringRead, OffspringCreate, OffspringUpdate, OffspringImage } from 'src/app/services/offspring.service';
import { DataService } from 'src/app/services/data.service';
import { ToastService } from 'src/app/services/toast.service';
import { IBreeding } from 'src/app/models/breeding';
declare var window: any;

@Component({
  standalone: true,
  selector: 'app-offspring-edit',
  templateUrl: './offspring-edit.component.html',
  styleUrls: ['./offspring-edit.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class OffspringEditComponent implements OnInit, OnChanges {

  constructor(
    private offspringService: OffspringService,
    private dataService: DataService,
    private toastr: ToastService,
    private cdr: ChangeDetectorRef
  ){
    this.maxDate = new Date();
  }

  @Input() offspring: OffspringRead | null = null;
  @Input() mode: 'create' | 'edit' = 'create';
  @Output() offspringSaved = new EventEmitter<void>();
  @Output() modalClosed = new EventEmitter<void>();

  breedings: IBreeding[] = [];
  maxDate: Date;
  imagePreviews: string[] = [];
  imageFiles: File[] = [];
  existingImages: OffspringImage[] = [];
  readonly MAX_PHOTOS = 5;
  
  isLoadingBreedings: boolean = false;
  isSaving: boolean = false;
  isUploadingImage: boolean = false;

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

  form = new FormGroup({
    breeding_id: new FormControl<number | null>(null, [Validators.required]),
    name: new FormControl<string>(''),
    gender: new FormControl<string>('Male', [Validators.required]),
    date_of_birth: new FormControl<string | null>(null, [Validators.required]),
    status: new FormControl<string>('Available', [Validators.required]),
    price: new FormControl<number | null>(null, [Validators.min(0)]),
    description: new FormControl<string>(''),
    color_markings: new FormControl<string>('')
  });

  ngOnInit(): void {
    this.loadBreedings();
    
    if (this.offspring) {
      this.loadExistingImages();
      this.populateForm();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['offspring'] && this.offspring) {
      this.imagePreviews = [];
      this.imageFiles = [];
      this.existingImages = [];
      this.loadExistingImages();
      this.populateForm();
    }
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

  loadExistingImages(): void {
    if (!this.offspring) return;
    
    if (this.offspring.images && this.offspring.images.length > 0) {
      this.existingImages = this.offspring.images;
    } else {
      this.existingImages = [];
    }
  }

  populateForm(): void {
    if (!this.offspring) return;

    this.imagePreviews = [];
    this.imageFiles = [];

    this.form.patchValue({
      breeding_id: this.offspring.breeding_id,
      name: this.offspring.name || '',
      gender: this.offspring.gender,
      date_of_birth: this.offspring.date_of_birth,
      status: this.offspring.status,
      price: this.offspring.price,
      description: this.offspring.description || '',
      color_markings: this.offspring.color_markings || ''
    });

    // Disable immutable fields in edit mode
    if (this.mode === 'edit') {
      this.form.get('breeding_id')?.disable();
      this.form.get('gender')?.disable();
      this.form.get('date_of_birth')?.disable();
    }
  }

  readURLMultiple(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      const totalExisting = this.existingImages.length + this.imagePreviews.length;
      const remainingSlots = this.MAX_PHOTOS - totalExisting;
      const filesToAdd = Math.min(files.length, remainingSlots);

      for (let i = 0; i < filesToAdd; i++) {
        const file = files[i];
        this.imageFiles.push(file);
        
        const blobUrl = window.URL.createObjectURL(file);
        this.imagePreviews.push(blobUrl);
      }
      
      this.cdr.detectChanges();
    }
    
    event.target.value = '';
  }

  removeImage(index: number): void {
    if (this.imagePreviews[index]) {
      window.URL.revokeObjectURL(this.imagePreviews[index]);
    }
    this.imagePreviews.splice(index, 1);
    this.imageFiles.splice(index, 1);
  }

  removeExistingImage(imageId: string): void {
    if (!this.offspring) return;
    
    if (confirm('Are you sure you want to delete this image?')) {
      this.offspringService.deleteOffspringImage(this.offspring.id, imageId).subscribe({
        next: () => {
          this.existingImages = this.existingImages.filter(img => img.id !== imageId);
          this.toastr.success('Image deleted successfully', 'Success');
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error deleting image:', error);
          this.toastr.error('Failed to delete image', 'Error');
        }
      });
    }
  }

  setPrimaryImage(image: OffspringImage): void {
    if (!this.offspring) return;

    this.offspringService.setPrimaryImage(this.offspring.id, image.id).subscribe({
      next: () => {
        this.existingImages = this.existingImages.map(img => ({
          ...img,
          is_primary: img.id === image.id
        }));
        this.toastr.success('Primary image set successfully', 'Success');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error setting primary image:', error);
        this.toastr.error('Failed to set primary image', 'Error');
      }
    });
  }

  moveImageUp(index: number): void {
    if (index > 0 && this.offspring) {
      const temp = this.existingImages[index];
      this.existingImages[index] = this.existingImages[index - 1];
      this.existingImages[index - 1] = temp;
      this.reorderImages();
    }
  }

  moveImageDown(index: number): void {
    if (index < this.existingImages.length - 1 && this.offspring) {
      const temp = this.existingImages[index];
      this.existingImages[index] = this.existingImages[index + 1];
      this.existingImages[index + 1] = temp;
      this.reorderImages();
    }
  }

  reorderImages(): void {
    if (!this.offspring) return;

    const imageIds = this.existingImages.map(img => img.id);
    this.offspringService.reorderImages(this.offspring.id, imageIds).subscribe({
      next: (updatedImages) => {
        this.existingImages = updatedImages;
        this.toastr.success('Images reordered successfully', 'Success');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error reordering images:', error);
        this.toastr.error('Failed to reorder images', 'Error');
      }
    });
  }

  getBreedingDisplay(breeding: IBreeding | undefined): string {
    if (!breeding) return 'Unknown Breeding';
    
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
    return this.breedings.find(b => Number(b.id) === Number(breedingId));
  }

  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) return '';
    
    const apiHost = this.dataService.apiurl.replace('/api', '');
    return `${apiHost}${imagePath}`;
  }

  modalClose(): void {
    this.modalClosed.emit();
  }

  submit(): void {
    if (this.form.invalid) {
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
    const formValue = this.form.getRawValue();
    
    const offspringData: OffspringCreate = {
      breeding_id: formValue.breeding_id!,
      name: formValue.name || null,
      gender: formValue.gender as 'Male' | 'Female',
      date_of_birth: formValue.date_of_birth!,
      status: formValue.status as 'Available' | 'Reserved' | 'Sold' | 'Archived',
      price: formValue.price || null,
      description: formValue.description || null,
      color_markings: formValue.color_markings || null
    };

    this.offspringService.createOffspring(offspringData).subscribe({
      next: (offspring) => {
        // If there are new images to upload, upload them sequentially
        if (this.imageFiles.length > 0) {
          this.offspring = offspring; // Set offspring for image upload
          this.uploadImagesSequentially(0);
        } else {
          this.toastr.success('Offspring created successfully', 'Success');
          this.isSaving = false;
          this.offspringSaved.emit();
        }
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
    if (!this.offspring) return;

    const formValue = this.form.getRawValue();
    
    const offspringData: OffspringUpdate = {
      name: formValue.name || null,
      status: formValue.status as 'Available' | 'Reserved' | 'Sold' | 'Archived',
      price: formValue.price || null,
      description: formValue.description || null,
      color_markings: formValue.color_markings || null
    };

    this.offspringService.updateOffspring(this.offspring.id, offspringData).subscribe({
      next: () => {
        // If there are new images to upload, upload them sequentially
        if (this.imageFiles.length > 0) {
          this.uploadImagesSequentially(0);
        } else {
          this.toastr.success('Offspring updated successfully', 'Success');
          this.isSaving = false;
          this.offspringSaved.emit();
        }
      },
      error: (error) => {
        console.error('Error updating offspring:', error);
        this.toastr.error(error.message || 'Failed to update offspring', 'Error');
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  private uploadImagesSequentially(index: number): void {
    if (!this.offspring) return;
    
    if (index >= this.imageFiles.length) {
      // All images uploaded
      this.toastr.success(`Offspring ${this.mode === 'create' ? 'created' : 'updated'} successfully`, 'Success');
      this.isSaving = false;
      this.offspringSaved.emit();
      return;
    }

    this.offspringService.uploadOffspringImage(String(this.offspring.id), this.imageFiles[index]).subscribe({
      next: () => {
        // Upload next image
        this.uploadImagesSequentially(index + 1);
      },
      error: (error) => {
        console.error(`Error uploading image ${index + 1}:`, error);
        // Continue with next image even if one fails
        this.uploadImagesSequentially(index + 1);
      }
    });
  }

  getTitle(): string {
    return this.mode === 'create' ? 'Create New Offspring' : 'Edit Offspring';
  }

  get breeding_id() {
    return this.form.controls.breeding_id as FormControl;
  }

  get name() {
    return this.form.controls.name as FormControl;
  }

  get gender() {
    return this.form.controls.gender as FormControl;
  }

  get date_of_birth() {
    return this.form.controls.date_of_birth as FormControl;
  }

  get status() {
    return this.form.controls.status as FormControl;
  }

  get price() {
    return this.form.controls.price as FormControl;
  }

  get description() {
    return this.form.controls.description as FormControl;
  }

  get color_markings() {
    return this.form.controls.color_markings as FormControl;
  }
}
