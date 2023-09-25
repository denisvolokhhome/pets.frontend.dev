import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DataService } from 'src/app/services/data.service';
import { ModalService } from 'src/app/services/modal.service';
declare var window: any;

@Component({
  selector: 'app-pet-delete',
  templateUrl: './pet-delete.component.html',
  styleUrls: ['./pet-delete.component.css']
})
export class PetDeleteComponent implements OnInit{

  constructor(
    private dataService: DataService,
    public modalService: ModalService
  ){}

@Input() pet_id: string = '';
formModal: any;


ngOnInit(): void {
  this.formModal = new window.bootstrap.Modal(
    document.getElementById('deletePetModal')
  );
}

  form = new FormGroup({
    petId: new FormControl('')
  });


  submit() {
    console.log(this.pet_id);

    this.dataService.deletePet(this.form.value.petId as string).subscribe(()=> {
      this.formModal.hide();
    })
  }
}
