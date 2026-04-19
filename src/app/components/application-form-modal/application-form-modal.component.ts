import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';

export interface ApplicationFormField {
  id: string;
  type: 'text' | 'textarea';
  label: string;
  required: boolean;
}

export interface ApplicationFormSubmission {
  responses: { [fieldId: string]: string };
  formattedMessage: string;
}

@Component({
  selector: 'app-application-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './application-form-modal.component.html',
  styleUrls: ['./application-form-modal.component.css']
})
export class ApplicationFormModalComponent implements OnInit {
  @Input() breedingId!: number;
  @Input() offspringName: string = 'this offspring';
  @Output() submitted = new EventEmitter<ApplicationFormSubmission>();
  @Output() cancelled = new EventEmitter<void>();

  fields: ApplicationFormField[] = [];
  answers: { [fieldId: string]: string } = {};
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  validationErrors: { [fieldId: string]: string } = {};

  constructor(
    private dataService: DataService,
    private toastr: ToastService
  ) {}

  ngOnInit(): void {
    this.dataService.getPublicApplicationForm(this.breedingId).subscribe({
      next: (form) => {
        this.fields = form.form_fields || [];
        this.fields.forEach(f => this.answers[f.id] = '');
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('Could not load application form.', 'Error');
        this.cancelled.emit();
      }
    });
  }

  validate(): boolean {
    this.validationErrors = {};
    let valid = true;
    for (const field of this.fields) {
      if (field.required && !this.answers[field.id]?.trim()) {
        this.validationErrors[field.id] = `"${field.label}" is required.`;
        valid = false;
      }
    }
    return valid;
  }

  onSubmit(): void {
    if (!this.validate()) return;

    // Build a formatted message from the answers
    const lines = this.fields
      .filter(f => this.answers[f.id]?.trim())
      .map(f => `**${f.label}**\n${this.answers[f.id].trim()}`);

    const formattedMessage = `Application for ${this.offspringName}:\n\n${lines.join('\n\n')}`;

    this.submitted.emit({
      responses: { ...this.answers },
      formattedMessage
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
