import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { from, of } from 'rxjs';
import { catchError, concatMap, map, toArray } from 'rxjs/operators';
import { OffspringService, OffspringCreate } from '../../services/offspring.service';
import { ToastService } from '../../services/toast.service';

@Component({
  standalone: false,
  selector: 'app-offspring-modal',
  templateUrl: './offspring-modal.component.html',
  styleUrls: ['./offspring-modal.component.css']
})
export class OffspringModalComponent implements OnInit, OnDestroy {
  @Input() breedingId!: string;
  @Input() breedDisplay!: string;
  @Input() breedId!: number | null;
  @Input() parentPets!: any[];
  @Output() close = new EventEmitter<void>();
  @Output() offspringAdded = new EventEmitter<void>();

  offspringForm!: FormGroup;
  isSubmitting: boolean = false;
  selectedGender: string = '';

  readonly MAX_PHOTOS = 5;
  imageFiles: File[] = [];
  imagePreviews: string[] = [];

  constructor(
    private fb: FormBuilder,
    private offspringService: OffspringService,
    private toastr: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.offspringForm = this.fb.group({
      name: [''],
      gender: ['', Validators.required],
      date_of_birth: ['', Validators.required],
      status: ['Available'],
      price: [''],
      color_markings: [''],
      description: ['']
    });
  }

  ngOnDestroy(): void {
    this.imagePreviews.forEach(url => URL.revokeObjectURL(url));
  }

  onPhotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []).filter(f => f.type.startsWith('image/'));
    const room = this.MAX_PHOTOS - this.imageFiles.length;
    if (files.length > room) {
      this.toastr.warning(`You can add up to ${this.MAX_PHOTOS} photos.`, 'Photo limit');
    }
    for (const file of files.slice(0, room)) {
      this.imageFiles.push(file);
      this.imagePreviews.push(URL.createObjectURL(file));
    }
    input.value = '';
  }

  removePhoto(index: number): void {
    URL.revokeObjectURL(this.imagePreviews[index]);
    this.imagePreviews.splice(index, 1);
    this.imageFiles.splice(index, 1);
  }

  selectGender(gender: string): void {
    this.selectedGender = gender;
    this.offspringForm.patchValue({ gender: gender });
  }

  onSubmit(): void {
    if (this.offspringForm.invalid) {
      this.toastr.warning('Please fill in all required fields', 'Validation Error');
      return;
    }

    this.isSubmitting = true;

    const formValue = this.offspringForm.value;
    
    // Parse breeding_id to integer
    const breedingIdInt = parseInt(this.breedingId, 10);
    if (isNaN(breedingIdInt)) {
      this.toastr.error('Invalid breeding ID', 'Error');
      this.isSubmitting = false;
      return;
    }
    
    // Prepare offspring data for the API
    const offspringData: OffspringCreate = {
      breeding_id: breedingIdInt,
      name: formValue.name || null,
      gender: formValue.gender as 'Male' | 'Female',
      date_of_birth: formValue.date_of_birth,
      status: formValue.status || 'Available',
      price: formValue.price ? parseFloat(formValue.price) : null,
      color_markings: formValue.color_markings || null,
      description: formValue.description || null
    };

    this.offspringService.createOffspring(offspringData).subscribe({
      next: (offspring) => this.uploadPhotos(offspring.id),
      error: (error) => {
        console.error('Error adding offspring:', error);
        const errorMsg = error?.message || error?.error?.detail || 'Failed to add offspring';
        this.toastr.error(errorMsg, 'Error');
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  /** Upload the chosen photos one by one; a failed photo doesn't undo the new offspring. */
  private uploadPhotos(offspringId: string): void {
    from(this.imageFiles).pipe(
      concatMap(file => this.offspringService.uploadOffspringImage(offspringId, file).pipe(
        catchError(() => of(null))
      )),
      toArray(),
      // The first photo that made it becomes the main photo, as the form promises
      concatMap(images => {
        const first = images.find(img => !!img);
        return first
          ? this.offspringService.setPrimaryImage(offspringId, first.id).pipe(
              catchError(() => of(null)), map(() => images))
          : of(images);
      })
    ).subscribe(images => {
      const failed = images.filter(img => !img).length;
      this.isSubmitting = false;
      this.offspringAdded.emit();
      this.toastr.success('Offspring added successfully', 'Success');
      if (failed) {
        this.toastr.warning(
          `${failed} photo(s) could not be uploaded. You can add them from Edit.`,
          'Some photos failed'
        );
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
