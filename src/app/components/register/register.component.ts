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
    name: this.builder.control(''),
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
      this.service.RegisterUser(this.registerForm.value).subscribe({
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
          if (error.error?.detail === 'REGISTER_USER_ALREADY_EXISTS') {
            // Security: Don't reveal that email exists, redirect to login instead
            const email = this.registerForm.value.email;
            this.toastr.info(
              'If you already have an account, please sign in.',
              'Account Check'
            );
            // Navigate to login with email pre-filled
            this.router.navigate(['login'], { 
              queryParams: { email: email }
            });
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
