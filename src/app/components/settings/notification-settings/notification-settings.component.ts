import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NotificationPreferenceService } from '../../../services/notification-preference.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  standalone: false,
  selector: 'app-notification-settings',
  templateUrl: './notification-settings.component.html',
  styleUrls: ['./notification-settings.component.css']
})
export class NotificationSettingsComponent implements OnInit {
  preferencesForm: FormGroup;
  isLoading: boolean = false;
  saveSuccess: boolean = false;
  saveError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private notificationPreferenceService: NotificationPreferenceService,
    private toastr: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.preferencesForm = this.fb.group({
      message_received: [true],
      favorite_added: [false]
    });
  }

  ngOnInit(): void {
    this.loadPreferences();
  }

  loadPreferences(): void {
    this.isLoading = true;
    this.saveError = null;
    
    this.notificationPreferenceService.getPreferences().subscribe({
      next: (preferences) => {
        this.preferencesForm.patchValue({
          message_received: preferences.message_received,
          favorite_added: preferences.favorite_added
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading notification preferences:', error);
        this.toastr.error('Failed to load notification preferences', 'Error');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  savePreferences(): void {
    if (this.preferencesForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.saveSuccess = false;
    this.saveError = null;

    const preferences = {
      message_received: this.preferencesForm.value.message_received,
      favorite_added: this.preferencesForm.value.favorite_added
    };

    this.notificationPreferenceService.updatePreferences(preferences).subscribe({
      next: (response) => {
        this.saveSuccess = true;
        this.isLoading = false;
        this.toastr.success('Notification preferences updated successfully', 'Success');
        this.cdr.detectChanges();
        setTimeout(() => {
          this.saveSuccess = false;
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (error) => {
        console.error('Error saving notification preferences:', error);
        this.saveError = error.error?.detail || 'Failed to save notification preferences';
        const errorMessage = this.saveError || 'Failed to save notification preferences';
        this.toastr.error(errorMessage, 'Error');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
