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
  @Output() editingPet = new EventEmitter();


  apiurl = environment.API_URL;
  apihost = environment.API_HOST;


  deletePet(pet_id: any): void{
    this.deletingPet.emit(this.pet.pet_id);
  }

  editPet(pet_id: any): void{
    this.editingPet.emit(this.pet.pet_id);
  }
}
