import { ChangeDetectorRef, Component, ElementRef, HostListener, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import * as QRCode from 'qrcode';
import { MobileSigninCode, MobileSigninService, MobileSigninStatus } from '../../services/mobile-signin.service';

type PopupState = 'loading' | 'ready' | 'used' | 'already' | 'error';

/**
 * Top-bar phone button (desktop only): opens a QR code that signs the phone in as this
 * user. A fresh code every 2 minutes while the popup is open and the tab is visible;
 * the popup polls the code's status and confirms once the phone is signed in.
 */
@Component({
  selector: 'app-mobile-switch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mobile-switch.component.html',
  styleUrls: ['./mobile-switch.component.css'],
})
export class MobileSwitchComponent implements OnDestroy {
  @ViewChild('trigger') trigger?: ElementRef<HTMLButtonElement>;
  @ViewChild('dialogTitle') dialogTitle?: ElementRef<HTMLElement>;

  open = false;
  state: PopupState = 'loading';
  qrDataUrl: string | null = null;
  secondsLeft = 0;
  errorMessage = '';

  private code: MobileSigninCode | null = null;
  private expiresAt = 0;
  private tick?: ReturnType<typeof setInterval>;
  private poll?: ReturnType<typeof setInterval>;
  private closeTimer?: ReturnType<typeof setTimeout>;
  private sub?: Subscription;
  private pollSub?: Subscription;

  constructor(private service: MobileSigninService, private router: Router,
              private cdr: ChangeDetectorRef, private zone: NgZone) {}

  get countdown(): string {
    const s = Math.max(0, this.secondsLeft);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  openPopup(): void {
    this.open = true;
    this.generate();
    setTimeout(() => this.dialogTitle?.nativeElement.focus());
  }

  close(): void {
    this.open = false;
    this.stop();
    this.code = null;
    this.qrDataUrl = null;
    setTimeout(() => this.trigger?.nativeElement.focus());
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.close();
  }

  /** No codes are created while nobody can see them. */
  @HostListener('document:visibilitychange')
  onVisibility(): void {
    if (!this.open) return;
    if (document.hidden) {
      this.stop();
    } else if (this.state !== 'used' && this.state !== 'already') {
      this.generate();
    }
  }

  generate(): void {
    this.stop();
    this.state = 'loading';
    this.errorMessage = '';
    this.sub = this.service.createCode(this.router.url || '/dashboard').subscribe({
      next: async code => {
        this.code = code;
        this.expiresAt = Date.now() + code.expires_in * 1000;
        try {
          this.qrDataUrl = await QRCode.toDataURL(code.url, { errorCorrectionLevel: 'M', margin: 1, width: 232 });
        } catch {
          this.fail('Could not draw the QR code. Please try again.');
          return;
        }
        this.state = 'ready';
        this.startTimers();
        this.cdr.markForCheck();
      },
      error: err => this.fail(err?.error?.detail || 'Could not create a code. Please try again.'),
    });
  }

  private startTimers(): void {
    this.secondsLeft = Math.ceil((this.expiresAt - Date.now()) / 1000);
    this.tick = setInterval(() => this.zone.run(() => {
      this.secondsLeft = Math.ceil((this.expiresAt - Date.now()) / 1000);
      if (this.secondsLeft <= 0) this.generate();  // fresh code, no click needed
      this.cdr.markForCheck();
    }), 1000);
    this.poll = setInterval(() => this.checkStatus(), 2000);
  }

  private checkStatus(): void {
    if (!this.code || this.pollSub && !this.pollSub.closed) return;
    const id = this.code.id;
    this.pollSub = this.service.status(id).subscribe({
      next: ({ status }) => this.onStatus(id, status),
      error: () => { /* transient; try again on the next tick */ },
    });
  }

  private onStatus(id: string, status: MobileSigninStatus): void {
    if (!this.code || this.code.id !== id) return;
    if (status === 'used' || status === 'already_signed_in') {
      this.stop();
      this.state = status === 'used' ? 'used' : 'already';
      this.cdr.markForCheck();
      this.closeTimer = setTimeout(() => this.zone.run(() => { if (this.open) this.close(); this.cdr.markForCheck(); }), 2500);
    } else if (status === 'expired') {
      this.generate();
    }
  }

  private fail(message: string): void {
    this.stop();
    this.state = 'error';
    this.errorMessage = message;
    this.cdr.markForCheck();
  }

  private stop(): void {
    if (this.tick) clearInterval(this.tick);
    if (this.poll) clearInterval(this.poll);
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.tick = this.poll = this.closeTimer = undefined;
    this.sub?.unsubscribe();
    this.pollSub?.unsubscribe();
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
