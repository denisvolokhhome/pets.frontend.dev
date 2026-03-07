import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface MessageCreate {
  breeder_id: string;
  sender_name: string;
  sender_email: string;
  message?: string;
}

export interface Message {
  id: string;
  breeder_id: string;
  pet_seeker_id?: string;
  offspring_id?: string;
  thread_id?: string;
  sender_name: string;
  sender_email: string;
  message: string | null;
  is_read: boolean;
  response_text: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string | null;
  is_linked_to_account?: boolean;
}

export interface MessageListItem {
  id: string;
  breeder_id: string;
  pet_seeker_id?: string;
  offspring_id?: string;
  thread_id?: string;
  sender_name: string;
  sender_email: string;
  message_preview: string | null;
  is_read: boolean;
  responded_at: string | null;
  created_at: string;
}

export interface MessageListResponse {
  messages: MessageListItem[];
  total: number;
  unread_count: number;
  limit: number;
  offset: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface MessageSendResponse {
  success: boolean;
  message: string;
}

export interface MessageResponseCreate {
  response_text: string;
}

export interface ThreadMessageCreate {
  receiver_id: string;
  message: string;
  offspring_id?: string;
  thread_id?: string;
}

export interface ThreadMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_is_breeder: boolean;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ThreadResponse {
  thread_id: string;
  offspring_id: string;
  breeder_id: string;
  pet_seeker_id: string;
  messages: ThreadMessage[];
  offspring?: {
    id: string;
    name: string;
    gender: string;
    age: string;
    status: string;
    price?: number;
    primary_image_url?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = environment.API_URL;

  constructor(private http: HttpClient) {}

  /**
   * Send a message to a breeder (public endpoint - no authentication required)
   */
  sendMessage(messageData: MessageCreate): Observable<MessageSendResponse> {
    return this.http
      .post<MessageSendResponse>(`${this.apiUrl}/messages/send`, messageData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all messages for the authenticated breeder
   */
  getMessages(
    status: 'all' | 'read' | 'unread' = 'all',
    skip: number = 0,
    limit: number = 20,
    sort: 'newest' | 'oldest' = 'newest'
  ): Observable<MessageListResponse> {
    const headers = this.getAuthHeaders();
    const params: any = {
      status,
      skip: skip.toString(),
      limit: limit.toString(),
      sort
    };

    return this.http
      .get<MessageListResponse>(`${this.apiUrl}/messages/`, { headers, params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get count of unread messages
   */
  getUnreadCount(): Observable<UnreadCountResponse> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<UnreadCountResponse>(`${this.apiUrl}/messages/unread-count`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get a single message by ID
   */
  getMessage(messageId: string): Observable<Message> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Message>(`${this.apiUrl}/messages/${messageId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Mark a message as read
   */
  markAsRead(messageId: string): Observable<Message> {
    const headers = this.getAuthHeaders();
    return this.http
      .patch<Message>(`${this.apiUrl}/messages/${messageId}/read`, {}, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Respond to a message
   */
  respondToMessage(messageId: string, responseData: MessageResponseCreate): Observable<Message> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<Message>(`${this.apiUrl}/messages/${messageId}/respond`, responseData, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Send a message in a thread (offspring context)
   */
  sendThreadMessage(messageData: ThreadMessageCreate): Observable<ThreadMessage> {
    const headers = this.getAuthHeaders();
    
    // If there's an offspring_id, use the offspring message endpoint
    if (messageData.offspring_id) {
      return this.http
        .post<ThreadMessage>(`${this.apiUrl}/messages/offspring/${messageData.offspring_id}`, {
          message: messageData.message,
          receiver_id: messageData.receiver_id
        }, { headers })
        .pipe(catchError(this.handleError));
    }
    
    // Otherwise use the general send endpoint
    return this.http
      .post<ThreadMessage>(`${this.apiUrl}/messages/send`, messageData, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all messages in a thread
   */
  getThreadMessages(threadId: string): Observable<ThreadResponse> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<ThreadResponse>(`${this.apiUrl}/messages/threads/${threadId}`, { headers })
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
        errorMessage = 'Message not found.';
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
