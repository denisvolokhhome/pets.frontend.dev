import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IPet } from '../models/pet';
import { Observable, delay, retry, tap } from 'rxjs';
import { IBreed } from '../models/breed';
import { ILocation } from '../models/location';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})

export class DataService {
  constructor(public http: HttpClient) {}
  // apiurl = 'http://localhost:8000/api'; //<todo> make dinamic from env</todo>
  apiurl= environment.API_URL;
  response: any;
  pets: IPet[] = [];
  breeds: IBreed[] = [];
  locations: ILocation[] = [];
  index: number = -1;


  getPetsByBreeder(id: any): Observable<IPet[]> {
    return this.http.get<IPet[]>(this.apiurl + '/pets/breeder/' + id).
    pipe(
      tap(pets => this.pets = pets)
    );
  }

  getPet(id: any): Observable<IPet[]> {
    let header = new HttpHeaders().set(
      'Authorization',
      'Bearer ' + localStorage.getItem('id_token')
    );
    return this.http.get<IPet[]>(this.apiurl + '/pets/' + id, {headers: header})
  }

  createPet(pet: IPet): Observable<IPet> {

    let formData = new FormData();
    formData.append("name", pet.name as string);
    formData.append("breed_name", pet.breed_name as string);
    formData.append("description", pet.description as string);
    formData.append("date_of_birth", pet.pet_dob as string);
    formData.append("gender", pet.gender as string);
    formData.append("weight", pet.weight as string);
    formData.append("location_name", pet.location_name as string);
    formData.append("image", pet.image as any);
    formData.append("is_puppy", pet.is_puppy as any);
    formData.append("has_microchip", pet.has_microchip as any);
    formData.append("has_vaccination", pet.has_vaccination as any);
    formData.append("has_healthcertificate", pet.has_healthcertificate as any);
    formData.append("has_dewormed", pet.has_dewormed as any);
    formData.append("has_birthcertificate", pet.has_birthcertificate as any);
    formData.append("id", pet.id as any);

    return this.http
      .post<IPet>(this.apiurl + '/pets', formData)
      .pipe(tap(pet => {
        this.pets.push(pet)
        this.pets = [...this.pets]
        }
      ));
  }

  deletePet(pet_id: any){
    let formData = new FormData();
    formData.append("id", pet_id as string);
    this.index =  this.pets.findIndex(x => x.pet_id === pet_id);
    return this.http.post(this.apiurl + '/pets/delete', formData)
    .pipe(tap(pet => {
      if (this.index !== -1) {
          this.pets.splice(this.index, 1);
      }
      this.pets = [...this.pets]
      }
    ));


  }

  getBreeds(): Observable<IBreed[]> {
    return this.http.get<IBreed[]>(this.apiurl + '/breeds').
    pipe(
      tap((breeds) => (this.breeds = breeds))
    );
  }

  getLocations(id: any): Observable<ILocation[]> {
    return this.http.get<ILocation[]>(this.apiurl + '/locations/'+ id).
    pipe(
      tap((locations) => (this.locations = locations))
    );
  }

}
