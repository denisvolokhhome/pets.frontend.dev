import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { WaitlistService } from '../../services/waitlist.service';
import { ToastService } from '../../services/toast.service';
import { DEPOSIT_STATUS_LABELS, DepositStatus, IWaitlistEntry } from '../../models/waitlist';

/** Breeder records a deposit status change for one waitlist entry. */
@Component({
  standalone: false,
  selector: 'app-waitlist-deposit-modal',
  templateUrl: './waitlist-deposit-modal.component.html',
  styleUrls: ['./waitlist-deposit-modal.component.css']
})
export class WaitlistDepositModalComponent implements OnInit {
  @Input() entry!: IWaitlistEntry;
  @Output() saved = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  readonly statuses = Object.keys(DEPOSIT_STATUS_LABELS) as DepositStatus[];
  readonly labels = DEPOSIT_STATUS_LABELS;

  status: DepositStatus = 'none';
  amount = '';
  receivedOn = '';
  method = '';
  errors: Record<string, string> = {};
  isSubmitting = false;

  constructor(private waitlistService: WaitlistService, private toastr: ToastService) {}

  ngOnInit(): void {
    this.status = this.entry.deposit_status;
    this.amount = this.entry.deposit_amount ?? '';
    this.receivedOn = this.entry.deposit_received_on ?? '';
    this.method = this.entry.deposit_method ?? '';
  }

  validate(): boolean {
    this.errors = {};
    const amount = String(this.amount ?? '').trim();
    if (this.status === 'received' && !this.receivedOn) {
      this.errors['receivedOn'] = 'Enter the date the deposit was received.';
    }
    if (amount && !(Number(amount) >= 0)) {
      this.errors['amount'] = 'Enter a valid amount.';
    }
    return Object.keys(this.errors).length === 0;
  }

  save(): void {
    if (!this.validate()) return;
    this.isSubmitting = true;
    this.waitlistService.updateDeposit(this.entry.id, {
      deposit_status: this.status,
      deposit_amount: String(this.amount ?? '').trim() || null,
      deposit_received_on: this.receivedOn || null,
      deposit_method: (this.method ?? '').trim() || null
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastr.success('Deposit updated.', 'Waitlist');
        this.saved.emit();
      },
      error: () => {
        this.isSubmitting = false;
        this.toastr.error('Could not update the deposit.', 'Error');
      }
    });
  }

  onClose(): void {
    this.closed.emit();
  }
}
