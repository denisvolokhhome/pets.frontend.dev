import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastrService } from 'ngx-toastr';

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
  locations: any[] = [];
  selectedGender: string = '';

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadLocations();
  }

  initializeForm(): void {
    // Get location from parent pets
    const locationId = this.parentPets && this.parentPets.length > 0 
      ? this.parentPets[0].location_id 
      : null;

    this.offspringForm = this.fb.group({
      name: ['', Validators.required],
      gender: ['', Validators.required],
      date_of_birth: ['', Validators.required],
      microchip: [''],
      weight: [''],
      location_id: [locationId, Validators.required],
      description: ['']
    });
  }

  loadLocations(): void {
    this.dataService.getLocations().subscribe({
      next: (data) => {
        this.locations = data;
      },
      error: (error) => {
        console.error('Error loading locations:', error);
        this.toastr.error('Failed to load locations', 'Error');
      }
    });
  }

  selectGender(gender: string): void {
    this.selectedGender = gender;
    this.offspringForm.patchValue({ gender: gender === 'Male' ? 'm' : 'f' });
  }

  onSubmit(): void {
    if (this.offspringForm.invalid) {
      this.toastr.warning('Please fill in all required fields', 'Validation Error');
      return;
    }

    this.isSubmitting = true;

    const formValue = this.offspringForm.value;
    
    // Prepare puppy data for the API
    const puppyData = {
      puppies: [{
        name: formValue.name,
        gender: formValue.gender,
        birth_date: formValue.date_of_birth
      }]
    };

    this.dataService.addPuppiesToBreeding(this.breedingId, puppyData.puppies).subscribe({
      next: () => {
        this.toastr.success('Offspring added successfully', 'Success');
        this.isSubmitting = false;
        this.offspringAdded.emit();
      },
      error: (error) => {
        console.error('Error adding offspring:', error);
        this.toastr.error('Failed to add offspring', 'Error');
        this.isSubmitting = false;
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
