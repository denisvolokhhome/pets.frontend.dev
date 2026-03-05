import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OffspringService, OffspringCreate } from '../../services/offspring.service';
import { ToastService } from '../../services/toast.service';

@Component({
  standalone: false,
  selector: 'app-offspring-modal',
  templateUrl: './offspring-modal.component.html',
  styleUrls: ['./offspring-modal.component.css']
})
export class OffspringModalComponent implements OnInit {
  @Input() breedingId!: string;
  @Input() breedDisplay!: string;
  @Input() breedId!: number | null;
  @Input() parentPets!: any[];
  @Output() close = new EventEmitter<void>();
  @Output() offspringAdded = new EventEmitter<void>();

  offspringForm!: FormGroup;
  isSubmitting: boolean = false;
  selectedGender: string = '';

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

    console.log('Submitting offspring data:', offspringData);

    this.offspringService.createOffspring(offspringData).subscribe({
      next: (offspring) => {
        console.log('Offspring created:', offspring);
        this.isSubmitting = false;
        this.offspringAdded.emit();
        this.toastr.success('Offspring added successfully', 'Success');
      },
      error: (error) => {
        console.error('Error adding offspring:', error);
        const errorMsg = error?.message || error?.error?.detail || 'Failed to add offspring';
        this.toastr.error(errorMsg, 'Error');
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
