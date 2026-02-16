import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
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
    private toastr: ToastrService,
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

    //<TODO>Add this fields to DB and api</TODO>
    // role:this.builder.control(''),
    // isActive:this.builder.control(false)
  });

  proceedRegistration() {
    if (this.registerForm.valid) {
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
          this.toastr.success(
            'Please contact admin to enable it',
            'User successfully registered'
          );
          this.router.navigate(['login']);
        },
        error: (error) => {
          console.error('Registration error:', error);
          
          // Handle specific error cases
          if (error.error?.detail === 'REGISTER_USER_ALREADY_EXISTS' || 
              (error.status === 400 && error.error?.detail?.includes('already exists'))) {
            const email = this.registerForm.value.email;
            
            // Show clear message that account exists
            this.toastr.error(
              'An account with this email already exists. Please sign in instead.',
              'Account Already Exists',
              {
                timeOut: 8000,
                progressBar: true,
                closeButton: true,
                tapToDismiss: true
              }
            );
            
            // Navigate to login with email pre-filled after a short delay
            setTimeout(() => {
              this.router.navigate(['login'], { 
                queryParams: { email: email }
              });
            }, 2000);
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
