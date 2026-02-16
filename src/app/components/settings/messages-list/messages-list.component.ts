import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService, MessageListItem } from '../../../services/message.service';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-messages-list',
  standalone: false,
  templateUrl: './messages-list.component.html',
  styleUrls: ['./messages-list.component.css']
})
export class MessagesListComponent implements OnInit {
  messages: MessageListItem[] = [];
  totalMessages: number = 0;
  unreadCount: number = 0;
  isLoading: boolean = false;
  
  // Filters
  statusFilter: 'all' | 'read' | 'unread' = 'all';
  
  // Pagination
  currentPage: number = 0;
  pageSize: number = 20;
  
  // Sorting
  sortOrder: 'newest' | 'oldest' = 'newest';

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMessages();
  }

  /**
   * Load messages from API
   */
  loadMessages(): void {
    this.isLoading = true;
    this.cdr.detectChanges(); // Force change detection
    
    const skip = this.currentPage * this.pageSize;

    this.messageService.getMessages(this.statusFilter, skip, this.pageSize, this.sortOrder)
      .subscribe({
        next: (response) => {
          this.messages = response.messages;
          this.totalMessages = response.total;
          this.unreadCount = response.unread_count;
          this.isLoading = false;
          this.cdr.detectChanges(); // Force change detection after data loads
        },
        error: (error) => {
          console.error('Error loading messages:', error);
          this.toastr.error('Failed to load messages', 'Error');
          this.isLoading = false;
          this.cdr.detectChanges(); // Force change detection on error
        }
      });
  }

  /**
   * Change status filter
   */
  onFilterChange(filter: 'all' | 'read' | 'unread'): void {
    this.statusFilter = filter;
    this.currentPage = 0;
    this.loadMessages();
  }

  /**
   * Change sort order
   */
  onSortChange(sort: 'newest' | 'oldest'): void {
    this.sortOrder = sort;
    this.currentPage = 0;
    this.loadMessages();
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.hasNextPage()) {
      this.currentPage++;
      this.loadMessages();
    }
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    if (this.hasPreviousPage()) {
      this.currentPage--;
      this.loadMessages();
    }
  }

  /**
   * Check if there's a next page
   */
  hasNextPage(): boolean {
    return (this.currentPage + 1) * this.pageSize < this.totalMessages;
  }

  /**
   * Check if there's a previous page
   */
  hasPreviousPage(): boolean {
    return this.currentPage > 0;
  }

  /**
   * Get current page range text
   */
  getPageRangeText(): string {
    const start = this.currentPage * this.pageSize + 1;
    const end = Math.min((this.currentPage + 1) * this.pageSize, this.totalMessages);
    return `${start}-${end} of ${this.totalMessages}`;
  }

  /**
   * View message details
   */
  viewMessage(messageId: string): void {
    this.router.navigate(['/settings/messages', messageId]);
  }

  /**
   * Format date to relative time
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Get status badge class
   */
  getStatusClass(message: MessageListItem): string {
    if (this.isPetSeeker) {
      // Pet seeker view: highlight pending responses
      if (message.responded_at) {
        return 'status-responded';
      } else {
        return 'status-pending';
      }
    } else {
      // Breeder view: show read status
      if (message.responded_at) {
        return 'status-responded';
      } else if (message.is_read) {
        return 'status-read';
      } else {
        return 'status-unread';
      }
    }
  }

  /**
   * Get status text
   */
  getStatusText(message: MessageListItem): string {
    if (this.isPetSeeker) {
      // Pet seeker view: show if breeder has responded
      if (message.responded_at) {
        return 'Responded';
      } else {
        return 'Pending';
      }
    } else {
      // Breeder view: show read status
      if (message.responded_at) {
        return 'Responded';
      } else if (message.is_read) {
        return 'Read';
      } else {
        return 'New';
      }
    }
  }

  /**
   * Refresh messages
   */
  refresh(): void {
    this.loadMessages();
  }

  /**
   * Check if current user is a breeder
   */
  get isBreeder(): boolean {
    return this.authService.isBreeder;
  }

  /**
   * Check if current user is a pet seeker
   */
  get isPetSeeker(): boolean {
    return this.authService.isPetSeeker;
  }

  /**
   * Get appropriate subtitle based on user type
   */
  getSubtitle(): string {
    if (this.isBreeder) {
      return 'Manage inquiries from potential customers';
    } else {
      return 'View your conversations with breeders';
    }
  }

  /**
   * Get appropriate empty state message based on user type and filter
   */
  getEmptyStateMessage(): string {
    if (this.statusFilter === 'all') {
      return this.isBreeder 
        ? "You haven't received any messages from potential customers."
        : "You haven't sent any messages to breeders yet.";
    } else if (this.statusFilter === 'unread') {
      return this.isBreeder
        ? "You don't have any unread messages."
        : "You don't have any messages without responses.";
    } else {
      return this.isBreeder
        ? "You don't have any read messages."
        : "You don't have any messages with responses.";
    }
  }
}
