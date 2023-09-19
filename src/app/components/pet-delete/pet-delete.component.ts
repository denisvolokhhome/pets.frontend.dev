import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DataService } from 'src/app/services/data.service';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  selector: 'app-pet-delete',
  templateUrl: './pet-delete.component.html',
  styleUrls: ['./pet-delete.component.css']
})
export class PetDeleteComponent {

  constructor(
    private dataService: DataService,
    public modalService: ModalService
  ){}

pet_id: string = '';

  form = new FormGroup({
    petId: new FormControl<string>('')
  });

  submit() {}
}
