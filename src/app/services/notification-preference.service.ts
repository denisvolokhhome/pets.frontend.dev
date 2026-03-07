import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface NotificationPreference {
  id: string;
  user_id: string;
  message_received: boolean;
  favorite_added: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferenceUpdate {
  message_received?: boolean;
  favorite_added?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationPreferenceService {
  private apiUrl = environment.API_URL;

  constructor(private http: HttpClient) {}

  /**
   * Get notification preferences for the authenticated user
   */
  getPreferences(): Observable<NotificationPreference> {
    const headers = this.getAuthHeaders();

    return this.http
      .get<NotificationPreference>(`${this.apiUrl}/notification-preferences/`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Update notification preferences for the authenticated user
   */
  updatePreferences(preferences: NotificationPreferenceUpdate): Observable<NotificationPreference> {
    const headers = this.getAuthHeaders();

    return this.http
      .put<NotificationPreference>(`${this.apiUrl}/notification-preferences/`, preferences, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get authorization headers with JWT token
   */
  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders().set(
      'Authorization',
      'Bearer ' + localStorage.getItem('id_token')
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.';
      } else if (error.status === 403) {
        errorMessage = 'Access forbidden.';
      } else if (error.status === 404) {
        errorMessage = 'Preferences not found.';
      } else if (error.status === 422) {
        errorMessage = error.error?.detail || 'Validation error.';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = error.error?.detail || `Error: ${error.status} - ${error.statusText}`;
      }
    }

    return throwError(() => ({
      ...error,
      message: errorMessage
    }));
  }
}
