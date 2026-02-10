import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ToastService, Toast } from '../../services/toast.service';

/**
 * Component for displaying toast notifications
 * Automatically removes toasts after their duration expires
 */
@Component({
  standalone: false,
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private subscription?: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.subscription = this.toastService.toasts$.subscribe(toast => {
      this.addToast(toast);
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Add a toast to the display list
   */
  private addToast(toast: Toast): void {
    this.toasts.push(toast);

    // Auto-remove after duration
    if (toast.duration) {
      setTimeout(() => {
        this.removeToast(toast.id);
      }, toast.duration);
    }
  }

  /**
   * Remove a toast by ID
   */
  removeToast(id: string): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  /**
   * Get icon for toast type
   */
  getIcon(type: Toast['type']): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  }
}
