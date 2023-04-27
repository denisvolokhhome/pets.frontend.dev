import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private http: HttpClient) {}
  apiurl = 'http://localhost:8000/api'; //<todo> make dinamic from env</todo>
  response: any;

  getPetsByBreeder(id: any) {
    return this.http.get(this.apiurl + '/pets/breeder/' + id);
  }
}
