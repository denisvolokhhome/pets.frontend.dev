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
  @Output() PetId = new EventEmitter();

  apiurl = environment.API_URL;
  apihost = environment.API_HOST;


  deletePet(pet_id: any): void{
    this.PetId.emit(pet_id);
    console.log('pet id to delete: '+pet_id);
  }
}
