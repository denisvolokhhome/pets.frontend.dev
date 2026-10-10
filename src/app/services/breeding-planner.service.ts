import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

import {
  IMatingInput,
  IMilestoneLocation,
  IPlanner,
  IPlannerUpdate,
  IUpcomingMilestone
} from '../models/breeding-planner';

/** Breeding cycle planner API. Every write returns the full, recomputed planner. */
@Injectable({ providedIn: 'root' })
export class BreedingPlannerService {
  private baseUrl = `${environment.API_URL}/breedings`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders().set(
      'Authorization', 'Bearer ' + localStorage.getItem('id_token')
    );
  }

  private url(breedingId: number | string, ...parts: string[]): string {
    return [this.baseUrl, breedingId, ...parts].join('/');
  }

  getPlanner(breedingId: number | string): Observable<IPlanner> {
    return this.http.get<IPlanner>(this.url(breedingId, 'planner'), { headers: this.getHeaders() });
  }

  updatePlanner(breedingId: number | string, data: IPlannerUpdate): Observable<IPlanner> {
    return this.http.patch<IPlanner>(this.url(breedingId, 'planner'), data, { headers: this.getHeaders() });
  }

  addMating(breedingId: number | string, input: IMatingInput): Observable<IPlanner> {
    return this.http.post<IPlanner>(this.url(breedingId, 'matings'), input, { headers: this.getHeaders() });
  }

  updateMating(breedingId: number | string, matingId: string, input: IMatingInput): Observable<IPlanner> {
    return this.http.put<IPlanner>(this.url(breedingId, 'matings', matingId), input, { headers: this.getHeaders() });
  }

  deleteMating(breedingId: number | string, matingId: string): Observable<IPlanner> {
    return this.http.delete<IPlanner>(this.url(breedingId, 'matings', matingId), { headers: this.getHeaders() });
  }

  addProgesteroneTest(
    breedingId: number | string,
    test: { tested_on: string; value_ng_ml: number }
  ): Observable<IPlanner> {
    return this.http.post<IPlanner>(this.url(breedingId, 'progesterone-tests'), test, { headers: this.getHeaders() });
  }

  deleteProgesteroneTest(breedingId: number | string, testId: string): Observable<IPlanner> {
    return this.http.delete<IPlanner>(
      this.url(breedingId, 'progesterone-tests', testId), { headers: this.getHeaders() }
    );
  }

  addMilestone(
    breedingId: number | string,
    milestone: { title: string; due_on: string; remind_on?: string | null }
  ): Observable<IPlanner> {
    return this.http.post<IPlanner>(this.url(breedingId, 'milestones'), milestone, { headers: this.getHeaders() });
  }

  setMilestoneCompleted(breedingId: number | string, milestoneId: string, completed: boolean): Observable<IPlanner> {
    return this.http.patch<IPlanner>(
      this.url(breedingId, 'milestones', milestoneId), { completed }, { headers: this.getHeaders() }
    );
  }

  deleteMilestone(breedingId: number | string, milestoneId: string): Observable<IPlanner> {
    return this.http.delete<IPlanner>(this.url(breedingId, 'milestones', milestoneId), { headers: this.getHeaders() });
  }

  /** Open milestones due within `days`, plus overdue ones, across all active pregnancies. */
  getUpcoming(days = 14): Observable<IUpcomingMilestone[]> {
    return this.http.get<IUpcomingMilestone[]>(`${this.baseUrl}/milestones/upcoming`, {
      headers: this.getHeaders(),
      params: new HttpParams().set('days', days)
    });
  }

  /** Resolve a milestone (from a notification link) to its breeding. */
  locateMilestone(milestoneId: string): Observable<IMilestoneLocation> {
    return this.http.get<IMilestoneLocation>(`${this.baseUrl}/milestones/${milestoneId}`, { headers: this.getHeaders() });
  }
}
