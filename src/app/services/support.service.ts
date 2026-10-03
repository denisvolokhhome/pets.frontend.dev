import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ISupportCategory {
  value: string;
  label: string;
}

export interface ISupportRequest {
  category: string;
  subject: string;
  message: string;
}

export interface ISupportRequestResponse {
  request_number: string;
  message: string;
}

/**
 * Handles support-request HTTP calls. The Authorization header is attached
 * globally by AuthInterceptor, so callers must not set it themselves.
 */
@Injectable({ providedIn: 'root' })
export class SupportService {
  private apiUrl = environment.API_URL;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<ISupportCategory[]> {
    return this.http.get<ISupportCategory[]>(`${this.apiUrl}/support/categories`);
  }

  submitRequest(payload: ISupportRequest): Observable<ISupportRequestResponse> {
    return this.http.post<ISupportRequestResponse>(`${this.apiUrl}/support/request`, payload);
  }
}
