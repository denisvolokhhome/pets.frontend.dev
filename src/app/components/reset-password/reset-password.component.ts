import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: false,
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  token: string = '';
  isLoading = false;
  success = false;
  errorMsg: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.errorMsg = 'Invalid or missing reset token. Please request a new password reset.';
    }
  }

  submit(): void {
    if (this.form.invalid || !this.token) return;
    const { password, confirmPassword } = this.form.value;
    if (password !== confirmPassword) {
      this.errorMsg = 'Passwords do not match.';
      return;
    }
    this.isLoading = true;
    this.errorMsg = null;
    this.authService.resetPassword(this.token, password).subscribe({
      next: () => {
        this.success = true;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 400) {
          this.errorMsg = 'This reset link has expired or is invalid. Please request a new one.';
        } else {
          this.errorMsg = 'Something went wrong. Please try again.';
        }
      }
    });
  }
}
