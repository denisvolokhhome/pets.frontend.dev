import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  standalone: false,
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  constructor(
    private builder: FormBuilder,
    private toastr: ToastService,
    private service: AuthService,
    private router: Router
  ) {
    this.service.IsLoggedIn().subscribe((res) => {
      if (res) {
        console.log('user logged in, redirecting to home...');
        this.router.navigate(['']);
      }
    });
  }

  // Account type selection
  selectedAccountType: 'breeder' | 'pet_seeker' | 'service' | null = null;

  // Selected service categories (for service provider flow)
  selectedCategoryIds: number[] = [];
  showCategoryError = false;

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

  selectAccountType(type: 'breeder' | 'pet_seeker' | 'service'): void {
    this.selectedAccountType = type;
    // Reset category state when switching away from service
    if (type !== 'service') {
      this.selectedCategoryIds = [];
      this.showCategoryError = false;
    }
  }

  onCategoriesSelected(ids: number[]): void {
    this.selectedCategoryIds = ids;
    if (ids.length > 0) {
      this.showCategoryError = false;
    }
  }

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

  proceedRegistration() {
    this.emailExistsError = null;

    // Require account type selection
    if (!this.selectedAccountType) {
      this.toastr.warning('Please select an account type to continue');
      return;
    }

    // Validate category selection for service providers
    if (this.selectedAccountType === 'service' && this.selectedCategoryIds.length === 0) {
      this.showCategoryError = true;
      return;
    }

    if (this.registerForm.valid) {
      if (!this.validatePassword()) {
        return;
      }
      if (this.isSubmitting) return;
      this.isSubmitting = true;

      const formValue = {
        ...this.registerForm.value,
        name: `${this.registerForm.value.firstName} ${this.registerForm.value.lastName}`.trim()
      };

      delete formValue.firstName;
      delete formValue.lastName;

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
        console.error('Registration error:', error);

        if (error.error?.detail === 'REGISTER_SSO_ACCOUNT_EXISTS' || error.status === 409) {
          this.toastr.info(
            'An account with this email was created using Google Sign-In. Please sign in with Google.',
            'Account Exists'
          );
          this.router.navigate(['login'], { queryParams: { hint: 'sso' } });
        } else if (
          error.error?.detail === 'REGISTER_USER_ALREADY_EXISTS' ||
          (error.status === 400 && error.error?.detail?.includes('already exists'))
        ) {
          this.emailExistsError = 'An account with this email already exists.';
        } else if (error.error?.detail) {
          this.toastr.error('Please check your information and try again.', 'Registration Failed');
        } else if (error.status === 400) {
          this.toastr.error('Please check your information and try again.', 'Invalid Registration Data');
        } else if (error.status === 0) {
          this.toastr.error('Unable to connect to the server. Please check your connection.', 'Connection Error');
        } else {
          this.toastr.error('An unexpected error occurred. Please try again later.', 'Registration Failed');
        }
      };

      if (this.selectedAccountType === 'service') {
        this.service.RegisterServiceProvider({
          ...formValue,
          category_ids: this.selectedCategoryIds
        }).subscribe({ next: handleSuccess, error: handleError });
      } else if (this.selectedAccountType === 'breeder') {
        this.service.RegisterUser(formValue).subscribe({ next: handleSuccess, error: handleError });
      } else {
        this.service.RegisterPetSeeker(formValue).subscribe({ next: handleSuccess, error: handleError });
      }
    } else {
      this.toastr.warning('Please enter valid data');
    }
  }
}
