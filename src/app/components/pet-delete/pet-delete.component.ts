import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DataService } from 'src/app/services/data.service';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  standalone: false,
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

  ngOnInit(): void {
  }

  form = new FormGroup({
    petId: new FormControl('')
  });

  submit() {
    console.log(this.pet_id);

    this.dataService.deletePet(this.pet_id as string).subscribe(()=> {
      this.modalService.close('deletePetModal');
      window.location.reload();
    })
  }

  modalClose() {
    this.modalService.close('deletePetModal');
  }
}
