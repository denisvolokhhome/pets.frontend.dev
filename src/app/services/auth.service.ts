import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}
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
          this.isLoggedInSubject.next(true);
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
        }),
        catchError((error) => {
          // If there's an error (like 401), user is not logged in
          this.isLoggedInSubject.next(false);
          return of(null);
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
    
    // Navigate to home
    this.router.navigate(['/']);
    
    return this.http.post(this.apiurl + '/auth/jwt/logout', {}, { headers: header }).pipe(
      catchError(() => {
        // Even if logout fails on backend, we've already cleared local state
        return of(null);
      })
    );
  }

  // Method to handle session expiration
  handleSessionExpired() {
    localStorage.removeItem('id_token');
    this.isLoggedInSubject.next(false);
    this.router.navigate(['/']);
  }

  // Check if user has a valid token
  hasValidToken(): boolean {
    return !!localStorage.getItem('id_token');
  }
}
