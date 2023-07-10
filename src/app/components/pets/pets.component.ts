import { Component, OnInit } from '@angular/core';
import { IPet } from 'src/app/models/pet';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-pets',
  templateUrl: './pets.component.html',
  styleUrls: ['./pets.component.css']
})
export class PetsComponent implements OnInit {

  constructor(
    public DataService: DataService
  ){}

  pets: IPet [] = [];

  ngOnInit(): void {

    this.DataService.getPetsByBreeder(localStorage.getItem('id')).subscribe((pets) => {
      this.pets = pets;
      console.log(pets);

    });
  }

}
