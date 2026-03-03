import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IBreed } from 'src/app/models/breed';
import { ILocation } from 'src/app/models/location';
import { IPet } from 'src/app/models/pet';
import { getPetTypeLabel, getPetTypeIcon } from 'src/app/models/pet-type';
import { DataService } from 'src/app/services/data.service';
import { ModalService } from 'src/app/services/modal.service';
import { DatePipe } from '@angular/common';
declare var window: any;

@Component({
  standalone: false,
  selector: 'app-pet-edit',
  templateUrl: './pet-edit.component.html',
  styleUrls: ['./pet-edit.component.css']
})
export class PetEditComponent implements OnInit, OnChanges {

  constructor(
    private DataService: DataService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef
  ){
    this.maxDate = new Date();
  }

  @Input() pet: IPet
  @Output() petUpdated = new EventEmitter<void>();

  breeds: IBreed[];
  filteredBreeds: IBreed[] = [];
  showBreedDropdown: boolean = false;
  locations: ILocation[];
  pets: IPet[] = [];
  maxDate: Date;
  imagePreviews: string[] = [];
  imageFiles: File[] = [];
  existingImages: any[] = []; // Track existing images from backend
  readonly MAX_PHOTOS = 5;

  readURLMultiple(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Calculate total images (existing + new)
      const totalExisting = this.existingImages.length + this.imagePreviews.length;
      const remainingSlots = this.MAX_PHOTOS - totalExisting;
      const filesToAdd = Math.min(files.length, remainingSlots);

      for (let i = 0; i < filesToAdd; i++) {
        const file = files[i];
        this.imageFiles.push(file);
        
        // Create blob URL for preview
        const blobUrl = window.URL.createObjectURL(file);
        this.imagePreviews.push(blobUrl);
      }
      
      // Trigger change detection to update UI immediately
      this.cdr.detectChanges();
    }
    
