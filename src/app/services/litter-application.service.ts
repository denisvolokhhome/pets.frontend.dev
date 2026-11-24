import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

import {
  ApplicationFormRead,
  ApplicationStatus,
  ApplicationSubmitInput,
  ApplicationSubmitted,
  LitterApplication,
  ManualApplicationStatus,
  PublicLitter,
} from '../models/litter-application';

/**
 * Litter applications API: the public litter page, applying, and the breeder's
 * Applications list. AuthInterceptor adds the bearer token (URLs start with API_HOST).
 */
@Injectable({ providedIn: 'root' })
export class LitterApplicationService {
  private api = environment.API_URL;

  constructor(private http: HttpClient) {}

  // ── Public / family ──

  getPublicLitter(breedingId: number | string): Observable<PublicLitter> {
    return this.http.get<PublicLitter>(`${this.api}/breedings/public/${breedingId}`);
  }

  submitApplication(breedingId: number | string, body: ApplicationSubmitInput): Observable<ApplicationSubmitted> {
    return this.http.post<ApplicationSubmitted>(`${this.api}/breedings/public/${breedingId}/applications`, body);
  }

  // ── Breeder ──

  setAcceptingApplications(breedingId: number | string, accepting: boolean): Observable<ApplicationFormRead> {
    return this.http.put<ApplicationFormRead>(
      `${this.api}/breedings/${breedingId}/application-form/litter-applications`,
      { accepting_litter_applications: accepting }
    );
  }

  listApplications(breedingId: number | string, status?: ApplicationStatus): Observable<LitterApplication[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<LitterApplication[]>(`${this.api}/breedings/${breedingId}/applications`, { params });
  }

  getApplication(id: string): Observable<LitterApplication> {
    return this.http.get<LitterApplication>(`${this.api}/applications/${id}`);
  }

  setStatus(id: string, status: ManualApplicationStatus): Observable<LitterApplication> {
    return this.http.patch<LitterApplication>(`${this.api}/applications/${id}/status`, { status });
  }

  assignPuppy(id: string, offspringId: string): Observable<LitterApplication> {
    return this.http.post<LitterApplication>(`${this.api}/applications/${id}/assign`, { offspring_id: offspringId });
  }

  unassignPuppy(id: string): Observable<LitterApplication> {
    return this.http.post<LitterApplication>(`${this.api}/applications/${id}/unassign`, {});
  }
}
