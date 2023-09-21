import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IPet } from 'src/app/models/pet';
import { environment } from 'src/environments/environment';


@Component({
  selector: '[app-pet-card]',
  templateUrl: './pet-card.component.html',
  styleUrls: ['./pet-card.component.css']
})
export class PetCardComponent {
  @Input() pet: IPet;
  @Output() deletingPet = new EventEmitter();

  apiurl = environment.API_URL;
  apihost = environment.API_HOST;


  deletePet(pet_id: any): void{

  this.deletingPet.emit(this.pet.pet_id);
  console.log(this.pet.pet_id);

  // var deletePetModal = (<HTMLInputElement>document.getElementById('deletePetModal'));
    // let modalTitle = deletePetModal?.querySelector('.modal-body h2');
    // let modalBodyInput = <HTMLInputElement>deletePetModal?.querySelector('.modal-body input.pet_id');
    // modalTitle!.textContent = 'Are you sure you want to delete this pet?';
    // modalBodyInput.value = pet_id;

  }
}
