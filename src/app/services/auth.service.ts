import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap, catchError, distinctUntilChanged, shareReplay } from 'rxjs/operators';
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
  public isLoggedIn$ = this.isLoggedInSubject.pipe(distinctUntilChanged());
  
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

  RegisterServiceProvider(input: any) {
    // Register service provider with category selections
    const payload = {
      email: input.email,
      password: input.password,
      name: input.name,
      category_ids: input.category_ids
    };
    return this.http.post(this.apiurl + '/auth/register/service-provider', payload);
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

  // Guards, the top menu and page components all call IsLoggedIn() on the same
  // navigation; share one in-flight /me request instead of firing one each.
  private meRequest$: Observable<any> | null = null;
  private meRequestToken: string | null = null;
  private meRequestAt = 0;
  private static readonly ME_DEDUPE_MS = 2000;

  IsLoggedIn(): Observable<any> {
    const token = localStorage.getItem('id_token');
    if (!token) {
      // No token: don't ask the API (it would only 401).
      this.isLoggedInSubject.next(false);
      this.currentUserSubject.next(null);
      return of(null);
    }
    if (
      this.meRequest$ &&
      this.meRequestToken === token &&
      Date.now() - this.meRequestAt < AuthService.ME_DEDUPE_MS
    ) {
      return this.meRequest$;
    }
    let header = new HttpHeaders().set('Authorization', 'Bearer ' + token);
    this.meRequestToken = token;
    this.meRequestAt = Date.now();
    this.meRequest$ = this.http
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
        }),
        shareReplay(1)
      );
    return this.meRequest$;
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
  handleSessionExpired(): Promise<boolean> {
    localStorage.removeItem('id_token');
    this.isLoggedInSubject.next(false);
    this.currentUserSubject.next(null);
    return this.router.navigate(['/login']);
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
  // Service providers are NOT pet seekers even though is_breeder=false.
  // is_breeder is authoritative here (not account_type) — account_type can
  // lag or be missing for accounts created before it existed, and trusting
  // it alone previously left non-breeder, non-service accounts matching
  // neither isBreeder nor isPetSeeker, hiding the "Convert to Breeder" UI.
  get isPetSeeker(): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;
    return !user.is_breeder && user.account_type !== 'service';
  }

  // Computed property: Check if current user is a service provider.
  // Gated by the feature flag: service providers are hidden pre-launch, so
  // this reports false even for an actual 'service' account_type while the
  // flag is off — that keeps all service-provider nav/UI hidden everywhere
  // that delegates to this getter (left menu, settings, dashboard, guard).
  get isServiceProvider(): boolean {
    return environment.enableServiceProviders && this.currentUserSubject.value?.account_type === 'service';
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
   * Convert current pet seeker account to breeder (irreversible)
   */
  convertToBreeder(): Observable<any> {
    const header = new HttpHeaders().set(
      'Authorization',
      'Bearer ' + localStorage.getItem('id_token')
    );
    return this.http.post(this.apiurl + '/auth/convert-to-breeder', {}, { headers: header }).pipe(
      tap((response: any) => {
        // Refresh user data so is_breeder updates everywhere
        this.IsLoggedIn().subscribe();
      })
    );
  }

  /**
   * Reset password using token from email
   */
  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(this.apiurl + '/auth/reset-password', { token, password }, { responseType: 'text' });
  }

  /**
   * Verify an email address using the token from the verification email.
   */
  verifyEmail(token: string): Observable<{ access_token: string; token_type: string; user: any }> {
    return this.http.post<{ access_token: string; token_type: string; user: any }>(
      this.apiurl + '/auth/verify',
      { token }
    );
  }

  /**
   * Request a new email-verification token be sent to the given address.
   */
  requestVerifyToken(email: string): Observable<any> {
    return this.http.post(this.apiurl + '/auth/request-verify-token', { email });
  }
}
