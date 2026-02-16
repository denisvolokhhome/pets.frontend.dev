import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from '../../services/message.service';
import { interval, Subscription } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-notification-icon',
  standalone: false,
  templateUrl: './notification-icon.component.html',
  styleUrls: ['./notification-icon.component.css']
})
export class NotificationIconComponent implements OnInit, OnDestroy {
  unreadCount: number = 0;
  private pollSubscription?: Subscription;
  private readonly POLL_INTERVAL = 30000; // 30 seconds

  constructor(
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initial load
    this.loadUnreadCount();

    // Poll for updates every 30 seconds
    this.pollSubscription = interval(this.POLL_INTERVAL)
      .pipe(
        switchMap(() => this.messageService.getUnreadCount()),
        catchError(error => {
          console.error('Error polling unread count:', error);
          return of({ unread_count: 0 });
        })
      )
      .subscribe(response => {
        this.unreadCount = response.unread_count;
      });
  }

  ngOnDestroy(): void {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
    }
  }

  /**
   * Load unread message count
   */
  private loadUnreadCount(): void {
    this.messageService.getUnreadCount().subscribe({
      next: (response) => {
        this.unreadCount = response.unread_count;
      },
      error: (error) => {
        console.error('Error loading unread count:', error);
        this.unreadCount = 0;
      }
    });
  }

  /**
   * Navigate to messages page
   */
  navigateToMessages(): void {
    this.router.navigate(['/messages']);
  }

  /**
   * Get display count (show 99+ for counts over 99)
   */
  getDisplayCount(): string {
    if (this.unreadCount > 99) {
      return '99+';
    }
    return this.unreadCount.toString();
  }

  /**
   * Check if there are unread messages
   */
  hasUnreadMessages(): boolean {
    return this.unreadCount > 0;
  }
}
