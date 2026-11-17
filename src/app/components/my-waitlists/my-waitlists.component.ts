import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { WaitlistService } from '../../services/waitlist.service';
import { ConfirmService } from '../../services/confirm.service';
import { ToastService } from '../../services/toast.service';
import { DEPOSIT_STATUS_LABELS, ISeekerEntry } from '../../models/waitlist';
import { statusBadgeClass } from '../../utils/format-utils';

/** A pet seeker's waitlist requests across breeders. */
@Component({
  selector: 'app-my-waitlists',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-waitlists.component.html',
  styleUrls: ['./my-waitlists.component.css']
})
export class MyWaitlistsComponent implements OnInit {
  entries: ISeekerEntry[] = [];
  isLoading = true;
  readonly depositLabels = DEPOSIT_STATUS_LABELS;
  readonly badgeClass = statusBadgeClass;

  constructor(
    private waitlistService: WaitlistService,
    private confirmService: ConfirmService,
    private toastr: ToastService
  ) {}

  ngOnInit(): void {
    this.waitlistService.getMine().subscribe({
      next: (entries) => { this.entries = entries; this.isLoading = false; },
      error: () => {
        this.isLoading = false;
        this.toastr.error('Could not load your waitlists.', 'Error');
      }
    });
  }

  canWithdraw(e: ISeekerEntry): boolean {
    return e.status === 'pending' || e.status === 'active';
  }

  statusText(e: ISeekerEntry): string {
    return e.status.charAt(0).toUpperCase() + e.status.slice(1);
  }

  async withdraw(entry: ISeekerEntry): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: 'Withdraw from waitlist?',
      message: `You will lose your place on ${entry.breedery_name || 'this breeder'}'s waitlist.`,
      confirmText: 'Withdraw',
      danger: true
    });
    if (!ok) return;
    this.waitlistService.withdrawMine(entry.id).subscribe({
      next: (updated) => {
        this.entries = this.entries.map(e => e.id === updated.id ? updated : e);
        this.toastr.success('You have left the waitlist.', 'Waitlist');
      },
      error: () => this.toastr.error('Could not withdraw. Please try again.', 'Error')
    });
  }
}