    // Reset input so same file can be selected again
    event.target.value = '';
  }

  removeImage(index: number): void {
    // Revoke blob URL to free memory
    if (this.imagePreviews[index]) {
      window.URL.revokeObjectURL(this.imagePreviews[index]);
    }
    this.imagePreviews.splice(index, 1);
    this.imageFiles.splice(index, 1);
  }

  removeExistingImage(imageId: number): void {
    if (confirm('Are you sure you want to delete this image?')) {
      this.DataService.deletePetImage(this.pet.id, imageId).subscribe({
        next: () => {
          // Remove from local array
          this.existingImages = this.existingImages.filter(img => img.id !== imageId);
          this.cdr.detectChanges();
          // Reload pet data to get updated images
          this.reloadPetData();
        },
        error: (error) => {
          console.error('Error deleting image:', error);
          alert('Failed to delete image. Please try again.');
        }
      });
    }
  }

  reloadPetData(): void {
    // Reload the pet to get updated images
    this.DataService.getPet(this.pet.id).subscribe({
      next: (updatedPet) => {
        this.pet = updatedPet;
        this.loadExistingImages();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error reloading pet data:', error);
      }
    });
  }

  getPetTypeLabel(): string {
    if (!this.pet || !this.breeds) return 'Not specified';
    
    const breed = this.breeds.find(b => b.id === this.pet.breed_id);
    if (breed && breed.kind) {
      return getPetTypeLabel(breed.kind);
    }
    
    return 'Not specified';
  }

  getPetTypeIcon(): string {
    if (!this.pet || !this.breeds) return '🐾';
    
    const breed = this.breeds.find(b => b.id === this.pet.breed_id);
    if (breed && breed.kind) {
      return getPetTypeIcon(breed.kind);
    }
    
    return '🐾';
  }

  ngOnInit(): void {
    this.DataService.getBreeds().subscribe(breeds => {
      this.breeds = breeds;
      this.filteredBreeds = breeds;
    })

    this.DataService.getLocations(localStorage.getItem('id')).subscribe(locations => {
      this.locations = locations;
    })
    
    // Load existing images if pet is already set
    if (this.pet) {
      this.loadExistingImages();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pet'] && this.pet) {
      console.log('Pet changed:', this.pet);
      console.log('Pet images:', this.pet.images);
      
      // Clear image arrays first to prevent showing previous pet's images
      this.imagePreviews = [];
      this.imageFiles = [];
      this.existingImages = [];
      this.populateForm();
      this.loadExistingImages();
    }
  }

  loadExistingImages(): void {
    if (!this.pet) return;
    
    // Load images from the images array (new multi-image support)
    if (this.pet.images && this.pet.images.length > 0) {
      this.existingImages = this.pet.images.map(img => ({
        id: img.id,
        url: this.getImageUrl(img.image_path),
        is_primary: img.is_primary
      }));
    } 
    // Fallback to legacy single image field
    else if (this.pet.image_path) {
      this.existingImages = [{
        id: null,
        url: this.getImageUrl(this.pet.image_path),
        is_primary: true
      }];
    } else {
      this.existingImages = [];
    }
  }

  populateForm(): void {
    if (!this.pet) return;

    // Clear new image previews
    this.imagePreviews = [];
    this.imageFiles = [];

    // Populate form with pet data (only editable fields)
    this.form.patchValue({
      name: this.pet.name || '',
      pet_desc: this.pet.description || '',
      weight: this.pet.weight?.toString() || '',
      location_name: this.pet.location_name || '',
      has_vaccination: !!(this.pet.has_vaccination),
      has_microchip: !!(this.pet.has_microchip),
      has_healthcertificate: !!(this.pet.has_healthcertificate),
      has_dewormed: !!(this.pet.has_dewormed),
      has_birthcertificate: !!(this.pet.has_birthcertificate)
    });
  }

  filterBreeds(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    if (!searchTerm) {
      this.filteredBreeds = this.breeds;
    } else {
      this.filteredBreeds = this.breeds.filter(breed =>
        breed.name.toLowerCase().includes(searchTerm)
      );
    }
    this.showBreedDropdown = true;
  }

  selectBreed(breedName: string): void {
    this.showBreedDropdown = false;
  }

  onBreedBlur(): void {
    // Delay to allow click event on dropdown item to fire
    setTimeout(() => {
      this.showBreedDropdown = false;
    }, 200);
  }

  modalClose(): void {
    this.modalService.close('editPetModal');
  }

  getBreedName(): string {
    if (!this.pet || !this.breeds) return '';
    
    // Try breed_name first (if it exists from old data)
    if (this.pet.breed_name) {
      return this.pet.breed_name;
    }
    
    // Otherwise look up by breed_id
    if (this.pet.breed_id) {
      const breed = this.breeds.find(b => b.id === this.pet.breed_id);
      return breed ? breed.name : '';
    }
    
    return '';
  }

  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) return '';
    
    // Remove 'app/' prefix if present (backend returns 'app/filename.png')
    const cleanPath = imagePath.startsWith('app/') ? imagePath.substring(4) : imagePath;
    
    // Use /storage endpoint instead of /api
    const apiHost = this.DataService.apiurl.replace('/api', '');
    return `${apiHost}/storage/${cleanPath}`;
  }



    form = new FormGroup({
      name: new FormControl<string>('', [
        Validators.required
      ]),
      pet_desc: new FormControl<string>('', [
        Validators.minLength(0),
        Validators.maxLength(200),
      ]),
      weight: new FormControl('', [
        Validators.required
      ]),
      location_name: new FormControl('', [
        Validators.required
      ]),
      image: new FormControl(''),
      imageSource: new FormControl(''),
      has_vaccination: new FormControl<boolean>(false),
      has_microchip: new FormControl<boolean>(false),
      has_healthcertificate: new FormControl<boolean>(false),
      has_dewormed: new FormControl<boolean>(false),
      has_birthcertificate: new FormControl<boolean>(false)
    });

    get name() {
      return this.form.controls.name as FormControl;
    }

    get description() {
      return this.form.controls.pet_desc as FormControl;
    }

    get weight() {
      return this.form.controls.weight as FormControl;
    }

    get location_name() {
      return this.form.controls.location_name as FormControl;
    }

    get image() {
      return this.form.controls.image as FormControl;
    }

    submit(): void {
      if (!this.pet) return;

      // Use existing pet data for read-only fields (breed_id, date_of_birth, gender, is_puppy)
      // Find location ID from location name
      const selectedLocation = this.locations.find(l => l.name === this.form.value.location_name);
      const locationId = selectedLocation ? selectedLocation.id : null;

      const updateData = {
        name: this.form.value.name as string,
        breed_id: this.pet.breed_id, // Use existing breed_id
        description: this.form.value.pet_desc as string,
        date_of_birth: this.pet.date_of_birth, // Use existing date
        gender: this.pet.gender, // Use existing gender
        weight: parseFloat(this.form.value.weight as string),
        location_id: locationId,
        is_puppy: this.pet.is_puppy, // Use existing is_puppy value
        has_microchip: !!this.form.value.has_microchip,
        has_vaccination: !!this.form.value.has_vaccination,
        has_healthcertificate: !!this.form.value.has_healthcertificate,
        has_dewormed: !!this.form.value.has_dewormed,
        has_birthcertificate: !!this.form.value.has_birthcertificate
      };

      // First update the pet data
      this.DataService.updatePet(this.pet.id, updateData).subscribe({
        next: () => {
          // If there are new images to upload, upload them sequentially
          if (this.imageFiles.length > 0) {
            this.uploadImagesSequentially(0);
          } else {
            this.modalService.close('editPetModal');
            this.petUpdated.emit();
          }
        },
        error: (error) => {
          console.error('Error updating pet:', error);
          alert('Failed to update pet. Please try again.');
        }
      });
    }

    private uploadImagesSequentially(index: number): void {
      if (index >= this.imageFiles.length) {
        // All images uploaded - close modal and emit event
        this.modalService.close('editPetModal');
        this.petUpdated.emit();
        return;
      }

      this.DataService.uploadPetImage(this.pet.id, this.imageFiles[index]).subscribe({
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

  }




