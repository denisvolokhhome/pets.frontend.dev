import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { PetImportRow, ImportResult } from '../models/pet-import.model';

@Injectable({
  providedIn: 'root',
})
export class PetImportService {
  private apiUrl = environment.API_URL;

  constructor(private http: HttpClient) {}

  /**
   * Import pets via CSV — POST parsed pet rows to the backend.
   */
  importPets(pets: PetImportRow[]): Observable<ImportResult> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<ImportResult>(`${this.apiUrl}/pets/import`, { pets }, { headers })
      .pipe(catchError(this.handleError));
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders().set(
      'Authorization',
      'Bearer ' + localStorage.getItem('id_token')
    );
  }

  private handleError(error: HttpErrorResponse | TimeoutError) {
    let errorMessage = 'An unknown error occurred';

    if (error instanceof TimeoutError) {
      errorMessage = 'Request timed out. Please check your connection and try again.';
    } else if (error instanceof HttpErrorResponse) {
      if (error.error instanceof ErrorEvent) {
        errorMessage = `Error: ${error.error.message}`;
      } else if (error.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.';
      } else if (error.status === 403) {
        errorMessage = error.error?.detail || 'Access forbidden. Breeder access required.';
      } else if (error.status === 400) {
        errorMessage = error.error?.detail || 'Invalid import data.';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = error.error?.detail || `Error: ${error.status} - ${error.statusText}`;
      }
    }

    return throwError(() => ({
      ...error,
      message: errorMessage,
    }));
  }
}
