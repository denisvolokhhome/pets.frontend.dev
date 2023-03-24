import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  constructor(private builder:FormBuilder, private toastr:ToastrService,
    private service:AuthService, private router:Router){
  }
// TODO: Make better password validation and confirm email validation
  registerForm = this.builder.group({
    name:this.builder.control('', ),
    email:this.builder.control('', Validators.compose([Validators.required, Validators.email])),
    password:this.builder.control('', Validators.required),
    password_confirmation:this.builder.control('', Validators.required),

    //<TODO>Add this fields to DB and api</TODO>
    // role:this.builder.control(''),
    // isActive:this.builder.control(false)
  })

  proceedRegistration(){
    if(this.registerForm.valid){
      this.service.RegisterUser(this.registerForm.value).subscribe(
        () => {
          this.toastr.success('Please contact admin to enable it','User successfully registered');
          this.router.navigate(['login']);
      }
      );

    }else{
      this.toastr.warning('Please enter valid data');
    }


  }


}
