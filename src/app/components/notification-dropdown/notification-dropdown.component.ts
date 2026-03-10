import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { NotificationService, Notification } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Subject, takeUntil, interval } from 'rxjs';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    BadgeModule
  ],
  templateUrl: './notification-dropdown.component.html',
  styleUrls: ['./notification-dropdown.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount = 0;
  isLoading = false;
  isOpen = false;
  private pollingStarted = false;
  
  private destroy$ = new Subject<void>();
  private readonly POLL_INTERVAL = 30000; // 30 seconds
  private readonly MAX_DISPLAY = 10;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Only subscribe to auth state if there's a token
    // This prevents unnecessary API calls on public pages
    if (!this.authService.hasValidToken()) {
      return;
    }
    
    // Subscribe to auth state changes
    this.authService.isLoggedIn$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isLoggedIn => {
        if (isLoggedIn) {
          // User is authenticated, load notifications
          this.loadNotifications();
          this.loadUnreadCount();
          if (!this.pollingStarted) {
            this.startPolling();
            this.pollingStarted = true;
          }
        } else {
          // User is not authenticated, clear data
          this.notifications = [];
          this.unreadCount = 0;
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleDropdown(): void {
    // Don't open dropdown if not authenticated
    if (!this.isAuthenticated()) {
      return;
    }
    
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.refreshNotifications();
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  private loadNotifications(): void {
    if (!this.isAuthenticated()) {
      this.notifications = [];
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }
    
    this.isLoading = true;
    this.cdr.markForCheck();
    
    this.notificationService.getNotifications(this.MAX_DISPLAY, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Backend returns array directly, not wrapped in object
          this.notifications = Array.isArray(response) ? response : [];
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          this.notifications = [];
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private loadUnreadCount(): void {
    if (!this.isAuthenticated()) {
      this.unreadCount = 0;
      this.cdr.markForCheck();
      return;
    }
    
    this.notificationService.getUnreadCount()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.unreadCount = response.count;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading unread count:', error);
          this.unreadCount = 0;
          this.cdr.markForCheck();
        }
      });
  }

  private startPolling(): void {
    if (!this.isAuthenticated()) {
      return;
    }
    
    // Poll for new notifications every 30 seconds
    interval(this.POLL_INTERVAL)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.isAuthenticated()) {
          this.loadNotifications();
          this.loadUnreadCount();
        }
      });
  }

  onNotificationClick(notification: Notification): void {
    // Mark as read if unread
    if (!notification.is_read) {
      this.markAsRead(notification);
    }

    // Close dropdown
    this.closeDropdown();

    // Navigate to the notification source
    this.navigateToSource(notification);
  }

  markAsRead(notification: Notification): void {
    this.notificationService.markAsRead(notification.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          notification.is_read = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error marking notification as read:', error);
        }
      });
  }

  markAllAsRead(): void {
    const unreadNotifications = this.notifications.filter(n => !n.is_read);
    
    if (unreadNotifications.length === 0) {
      return;
    }

    unreadNotifications.forEach(notification => {
      this.markAsRead(notification);
    });

    this.toastService.success('All notifications marked as read', 'Success');
  }

  navigateToSource(notification: Notification): void {
    if (!notification.related_id || !notification.related_type) {
      return;
    }

    switch (notification.related_type) {
      case 'offspring':
        this.router.navigate(['/offspring', notification.related_id]);
        break;
      case 'message':
        this.router.navigate(['/messages'], {
          queryParams: { messageId: notification.related_id }
        });
        break;
      case 'favorite':
        this.router.navigate(['/offsprings']);
        break;
      default:
        console.warn('Unknown notification type:', notification.related_type);
    }
  }

  viewAllNotifications(): void {
    this.closeDropdown();
    this.router.navigate(['/notifications']);
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'favorite_added':
        return 'pi-heart-fill';
      case 'message_received':
        return 'pi-envelope';
      case 'offspring_status_changed':
        return 'pi-info-circle';
      default:
        return 'pi-bell';
    }
  }

  getNotificationIconClass(type: string): string {
    switch (type) {
      case 'favorite_added':
        return 'text-red-500';
      case 'message_received':
        return 'text-blue-500';
      case 'offspring_status_changed':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  refreshNotifications(): void {
    this.loadNotifications();
    this.loadUnreadCount();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authService.hasValidToken();
  }

  getDisplayCount(): string {
    if (this.unreadCount > 99) {
      return '99+';
    }
    return this.unreadCount.toString();
  }
}
