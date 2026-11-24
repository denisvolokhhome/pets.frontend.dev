import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

import {
  ICalendar,
  IHeatCycle,
  IHeatCycleWrite,
  IReminder,
  IReminderWrite,
} from '../models/heat-cycle';

/** Heat history, manual reminders and the breeder calendar (breeder-only). */
@Injectable({ providedIn: 'root' })
export class HeatCycleService {
  private baseUrl = environment.API_URL;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('id_token'));
  }

  // ── Heat cycles ──

  listCycles(petId: string): Observable<IHeatCycle[]> {
    return this.http.get<IHeatCycle[]>(`${this.baseUrl}/pets/${petId}/heat-cycles`, { headers: this.getHeaders() });
  }

  createCycle(petId: string, body: IHeatCycleWrite): Observable<IHeatCycle> {
    return this.http.post<IHeatCycle>(`${this.baseUrl}/pets/${petId}/heat-cycles`, body, { headers: this.getHeaders() });
  }

  /** Full replace; ending a cycle is an update with end_date set. */
  updateCycle(cycleId: string, body: IHeatCycleWrite): Observable<IHeatCycle> {
    return this.http.put<IHeatCycle>(`${this.baseUrl}/heat-cycles/${cycleId}`, body, { headers: this.getHeaders() });
  }

  deleteCycle(cycleId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/heat-cycles/${cycleId}`, { headers: this.getHeaders() });
  }

  // ── Reminders ──

  listReminders(petId: string): Observable<IReminder[]> {
    return this.http.get<IReminder[]>(`${this.baseUrl}/pets/${petId}/reminders`, { headers: this.getHeaders() });
  }

  createReminder(petId: string, body: IReminderWrite): Observable<IReminder> {
    return this.http.post<IReminder>(`${this.baseUrl}/pets/${petId}/reminders`, body, { headers: this.getHeaders() });
  }

  updateReminder(reminderId: string, body: IReminderWrite): Observable<IReminder> {
    return this.http.put<IReminder>(`${this.baseUrl}/reminders/${reminderId}`, body, { headers: this.getHeaders() });
  }

  deleteReminder(reminderId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/reminders/${reminderId}`, { headers: this.getHeaders() });
  }

  // ── Calendar ──

  /** Events between two dates inclusive (at most 120 days), optionally for one dog. */
  getCalendar(start: string, end: string, petId?: string | null): Observable<ICalendar> {
    let params = new HttpParams().set('start', start).set('end', end);
    if (petId) params = params.set('pet_id', petId);
    return this.http.get<ICalendar>(`${this.baseUrl}/calendar`, { headers: this.getHeaders(), params });
  }
}

/** The server's `detail` message, or a fallback. Handles FastAPI's 422 list form too. */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const detail = (err as HttpErrorResponse)?.error?.detail;
  if (typeof detail === 'string' && detail) return detail;
  if (Array.isArray(detail) && detail.length) {
    const msg = detail[0]?.msg;
    if (typeof msg === 'string') return msg.replace(/^Value error, /, '');
  }
  return fallback;
}
