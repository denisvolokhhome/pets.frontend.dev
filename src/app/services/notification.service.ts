import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, interval } from 'rxjs';
import { catchError, tap, switchMap, startWith } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  related_id: string | null;
  related_type: string | null;
  is_read: boolean;
  created_at: string;
}

// Backend returns array directly, not wrapped in object
export type NotificationListResponse = Notification[];

export interface UnreadCountResponse {
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = environment.API_URL;
  
  // Observable for unread count with polling
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  
  // Polling interval in milliseconds (30 seconds)
  private pollingInterval = 30000;
  private pollingSubscription: any;

  constructor(private http: HttpClient) {}

  /**
   * Start polling for unread count
   */
  startPolling(): void {
    const token = localStorage.getItem('id_token');
    if (!token) return;

    // Initial fetch
    this.fetchUnreadCount();

    // Poll every 30 seconds
    this.pollingSubscription = interval(this.pollingInterval)
      .pipe(
        startWith(0),
        switchMap(() => this.getUnreadCount())
      )
      .subscribe({
        next: (response) => {
          this.unreadCountSubject.next(response.count);
        },
        error: () => {
          // Silently fail - keep previous count
        }
      });
  }

  /**
   * Stop polling for unread count
   */
  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  /**
   * Fetch unread count immediately
   */
  private fetchUnreadCount(): void {
    this.getUnreadCount().subscribe({
      next: (response) => {
        this.unreadCountSubject.next(response.count);
      },
      error: () => {
        // Silently fail
      }
    });
  }

  /**
   * Get all notifications for the authenticated user
   */
  getNotifications(
    limit: number = 20,
    offset: number = 0,
    isRead?: boolean,
    type?: string
  ): Observable<Notification[]> {
    const headers = this.getAuthHeaders();
    const params: any = {
      offset: offset.toString(),
      limit: limit.toString()
    };
    
    if (isRead !== undefined) params.is_read = isRead.toString();
    if (type) params.type = type;

    return this.http
      .get<Notification[]>(`${this.apiUrl}/notifications/`, { headers, params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Mark a notification as read
   */
  markAsRead(notificationId: string): Observable<Notification> {
    const headers = this.getAuthHeaders();

    return this.http
      .put<Notification>(`${this.apiUrl}/notifications/${notificationId}/read`, {}, { headers })
      .pipe(
        tap(() => {
          // Decrement unread count
          const currentCount = this.unreadCountSubject.value;
          if (currentCount > 0) {
            this.unreadCountSubject.next(currentCount - 1);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get count of unread notifications
   */
  getUnreadCount(): Observable<UnreadCountResponse> {
    const headers = this.getAuthHeaders();

    return this.http
      .get<UnreadCountResponse>(`${this.apiUrl}/notifications/unread/count`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Refresh unread count immediately
   */
  refreshUnreadCount(): void {
    this.fetchUnreadCount();
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
        errorMessage = 'Notification not found.';
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
