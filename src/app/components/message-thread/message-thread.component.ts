import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Textarea } from 'primeng/textarea';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { MessageService } from '../../services/message.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Subject, takeUntil, interval } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ThreadMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_is_breeder: boolean;
  sender_profile_image_url?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface OffspringContext {
  id: string;
  name: string;
  breed_name: string;
  gender: string;
  age: string;
  primary_image_url?: string;
  status: string;
  price?: number;
}

@Component({
  selector: 'app-message-thread',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    Textarea,
    CardModule,
    AvatarModule,
    BadgeModule
  ],
  templateUrl: './message-thread.component.html',
  styleUrls: ['./message-thread.component.css']
})
export class MessageThreadComponent implements OnInit, OnDestroy {
  @Input() threadId?: string;
  @Input() offspringContext?: OffspringContext;
  @Input() breederId!: string;
  @Input() breederName: string = 'Breeder';

  messages: ThreadMessage[] = [];
  replyForm: FormGroup;
  isSubmitting = false;
  isLoading = false;
  currentUserId?: string;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.replyForm = this.fb.group({
      message: ['', [Validators.required, Validators.maxLength(2000)]]
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    if (this.threadId) {
      this.loadThreadMessages();
      this.markMessagesAsRead();
      this.startPolling();
    } else {
      // No thread ID means new conversation - not loading
      this.isLoading = false;
    }
    // Trigger change detection to ensure view updates
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCurrentUser(): void {
    // Try to get from AuthService first
    const user = this.authService.currentUser;
    if (user) {
      this.currentUserId = user.id;
      console.log('Current user ID loaded from AuthService:', this.currentUserId);
      return;
    }
    
    // Fallback to localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      this.currentUserId = userData.id;
      console.log('Current user ID loaded from localStorage:', this.currentUserId);
    } else {
      console.warn('Could not load current user ID');
    }
  }

  private loadThreadMessages(silent: boolean = false): void {
    if (!this.threadId) {
      console.log('No thread ID available, skipping message load');
      return;
    }

    // Only show loading spinner on initial load, not during polling
    if (!silent) {
      this.isLoading = true;
    }
    
    this.messageService.getThreadMessages(this.threadId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Extract messages array from ThreadResponse
          const newMessages = response.messages;
          
          // Check if there are new messages
          const hasNewMessages = newMessages.length > this.messages.length;
          
          // Only update if messages have changed (prevents unnecessary re-renders)
          if (JSON.stringify(newMessages) !== JSON.stringify(this.messages)) {
            this.messages = newMessages;
            
            // Scroll to bottom if:
            // 1. Initial load (!silent)
            // 2. New messages detected during polling (hasNewMessages)
            if (!silent || hasNewMessages) {
              this.scrollToBottom();
            }
          }
          
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading thread messages:', error);
          if (!silent) {
            this.toastService.error('Failed to load messages', 'Error');
          }
          this.isLoading = false;
        }
      });
  }

  private markMessagesAsRead(): void {
    // Backend automatically marks messages as read when breeder accesses thread
    // No need to manually mark each message
  }

  private startPolling(): void {
    // Poll for new messages every 10 seconds in silent mode (no loading spinner)
    interval(10000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Silent refresh - updates messages without showing loading state
        this.loadThreadMessages(true);
      });
  }

  onSubmit(): void {
    if (this.replyForm.invalid || this.isSubmitting) {
      this.replyForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const messageData = {
      receiver_id: this.breederId,
      message: this.replyForm.value.message.trim(),
      offspring_id: this.offspringContext?.id,
      thread_id: this.threadId
    };

    this.messageService.sendThreadMessage(messageData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.toastService.success('Message sent successfully', 'Success');
          this.replyForm.reset();
          this.isSubmitting = false;
          
          // If this was the first message, extract and set the thread_id
          if (!this.threadId && response.thread_id) {
            this.threadId = response.thread_id;
            console.log('Thread ID set from response:', this.threadId);
            // Start polling now that we have a thread
            this.startPolling();
          }
          
          // Add the new message directly to the array (optimistic update)
          const newMessage: ThreadMessage = {
            id: response.id,
            sender_id: this.currentUserId!,
            sender_name: this.authService.currentUser?.name || 'You',
            sender_is_breeder: this.authService.currentUser?.is_breeder || false,
            message: messageData.message,
            is_read: false,
            created_at: new Date().toISOString()
          };
          
          this.messages.push(newMessage);
          this.cdr.detectChanges();
          this.scrollToBottom();
        },
        error: (error) => {
          console.error('Error sending message:', error);
          this.toastService.error(
            error.message || 'Failed to send message',
            'Error'
          );
          this.isSubmitting = false;
        }
      });
  }

  onEnterPress(event: KeyboardEvent): void {
    // Submit on Enter, but allow Shift+Enter for new line
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
  }

  isSentByCurrentUser(message: ThreadMessage): boolean {
    const isSent = message.sender_id === this.currentUserId;
    console.log(`Message from ${message.sender_id}, current user: ${this.currentUserId}, isSent: ${isSent}`);
    return isSent;
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

  private scrollToBottom(): void {
    // With flex-col-reverse, scrollTop: 0 is the bottom
    setTimeout(() => {
      const messageContainer = document.querySelector('.overflow-y-auto');
      if (messageContainer) {
        messageContainer.scrollTop = 0;
      }
    }, 100);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800';
      case 'Reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'Sold':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getProfileImageUrl(imagePath: string): string {
    // If the path already includes the full URL, return it
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    // Otherwise, prepend the API URL from environment
    const apiUrl = environment.API_URL || 'http://localhost:8000';
    return `${apiUrl}${imagePath}`;
  }

  onImageError(event: any): void {
    // Hide the broken image and show the icon placeholder instead
    event.target.style.display = 'none';
  }
}
