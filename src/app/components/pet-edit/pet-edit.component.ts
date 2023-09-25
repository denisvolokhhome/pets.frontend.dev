import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-pet-edit',
  templateUrl: './pet-edit.component.html',
  styleUrls: ['./pet-edit.component.css']
})
export class PetEditComponent {
  @Input() pet_id: string = ''

}
