import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IBreed } from 'src/app/models/breed';
import { ILocation } from 'src/app/models/location';
import { IPet } from 'src/app/models/pet';
import { DataService } from 'src/app/services/data.service';
import { DatePipe } from '@angular/common';
declare var window: any;

@Component({
  selector: 'app-pet-edit',
  templateUrl: './pet-edit.component.html',
  styleUrls: ['./pet-edit.component.css']
})
export class PetEditComponent implements OnInit, OnChanges {

  constructor(private DataService: DataService){
    this.maxDate = new Date();
  }

  @Input() pet: IPet

  breeds: IBreed[];
  filteredBreeds: IBreed[] = [];
  showBreedDropdown: boolean = false;
  locations: ILocation[];
  pets: IPet[] = [];
  maxDate: Date;
  formModal: any;
  image_path: any;

  readURL(event: any): void {
    this.image_path = window.URL.createObjectURL(event.target.files[0]);

    if (event.target.files.length > 0) {
      const file = event.target.files[0];

      this.form.patchValue({
        imageSource: file
      });
    }
  }

  ngOnInit(): void {
    this.formModal = new window.bootstrap.Modal(
      document.getElementById('editPetModal')
    );

    this.DataService.getBreeds().subscribe(breeds => {
      this.breeds = breeds;
      this.filteredBreeds = breeds;
    })

    this.DataService.getLocations(localStorage.getItem('id')).subscribe(locations => {
      this.locations = locations;
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pet'] && this.pet) {
      this.populateForm();
    }
  }

  populateForm(): void {
    if (!this.pet) return;

    // Set image path if exists
    if (this.pet.image_path) {
      this.image_path = this.getImageUrl(this.pet.image_path);
    }

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
    this.formModal.hide();
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

      // Use existing pet data for read-only fields (breed_id, date_of_birth, gender)
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
        is_puppy: 0, // Adults are 0, puppies are 1
        has_microchip: !!this.form.value.has_microchip,
        has_vaccination: !!this.form.value.has_vaccination,
        has_healthcertificate: !!this.form.value.has_healthcertificate,
        has_dewormed: !!this.form.value.has_dewormed,
        has_birthcertificate: !!this.form.value.has_birthcertificate
      };

      // First update the pet data
      this.DataService.updatePet(this.pet.id, updateData).subscribe({
        next: () => {
          // If there's an image to upload, upload it separately
          const imageFile = this.form.get('imageSource')?.value as any;
          if (imageFile && imageFile instanceof File) {
            this.DataService.uploadPetImage(this.pet.id, imageFile as File).subscribe({
              next: () => {
                this.formModal.hide();
                window.location.reload();
              },
              error: (error) => {
                console.error('Error uploading image:', error);
                alert('Pet updated but image upload failed. Please try again.');
                this.formModal.hide();
                window.location.reload();
              }
            });
          } else {
            this.formModal.hide();
            window.location.reload();
          }
        },
        error: (error) => {
          console.error('Error updating pet:', error);
          alert('Failed to update pet. Please try again.');
        }
      });
    }

  }




