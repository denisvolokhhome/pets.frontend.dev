import { Component, OnInit } from '@angular/core';
import { IPet } from 'src/app/models/pet';
import { DataService } from 'src/app/services/data.service';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  selector: 'app-pets',
  templateUrl: './pets.component.html',
  styleUrls: ['./pets.component.css']
})
export class PetsComponent implements OnInit {

  constructor(
    public DataService: DataService,
    public ModalService: ModalService
  ){}

  pets: IPet [] = [];
  pet: IPet;
  view: string = 'cards';
  title: string = 'Pets';
  term: string = '';
  petId: string = '';

  ngOnInit(): void {

    this.DataService.getPetsByBreeder(localStorage.getItem('id')).subscribe((pets) => {
      this.pets = pets;
    });
  }

  changeLayout(emittedName: string) {
    this.view = emittedName;
    console.log('Layout change clicked.');
  }

  searchPets(emittedSearch: string){
    this.term = emittedSearch;
    console.log('searching... ' + emittedSearch);
  }

  deletePet(emittedPetId: any){
    this.petId = emittedPetId;
    console.log('deleting pet id: ' + emittedPetId);
  }

  editPet(emittedPet: any){
    this.pet = emittedPet;
  }

}
