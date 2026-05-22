import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IServiceCategory } from '../models/service-category';
import {
  IService,
  IServiceImage,
  IServiceListResponse,
  IServiceCreate,
  IServiceUpdate,
} from '../models/service';

@Injectable({
  providedIn: 'root'
})
export class ServiceProviderService {
  private apiUrl = environment.API_URL;

  constructor(private http: HttpClient) {}

  /**
   * Get all active service categories (public)
   */
  getCategories(): Observable<IServiceCategory[]> {
    return this.http
      .get<IServiceCategory[]>(`${this.apiUrl}/service-categories/`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all services for the authenticated service provider
   */
  getServices(): Observable<IServiceListResponse> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<IServiceListResponse>(`${this.apiUrl}/services`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Create a new service
   */
  createService(payload: IServiceCreate): Observable<IService> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<IService>(`${this.apiUrl}/services`, payload, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Update an existing service
   */
  updateService(id: string, payload: IServiceUpdate): Observable<IService> {
    const headers = this.getAuthHeaders();
    return this.http
      .put<IService>(`${this.apiUrl}/services/${id}`, payload, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Soft-delete a service
   */
  deleteService(id: string): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http
      .delete<void>(`${this.apiUrl}/services/${id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Upload an image for a service
   */
  uploadServiceImage(serviceId: string, file: File): Observable<IServiceImage> {
    const formData = new FormData();
    formData.append('file', file);
    const headers = this.getAuthHeaders();
    return this.http
      .post<IServiceImage>(`${this.apiUrl}/services/${serviceId}/images`, formData, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete a service image
   */
  deleteServiceImage(serviceId: string, imgId: string): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http
      .delete<void>(`${this.apiUrl}/services/${serviceId}/images/${imgId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Search service providers (public)
   */
  searchServices(params: any): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return this.http
      .get<any>(`${this.apiUrl}/services/search`, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get public profile for a service provider
   */
  getPublicProfile(userId: string): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/services/provider/${userId}/public`)
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
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.';
      } else if (error.status === 403) {
        errorMessage = 'Access forbidden.';
      } else if (error.status === 404) {
        errorMessage = 'Service not found.';
      } else if (error.status === 409) {
        errorMessage = error.error?.detail?.message || error.error?.detail || 'Conflict occurred.';
      } else if (error.status === 413) {
        errorMessage = 'File size too large.';
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
