import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { IUser } from '../models/user';
import { OAuthService } from './oauth.service';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();
  
  private currentUserSubject = new BehaviorSubject<IUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient, 
    private router: Router,
    private oauthService: OAuthService
  ) {}
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

  RegisterPetSeeker(input: any) {
    // Register pet seeker with simplified form
    const payload = {
      email: input.email,
      password: input.password,
      name: input.name
    };
    return this.http.post(this.apiurl + '/auth/register/pet-seeker', payload);
  }

  ConvertGuestToAccount(input: any) {
    // Convert guest message sender to registered account
    const payload = {
      email: input.email,
      password: input.password,
      name: input.name
    };
    return this.http.post(this.apiurl + '/auth/register/from-message', payload);
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
          // Fetch user data after login
          this.IsLoggedIn().subscribe();
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
          this.currentUserSubject.next(user);
        }),
        catchError((error) => {
          // If there's an error (like 401), user is not logged in
          this.isLoggedInSubject.next(false);
          this.currentUserSubject.next(null);
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
    this.currentUserSubject.next(null);
    
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
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  // Check if user has a valid token
  hasValidToken(): boolean {
    return !!localStorage.getItem('id_token');
  }

  // Get current user synchronously
  get currentUser(): IUser | null {
    return this.currentUserSubject.value;
  }

  // Computed property: Check if current user is a breeder
  get isBreeder(): boolean {
    const user = this.currentUserSubject.value;
    return user?.is_breeder ?? false;
  }

  // Computed property: Check if current user is a pet seeker
  get isPetSeeker(): boolean {
    const user = this.currentUserSubject.value;
    return user ? !user.is_breeder : false;
  }

  /**
   * Initiate Google OAuth sign-in flow
   */
  signInWithGoogle(): void {
    this.oauthService.initiateGoogleOAuth().subscribe({
      error: (error) => {
        console.error('Failed to initiate Google OAuth:', error);
      }
    });
  }

  /**
   * Handle Google OAuth callback
   * @param code - Authorization code from Google
   */
  handleGoogleCallback(code: string): Observable<any> {
    return this.oauthService.handleGoogleCallback(code).pipe(
      tap((response) => {
        // Update login state
        this.isLoggedInSubject.next(true);
        // Fetch user data
        this.IsLoggedIn().subscribe();
      }),
      catchError((error) => {
        console.error('Google OAuth callback failed:', error);
        return of(null);
      })
    );
  }

  /**
   * Request password reset email
   */
  forgotPassword(email: string): Observable<any> {
    return this.http.post(this.apiurl + '/auth/forgot-password', { email });
  }

  /**
   * Reset password using token from email
   */
  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(this.apiurl + '/auth/reset-password', { token, password }, { responseType: 'text' });
  }
}
