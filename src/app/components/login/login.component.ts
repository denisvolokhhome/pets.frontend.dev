import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],

})
export class LoginComponent {
  constructor(
    private builder: FormBuilder,
    private toastr: ToastrService,
    private service: AuthService,
    private router: Router
  ) {}

  response: any;
  error: any;

  loginForm = this.builder.group({
    email: this.builder.control('', [Validators.required, Validators.email]),
    password: this.builder.control('', Validators.required),
  });


  emailFormControl = new FormControl('', [Validators.required, Validators.email])

  ngOnInit() {
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
      this.service.LoginUser(this.loginForm.value).subscribe(
        (res: any) => {
          this.response = res;

          // FastAPI returns access_token, not token
          if (this.response.access_token) {
            localStorage.setItem('id_token', this.response.access_token);
            
            // Fetch user info after successful login
            this.service.IsLoggedIn().subscribe(
              (userResponse: any) => {
                if (userResponse && userResponse.id) {
                  localStorage.setItem('id', userResponse.id);
                  this.toastr.success('Login successful', 'Success');
                  this.router.navigate(['dashboard']);
                }
              },
              (err: HttpErrorResponse) => {
                console.error('Error fetching user info:', err);
                this.toastr.error('Error fetching user information', 'Error');
              }
            );
          }
        },
        (err: HttpErrorResponse) => {
          console.error('Login error:', err);
          this.toastr.error('You entered wrong credentials', 'Error');
        }
      );
    } else {
      this.toastr.error('Please fill the form correctly', 'Error');
    }
  }
}
