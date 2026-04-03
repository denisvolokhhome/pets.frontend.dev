import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService, MessageListItem } from '../../../services/message.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { FilterConfig, FilterValues } from '../../shared/filter-widget/filter-widget.component';
import { PageHeaderConfig } from '../../page-header/page-header.component';

interface MessageThread {
  thread_id: string | null;
  latest_message: MessageListItem;
  participant_name: string;
  participant_email: string;
  offspring_id?: string;
  message_count: number;
  unread_count: number;
  last_activity: string;
}

@Component({
  selector: 'app-messages-list',
  standalone: false,
  templateUrl: './messages-list.component.html',
  styleUrls: ['./messages-list.component.css']
})
export class MessagesListComponent implements OnInit {
  
  headerConfig: PageHeaderConfig = {
    title: 'Messages',
    icon: 'bi bi-envelope-fill',
    iconColor: '#6366f1',
    showLayoutSwitcher: false,
    showSearch: true,
    searchPlaceholder: 'Search messages...',
    showActionButton: true,
    actionButtonIcon: 'bi bi-arrow-clockwise',
    actionButtonColor: 'var(--secondary-color)',
    actionButtonTitle: 'Refresh'
  };
  messages: MessageListItem[] = [];
  threads: MessageThread[] = [];
  totalMessages: number = 0;
  unreadCount: number = 0;
  isLoading: boolean = false;
  searchTerm: string = '';
  
  // Filter widget configuration
  filterConfig: FilterConfig = {
    showLocation: false,
    showGender: false,
    showPetType: false,
    showStatus: true,
    showBreed: false,
    showHealthRecords: false,
    showSortOrder: true
  };
  
  // Current filter values
  currentFilters: FilterValues = {};
  
  // Filters (for backward compatibility)
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
    private toastr: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Configure status options based on user type
    this.filterConfig.statusOptions = [
      { value: 'all', label: 'All Messages' },
      { value: 'unread', label: this.isBreeder ? 'Unread' : 'Pending Response' },
      { value: 'read', label: this.isBreeder ? 'Read' : 'Responded' }
    ];
    
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
          
          // Group messages into threads
          this.groupMessagesIntoThreads();
          
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
   * Group messages into conversation threads
   */
  private groupMessagesIntoThreads(): void {
    const threadMap = new Map<string, MessageThread>();

    for (const message of this.messages) {
      // Use thread_id if available, otherwise create unique key per conversation
      const threadKey = message.thread_id || `${message.sender_id}-${message.receiver_id}`;

      if (!threadMap.has(threadKey)) {
        // Create new thread
        threadMap.set(threadKey, {
          thread_id: message.thread_id || null,
          latest_message: message,
          participant_name: message.sender_name,
          participant_email: message.sender_email || '',
          offspring_id: message.context_type === 'offspring' ? message.context_id : undefined,
          message_count: 1,
          unread_count: !message.is_read ? 1 : 0,
          last_activity: message.created_at
        });
      } else {
        // Update existing thread
        const thread = threadMap.get(threadKey)!;
        thread.message_count++;
        
        if (!message.is_read) {
          thread.unread_count++;
        }

        // Update latest message if this one is newer
        if (new Date(message.created_at) > new Date(thread.last_activity)) {
          thread.latest_message = message;
          thread.last_activity = message.created_at;
        }
      }
    }

    // Convert map to array and sort by last activity
    this.threads = Array.from(threadMap.values()).sort((a, b) => {
      return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
    });
  }

  /**
   * Handle filter changes from filter widget
   */
  onWidgetFilterChange(filters: FilterValues): void {
    this.currentFilters = filters;
    
    // Map filter values to component state
    if (filters.status) {
      this.statusFilter = filters.status as 'all' | 'read' | 'unread';
    } else {
      this.statusFilter = 'all';
    }
    
    if (filters.sortOrder) {
      this.sortOrder = filters.sortOrder as 'newest' | 'oldest';
    }
    
    this.currentPage = 0;
    this.loadMessages();
  }

  /**
   * Handle clear filters from filter widget
   */
  onWidgetClearFilters(): void {
    this.currentFilters = {};
    this.statusFilter = 'all';
    this.sortOrder = 'newest';
    this.currentPage = 0;
    this.loadMessages();
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
   * View message details - navigate directly to conversation
   */
  viewThread(thread: MessageThread): void {
    // Navigate directly to the conversation with thread context
    const message = thread.latest_message;
    const currentUser = this.authService.currentUser;
    
    if (!currentUser) {
      this.toastr.error('User information not available', 'Error');
      return;
    }
    
    // Determine who the breeder is
    // If current user is the sender, the receiver is the breeder
    // If current user is the receiver, the sender is the breeder
    let breederId: string;
    
    if (message.sender_id === currentUser.id) {
      // Current user sent the message, so receiver is the other party
      breederId = message.receiver_id;
    } else {
      // Current user received the message, so sender is the other party
      breederId = message.sender_id;
    }
    
    const queryParams: any = {
      breederId: breederId
    };

    if (thread.thread_id) {
      queryParams.threadId = thread.thread_id;
    }

    if (thread.offspring_id) {
      queryParams.offspringId = thread.offspring_id;
    }

    this.router.navigate(['/messages/new'], { queryParams });
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
   * Get status badge class for thread
   */
  getThreadStatusClass(thread: MessageThread): string {
    // For now, just use read/unread status since we don't have responded_at
    if (thread.unread_count > 0) {
      return 'status-unread';
    } else {
      return 'status-read';
    }
  }

  /**
   * Get status text for thread
   */
  getThreadStatusText(thread: MessageThread): string {
    // Show unread count or read status
    if (thread.unread_count > 0) {
      return `${thread.unread_count} New`;
    } else {
      return 'Read';
    }
  }

  /**
   * Refresh messages
   */
  refresh(): void {
    this.loadMessages();
  }
  
  onSearchTermChange(term: string): void {
    this.searchTerm = term;
    this.currentPage = 0;
    this.loadMessages();
  }
  
  onRefreshClick(): void {
    this.refresh();
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
