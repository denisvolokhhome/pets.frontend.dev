import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],

})
export class LoginComponent {
  constructor(
    private builder: FormBuilder,
    private toastr: ToastrService,
    private service: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  response: any;
  error: any;
  loginError: string | null = null;
  showUserTypeModal: boolean = false;

  loginForm = this.builder.group({
    email: this.builder.control('', [Validators.required, Validators.email]),
    password: this.builder.control('', Validators.required),
  });


  emailFormControl = new FormControl('', [Validators.required, Validators.email])

  ngOnInit() {
    // Check for email query parameter from registration redirect
    this.route.queryParams.subscribe(params => {
      if (params['email']) {
        this.loginForm.patchValue({
          email: params['email']
        });
        // Show a helpful message
        this.toastr.info('Please enter your password to sign in.', 'Welcome Back');
      }
    });

    this.service.IsLoggedIn().subscribe(
      (user) => {
        if (user && user.id) {
          // User is authenticated
          console.log('User is authenticated');
          this.router.navigate(['dashboard']);
        } else {
          // User is not authenticated
          console.log('User is not authenticated');
        }
      },
      (error: any) => {
        console.error('Not authenticated:', error);
      }
    );
  }


  proceedLogin() {
    if (this.loginForm.valid) {
      this.loginError = null; // Clear any previous errors
      
      this.service.LoginUser(this.loginForm.value).subscribe({
        next: (res: any) => {
          this.response = res;

          // FastAPI returns access_token, not token
          if (this.response.access_token) {
            localStorage.setItem('id_token', this.response.access_token);
            
            // Fetch user info after successful login
            this.service.IsLoggedIn().subscribe({
              next: (userResponse: any) => {
                if (userResponse && userResponse.id) {
                  localStorage.setItem('id', userResponse.id);
                  this.toastr.success('Welcome back!', 'Login Successful', {
                    timeOut: 3000,
                    progressBar: true
                  });
                  this.router.navigate(['dashboard']);
                }
              },
              error: (err: HttpErrorResponse) => {
                console.error('Error fetching user info:', err);
                this.loginError = 'Error fetching user information. Please try again.';
                this.toastr.error('Error fetching user information', 'Error', {
                  timeOut: 5000,
                  progressBar: true
                });
              }
            });
          }
        },
        error: (err: HttpErrorResponse) => {
          console.error('Login error:', err);
          
          // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            // Check if it's a bad credentials error
            if (err.status === 400 && err.error?.detail === 'LOGIN_BAD_CREDENTIALS') {
              this.loginError = 'Invalid email or password';
              this.toastr.error(
                'The email or password you entered is incorrect. Please try again or create a new account.',
                'Login Failed',
                { 
                  timeOut: 8000,
                  progressBar: true,
                  closeButton: true,
                  tapToDismiss: true
                }
              );
            } else if (err.status === 0) {
              // Network error
              this.loginError = 'Cannot connect to server. Please check your connection.';
              this.toastr.error('Cannot connect to server. Please check your internet connection.', 'Connection Error', {
                timeOut: 8000,
                progressBar: true,
                closeButton: true
              });
            } else {
              this.loginError = 'An error occurred during login. Please try again.';
              this.toastr.error('An unexpected error occurred. Please try again.', 'Error', {
                timeOut: 5000,
                progressBar: true,
                closeButton: true
              });
            }
            this.cdr.detectChanges();
          }, 0);
        }
      });
    } else {
      setTimeout(() => {
        this.loginError = 'Please fill in all required fields correctly';
        this.toastr.warning('Please fill in all required fields correctly', 'Form Validation', {
          timeOut: 5000,
          progressBar: true
        });
        this.cdr.detectChanges();
      }, 0);
    }
  }

  signInWithGoogle() {
    this.service.signInWithGoogle();
  }
}
