import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IPet } from '../models/pet';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private http: HttpClient) {}
  apiurl = 'http://localhost:8000/api'; //<todo> make dinamic from env</todo>
  response: any;
  pets: IPet[] = [];

  getPetsByBreeder(id: any) {
    return this.http.get<IPet[]>(this.apiurl + '/pets/breeder/' + id);
  }
}
