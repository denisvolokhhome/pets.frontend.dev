import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalService } from './../../services/modal.service';
import { DataService } from './../../services/data.service';
import { FormControl, FormGroup, NgForm, Validators } from '@angular/forms';
import { IBreed } from 'src/app/models/breed';
import { ILocation } from 'src/app/models/location';
import { DatePipe } from '@angular/common';
import { DomSanitizer  } from '@angular/platform-browser';
declare var window: any;



@Component({
  selector: 'app-pet-add',
  templateUrl: './pet-add.component.html',
  styleUrls: ['./pet-add.component.css']
})
export class PetAddComponent implements OnInit{

  formModal: any;
  breeds: IBreed[];
  locations: ILocation[];
  maxDate: Date;
  image_path: any ;


  @ViewChild('addPet') public addPetForm:NgForm;

  constructor(private DataService: DataService, private ModalService: ModalService, private sanitizer: DomSanitizer )
  {
    this.maxDate = new Date();
  }

  readURL(event: any): void {
    this.image_path = window.URL.createObjectURL(event.target.files[0]);

    if (event.target.files.length > 0) {
      const file = event.target.files[0];


      this.form.patchValue({
        imageSource: file
      });

      console.log('file set');
      console.log(file);
    }

  }

  ngOnInit(): void {
  this.formModal = new window.bootstrap.Modal(
    document.getElementById('addPetModal')
  );


  this.DataService.getBreeds().subscribe(breeds => {
    this.breeds = breeds;
  })

  this.DataService.getLocations(localStorage.getItem('id')).subscribe(locations => {
    this.locations = locations;
  })
  }


  form = new FormGroup({
    name: new FormControl<string>('', [
      Validators.required
    ]),
    breed_name: new FormControl<string>('', [
      Validators.required
    ]),
    pet_desc: new FormControl<string>('', [
      Validators.minLength(0),
      Validators.maxLength(200),
    ]),
    // TODO add date validation - date less or equel then today
    pet_dob: new FormControl('', [
      Validators.required
    ]),
    gender: new FormControl('', [
      Validators.required
    ]),
    weight: new FormControl('', [
      Validators.required
    ]),
    location_name: new FormControl('', [
      Validators.required
    ]),
    image: new FormControl(''),
    imageSource: new FormControl(''),
    has_vaccination: new FormControl(''),
    has_microchip: new FormControl(''),
    has_healthcertificate: new FormControl(''),
    has_dewormed: new FormControl(''),
    has_birthcertificate: new FormControl('')
  });

  get name() {
    return this.form.controls.name as FormControl;
  }

  get breed_name() {
    return this.form.controls.breed_name as FormControl;
  }

  get description() {
    return this.form.controls.pet_desc as FormControl;
  }
  get pet_dob() {
    return this.form.controls.pet_dob as FormControl;
  }
  get gender() {
    return this.form.controls.gender as FormControl;
  }
  get weight() {
    return this.form.controls.weight as FormControl;
  }
  get location_name() {
    return this.form.controls.location_name as FormControl;
  }
  get image() {
    return this.form.controls.image as FormControl;
  }

  submit() {

    const dateSendingToServer = new DatePipe('en-US').transform(this.form.value.pet_dob, 'yyyy/MM/dd')

     this.DataService.createPet({
      name: this.form.value.name as string,
      breed_name: this.form.value.breed_name as string,
      description: this.form.value.pet_desc as string,
      pet_dob: dateSendingToServer as string,
      gender: this.form.value.gender as string,
      weight: this.form.value.weight as string,
      location_name: this.form.value.location_name as string,
      image: this.form.get('imageSource')?.value as any ,
      is_puppy: 0,
      has_microchip: this.form.value.has_microchip ? 1 : 0 as number,
      has_vaccination:  this.form.value.has_vaccination ? 1 : 0 as number,
      has_healthcertificate: this.form.value.has_healthcertificate ? 1 : 0 as number,
      has_dewormed: this.form.value.has_dewormed ? 1 : 0 as number,
      has_birthcertificate: this.form.value.has_birthcertificate ? 1 : 0 as number,
      id: localStorage.getItem('id')
     }).subscribe(() => {
       this.addPetForm.form.reset();
       this.image_path = '';

       Object.keys(this.addPetForm.form.controls).forEach(key =>{
         this.addPetForm.form.controls[key].setErrors(null)
       });
       this.formModal.hide();
     });
  }

}

