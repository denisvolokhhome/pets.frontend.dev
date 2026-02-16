import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OAuthService {
  private apiUrl = environment.API_URL;

  constructor(private http: HttpClient) {}

  /**
   * Initiate Google OAuth flow
   * Gets the authorization URL from backend and redirects user to Google
   */
  initiateGoogleOAuth(): Observable<{ authorization_url: string }> {
    return this.http.get<{ authorization_url: string }>(
      `${this.apiUrl}/auth/google/authorize`
    ).pipe(
      tap((response) => {
        // Redirect to Google OAuth consent screen
        this.redirectToUrl(response.authorization_url);
      })
    );
  }

  /**
   * Handle OAuth callback
   * Exchanges authorization code for JWT token
   * @param code - Authorization code from Google
   */
  handleGoogleCallback(code: string): Observable<{ access_token: string; token_type: string; user: any }> {
    return this.http.get<{ access_token: string; token_type: string; user: any }>(
      `${this.apiUrl}/auth/google/callback`,
      { params: { code } }
    ).pipe(
      tap((response) => {
        // Store JWT token
        if (response.access_token) {
          localStorage.setItem('id_token', response.access_token);
        }
      })
    );
  }

  /**
   * Redirect to URL (extracted for testability)
   * @param url - URL to redirect to
   */
  protected redirectToUrl(url: string): void {
    window.location.href = url;
  }
}
