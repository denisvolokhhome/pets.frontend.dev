import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

import {
  DepositStatus,
  IBreederWaitlist,
  ILitterWaitlist,
  ISeekerEntry,
  IWaitlistEntry,
  IWaitlistEvent,
  IWaitlistInfo,
  IWaitlistSettings,
  SexPreference
} from '../models/waitlist';

/** Request body for a pet seeker asking for a spot on a breeder's waitlist. */
export interface IWaitlistRequestInput {
  request_breeding_id?: number | null;
  sex_preference: SexPreference;
  preference_notes?: string | null;
  application_answers?: Record<string, string> | null;
}

/** Request body for a breeder adding a waitlist entry by hand. An email or a phone is required. */
export interface IManualEntryInput {
  contact_name: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  sex_preference?: SexPreference;
  preference_notes?: string | null;
}

/** Request body for updating an entry's deposit. */
export interface IDepositUpdate {
  deposit_status: DepositStatus;
  deposit_amount?: string | null;
  deposit_received_on?: string | null;
  deposit_method?: string | null;
}

/** Breeder waitlists & deposits API. */
@Injectable({ providedIn: 'root' })
export class WaitlistService {
  private baseUrl = `${environment.API_URL}/waitlist`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders().set(
      'Authorization', 'Bearer ' + localStorage.getItem('id_token')
    );
  }

  private entryUrl(id: string, action: string): string {
    return `${this.baseUrl}/entries/${id}/${action}`;
  }

  // ── Pet seeker ──

  getInfo(breederId: string, breedingId?: number): Observable<IWaitlistInfo> {
    let params = new HttpParams();
    if (breedingId !== undefined) {
      params = params.set('breeding_id', String(breedingId));
    }
    return this.http.get<IWaitlistInfo>(
      `${this.baseUrl}/breeders/${breederId}/info`, { headers: this.getHeaders(), params }
    );
  }

  requestSpot(breederId: string, body: IWaitlistRequestInput): Observable<ISeekerEntry> {
    return this.http.post<ISeekerEntry>(
      `${this.baseUrl}/breeders/${breederId}/requests`, body, { headers: this.getHeaders() }
    );
  }

  getMine(): Observable<ISeekerEntry[]> {
    return this.http.get<ISeekerEntry[]>(`${this.baseUrl}/mine`, { headers: this.getHeaders() });
  }

  withdrawMine(entryId: string): Observable<ISeekerEntry> {
    return this.http.post<ISeekerEntry>(
      `${this.baseUrl}/mine/${entryId}/withdraw`, {}, { headers: this.getHeaders() }
    );
  }

  // ── Breeder ──

  getBreederWaitlist(): Observable<IBreederWaitlist> {
    return this.http.get<IBreederWaitlist>(this.baseUrl, { headers: this.getHeaders() });
  }

  getLitterWaitlist(breedingId: number): Observable<ILitterWaitlist> {
    return this.http.get<ILitterWaitlist>(
      `${this.baseUrl}/breedings/${breedingId}`, { headers: this.getHeaders() }
    );
  }

  addManual(body: IManualEntryInput): Observable<IWaitlistEntry> {
    return this.http.post<IWaitlistEntry>(`${this.baseUrl}/entries`, body, { headers: this.getHeaders() });
  }

  approve(id: string): Observable<IWaitlistEntry> {
    return this.http.post<IWaitlistEntry>(this.entryUrl(id, 'approve'), {}, { headers: this.getHeaders() });
  }

  decline(id: string): Observable<IWaitlistEntry> {
    return this.http.post<IWaitlistEntry>(this.entryUrl(id, 'decline'), {}, { headers: this.getHeaders() });
  }

  updateDeposit(id: string, body: IDepositUpdate): Observable<IWaitlistEntry> {
    return this.http.put<IWaitlistEntry>(this.entryUrl(id, 'deposit'), body, { headers: this.getHeaders() });
  }

  move(id: string, breedingId: number | null): Observable<IWaitlistEntry> {
    return this.http.post<IWaitlistEntry>(
      this.entryUrl(id, 'move'), { breeding_id: breedingId }, { headers: this.getHeaders() }
    );
  }

  reorder(id: string, position: number, note?: string): Observable<IWaitlistEntry> {
    const body: { position: number; note?: string } = { position };
    if (note !== undefined) {
      body.note = note;
    }
    return this.http.post<IWaitlistEntry>(this.entryUrl(id, 'reorder'), body, { headers: this.getHeaders() });
  }

  resetOrder(breedingId: number | null): Observable<unknown> {
    const path = breedingId === null ? 'general' : `breedings/${breedingId}`;
    return this.http.post<unknown>(`${this.baseUrl}/${path}/reset-order`, {}, { headers: this.getHeaders() });
  }

  match(id: string, offspringId: string): Observable<IWaitlistEntry> {
    return this.http.post<IWaitlistEntry>(
      this.entryUrl(id, 'match'), { offspring_id: offspringId }, { headers: this.getHeaders() }
    );
  }

  pass(id: string): Observable<IWaitlistEntry> {
    return this.http.post<IWaitlistEntry>(this.entryUrl(id, 'pass'), {}, { headers: this.getHeaders() });
  }

  withdraw(id: string, depositOutcome?: 'refunded' | 'forfeited'): Observable<IWaitlistEntry> {
    const body = depositOutcome ? { deposit_outcome: depositOutcome } : {};
    return this.http.post<IWaitlistEntry>(this.entryUrl(id, 'withdraw'), body, { headers: this.getHeaders() });
  }

  getEvents(id: string): Observable<IWaitlistEvent[]> {
    return this.http.get<IWaitlistEvent[]>(this.entryUrl(id, 'events'), { headers: this.getHeaders() });
  }

  getSettings(): Observable<IWaitlistSettings> {
    return this.http.get<IWaitlistSettings>(`${this.baseUrl}/settings`, { headers: this.getHeaders() });
  }

  updateSettings(body: IWaitlistSettings): Observable<IWaitlistSettings> {
    return this.http.put<IWaitlistSettings>(`${this.baseUrl}/settings`, body, { headers: this.getHeaders() });
  }
}
