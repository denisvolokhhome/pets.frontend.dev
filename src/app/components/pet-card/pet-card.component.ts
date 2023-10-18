import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IPet } from 'src/app/models/pet';
import { DataService } from 'src/app/services/data.service';
import { environment } from 'src/environments/environment';


@Component({
  selector: '[app-pet-card]',
  templateUrl: './pet-card.component.html',
  styleUrls: ['./pet-card.component.css']
})
export class PetCardComponent {

  constructor(private dataService: DataService){}

  @Input() pet: IPet;
  @Output() deletingPet = new EventEmitter();
  @Output() editingPet = new EventEmitter();


  apiurl = environment.API_URL;
  apihost = environment.API_HOST;


  deletePet(pet_id: any): void{
    this.deletingPet.emit(this.pet.pet_id);
  }

  editPet(pet_id: any): void{
    // this.dataService.getPet(this.pet.pet_id).subscribe(

    // )
    this.editingPet.emit(this.pet);
  }
}
