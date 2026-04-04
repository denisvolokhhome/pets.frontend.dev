import { Component, ChangeDetectorRef, HostListener } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
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
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showUserTypeModal) this.showUserTypeModal = false;
    else if (this.showForgotPassword) this.showForgotPassword = false;
  }

  constructor(
    private builder: FormBuilder,
    private toastr: ToastService,
    private service: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  response: any;
  error: any;
  loginError: string | null = null;
  isSubmitting: boolean = false;
  showUserTypeModal: boolean = false;
  showForgotPassword: boolean = false;
  forgotPasswordEmail: string = '';
  forgotPasswordLoading: boolean = false;
  forgotPasswordSent: boolean = false;
  forgotPasswordError: string | null = null;

  loginForm = this.builder.group({
    email: this.builder.control('', [Validators.required, Validators.email]),
    password: this.builder.control('', Validators.required),
  });


  emailFormControl = new FormControl('', [Validators.required, Validators.email])

  ngOnInit() {
    // Check for email query parameter from registration redirect
    this.route.queryParams.subscribe(params => {
      // Handle OAuth errors
      if (params['error']) {
        setTimeout(() => {
          if (params['error'] === 'access_denied') {
            this.loginError = 'Google sign-in was cancelled.';
            this.toastr.warning('Google sign-in was cancelled. You can try again or sign in with your email.', 'Sign-In Cancelled', {
              timeOut: 6000, progressBar: true, closeButton: true
            });
          } else {
            this.loginError = 'Google sign-in failed. Please try again.';
            this.toastr.error('Google sign-in failed. Please try again or sign in with your email.', 'Sign-In Failed', {
              timeOut: 6000, progressBar: true, closeButton: true
            });
          }
        }, 100);
      }

      if (params['email']) {
        this.loginForm.patchValue({
          email: params['email']
        });
        
        // Use setTimeout to avoid Angular change detection errors
        setTimeout(() => {
          // Check if redirected due to existing account
          if (params['accountExists'] === 'true') {
            this.toastr.error(
              'An account with this email already exists. Please sign in instead.',
              'Account Already Exists',
              {
                timeOut: 8000,
                progressBar: true,
                closeButton: true
              }
            );
          } else {
            // Show a helpful message for other redirects
            this.toastr.info('Please enter your password to sign in.', 'Welcome Back');
          }
        }, 100);
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
      if (this.isSubmitting) return;
      this.isSubmitting = true;
      this.loginError = null;
      
      this.service.LoginUser(this.loginForm.value).subscribe({
        next: (res: any) => {
          this.response = res;

          if (this.response.access_token) {
            localStorage.setItem('id_token', this.response.access_token);
            
            this.service.IsLoggedIn().subscribe({
              next: (userResponse: any) => {
                this.isSubmitting = false;
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
                this.isSubmitting = false;
                console.error('Error fetching user info:', err);
                this.loginError = 'Error fetching user information. Please try again.';
                this.toastr.error('Error fetching user information', 'Error', {
                  timeOut: 5000,
                  progressBar: true
                });
              }
            });
          } else {
            this.isSubmitting = false;
          }
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting = false;
          console.error('Login error:', err);
          
          // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            // Check if it's a bad credentials error
            if (err.status === 403) {
              this.loginError = 'Your account has been suspended. If you believe this is a mistake, please contact Breedly support at support@breedly.com for clarification and to request reactivation.';
              this.toastr.error(
                'Your account has been suspended. Please contact support@breedly.com for assistance.',
                'Account Suspended',
                {
                  timeOut: 12000,
                  progressBar: true,
                  closeButton: true,
                  tapToDismiss: true
                }
              );
            } else if (err.status === 400 && err.error?.detail === 'LOGIN_BAD_CREDENTIALS') {
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

  submitForgotPassword() {
    if (!this.forgotPasswordEmail) return;
    this.forgotPasswordLoading = true;
    this.forgotPasswordError = null;
    this.service.forgotPassword(this.forgotPasswordEmail).subscribe({
      next: () => {
        this.forgotPasswordSent = true;
        this.forgotPasswordLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        // Always show success to prevent email enumeration
        this.forgotPasswordSent = true;
        this.forgotPasswordLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
