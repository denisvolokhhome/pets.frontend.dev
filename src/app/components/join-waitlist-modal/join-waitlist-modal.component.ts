import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { WaitlistService } from '../../services/waitlist.service';
import { ToastService } from '../../services/toast.service';
import { IWaitlistInfo, SexPreference } from '../../models/waitlist';

/** Pet seeker asks to join a breeder's waitlist (optionally for one specific litter). */
@Component({
  selector: 'app-join-waitlist-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './join-waitlist-modal.component.html',
  styleUrls: ['./join-waitlist-modal.component.css']
})
export class JoinWaitlistModalComponent implements OnInit {
  @Input() breederId!: string;
  @Input() breedingId?: number;
  @Output() joined = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  info: IWaitlistInfo | null = null;
  isLoading = true;
  isSubmitting = false;
  conflictMessage = '';

  sexPreference: SexPreference = 'Any';
  notes = '';
  answers: Record<string, string> = {};
  validationErrors: Record<string, string> = {};
  readonly sexOptions: SexPreference[] = ['Any', 'Male', 'Female'];

  constructor(private waitlistService: WaitlistService, private toastr: ToastService) {}

  ngOnInit(): void {
    this.waitlistService.getInfo(this.breederId, this.breedingId).subscribe({
      next: (info) => {
        this.info = info;
        (info.application_form?.form_fields ?? []).forEach(f => this.answers[f.id] = '');
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('Could not load waitlist details.', 'Error');
        this.closed.emit();
      }
    });
  }

  get fields() {
    return this.info?.application_form?.form_fields ?? [];
  }

  validate(): boolean {
    this.validationErrors = {};
    for (const field of this.fields) {
      if (field.required && !this.answers[field.id]?.trim()) {
        this.validationErrors[field.id] = `"${field.label}" is required.`;
      }
    }
    return Object.keys(this.validationErrors).length === 0;
  }

  onSubmit(): void {
    if (this.isSubmitting || !this.validate()) return;
    this.isSubmitting = true;
    this.conflictMessage = '';
    this.waitlistService.requestSpot(this.breederId, {
      request_breeding_id: this.breedingId ?? null,
      sex_preference: this.sexPreference,
      preference_notes: this.notes.trim() || null,
      application_answers: this.fields.length ? { ...this.answers } : null
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastr.success('Request sent', 'Waitlist');
        this.joined.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting = false;
        if (err.status === 409) {
          this.conflictMessage = "You're already on this breeder's waitlist.";
        } else {
          this.toastr.error('Could not send your request. Please try again.', 'Error');
        }
      }
    });
  }

  onClose(): void {
    this.closed.emit();
  }
}
