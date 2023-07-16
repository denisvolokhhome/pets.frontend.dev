import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IPet } from '../models/pet';
import { Observable, delay, retry, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private http: HttpClient) {}
  apiurl = 'http://localhost:8000/api'; //<todo> make dinamic from env</todo>
  response: any;
  pets: IPet[] = [];

  getPetsByBreeder(id: any): Observable<IPet[]> {
    return this.http.get<IPet[]>(this.apiurl + '/pets/breeder/' + id).
    pipe(
      tap((pets) => (this.pets = pets))
    );
  }

  createPet(pet: any): Observable<IPet[]> {
    return this.http.post<IPet[]>(this.apiurl + '/pets', pet).
    pipe(
      tap((pets) => (this.pets = pets))
    );
  }

  // create(product: IProduct): Observable<IProduct> {
  //   return this.http
  //     .post<IProduct>('https://fakestoreapi.com/products', product)
  //     .pipe(tap((prod) => this.products.push(prod)));
  // }

}
