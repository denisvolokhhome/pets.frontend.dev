import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

/**
 * Service for displaying toast notifications
 * Provides a centralized way to show user feedback messages
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new Subject<Toast>();
  public toasts$: Observable<Toast> = this.toastSubject.asObservable();

  /**
   * Show a success toast notification
   */
  success(message: string, duration: number = 3000): void {
    this.show(message, 'success', duration);
  }

  /**
   * Show an error toast notification
   */
  error(message: string, duration: number = 5000): void {
    this.show(message, 'error', duration);
  }

  /**
   * Show a warning toast notification
   */
  warning(message: string, duration: number = 4000): void {
    this.show(message, 'warning', duration);
  }

  /**
   * Show an info toast notification
   */
  info(message: string, duration: number = 3000): void {
    this.show(message, 'info', duration);
  }

  /**
   * Show a toast notification
   */
  private show(message: string, type: Toast['type'], duration: number): void {
    const toast: Toast = {
      id: this.generateId(),
      message,
      type,
      duration
    };
    this.toastSubject.next(toast);
  }

  /**
   * Generate a unique ID for the toast
   */
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
