import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}
  apiurl = 'http://localhost:8000/api'; //<todo> make dinamic from env</todo>
  response: any;
  // GetAllUsers(){
  //   return this.http.get(this.apiurl);
  // }

  // GetUserById(id:any){
  //   return this.http.get(this.apiurl+'/'+id);
  // }

  RegisterUser(input: any) {
    return this.http.post(this.apiurl + '/register', input);
  }

  LoginUser(input: any) {
    return this.http.post(this.apiurl + '/login', input);
  }

  IsLoggedIn(): Observable<boolean> {
    let header = new HttpHeaders().set(
      'Authorization',
      'Bearer ' + localStorage.getItem('id_token')
    );
    return this.http.get<boolean>(this.apiurl + '/validatetoken', {
      headers: header,
    });
  }

  LogoutUser() {
    let header = new HttpHeaders().set(
      'Authorization',
      'Bearer ' + localStorage.getItem('id_token')
    );
    return this.http.post(this.apiurl + '/logout', { headers: header });
  }
}
