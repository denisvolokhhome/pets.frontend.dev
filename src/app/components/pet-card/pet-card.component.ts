import { Component, Input, OnInit } from '@angular/core';
import { IPet } from 'src/app/models/pet';
import { environment } from 'src/environments/environment';


@Component({
  selector: '[app-pet-card]',
  templateUrl: './pet-card.component.html',
  styleUrls: ['./pet-card.component.css']
})
export class PetCardComponent {
  @Input() pet: IPet;

  apiurl = environment.API_URL;

}
