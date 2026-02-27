import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalService } from './../../services/modal.service';
import { DataService } from './../../services/data.service';
import { FormControl, FormGroup, NgForm, Validators } from '@angular/forms';
import { IBreed } from 'src/app/models/breed';
import { ILocation } from 'src/app/models/location';
import { DatePipe } from '@angular/common';
declare var window: any;

interface PetType {
  value: string;   // matches IBreed.kind — 'dog' | 'cat' | 'cow' | 'horse'
  label: string;
  icon: string;    // emoji icon displayed in the tile
}

@Component({
  standalone: false,
  selector: 'app-pet-add',
  templateUrl: './pet-add.component.html',
  styleUrls: ['./pet-add.component.css']
})
export class PetAddComponent implements OnInit {

  // ── Pet type tiles ──────────────────────────────────────────────────────────
  petTypes: PetType[] = [
    { value: 'dog',   label: 'Dog',   icon: '🐕' },
    { value: 'cat',   label: 'Cat',   icon: '🐈' },
    { value: 'cow',   label: 'Cow',   icon: '🐄' },
    { value: 'horse', label: 'Horse', icon: '🐴' },
  ];
  selectedPetType: string = '';

  // ── Breeds ──────────────────────────────────────────────────────────────────
  breeds: IBreed[] = [];
  filteredBreeds: IBreed[] = [];
  showBreedDropdown: boolean = false;

  // ── Locations ───────────────────────────────────────────────────────────────
  locations: ILocation[] = [];

  // ── Date cap ────────────────────────────────────────────────────────────────
  maxDate: Date;

  // ── Multi-image upload ──────────────────────────────────────────────────────
  imagePreviews: string[] = [];          // blob URLs for the preview grid
  imageFiles: File[] = [];              // actual File objects to upload
  readonly MAX_PHOTOS = 5;

  @ViewChild('addPet') public addPetForm: NgForm;

  constructor(
    private DataService: DataService,
    private modalService: ModalService
  ) {
    this.maxDate = new Date();
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Load ALL breeds initially (no kind filter)
    this.DataService.getBreeds().subscribe(breeds => {
      this.breeds = breeds;
      this.filteredBreeds = breeds;
    });

    this.DataService.getLocations(localStorage.getItem('id')).subscribe(locations => {
      this.locations = locations;
    });
  }

  // ── Pet type selection ──────────────────────────────────────────────────────

  selectPetType(kind: string): void {
    this.selectedPetType = kind;

    // Re-fetch breeds filtered by kind
    this.DataService.getBreeds(kind).subscribe(breeds => {
      this.breeds = breeds;
      this.filteredBreeds = breeds;
    });

    // Clear selected breed when type changes
    this.breed_name.setValue('');
  }

  // ── Breed autocomplete ──────────────────────────────────────────────────────

  filterBreeds(event: any): void {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredBreeds = searchTerm
      ? this.breeds.filter(b => b.name.toLowerCase().includes(searchTerm))
      : this.breeds;
    this.showBreedDropdown = true;
  }

  selectBreed(breedName: string): void {
    this.breed_name.setValue(breedName);
    this.showBreedDropdown = false;
  }

  onBreedBlur(): void {
    setTimeout(() => { this.showBreedDropdown = false; }, 200);
  }

  // ── Multi-image upload ──────────────────────────────────────────────────────

  readURLMultiple(event: any): void {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    const remaining = this.MAX_PHOTOS - this.imagePreviews.length;
    const toAdd = Math.min(files.length, remaining);

    for (let i = 0; i < toAdd; i++) {
      const file = files[i];
      this.imageFiles.push(file);
      this.imagePreviews.push(window.URL.createObjectURL(file));
    }

    // Reset input so the same file can be re-selected if removed
    event.target.value = '';
  }

  removeImage(index: number): void {
    // Revoke blob URL to free memory
    window.URL.revokeObjectURL(this.imagePreviews[index]);
    this.imagePreviews.splice(index, 1);
    this.imageFiles.splice(index, 1);
  }

