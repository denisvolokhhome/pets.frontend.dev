import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-pet-delete',
  templateUrl: './pet-delete.component.html',
  styleUrls: ['./pet-delete.component.css']
})
export class PetDeleteComponent {

pet_id: string = '';

  form = new FormGroup({
    petId: new FormControl<string>('')
  });



  deletePet(emittedPetId: string){
    this.pet_id = emittedPetId;
    console.log('deleting pet id... ' + emittedPetId);
  }


  submit() {}
}
