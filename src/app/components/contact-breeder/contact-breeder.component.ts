import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService, MessageCreate } from '../../services/message.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-contact-breeder',
  standalone: false,
  templateUrl: './contact-breeder.component.html',
  styleUrls: ['./contact-breeder.component.css']
})
export class ContactBreederComponent {
  @Input() breederId!: string;
  @Input() breederName: string = 'breeder';
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() messageSent = new EventEmitter<void>();

  @ViewChild('dialogEl') dialogEl!: ElementRef<HTMLElement>;

  contactForm: FormGroup;
  isSubmitting = false;
  showAccountPrompt = false;
  submittedEmail = '';
  isClosing = false;

  // Drag-to-dismiss
  dragOffsetY = 0;
  private dragStartY = 0;
  private isDragging = false;
  private readonly CLOSE_DURATION = 280;
  private readonly DISMISS_THRESHOLD = 120;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private toastr: ToastService,
    private router: Router
  ) {
    this.contactForm = this.fb.group({
      sender_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      sender_email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      message: ['', [Validators.maxLength(2000)]]
    });
  }

  get senderName() { return this.contactForm.get('sender_name'); }
  get senderEmail() { return this.contactForm.get('sender_email'); }
  get message()     { return this.contactForm.get('message'); }

  // ── Drag-to-dismiss (mobile only) ────────────────────────────────────────

  onDragStart(event: TouchEvent): void {
    if (window.innerWidth > 640) return;
    this.isDragging = true;
    this.dragStartY = event.touches[0].clientY;
    this.dragOffsetY = 0;
  }

  onDragMove(event: TouchEvent): void {
    if (!this.isDragging) return;
    const delta = event.touches[0].clientY - this.dragStartY;
    // Only allow dragging downward
    this.dragOffsetY = Math.max(0, delta);
  }

  onDragEnd(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    if (this.dragOffsetY >= this.DISMISS_THRESHOLD) {
      this.dragOffsetY = 0;
      this.closeDialog();
    } else {
      // Snap back
      this.dragOffsetY = 0;
    }
  }

  // ── Close with animation ─────────────────────────────────────────────────

  closeDialog(): void {
    this.isClosing = true;
    setTimeout(() => {
      this.isClosing = false;
      this.dragOffsetY = 0;
      this.visible = false;
      this.visibleChange.emit(false);
      this.contactForm.reset();
      this.showAccountPrompt = false;
      this.submittedEmail = '';
    }, this.CLOSE_DURATION);
  }

  onCancel(): void { this.closeDialog(); }

  // ── Form submission ───────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.contactForm.invalid || this.isSubmitting) {
      Object.keys(this.contactForm.controls).forEach(key =>
        this.contactForm.get(key)?.markAsTouched()
      );
      return;
    }

    this.isSubmitting = true;

    const messageData: MessageCreate = {
      breeder_id: this.breederId,
      sender_name: this.contactForm.value.sender_name.trim(),
      sender_email: this.contactForm.value.sender_email.trim(),
      message: this.contactForm.value.message?.trim() || undefined
    };

    this.messageService.sendMessage(messageData).subscribe({
      next: () => {
        this.toastr.success('Your message has been sent to the breeder!', 'Message Sent');
        this.submittedEmail = this.contactForm.value.sender_email.trim();
        this.contactForm.reset();
        this.isSubmitting = false;
        this.messageSent.emit();
        this.showAccountPrompt = true;
      },
      error: (error) => {
        this.toastr.error(error.message || 'Failed to send message. Please try again.', 'Error');
        this.isSubmitting = false;
      }
    });
  }

  onCreateAccount(): void {
    this.router.navigate(['/guest-to-account'], { queryParams: { email: this.submittedEmail } });
    this.closeDialog();
  }

  onSkipAccountCreation(): void { this.closeDialog(); }
}
