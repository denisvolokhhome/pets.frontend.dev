import { Component, OnInit } from '@angular/core';

import { WaitlistService } from '../../../services/waitlist.service';
import { ToastService } from '../../../services/toast.service';

/** Breeder's default deposit amount and policy shown to people joining the waitlist. */
@Component({
  standalone: false,
  selector: 'app-waitlist-settings',
  templateUrl: './waitlist-settings.component.html',
  styleUrls: ['./waitlist-settings.component.css']
})
export class WaitlistSettingsComponent implements OnInit {
  amount = '';
  policy = '';
  amountError = '';
  isLoading = true;
  isSaving = false;

  constructor(private waitlistService: WaitlistService, private toastr: ToastService) {}

  ngOnInit(): void {
    this.waitlistService.getSettings().subscribe({
      next: s => {
        this.amount = s.deposit_amount ?? '';
        this.policy = s.deposit_policy ?? '';
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('Could not load waitlist settings.', 'Error');
      }
    });
  }

  save(): void {
    const amount = String(this.amount ?? '').trim();
    this.amountError = '';
    if (amount && !(Number(amount) >= 0)) {
      this.amountError = 'Enter a valid amount.';
      return;
    }
    this.isSaving = true;
    this.waitlistService.updateSettings({
      deposit_amount: amount || null,
      deposit_policy: (this.policy ?? '').trim() || null
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.toastr.success('Waitlist settings saved.', 'Settings');
      },
      error: () => {
        this.isSaving = false;
        this.toastr.error('Could not save settings.', 'Error');
      }
    });
  }
}
