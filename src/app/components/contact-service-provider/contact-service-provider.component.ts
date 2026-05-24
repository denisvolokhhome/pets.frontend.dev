import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from '../../services/message.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-contact-service-provider',
  standalone: false,
  templateUrl: './contact-service-provider.component.html',
  styleUrls: ['./contact-service-provider.component.css'],
})
export class ContactServiceProviderComponent {
  @Input() providerId!: string;
  @Input() providerName: string = 'service provider';
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() messageSent = new EventEmitter<void>();

  form: FormGroup;
  isSubmitting = false;
  sent = false;

  // Drag-to-dismiss (mobile bottom sheet)
  dragOffsetY = 0;
  private dragStartY = 0;
  private isDragging = false;
  private readonly CLOSE_DURATION = 280;
  private readonly DISMISS_THRESHOLD = 120;
  isClosing = false;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    public authService: AuthService,
    private toast: ToastService,
    private router: Router
  ) {
    this.form = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    });
  }

  get isLoggedIn(): boolean {
    return this.authService.hasValidToken();
  }

  get messageCtrl() { return this.form.get('message'); }

  // ── Drag-to-dismiss ───────────────────────────────────────────────────────

  onDragStart(event: TouchEvent): void {
    if (window.innerWidth > 640) return;
    this.isDragging = true;
    this.dragStartY = event.touches[0].clientY;
    this.dragOffsetY = 0;
  }

  onDragMove(event: TouchEvent): void {
    if (!this.isDragging) return;
    this.dragOffsetY = Math.max(0, event.touches[0].clientY - this.dragStartY);
  }

  onDragEnd(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    if (this.dragOffsetY >= this.DISMISS_THRESHOLD) {
      this.dragOffsetY = 0;
      this.close();
    } else {
      this.dragOffsetY = 0;
    }
  }

  // ── Close ─────────────────────────────────────────────────────────────────

  close(): void {
    this.isClosing = true;
    setTimeout(() => {
      this.isClosing = false;
      this.dragOffsetY = 0;
      this.visible = false;
      this.visibleChange.emit(false);
      this.form.reset();
      this.sent = false;
    }, this.CLOSE_DURATION);
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.messageService.sendThreadMessage({
      receiver_id: this.providerId,
      message: this.form.value.message.trim(),
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.sent = true;
        this.messageSent.emit();
        this.toast.success(`Message sent to ${this.providerName}!`);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.toast.error(err.message || 'Failed to send message. Please try again.');
      },
    });
  }

  goToLogin(): void {
    this.close();
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/search-pets' } });
  }

  goToRegister(): void {
    this.close();
    this.router.navigate(['/register']);
  }

  goToMessages(): void {
    this.close();
    this.router.navigate(['/messages']);
  }
}
