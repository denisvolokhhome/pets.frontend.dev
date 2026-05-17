import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  IPlan,
  ISubscription,
  IInvoice,
  ICheckoutSessionResponse,
  IPortalSessionResponse,
} from '../models/billing.model';

@Injectable({
  providedIn: 'root',
})
export class BillingService {
  private apiUrl = environment.API_URL;

  constructor(private http: HttpClient) {}

  /**
   * Get all available subscription plans (public, no auth required)
   */
  getPlans(): Observable<IPlan[]> {
    return this.http
      .get<IPlan[]>(`${this.apiUrl}/billing/plans`)
      .pipe(timeout(8000), catchError(this.handleError));
  }

  /**
   * Get the current breeder's subscription details
   */
  getSubscription(): Observable<ISubscription> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<ISubscription>(`${this.apiUrl}/billing/subscription`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Subscribe to a plan or change the current plan
   */
  subscribe(planId: string): Observable<ISubscription> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<ISubscription>(
        `${this.apiUrl}/billing/subscribe`,
        { plan_id: planId },
        { headers }
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Create a Stripe Checkout Session for a paid plan
   */
  createCheckoutSession(planId: string): Observable<ICheckoutSessionResponse> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<ICheckoutSessionResponse>(
        `${this.apiUrl}/billing/create-checkout-session`,
        { plan_id: planId },
        { headers }
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Verify a completed Stripe Checkout Session and apply the plan upgrade.
   * Called after Stripe redirects back with ?session_id=...
   */
  verifyCheckoutSession(sessionId: string): Observable<ISubscription> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<ISubscription>(
        `${this.apiUrl}/billing/verify-session/${sessionId}`,
        { headers }
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Get the Stripe-hosted invoice URL and PDF link for a specific invoice
   */
  downloadInvoice(invoiceId: string): Observable<{ hosted_invoice_url: string | null; invoice_pdf: string | null }> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<{ hosted_invoice_url: string | null; invoice_pdf: string | null }>(
        `${this.apiUrl}/billing/invoices/${invoiceId}/download`,
        { headers }
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Create a Stripe Customer Portal session for invoice management
   */
  createPortalSession(): Observable<IPortalSessionResponse> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<IPortalSessionResponse>(
        `${this.apiUrl}/billing/portal-session`,
        {},
        { headers }
      )
      .pipe(catchError(this.handleError));
  }

  /**
   * Get the breeder's invoice history (ordered by creation date descending)
   */
  getInvoices(): Observable<IInvoice[]> {    const headers = this.getAuthHeaders();
    return this.http
      .get<IInvoice[]>(`${this.apiUrl}/billing/invoices`, { headers })
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
  private handleError(error: HttpErrorResponse | TimeoutError) {
    let errorMessage = 'An unknown error occurred';

    if (error instanceof TimeoutError) {
      errorMessage = 'Request timed out. Please check your connection and try again.';
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.';
      } else if (error.status === 403) {
        errorMessage =
          error.error?.detail || 'Access forbidden. Breeder access required.';
      } else if (error.status === 404) {
        errorMessage = error.error?.detail || 'Resource not found.';
      } else if (error.status === 422) {
        errorMessage = error.error?.detail || 'Validation error.';
      } else if (error.status === 429) {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage =
          error.error?.detail || `Error: ${error.status} - ${error.statusText}`;
      }
    }

    return throwError(() => ({
      ...error,
      message: errorMessage,
    }));
  }
}
