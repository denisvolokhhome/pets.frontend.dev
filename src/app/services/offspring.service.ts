import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface OffspringBase {
  name?: string | null;
  gender: 'Male' | 'Female';
  date_of_birth: string;
  status?: 'Available' | 'Reserved' | 'Sold' | 'Archived';
  price?: number | null;
  description?: string | null;
  color_markings?: string | null;
}

export interface OffspringCreate extends OffspringBase {
  breeding_id: number;
}

export interface OffspringUpdate {
  name?: string | null;
  status?: 'Available' | 'Reserved' | 'Sold' | 'Archived';
  price?: number | null;
  description?: string | null;
  color_markings?: string | null;
}

export interface OffspringImage {
  id: string;
  offspring_id: string;
  image_path: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface OffspringRead extends OffspringBase {
  id: string;
  breeding_id: number;
  user_id: string;
  breed_id: number | null;
  created_at: string;
  updated_at: string | null;
  age: string;
  favorites_count: number;
  thread_count: number;  // Number of unique conversation threads
  breeding?: any;
  breed?: any;
  images: OffspringImage[];
  primary_image?: OffspringImage | null;
  father?: any;
  mother?: any;
  is_favorited?: boolean;
}

export interface OffspringListResponse {
  offsprings: OffspringRead[];
  total: number;
  limit: number;
  offset: number;
}

export interface ImageReorderRequest {
  image_ids: string[];
}

@Injectable({
  providedIn: 'root'
})
export class OffspringService {
  private apiUrl = environment.API_URL;

  constructor(private http: HttpClient) {}

  /**
   * Get all offsprings for the authenticated breeder
   */
  getOffsprings(
    status?: string,
    breedId?: number,
    limit: number = 50,
    offset: number = 0
  ): Observable<OffspringListResponse> {
    const headers = this.getAuthHeaders();
    const params: any = {
      limit: limit.toString(),
      offset: offset.toString()
    };
    
    if (status) params.status = status;
    if (breedId) params.breed_id = breedId.toString();

    return this.http
      .get<OffspringListResponse>(`${this.apiUrl}/offsprings/`, { headers, params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Create a new offspring
   */
  createOffspring(offspringData: OffspringCreate): Observable<OffspringRead> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<OffspringRead>(`${this.apiUrl}/offsprings/`, offspringData, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get a single offspring by ID
   */
  getOffspring(offspringId: string): Observable<OffspringRead> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<OffspringRead>(`${this.apiUrl}/offsprings/${offspringId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Update an offspring
   */
  updateOffspring(offspringId: string, offspringData: OffspringUpdate): Observable<OffspringRead> {
    const headers = this.getAuthHeaders();
    return this.http
      .put<OffspringRead>(`${this.apiUrl}/offsprings/${offspringId}`, offspringData, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete an offspring
   */
  deleteOffspring(offspringId: string): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http
      .delete<void>(`${this.apiUrl}/offsprings/${offspringId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Upload an image for an offspring
   */
  uploadOffspringImage(offspringId: string, imageFile: File): Observable<OffspringImage> {
    const formData = new FormData();
    formData.append('file', imageFile);
    
    const headers = this.getAuthHeaders();
    
    return this.http
      .post<OffspringImage>(`${this.apiUrl}/offsprings/${offspringId}/images`, formData, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Delete an offspring image
   */
  deleteOffspringImage(offspringId: string, imageId: string): Observable<void> {
    const headers = this.getAuthHeaders();
    
    return this.http
      .delete<void>(`${this.apiUrl}/offsprings/${offspringId}/images/${imageId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Set an image as primary
   */
  setPrimaryImage(offspringId: string, imageId: string): Observable<OffspringImage> {
    const headers = this.getAuthHeaders();
    
    return this.http
      .put<OffspringImage>(`${this.apiUrl}/offsprings/${offspringId}/images/${imageId}/primary`, {}, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Reorder offspring images
   */
  reorderImages(offspringId: string, imageIds: string[]): Observable<OffspringImage[]> {
    const headers = this.getAuthHeaders();
    const data: ImageReorderRequest = { image_ids: imageIds };
    
    return this.http
      .put<OffspringImage[]>(`${this.apiUrl}/offsprings/${offspringId}/images/reorder`, data, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get public offsprings for a breeder (no authentication required)
   */
  getPublicOffspringsByBreeder(
    breederId: string,
    breedId?: number,
    gender?: string,
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Observable<OffspringListResponse> {
    const params: any = {
      limit: limit.toString(),
      offset: offset.toString()
    };
    
    if (breedId) params.breed_id = breedId.toString();
    if (gender) params.gender = gender;
    if (status) params.status = status;

    // Include auth headers if user is logged in (for favorite status)
    const token = localStorage.getItem('id_token');
    const headers = token ? this.getAuthHeaders() : undefined;

    return this.http
      .get<OffspringListResponse>(`${this.apiUrl}/offsprings/public/breeder/${breederId}`, { headers, params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get a single public offspring by ID (no authentication required)
   */
  getPublicOffspring(offspringId: string): Observable<OffspringRead> {
    // Include auth headers if user is logged in (for favorite status)
    const token = localStorage.getItem('id_token');
    const headers = token ? this.getAuthHeaders() : undefined;

    return this.http
      .get<OffspringRead>(`${this.apiUrl}/offsprings/public/${offspringId}`, { headers })
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
        errorMessage = 'Offspring not found.';
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
