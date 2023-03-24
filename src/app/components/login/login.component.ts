import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
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
    email: this.builder.control('', Validators.required),
    password: this.builder.control('', Validators.required),
  });

  proceedLogin() {
    if (this.loginForm.valid) {
      this.service.LoginUser(this.loginForm.value).subscribe(
        (res) => {
          this.response = res;

          console.log(this.response.token); //token
          console.log(this.response.user.email); //email
        },
        (err: HttpErrorResponse) => {
          this.toastr.error('You entered wrong credentials', 'Error');
        }
      );
    }
  }
}
