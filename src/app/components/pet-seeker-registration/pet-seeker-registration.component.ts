import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  standalone: false,
  selector: 'app-pet-seeker-registration',
  templateUrl: './pet-seeker-registration.component.html',
  styleUrls: ['./pet-seeker-registration.component.css'],
})
export class PetSeekerRegistrationComponent {
  constructor(
    private builder: FormBuilder,
    private toastr: ToastrService,
    private service: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // If logged in, navigate to dashboard
    this.service.IsLoggedIn().subscribe((res) => {
      if (res) {
        console.log('user logged in, redirecting to dashboard...');
        this.router.navigate(['dashboard']);
      }
    });
  }

  registerForm = this.builder.group({
    email: this.builder.control(
      '',
      Validators.compose([Validators.required, Validators.email])
    ),
    password: this.builder.control('', Validators.required),
    name: this.builder.control(''), // Optional field
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

      const formValue = {
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        name: this.registerForm.value.name || undefined, // Send undefined if empty
      };

      this.service.RegisterPetSeeker(formValue).subscribe({
        next: (response: any) => {
          // Store JWT token
          if (response.access_token) {
            localStorage.setItem('id_token', response.access_token);
          }
          
          this.toastr.success(
            'Welcome to Breedly!',
            'Account Created Successfully'
          );
          
          // Redirect to pet seeker dashboard
          this.router.navigate(['dashboard']);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Registration error:', error);
          console.error('Error detail:', error.error?.detail);
          console.error('Error status:', error.status);

          if (error.error?.detail === 'REGISTER_USER_ALREADY_EXISTS' || 
              (error.status === 400 && error.error?.detail?.includes('already exists'))) {
            this.emailExistsError = 'An account with this email already exists.';
            this.cdr.detectChanges();
          } else if (error.status === 400) {
            this.toastr.error(
              'Please check your information and try again.',
              'Invalid Registration Data'
            );
          } else if (error.status === 0) {
            this.toastr.error(
              'Unable to connect to the server. Please check your connection.',
              'Connection Error'
            );
          } else {
            this.toastr.error(
              'An unexpected error occurred. Please try again later.',
              'Registration Failed'
            );
          }
        },
      });
    } else {
      this.toastr.warning('Please enter valid data');
    }
  }

  signInWithGoogle() {
    this.service.signInWithGoogle();
  }
}
