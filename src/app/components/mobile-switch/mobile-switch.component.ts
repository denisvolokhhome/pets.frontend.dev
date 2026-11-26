import { ChangeDetectorRef, Component, ElementRef, HostListener, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import * as QRCode from 'qrcode';
import { MobileSigninService } from '../../services/mobile-signin.service';
import { MobileSigninCode, MobileSigninStatus } from '../../models/mobile-signin';

type PopupState = 'loading' | 'ready' | 'used' | 'already' | 'error';

/** Reuse the code on screen when coming back to the tab if it still has this long to live. */
const REUSE_IF_LEFT_MS = 20_000;
const POLL_MS = 2_000;
const AUTO_CLOSE_MS = 2_500;

/**
 * Top-bar phone button (hidden ≤768px): opens a QR code that signs the phone in as this
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
  /** Bumped on every generate/stop so late async results from an older request are ignored. */
  private generation = 0;
  private tick?: ReturnType<typeof setInterval>;
  private poll?: ReturnType<typeof setInterval>;
  private closeTimer?: ReturnType<typeof setTimeout>;
  private createSub?: Subscription;
  private pollSub?: Subscription;

  constructor(private service: MobileSigninService, private router: Router,
              private cdr: ChangeDetectorRef, private zone: NgZone) {}

  get countdown(): string {
    const s = Math.max(0, this.secondsLeft);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  /** True while it's fine to create codes: popup open, tab visible, not finished. */
  private get active(): boolean {
    return this.open && !document.hidden && this.state !== 'used' && this.state !== 'already';
  }

  openPopup(): void {
    this.open = true;
    this.state = 'loading';
    this.resumeOrGenerate();
    setTimeout(() => this.dialogTitle?.nativeElement.focus());
  }

  close(): void {
    this.open = false;
    this.stopCodeTimers();
    this.clearCloseTimer();
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
    if (!this.open || this.state === 'used' || this.state === 'already') return;  // success screen keeps its auto-close
    if (document.hidden) {
      this.stopCodeTimers();
    } else {
      this.resumeOrGenerate();
    }
  }

  generate(): void {
    this.stopCodeTimers();
    const generation = this.generation;
    this.code = null;
    this.state = 'loading';
    this.errorMessage = '';
    this.createSub = this.service.createCode(this.router.url || '/dashboard').subscribe({
      next: async code => {
        let dataUrl: string;
        try {
          dataUrl = await QRCode.toDataURL(code.url, { errorCorrectionLevel: 'M', margin: 1, width: 232 });
        } catch {
          if (generation === this.generation) this.fail('Could not draw the QR code. Please try again.');
          return;
        }
        // The popup may have closed, the tab been hidden or a newer code requested meanwhile
        if (generation !== this.generation || !this.active) return;
        this.code = code;
        this.expiresAt = Date.now() + code.expires_in * 1000;
        this.qrDataUrl = dataUrl;
        this.state = 'ready';
        this.startCodeTimers();
        this.cdr.markForCheck();
      },
      error: err => {
        if (generation === this.generation) this.fail(err?.error?.detail || 'Could not create a code. Please try again.');
      },
    });
  }

  /** Coming back: keep showing the current code if it still has time left, else make a new one. */
  private resumeOrGenerate(): void {
    if (this.code && this.qrDataUrl && this.expiresAt - Date.now() > REUSE_IF_LEFT_MS) {
      this.stopCodeTimers();
      this.state = 'ready';
      this.startCodeTimers();
      this.checkStatus();
      this.cdr.markForCheck();
    } else {
      this.generate();
    }
  }

  private startCodeTimers(): void {
    this.secondsLeft = Math.ceil((this.expiresAt - Date.now()) / 1000);
    this.tick = setInterval(() => this.zone.run(() => {
      this.secondsLeft = Math.ceil((this.expiresAt - Date.now()) / 1000);
      if (this.secondsLeft <= 0 && this.active) this.generate();  // fresh code, no click needed
      this.cdr.markForCheck();
    }), 1000);
    this.poll = setInterval(() => this.checkStatus(), POLL_MS);
  }

  private checkStatus(): void {
    if (!this.code || (this.pollSub && !this.pollSub.closed)) return;
    const id = this.code.id;
    this.pollSub = this.service.status(id).subscribe({
      next: ({ status }) => this.onStatus(id, status),
      error: () => { /* transient; try again on the next tick */ },
    });
  }

  private onStatus(id: string, status: MobileSigninStatus): void {
    if (!this.open || !this.code || this.code.id !== id) return;
    if (status === 'used' || status === 'already_signed_in') {
      this.stopCodeTimers();
      this.state = status === 'used' ? 'used' : 'already';
      this.cdr.markForCheck();
      this.clearCloseTimer();
      this.closeTimer = setTimeout(() => this.zone.run(() => {
        if (this.open) this.close();
        this.cdr.markForCheck();
      }), AUTO_CLOSE_MS);
    } else if (status === 'expired' && this.active) {
      this.generate();
    }
  }

  private fail(message: string): void {
    this.stopCodeTimers();
    this.state = 'error';
    this.errorMessage = message;
    this.cdr.markForCheck();
  }

  /** Stops code creation, countdown and polling, and invalidates in-flight results. */
  private stopCodeTimers(): void {
    this.generation++;
    if (this.tick) clearInterval(this.tick);
    if (this.poll) clearInterval(this.poll);
    this.tick = this.poll = undefined;
    this.createSub?.unsubscribe();
    this.pollSub?.unsubscribe();
  }

  private clearCloseTimer(): void {
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.closeTimer = undefined;
  }

  ngOnDestroy(): void {
    this.stopCodeTimers();
    this.clearCloseTimer();
  }
}
