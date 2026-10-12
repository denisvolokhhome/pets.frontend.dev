import { Component, EventEmitter, Output } from '@angular/core';

import { WaitlistService } from '../../services/waitlist.service';
import { ToastService } from '../../services/toast.service';
import { SexPreference } from '../../models/waitlist';

/** Breeder adds a person to the general waitlist by hand. */
@Component({
  standalone: false,
  selector: 'app-waitlist-manual-modal',
  templateUrl: './waitlist-manual-modal.component.html',
  styleUrls: ['./waitlist-manual-modal.component.css']
})
export class WaitlistManualModalComponent {
  @Output() added = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  readonly sexOptions: SexPreference[] = ['Any', 'Male', 'Female'];
  name = '';
  email = '';
  phone = '';
  sexPreference: SexPreference = 'Any';
  notes = '';
  errors: Record<string, string> = {};
  isSubmitting = false;

  constructor(private waitlistService: WaitlistService, private toastr: ToastService) {}

  validate(): boolean {
    this.errors = {};
    if (!this.name.trim()) this.errors['name'] = 'Name is required.';
    if (!this.email.trim() && !this.phone.trim()) this.errors['contact'] = 'Enter an email or a phone number.';
    return Object.keys(this.errors).length === 0;
  }

  save(): void {
    if (!this.validate()) return;
    this.isSubmitting = true;
    this.waitlistService.addManual({
      contact_name: this.name.trim(),
      contact_email: this.email.trim() || null,
      contact_phone: this.phone.trim() || null,
      sex_preference: this.sexPreference,
      preference_notes: this.notes.trim() || null
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastr.success('Added to the waitlist.', 'Waitlist');
        this.added.emit();
      },
      error: () => {
        this.isSubmitting = false;
        this.toastr.error('Could not add this person.', 'Error');
      }
    });
  }

  onClose(): void {
    this.closed.emit();
  }
}
