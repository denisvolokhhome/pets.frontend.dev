import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';

export interface ApplicationFormField {
  id: string;
  type: 'text' | 'textarea';
  label: string;
  required: boolean;
}

@Component({
  standalone: false,
  selector: 'app-breeding-detail',
  templateUrl: './breeding-detail.component.html',
  styleUrls: ['./breeding-detail.component.css']
})
export class BreedingDetailComponent implements OnInit {
  breedingId: string = '';
  breeding: any = null;
  isLoading: boolean = true;
  showOffspringModal: boolean = false;

  // Application form
  showFormBuilder: boolean = false;
  formFields: ApplicationFormField[] = [];
  isSavingForm: boolean = false;
  isDeletingForm: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private toastr: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.breedingId = params['id'];
      this.loadBreedingDetails();
    });
  }

  loadBreedingDetails(): void {
    this.isLoading = true;
    
    this.dataService.getBreeding(this.breedingId).subscribe({
      next: (data) => {
        this.breeding = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading breeding details:', error);
        this.toastr.error('Failed to load breeding details', 'Error');
        this.isLoading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/breedings']);
      }
    });
  }

  getBreedDisplay(): string {
    if (!this.breeding?.parent_pets || this.breeding.parent_pets.length === 0) {
      return 'Unknown';
    }

    const breeds = this.breeding.parent_pets
      .map((pet: any) => pet.breed_name)
      .filter((breed: string) => breed);

    if (breeds.length === 0) {
      return 'Unknown';
    }

    const uniqueBreeds = [...new Set<string>(breeds)];
    
    if (uniqueBreeds.length === 1) {
      return uniqueBreeds[0] as string;
    }

    return `Mixed (${uniqueBreeds.join(' + ')})`;
  }

  getBreedId(): number | null {
    if (!this.breeding?.parent_pets || this.breeding.parent_pets.length === 0) {
      return null;
    }

    const breedIds = this.breeding.parent_pets
      .map((pet: any) => pet.breed_id)
      .filter((id: number) => id);

    if (breedIds.length === 0) {
      return null;
    }

    const uniqueBreedIds = [...new Set<number>(breedIds)];
    
    // If all parents have the same breed, return that breed_id
    if (uniqueBreedIds.length === 1) {
      return uniqueBreedIds[0] as number;
    }
    if (uniqueBreedIds.length === 1) {
      return uniqueBreedIds[0];
    }

    // Mixed breed - return null to indicate mixed
    return null;
  }

  openOffspringModal(): void {
    this.showOffspringModal = true;
  }

  closeOffspringModal(): void {
    this.showOffspringModal = false;
  }

  onOffspringAdded(): void {
    this.showOffspringModal = false;
    this.loadBreedingDetails();
  }

  goBack(): void {
    this.router.navigate(['/breedings']);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'started':
        return 'status-started';
      case 'inprocess':
      case 'in_process':
        return 'status-inprocess';
      case 'done':
        return 'status-done';
      case 'voided':
        return 'status-voided';
      default:
        return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'started':
        return 'Started';
      case 'inprocess':
      case 'in_process':
        return 'In Process';
      case 'done':
        return 'Done';
      case 'voided':
        return 'Voided';
      default:
        return status;
    }
  }

  // ── Application Form ──────────────────────────────────────────────────────

  get hasApplicationForm(): boolean {
    return !!(this.breeding?.application_form?.form_fields?.length);
  }

  openFormBuilder(): void {
    // Pre-populate with existing fields if any
    if (this.breeding?.application_form?.form_fields) {
      this.formFields = this.breeding.application_form.form_fields.map((f: any) => ({ ...f }));
    } else {
      this.formFields = [];
    }
    this.showFormBuilder = true;
  }

  closeFormBuilder(): void {
    this.showFormBuilder = false;
  }

  addField(type: 'text' | 'textarea'): void {
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    this.formFields.push({ id, type, label: '', required: false });
  }

  removeField(index: number): void {
    this.formFields.splice(index, 1);
  }

  moveField(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= this.formFields.length) return;
    [this.formFields[index], this.formFields[target]] = [this.formFields[target], this.formFields[index]];
  }

  saveForm(): void {
    const valid = this.formFields.every(f => f.label.trim().length > 0);
    if (!valid) {
      this.toastr.error('All fields must have a label.', 'Validation Error');
      return;
    }
    this.isSavingForm = true;
    this.dataService.upsertApplicationForm(Number(this.breedingId), this.formFields).subscribe({
      next: (form) => {
        if (!this.breeding.application_form) this.breeding.application_form = {};
        this.breeding.application_form = form;
        this.isSavingForm = false;
        this.showFormBuilder = false;
        this.toastr.success('Application form saved.', 'Saved');
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSavingForm = false;
        this.toastr.error('Failed to save form.', 'Error');
      }
    });
  }

  deleteForm(): void {
    if (!confirm('Remove the application form from this breeding?')) return;
    this.isDeletingForm = true;
    this.dataService.deleteApplicationForm(Number(this.breedingId)).subscribe({
      next: () => {
        this.breeding.application_form = null;
        this.isDeletingForm = false;
        this.toastr.success('Application form removed.', 'Removed');
        this.cdr.detectChanges();
      },
      error: () => {
        this.isDeletingForm = false;
        this.toastr.error('Failed to remove form.', 'Error');
      }
    });
  }
}
