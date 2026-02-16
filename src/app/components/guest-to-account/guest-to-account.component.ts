import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  standalone: false,
  selector: 'app-guest-to-account',
  templateUrl: './guest-to-account.component.html',
  styleUrls: ['./guest-to-account.component.css'],
})
export class GuestToAccountComponent implements OnInit {
  linkedMessagesCount: number = 0;

  constructor(
    private builder: FormBuilder,
    private toastr: ToastrService,
    private service: AuthService,
    private router: Router,
    private route: ActivatedRoute
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
      { value: '', disabled: true },
      Validators.compose([Validators.required, Validators.email])
    ),
    password: this.builder.control('', Validators.required),
    name: this.builder.control(''), // Optional field
  });

  ngOnInit() {
    // Pre-fill email from query parameter
    this.route.queryParams.subscribe((params) => {
      if (params['email']) {
        this.registerForm.patchValue({
          email: params['email'],
        });
      }
    });
  }

  proceedRegistration() {
    if (this.registerForm.valid) {
      const formValue = {
        email: this.registerForm.get('email')?.value, // Get value from disabled field
        password: this.registerForm.value.password,
        name: this.registerForm.value.name || undefined,
      };

      this.service.ConvertGuestToAccount(formValue).subscribe({
        next: (response: any) => {
          // Store JWT token
          if (response.access_token) {
            localStorage.setItem('id_token', response.access_token);
          }

          // Store linked messages count
          this.linkedMessagesCount = response.linked_messages_count || 0;

          const messageText =
            this.linkedMessagesCount > 0
              ? `${this.linkedMessagesCount} previous message(s) linked to your account`
              : 'Welcome to Breedly!';

          this.toastr.success(messageText, 'Account Created Successfully', {
            timeOut: 5000,
          });

          // Redirect to messages dashboard
          this.router.navigate(['settings/messages']);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Registration error:', error);

          if (error.error?.detail === 'REGISTER_USER_ALREADY_EXISTS') {
            const email = this.registerForm.get('email')?.value;
            this.toastr.info(
              'If you already have an account, please sign in.',
              'Account Check'
            );
            this.router.navigate(['login'], {
              queryParams: { email: email },
            });
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
      this.toastr.warning('Please enter a valid password');
    }
  }
}
