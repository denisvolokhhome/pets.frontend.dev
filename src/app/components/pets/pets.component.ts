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
  view: string = 'cards';
  title: string = 'Pets';

  ngOnInit(): void {

    this.DataService.getPetsByBreeder(localStorage.getItem('id')).subscribe((pets) => {
      this.pets = pets;
      // console.log(pets);
    });
  }

  changeLayout(emittedName: string) {
    this.view = emittedName;
    console.log('Layout change clicked.');
  }



}
