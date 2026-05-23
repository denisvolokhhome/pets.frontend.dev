import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  standalone: false,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  constructor(
    private builder: FormBuilder,
    private toastr: ToastService,
    private service: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.service.IsLoggedIn().subscribe((res) => {
      if (res) {
        this.router.navigate(['']);
      }
    });
    // Pre-select account type from query param (e.g. ?type=service from home page CTA)
    this.route.queryParams.subscribe(params => {
      if (params['type'] === 'service') {
        this.selectAccountType('service');
        this.currentStep = 1;
      }
    });
  }

  // ── Stepper state ──────────────────────────────────────────────────────────
  // Steps for service provider: 1=account type, 2=categories, 3=account details
  // Steps for breeder/pet seeker: 1=account type, 2=account details (skip categories)
  currentStep = 1;

  get totalSteps(): number {
    return 2;
  }

  get stepLabel(): string {
    if (this.currentStep === 1) return 'Choose Account Type';
    return 'Create Account';
  }

  // ── Account type ───────────────────────────────────────────────────────────
  selectedAccountType: 'breeder' | 'pet_seeker' | 'service' | null = null;

  selectAccountType(type: 'breeder' | 'pet_seeker' | 'service'): void {
    this.selectedAccountType = type;
    if (type !== 'service') {
      this.selectedCategoryIds = [];
    }
  }

  goToNextStep(): void {
    if (this.currentStep === 1) {
      if (!this.selectedAccountType) {
        this.toastr.warning('Please select an account type to continue');
        return;
      }
      this.currentStep = 2;
      return;
    }
  }

  goToPrevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // ── Categories — removed from registration flow ───────────────────────────
  // Categories are now managed post-registration via Settings → My Service Categories
  selectedCategoryIds: number[] = [];

  // ── Registration form (step 3 / step 2 for non-service) ───────────────────
  registerForm = this.builder.group({
    firstName: this.builder.control('', Validators.required),
    lastName: this.builder.control('', Validators.required),
    email: this.builder.control(
      '',
      Validators.compose([Validators.required, Validators.email])
    ),
    password: this.builder.control('', Validators.required),
    password_confirmation: this.builder.control('', Validators.required),
    acceptTerms: this.builder.control(false, Validators.requiredTrue),
  });

  passwordErrors: string[] = [];
  emailExistsError: string | null = null;
  isSubmitting = false;

  validatePassword(): boolean {
    this.passwordErrors = [];
    const password = this.registerForm.value.password || '';
    const email = this.registerForm.value.email || '';

    if (password.length < 8) {
      this.passwordErrors.push('Password must be at least 8 characters long');
    }
    if (password.length > 100) {
      this.passwordErrors.push('Password must be at most 100 characters long');
    }
    if (!/[a-zA-Z]/.test(password)) {
      this.passwordErrors.push('Password must contain at least one letter');
    }
    if (!/\d/.test(password)) {
      this.passwordErrors.push('Password must contain at least one digit');
    }
    if (password.toLowerCase() === email.toLowerCase()) {
      this.passwordErrors.push('Password cannot be the same as email');
    }

    return this.passwordErrors.length === 0;
  }

  proceedRegistration(): void {
    this.emailExistsError = null;

    if (!this.registerForm.valid) {
      this.toastr.warning('Please fill in all required fields');
      return;
    }
    if (!this.validatePassword()) return;
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const formValue = {
      ...this.registerForm.value,
      name: `${this.registerForm.value.firstName} ${this.registerForm.value.lastName}`.trim()
    };
    delete (formValue as any).firstName;
    delete (formValue as any).lastName;

    const handleSuccess = () => {
      this.isSubmitting = false;
      if (this.selectedAccountType === 'service') {
        localStorage.setItem('service_provider_just_registered', 'true');
      } else {
        localStorage.setItem('breeder_just_registered', 'true');
      }
      this.router.navigate(['/verify-email'], { queryParams: { email: formValue.email } });
    };

    const handleError = (error: any) => {
      this.isSubmitting = false;
      if (error.error?.detail === 'REGISTER_SSO_ACCOUNT_EXISTS' || error.status === 409) {
        this.toastr.info('An account with this email was created using Google Sign-In. Please sign in with Google.', 'Account Exists');
        this.router.navigate(['login'], { queryParams: { hint: 'sso' } });
      } else if (error.error?.detail === 'REGISTER_USER_ALREADY_EXISTS' || (error.status === 400 && error.error?.detail?.includes('already exists'))) {
        this.emailExistsError = 'An account with this email already exists.';
      } else if (error.status === 0) {
        this.toastr.error('Unable to connect to the server. Please check your connection.', 'Connection Error');
      } else {
        this.toastr.error('Please check your information and try again.', 'Registration Failed');
      }
    };

    if (this.selectedAccountType === 'service') {
      this.service.RegisterServiceProvider({ ...formValue, category_ids: [] })
        .subscribe({ next: handleSuccess, error: handleError });
    } else if (this.selectedAccountType === 'breeder') {
      this.service.RegisterUser(formValue).subscribe({ next: handleSuccess, error: handleError });
    } else {
      this.service.RegisterPetSeeker(formValue).subscribe({ next: handleSuccess, error: handleError });
    }
  }
}
