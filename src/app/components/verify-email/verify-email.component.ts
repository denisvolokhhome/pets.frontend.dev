import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';
import { ToastService } from 'src/app/services/toast.service';
import { environment } from 'src/environments/environment';

@Component({
  standalone: false,
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css']
})
export class VerifyEmailComponent implements OnInit {
  email: string = '';
  mode: 'pending' | 'verifying' | 'success' | 'error' = 'pending';
  errorMessage: string = '';
  isResending = false;
  resendCooldown = 0;
  private cooldownInterval: any;

  private static readonly COOLDOWN_KEY = 'verify_resend_until';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private toastr: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.restoreCooldown();

    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      const token = params['token'];

      if (token) {
        this.verifyToken(token);
      }
    });
  }

  verifyToken(token: string): void {
    this.mode = 'verifying';
    this.http.post(
      `${environment.API_URL}/auth/verify`,
      { token }
    ).subscribe({
      next: () => {
        this.mode = 'success';
        this.toastr.success('Your email has been verified!', 'Verified');
      },
      error: (err) => {
        this.mode = 'error';
        const detail = err?.error?.detail;
        if (detail === 'VERIFY_USER_BAD_TOKEN') {
          this.errorMessage = 'This verification link is invalid or has expired.';
        } else if (detail === 'VERIFY_USER_ALREADY_VERIFIED') {
          this.mode = 'success';
          this.toastr.info('Your email is already verified.', 'Already Verified');
        } else {
          this.errorMessage = 'Verification failed. Please try again.';
        }
      }
    });
  }

  resendVerification(): void {
    if (this.isResending || this.resendCooldown > 0 || !this.email) return;
    this.isResending = true;

    this.http.post(
      `${environment.API_URL}/auth/request-verify-token`,
      { email: this.email }
    ).subscribe({
      next: () => {
        this.isResending = false;
        this.toastr.success('Verification email sent!', 'Email Sent');
        this.startCooldown();
      },
      error: () => {
        this.isResending = false;
        // Always show success to prevent email enumeration
        this.toastr.success('If the account exists, a verification email has been sent.', 'Email Sent');
        this.startCooldown();
      }
    });
  }

  private startCooldown(): void {
    const until = Date.now() + 60000;
    localStorage.setItem(VerifyEmailComponent.COOLDOWN_KEY, until.toString());
    this.tickCooldown(until);
  }

  private restoreCooldown(): void {
    const raw = localStorage.getItem(VerifyEmailComponent.COOLDOWN_KEY);
    if (!raw) return;
    const until = parseInt(raw, 10);
    if (until > Date.now()) {
      this.tickCooldown(until);
    } else {
      localStorage.removeItem(VerifyEmailComponent.COOLDOWN_KEY);
    }
  }

  private tickCooldown(until: number): void {
    clearInterval(this.cooldownInterval);
    this.resendCooldown = Math.ceil((until - Date.now()) / 1000);
    this.cooldownInterval = setInterval(() => {
      this.resendCooldown = Math.ceil((until - Date.now()) / 1000);
      if (this.resendCooldown <= 0) {
        this.resendCooldown = 0;
        clearInterval(this.cooldownInterval);
        localStorage.removeItem(VerifyEmailComponent.COOLDOWN_KEY);
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
