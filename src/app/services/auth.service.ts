import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isLoggedInSubject = new Subject<boolean>();

  constructor(private http: HttpClient) {}
  apiurl= environment.API_URL;
  response: any;

  RegisterUser(input: any) {
    // FastAPI expects JSON format with email, password, and name
    const payload = {
      email: input.email,
      password: input.password,
      name: input.name
    };
    return this.http.post(this.apiurl + '/auth/register', payload);
  }

  LoginUser(input: any) {
    // FastAPI expects form data for login
    const formData = new FormData();
    formData.append('username', input.email); // FastAPI uses 'username' field
    formData.append('password', input.password);
    
    return this.http.post(this.apiurl + '/auth/jwt/login', formData).pipe(
      tap((response: any) => {
        // Store the JWT token
        if (response.access_token) {
          localStorage.setItem('id_token', response.access_token);
        }
      })
    );
  }

  IsLoggedIn(): Observable<any> {
    let header = new HttpHeaders().set(
      'Authorization',
      'Bearer ' + localStorage.getItem('id_token')
    );
    return this.http
      .get<any>(this.apiurl + '/auth/users/me', {
        headers: header,
      })
      .pipe(
        tap((user) => {
          // If we get a user object back, we're logged in
          this.isLoggedInSubject.next(!!user);
        })
      );
  }

  LogoutUser() {
    let header = new HttpHeaders().set(
      'Authorization',
      'Bearer ' + localStorage.getItem('id_token')
    );
    // Clear token from localStorage
    localStorage.removeItem('id_token');
    this.isLoggedInSubject.next(false);
    return this.http.post(this.apiurl + '/auth/jwt/logout', {}, { headers: header });
  }
}
