import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService, Message } from '../../../services/message.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-message-detail',
  standalone: false,
  templateUrl: './message-detail.component.html',
  styleUrls: ['./message-detail.component.css']
})
export class MessageDetailComponent implements OnInit {
  message: Message | null = null;
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  responseForm: FormGroup;
  showResponseForm: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private authService: AuthService,
    private fb: FormBuilder,
    private toastr: ToastService
  ) {
    this.responseForm = this.fb.group({
      response_text: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(5000)]]
    });
  }

  ngOnInit(): void {
    const messageId = this.route.snapshot.paramMap.get('id');
    if (messageId) {
      this.loadMessage(messageId);
    } else {
      this.router.navigate(['/settings/messages']);
    }
  }

  /**
   * Load message details
   */
  loadMessage(messageId: string): void {
    this.isLoading = true;

    this.messageService.getMessage(messageId).subscribe({
      next: (message) => {
        this.message = message;
        this.isLoading = false;

        // Auto-mark as read if not already read
        if (!message.is_read) {
          this.markAsRead(messageId);
        }

        // Show response form if not yet responded
        if (!message.response_text) {
          this.showResponseForm = true;
        }
      },
      error: (error) => {
        console.error('Error loading message:', error);
        this.toastr.error('Failed to load message', 'Error');
        this.isLoading = false;
        this.router.navigate(['/settings/messages']);
      }
    });
  }

  /**
   * Mark message as read
   */
  markAsRead(messageId: string): void {
    this.messageService.markAsRead(messageId).subscribe({
      next: (updatedMessage) => {
        if (this.message) {
          this.message.is_read = true;
        }
      },
      error: (error) => {
        console.error('Error marking message as read:', error);
      }
    });
  }

  /**
   * Submit response
   */
  onSubmitResponse(): void {
    if (this.responseForm.invalid || this.isSubmitting || !this.message) {
      this.responseForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const responseData = {
      response_text: this.responseForm.value.response_text.trim()
    };

    this.messageService.respondToMessage(this.message.id, responseData).subscribe({
      next: (updatedMessage) => {
        this.message = updatedMessage;
        this.isSubmitting = false;
        this.showResponseForm = false;
        this.responseForm.reset();
        this.toastr.success('Response sent successfully!', 'Success');
      },
      error: (error) => {
        console.error('Error sending response:', error);
        this.toastr.error(error.message || 'Failed to send response', 'Error');
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Toggle response form visibility
   */
  toggleResponseForm(): void {
    this.showResponseForm = !this.showResponseForm;
    if (this.showResponseForm) {
      this.responseForm.reset();
    }
  }

  /**
   * Navigate back to messages list
   */
  goBack(): void {
    this.router.navigate(['/settings/messages']);
  }

  /**
   * Format date to readable string
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get response form control
   */
  get responseText() {
    return this.responseForm.get('response_text');
  }

  /**
   * Check if message has been responded to
   */
  hasResponse(): boolean {
    return !!this.message?.response_text;
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
}
