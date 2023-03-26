import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}
  apiurl = 'http://127.0.0.1:8000/api'; //<todo> make dinamic from env</todo>

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

  IsLoggedIn() {
    return this.http.get(this.apiurl + '/validateToken');
  }

  LogoutUser() {
    return this.http.get(this.apiurl + '/logout');
  }
  // UpdateUser(id:any, input:any){
  //   return this.http.post(this.apiurl+'/user/update/'+id, input);
  // }
}
