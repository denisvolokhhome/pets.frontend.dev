import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { LitterApplicationService } from '../../services/litter-application.service';
import { ToastService } from '../../services/toast.service';
import { ApplicationFormRead, apiErrorMessage } from '../../models/litter-application';

/**
 * Breeder control in the litter's Application Form section: open/close
 * "Apply for this litter" and share the public litter page.
 */
@Component({
  selector: 'app-litter-applications-toggle',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './litter-applications-toggle.component.html',
  styleUrls: ['./litter-applications-toggle.component.css']
})
export class LitterApplicationsToggleComponent {
  @Input() breedingId!: number | string;
  /** breeding.application_form (must have fields for this component to be shown). */
  @Input() form: Partial<ApplicationFormRead> | null = null;
  @Input() voided = false;
  /** Emits the updated form after a successful toggle. */
  @Output() formChange = new EventEmitter<ApplicationFormRead>();

  isSaving = false;

  constructor(private service: LitterApplicationService, private toastr: ToastService) {}

  get accepting(): boolean {
    return !!this.form?.accepting_litter_applications;
  }

  get publicPath(): string {
    return `/litter/${this.breedingId}`;
  }

  get shareUrl(): string {
    return `${window.location.origin}${this.publicPath}`;
  }

  toggle(event: Event): void {
    const input = event.target as HTMLInputElement;
    const next = input.checked;
    if (this.isSaving) {
      input.checked = this.accepting;
      return;
    }
    this.isSaving = true;
    this.service.setAcceptingApplications(this.breedingId, next).subscribe({
      next: form => {
        this.isSaving = false;
        this.form = form;
        this.formChange.emit(form);
        this.toastr.success(
          form.accepting_litter_applications
            ? 'Families can now apply from the litter page.'
            : 'The litter page no longer takes new applications.',
          form.accepting_litter_applications ? 'Applications open' : 'Applications closed'
        );
      },
      error: err => {
        this.isSaving = false;
        input.checked = this.accepting;
        this.toastr.error(apiErrorMessage(err, 'Could not change applications.'), 'Error');
      }
    });
  }

  async copyLink(): Promise<void> {
    const url = this.shareUrl;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (!ok) throw new Error('copy failed');
      }
      this.toastr.success(url, 'Link copied');
    } catch {
      this.toastr.error('Copy this link instead: ' + url, 'Could not copy');
    }
  }
}
