import { Component, Input } from '@angular/core';
import { IPet } from 'src/app/models/pet';

@Component({
  standalone: false,
  selector: '[app-pet-grid]',
  templateUrl: './pet-grid.component.html',
  styleUrls: ['./pet-grid.component.css']
})
export class PetGridComponent {
  @Input() pet: IPet;
}
