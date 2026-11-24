import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Observable, firstValueFrom, isObservable } from 'rxjs';
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
  /** Name used in the header and the formatted message (defaults to offspringName). */
  @Input() subjectName?: string;
  /** Header text; defaults to "Apply for {subjectName}". */
  @Input() heading?: string;
  /** Intro text under the header. */
  @Input() intro?: string;
  /** Submit button text. */
  @Input() submitLabel?: string;
  /** Fields known up front (e.g. from the public litter page); skips loading the form. */
  @Input() fields: ApplicationFormField[] | null = null;
  /**
   * Optional async submit hook. When set, the modal waits for it before emitting
   * `submitted`, shows "Submitting…" meanwhile and keeps the form open on failure.
   * The hook may throw/reject with an Error whose message is shown in the modal.
   */
  @Input() submitHandler?: (submission: ApplicationFormSubmission) => Observable<unknown> | Promise<unknown>;
  @Output() submitted = new EventEmitter<ApplicationFormSubmission>();
  @Output() cancelled = new EventEmitter<void>();

  answers: { [fieldId: string]: string } = {};
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  validationErrors: { [fieldId: string]: string } = {};
  submitError: string | null = null;

  get displayName(): string {
    return this.subjectName || this.offspringName;
  }

  get headerText(): string {
    return this.heading || `Apply for ${this.displayName}`;
  }

  constructor(
    private dataService: DataService,
    private toastr: ToastService
  ) {}

  ngOnInit(): void {
    if (this.fields && this.fields.length) {
      this.fields.forEach(f => this.answers[f.id] = '');
      this.isLoading = false;
      return;
    }
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
    for (const field of this.fields || []) {
      if (field.required && !this.answers[field.id]?.trim()) {
        this.validationErrors[field.id] = `"${field.label}" is required.`;
        valid = false;
      }
    }
    return valid;
  }

  async onSubmit(): Promise<void> {
    if (this.isSubmitting || !this.validate()) return;

    // Build a formatted message from the answers
    const lines = (this.fields || [])
      .filter(f => this.answers[f.id]?.trim())
      // Plain text: messages are shown verbatim, so no markdown markers
      .map(f => `${f.label}\n${this.answers[f.id].trim()}`);

    const formattedMessage = `Application for ${this.displayName}:\n\n${lines.join('\n\n')}`;
    const submission: ApplicationFormSubmission = {
      responses: { ...this.answers },
      formattedMessage
    };

    if (!this.submitHandler) {
      this.submitted.emit(submission);
      return;
    }

    this.isSubmitting = true;
    this.submitError = null;
    try {
      const result = this.submitHandler(submission);
      await (isObservable(result) ? firstValueFrom(result, { defaultValue: null }) : result);
      this.isSubmitting = false;
      this.submitted.emit(submission);
    } catch (err: any) {
      this.isSubmitting = false;
      this.submitError = err?.message || 'Could not send your application. Please try again.';
    }
  }

  onCancel(): void {
    if (this.isSubmitting) return;
    this.cancelled.emit();
  }
}
