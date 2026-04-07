import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  ReviewCreate,
  ReviewRead,
  ReviewSummary,
  ReviewEligibility,
  PaginatedReviews
} from '../models/review.model';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = environment.API_URL;

  constructor(private http: HttpClient) {}

  /**
   * Check if a pet seeker is eligible to review a breeder in a given thread
   */
  checkEligibility(breederId: string, threadId: string): Observable<ReviewEligibility> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams()
      .set('breeder_id', breederId)
      .set('thread_id', threadId);

    return this.http
      .get<ReviewEligibility>(`${this.apiUrl}/reviews/eligibility`, { headers, params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Submit a new review for a breeder
   */
  submitReview(data: ReviewCreate): Observable<ReviewRead> {
    const headers = this.getAuthHeaders();

    return this.http
      .post<ReviewRead>(`${this.apiUrl}/reviews/`, data, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get the rating summary for a breeder
   */
  getBreederSummary(breederId: string): Observable<ReviewSummary> {
    return this.http
      .get<ReviewSummary>(`${this.apiUrl}/reviews/breeder/${breederId}/summary`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get paginated reviews for a breeder
   */
  getBreederReviews(breederId: string, page: number): Observable<PaginatedReviews> {
    const params = new HttpParams()
      .set('limit', '10')
      .set('offset', (page * 10).toString());

    return this.http
      .get<PaginatedReviews>(`${this.apiUrl}/reviews/breeder/${breederId}`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get the list of predefined review tags
   */
  getTags(): Observable<string[]> {
    return this.http
      .get<string[]>(`${this.apiUrl}/reviews/tags`)
      .pipe(catchError(this.handleError));
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders().set(
      'Authorization',
      'Bearer ' + localStorage.getItem('id_token')
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 401:
          errorMessage = 'Unauthorized. Please log in again.';
          break;
        case 403:
          errorMessage = error.error?.detail || 'Access forbidden.';
          break;
        case 404:
          errorMessage = error.error?.detail || 'Not found.';
          break;
        case 409:
          errorMessage = error.error?.detail || 'Review already submitted for this interaction.';
          break;
        case 422:
          errorMessage = error.error?.detail || 'Validation error.';
          break;
        case 429:
          errorMessage = 'Too many reviews submitted. Please try again later.';
          break;
        default:
          if (error.status >= 500) {
            errorMessage = 'Something went wrong. Please try again.';
          } else {
            errorMessage = error.error?.detail || `Error: ${error.status} - ${error.statusText}`;
          }
      }
    }

    return throwError(() => ({
      ...error,
      message: errorMessage
    }));
  }
}
