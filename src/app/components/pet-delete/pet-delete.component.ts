import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-pet-delete',
  templateUrl: './pet-delete.component.html',
  styleUrls: ['./pet-delete.component.css']
})
export class PetDeleteComponent {

  form = new FormGroup({
    petId: new FormControl<string>('')
  });


  submit() {}
}
