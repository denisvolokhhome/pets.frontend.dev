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
      (response) => {
        if (response === true) {
          // User is authenticated
          console.log('User is authenticated');
          this.router.navigate(['dashboard']);
        } else {
          // User is not authenticated
          console.log('User is not authenticated');
        }
      },
      (error: any) => {
        console.error(error);
      }
    );
  }


  proceedLogin() {
    if (this.loginForm.valid) {
      this.service.LoginUser(this.loginForm.value).subscribe(
        (res) => {
          this.response = res;

          console.log(this.response.token); //token
          console.log(this.response.user.email); //email
          this.router.navigate(['dashboard']);
          localStorage.setItem('id_token', this.response.token);
          localStorage.setItem('id', this.response.user.id);
        },
        (err: HttpErrorResponse) => {
          this.toastr.error('You entered wrong credentials', 'Error');
        }
      );
    }else{
      this.toastr.error('Please fill the form correctly', 'Error');
    }
  }
}
