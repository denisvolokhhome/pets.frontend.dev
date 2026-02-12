import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService, MessageCreate } from '../../services/message.service';
import { ToastrService } from 'ngx-toastr';

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

  contactForm: FormGroup;
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private toastr: ToastrService
  ) {
    this.contactForm = this.fb.group({
      sender_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      sender_email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      message: ['', [Validators.maxLength(2000)]]
    });
  }

  get senderName() {
    return this.contactForm.get('sender_name');
  }

  get senderEmail() {
    return this.contactForm.get('sender_email');
  }

  get message() {
    return this.contactForm.get('message');
  }

  onSubmit(): void {
    if (this.contactForm.invalid || this.isSubmitting) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.contactForm.controls).forEach(key => {
        this.contactForm.get(key)?.markAsTouched();
      });
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
      next: (response) => {
        this.toastr.success(
          'Your message has been sent to the breeder!',
          'Message Sent',
          {
            timeOut: 5000,
            progressBar: true
          }
        );
        this.contactForm.reset();
        this.isSubmitting = false;
        this.messageSent.emit();
        this.closeDialog();
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.toastr.error(
          error.message || 'Failed to send message. Please try again.',
          'Error',
          {
            timeOut: 5000,
            progressBar: true
          }
        );
        this.isSubmitting = false;
      }
    });
  }

  closeDialog(): void {
    this.visible = false;
    this.visibleChange.emit(this.visible);
    this.contactForm.reset();
  }

  onCancel(): void {
    this.closeDialog();
  }
}
