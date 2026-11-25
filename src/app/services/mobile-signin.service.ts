import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { MobileSigninCode, MobileSigninPreview, MobileSigninRedeemed, MobileSigninStatus } from '../models/mobile-signin';

/** "Instant mobile switch": QR code on desktop → phone signed in as the same user. */
@Injectable({ providedIn: 'root' })
export class MobileSigninService {
  private base = `${environment.API_URL}/auth/mobile-signin`;

  constructor(private http: HttpClient) {}

  createCode(targetPath: string): Observable<MobileSigninCode> {
    return this.http.post<MobileSigninCode>(`${this.base}/codes`, { target_path: targetPath });
  }

  status(codeId: string): Observable<{ status: MobileSigninStatus }> {
    return this.http.get<{ status: MobileSigninStatus }>(`${this.base}/codes/${codeId}/status`);
  }

  preview(code: string): Observable<MobileSigninPreview> {
    return this.http.post<MobileSigninPreview>(`${this.base}/preview`, { code });
  }

  redeem(code: string): Observable<MobileSigninRedeemed> {
    return this.http.post<MobileSigninRedeemed>(`${this.base}/redeem`, { code });
  }
}
