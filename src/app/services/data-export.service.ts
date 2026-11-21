import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DataExport } from '../models/data-export';

/** Breeder data export: background-built ZIP, downloaded through a short-lived link. */
@Injectable({ providedIn: 'root' })
export class DataExportService {
  private readonly base = `${environment.API_URL}/exports`;

  constructor(private http: HttpClient) {}

  start(): Observable<DataExport> {
    return this.http.post<DataExport>(this.base, {});
  }

  latest(): Observable<DataExport | null> {
    return this.http.get<DataExport | null>(`${this.base}/latest`);
  }

  /** Returns a host-relative URL; prefix with API_HOST before navigating. */
  downloadLink(id: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.base}/${id}/download-link`, {});
  }
}
