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
import { ToastService } from '../../services/toast.service';
import { Subject, takeUntil, interval } from 'rxjs';

export interface ThreadMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  offspring_id?: string;
  thread_id?: string;
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
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.currentUserId = user.id;
    }
  }

  private loadThreadMessages(): void {
    if (!this.threadId) return;

    this.isLoading = true;
    this.messageService.getThreadMessages(this.threadId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (messages) => {
          this.messages = messages;
          this.isLoading = false;
          this.scrollToBottom();
        },
        error: (error) => {
          console.error('Error loading thread messages:', error);
          this.toastService.error('Failed to load messages', 'Error');
          this.isLoading = false;
        }
      });
  }

  private markMessagesAsRead(): void {
    if (!this.threadId || !this.currentUserId) return;

    // Mark unread messages as read
    const unreadMessages = this.messages.filter(
      m => !m.is_read && m.receiver_id === this.currentUserId
    );

    unreadMessages.forEach(message => {
      this.messageService.markAsRead(message.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            message.is_read = true;
          },
          error: (error) => {
            console.error('Error marking message as read:', error);
          }
        });
    });
  }

  private startPolling(): void {
    // Poll for new messages every 10 seconds
    interval(10000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadThreadMessages();
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
        next: (response) => {
          this.toastService.success('Message sent successfully', 'Success');
          this.replyForm.reset();
          this.isSubmitting = false;
          
          // Reload messages to show the new one
          this.loadThreadMessages();
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

  isSentByCurrentUser(message: ThreadMessage): boolean {
    return message.sender_id === this.currentUserId;
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
    setTimeout(() => {
      const messageContainer = document.querySelector('.message-list');
      if (messageContainer) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
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
}