  // ── Form ────────────────────────────────────────────────────────────────────

  form = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
    breed_name: new FormControl<string>('', [Validators.required]),
    pet_desc: new FormControl<string>('', [
      Validators.minLength(0),
      Validators.maxLength(200),
    ]),
    pet_dob: new FormControl('', [Validators.required]),
    gender: new FormControl('', [Validators.required]),
    weight: new FormControl('', [Validators.required]),
    location_name: new FormControl('', [Validators.required]),
    image: new FormControl(''),
    has_vaccination: new FormControl(''),
    has_microchip: new FormControl(''),
    has_healthcertificate: new FormControl(''),
    has_dewormed: new FormControl(''),
    has_birthcertificate: new FormControl('')
  });

  // ── Getters ─────────────────────────────────────────────────────────────────

  get name()          { return this.form.controls.name          as FormControl; }
  get breed_name()    { return this.form.controls.breed_name    as FormControl; }
  get description()   { return this.form.controls.pet_desc      as FormControl; }
  get pet_dob()       { return this.form.controls.pet_dob       as FormControl; }
  get gender()        { return this.form.controls.gender        as FormControl; }
  get weight()        { return this.form.controls.weight        as FormControl; }
  get location_name() { return this.form.controls.location_name as FormControl; }

  // ── Submit ───────────────────────────────────────────────────────────────────

  submit(): void {
    const dateSendingToServer = new DatePipe('en-US')
      .transform(this.form.value.pet_dob, 'yyyy-MM-dd');

    this.DataService.createPet({
      name:                 this.form.value.name              as string,
      breed_name:           this.form.value.breed_name        as string,
      description:          this.form.value.pet_desc          as string,
      pet_dob:              dateSendingToServer               as string,
      gender:               this.form.value.gender            as string,
      weight:               this.form.value.weight            as string,
      location_name:        this.form.value.location_name     as string,
      is_puppy:             0,
      has_microchip:        this.form.value.has_microchip        ? 1 : 0 as number,
      has_vaccination:      this.form.value.has_vaccination      ? 1 : 0 as number,
      has_healthcertificate:this.form.value.has_healthcertificate? 1 : 0 as number,
      has_dewormed:         this.form.value.has_dewormed         ? 1 : 0 as number,
      has_birthcertificate: this.form.value.has_birthcertificate ? 1 : 0 as number,
      id:                   localStorage.getItem('id')
    }).subscribe({
      next: (createdPet) => {
        if (this.imageFiles.length > 0) {
          // Upload images sequentially, then reset
          this.uploadImagesSequentially(createdPet.id, 0);
        } else {
          this.resetForm();
        }
      },
      error: (error) => {
        console.error('Error creating pet:', error);
        alert('Failed to create pet. Please try again.');
      }
    });
  }

  private uploadImagesSequentially(petId: string, index: number): void {
    if (index >= this.imageFiles.length) {
      this.resetForm();
      return;
    }

    this.DataService.uploadPetImage(petId, this.imageFiles[index]).subscribe({
      next: () => this.uploadImagesSequentially(petId, index + 1),
      error: (error) => {
        console.error(`Error uploading image ${index + 1}:`, error);
        // Continue uploading remaining images even if one fails
        this.uploadImagesSequentially(petId, index + 1);
      }
    });
  }

  // ── Reset ────────────────────────────────────────────────────────────────────

  resetForm(): void {
    this.addPetForm.form.reset();

    // Clean up blob URLs
    this.imagePreviews.forEach(url => window.URL.revokeObjectURL(url));
    this.imagePreviews = [];
    this.imageFiles = [];
    this.selectedPetType = '';

    Object.keys(this.addPetForm.form.controls).forEach(key => {
      this.addPetForm.form.controls[key].setErrors(null);
    });

    this.modalService.close('addPetModal');
    window.location.reload();
  }

  modalClose(): void {
    this.modalService.close('addPetModal');
  }
}