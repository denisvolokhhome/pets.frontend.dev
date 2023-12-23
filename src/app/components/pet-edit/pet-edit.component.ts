import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IBreed } from 'src/app/models/breed';
import { ILocation } from 'src/app/models/location';
import { IPet } from 'src/app/models/pet';
import { DataService } from 'src/app/services/data.service';
declare var window: any;

@Component({
  selector: 'app-pet-edit',
  templateUrl: './pet-edit.component.html',
  styleUrls: ['./pet-edit.component.css']
})
export class PetEditComponent implements OnInit{

  constructor(private DataService: DataService,){
    this.maxDate = new Date();
  }

  @Input() pet: IPet

  breeds: IBreed[];
  locations: ILocation[];
  pets: IPet[] = [];
  maxDate: Date;
  formModal: any;
  image_path: any ;

  readURL(event: any): void {
    this.image_path = window.URL.createObjectURL(event.target.files[0]);

    if (event.target.files.length > 0) {
      const file = event.target.files[0];

      this.form.patchValue({
        imageSource: file
      });

    }

  }

  ngOnInit(): void {
      this.formModal = new window.bootstrap.Modal(
        document.getElementById('editPetModal')
      );


      this.DataService.getBreeds().subscribe(breeds => {
        this.breeds = breeds;
      })

      this.DataService.getLocations(localStorage.getItem('id')).subscribe(locations => {
        this.locations = locations;
      })

      // <TODO> Need to set form input values

    }

    modalClose(){
      console.log('clicked');
      this.formModal.reset
      this.formModal.hide();
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

    // editPet(){
    //   this.DataService.getPet(this.pet_id).subscribe(response => {
    //     this.pet = response;
    //   })
    // }

    submit(){

    }

  }




