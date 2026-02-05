import { ModalService } from './../../services/modal.service';
import { Component, Input, OnInit, OnDestroy, HostListener, ElementRef, HostBinding } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  standalone: false,
  selector: '[app-modal]',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'],
})
export class ModalComponent implements OnInit, OnDestroy {
  @Input() title: string;
  @Input() modalSize: string;
  @Input() pet_id: string;
  @Input() modalId: string = 'default';

  @HostBinding('class.visible') isVisible = false;

  private previousActiveElement: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];
  private subscription: Subscription;

  constructor(
    public ModalService: ModalService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    // Subscribe to modal visibility changes
    this.subscription = this.ModalService.getModalState(this.modalId).subscribe(isVisible => {
      this.isVisible = isVisible;
      
      if (isVisible) {
        // Store the element that had focus before modal opened
        this.previousActiveElement = document.activeElement as HTMLElement;
        
        // Set up focus trap after modal is rendered
        setTimeout(() => {
          this.setupFocusTrap();
          this.focusFirstElement();
        }, 100);
      }
    });
  }

  ngOnDestroy(): void {
    // Return focus to the element that opened the modal
    if (this.previousActiveElement && typeof this.previousActiveElement.focus === 'function') {
      this.previousActiveElement.focus();
    }
    
    // Clean up subscription
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent): void {
    if (this.isVisible) {
      event.preventDefault();
      this.closeModal();
    }
  }

  @HostListener('click', ['$event'])
  handleBackdropClick(event: MouseEvent): void {
    // Close modal if clicking on the backdrop (the host element)
    if (this.isVisible && event.target === this.elementRef.nativeElement) {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.ModalService.close(this.modalId);
  }

  private setupFocusTrap(): void {
    const modalElement = this.elementRef.nativeElement;
    
    // Get all focusable elements within the modal
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];

    this.focusableElements = Array.from(
      modalElement.querySelectorAll(focusableSelectors.join(','))
    ) as HTMLElement[];
  }

  private focusFirstElement(): void {
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }
  }

  @HostListener('keydown.tab', ['$event'])
  handleTabKey(event: KeyboardEvent): void {
    if (!this.isVisible || this.focusableElements.length === 0) {
      return;
    }

    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      // Shift + Tab: moving backwards
      if (activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: moving forwards
      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
}
