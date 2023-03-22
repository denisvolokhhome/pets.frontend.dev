import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  constructor(private builder:FormBuilder, private toastr:ToastrService){
  }

  registerForm = this.builder.group({
    id:this.builder.control('', Validators.compose([Validators.required, Validators.minLength(5)])),
    name:this.builder.control('', Validators.required),
    email:this.builder.control('', Validators.compose([Validators.required, Validators.email])),
    password:this.builder.control('', Validators.compose([Validators.required , Validators.pattern("^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$")])),
    password_confirmation:this.builder.control('', Validators.required),
    role:this.builder.control(''),
    isActive:this.builder.control(false)
  })

  proceedRegistration(){
    if(this.registerForm.valid){

    }else{
      this.toastr.warning('Please enter valid data');
    }


  }


}
