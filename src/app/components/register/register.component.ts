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
    //if logged in navigate to home

    this.service.IsLoggedIn().subscribe((res) => {
      if (res) {
        console.log('user logged in, redirecting to home...');
        this.router.navigate(['']);
      }
    });
  }
  // TODO: Make better password validation and confirm email validation
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

    //<TODO>Add this fields to DB and api</TODO>
    // role:this.builder.control(''),
    // isActive:this.builder.control(false)
  });

  passwordErrors: string[] = [];
  emailExistsError: string | null = null;

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
    
    if (this.registerForm.valid) {
      // Validate password before submitting
      if (!this.validatePassword()) {
        return;
      }

      // Combine first and last name into a single name field for the API
      const formValue = {
        ...this.registerForm.value,
        name: `${this.registerForm.value.firstName} ${this.registerForm.value.lastName}`.trim()
      };
      
      // Remove firstName and lastName as they're not needed by the API
      delete formValue.firstName;
      delete formValue.lastName;
      
      this.service.RegisterUser(formValue).subscribe({
        next: () => {
          localStorage.setItem('breeder_just_registered', 'true');
          this.toastr.success(
            'Please sign in to get started',
            'Account created successfully'
          );
          this.router.navigate(['login']);
        },
        error: (error) => {
          console.error('Registration error:', error);
          
          // Handle specific error cases
          if (error.error?.detail === 'REGISTER_SSO_ACCOUNT_EXISTS' || error.status === 409) {
            this.toastr.info(
              'An account with this email was created using Google Sign-In. Please sign in with Google.',
              'Account Exists'
            );
            this.router.navigate(['login'], { queryParams: { hint: 'sso' } });
          } else if (error.error?.detail === 'REGISTER_USER_ALREADY_EXISTS' || 
              (error.status === 400 && error.error?.detail?.includes('already exists'))) {
            this.emailExistsError = 'An account with this email already exists.';
          } else if (error.error?.detail) {
            // Handle other specific error messages from the API
            this.toastr.error('Please check your information and try again.', 'Registration Failed');
          } else if (error.status === 400) {
            this.toastr.error('Please check your information and try again.', 'Invalid Registration Data');
          } else if (error.status === 0) {
            this.toastr.error('Unable to connect to the server. Please check your connection.', 'Connection Error');
          } else {
            this.toastr.error('An unexpected error occurred. Please try again later.', 'Registration Failed');
          }
        }
      });
    } else {
      this.toastr.warning('Please enter valid data');
    }
  }
}
