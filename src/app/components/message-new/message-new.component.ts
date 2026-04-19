import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageThreadComponent, OffspringContext } from '../message-thread/message-thread.component';
import { MessageService, MessageListItem } from '../../services/message.service';
import { OffspringService } from 'src/app/services/offspring.service';
import { AuthService } from 'src/app/services/auth.service';
import { ToastService } from 'src/app/services/toast.service';

interface MessageThread {
  thread_id: string | null;
  latest_message: MessageListItem;
  participant_name: string;
  participant_email: string;
  participant_id: string;
  offspring_id?: string;
  message_count: number;
  unread_count: number;
  last_activity: string;
}

@Component({
  selector: 'app-message-new',
  standalone: true,
  imports: [CommonModule, MessageThreadComponent],
  templateUrl: './message-new.component.html',
  styleUrls: ['./message-new.component.css']
})
export class MessageNewComponent implements OnInit {
  breederId: string = '';
  breederName: string = 'Breeder';
  offspringId?: string;
  threadId?: string;
  offspringContext?: OffspringContext;
  isLoading: boolean = true;
  initialMessage?: string;
  
  // Threads sidebar
  threads: MessageThread[] = [];
  isLoadingThreads: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private messageService: MessageService,
    private offspringService: OffspringService,
    private authService: AuthService,
    private toastr: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Load threads first
    this.loadThreads();
    
    // Then load specific thread if provided in query params
    this.route.queryParams.subscribe(params => {
      this.breederId = params['breederId'];
      this.offspringId = params['offspringId'];
      this.threadId = params['threadId'];
      this.initialMessage = params['initialMessage'];

      if (!this.breederId && !this.threadId) {
        // No specific thread selected, just show threads list
        this.isLoading = false;
        this.cdr.detectChanges();
        return;
      }

      if (this.offspringId) {
        this.loadOffspringContext();
      } else {
        // No offspring context to load, ready to show form
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Load all message threads for sidebar
   */
  private loadThreads(): void {
    this.isLoadingThreads = true;
    
    this.messageService.getMessages('all', 0, 50, 'newest')
      .subscribe({
        next: (response) => {
          this.groupMessagesIntoThreads(response.messages);
          this.isLoadingThreads = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading threads:', error);
          this.toastr.error('Failed to load conversations', 'Error');
          this.isLoadingThreads = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Group messages into conversation threads
   */
  private groupMessagesIntoThreads(messages: MessageListItem[]): void {
    const threadMap = new Map<string, MessageThread>();
    const currentUser = this.authService.currentUser;

    if (!currentUser) {
      return;
    }

    for (const message of messages) {
      // Use thread_id if available, otherwise create unique key per conversation
      const threadKey = message.thread_id || `${message.sender_id}-${message.receiver_id}`;

      // Determine the other participant
      const isCurrentUserSender = message.sender_id === currentUser.id;
      const participantId = isCurrentUserSender ? message.receiver_id : message.sender_id;
      const participantName = isCurrentUserSender ? 
        (message.receiver_name || 'Unknown') : 
        message.sender_name;
      const participantEmail = message.sender_email || '';

      if (!threadMap.has(threadKey)) {
        // Create new thread
        threadMap.set(threadKey, {
          thread_id: message.thread_id || null,
          latest_message: message,
          participant_name: participantName,
          participant_email: participantEmail,
          participant_id: participantId,
          offspring_id: message.context_type === 'offspring' ? message.context_id : undefined,
          message_count: 1,
          unread_count: !message.is_read && !isCurrentUserSender ? 1 : 0,
          last_activity: message.created_at
        });
      } else {
        // Update existing thread
        const thread = threadMap.get(threadKey)!;
        thread.message_count++;
        
        if (!message.is_read && !isCurrentUserSender) {
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
   * Select a thread from the sidebar
   */
  selectThread(thread: MessageThread): void {
    this.breederId = thread.participant_id;
    this.breederName = thread.participant_name;
    this.threadId = thread.thread_id || undefined;
    
    if (thread.offspring_id) {
      this.offspringId = thread.offspring_id;
      this.loadOffspringContext();
    } else {
      this.offspringContext = undefined;
      this.offspringId = undefined;
      this.isLoading = false;
      this.cdr.detectChanges();
    }
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
      return `${diffMins}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else if (diffDays < 7) {
      return `${diffDays}d`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  /**
   * Load offspring context for the message thread
   */
  loadOffspringContext(): void {
    if (!this.offspringId) {
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.offspringService.getPublicOffspring(this.offspringId).subscribe({
      next: (offspring) => {
        this.offspringContext = {
          id: offspring.id,
          name: offspring.name || 'Unnamed',
          breed_name: offspring.breed?.name || 'Unknown',
          gender: offspring.gender,
          age: offspring.age || '',
          primary_image_url: offspring.primary_image?.image_url,
          status: offspring.status || 'available',
          price: offspring.price ?? undefined
        };
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading offspring context:', error);
        // Don't show error toast, just continue without offspring context
        this.offspringContext = undefined;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Navigate back
   */
  goBack(): void {
    // Use browser history to go back to previous page
    this.location.back();
  }
}
