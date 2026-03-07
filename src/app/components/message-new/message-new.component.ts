import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageThreadComponent, OffspringContext } from '../message-thread/message-thread.component';
import { OffspringService } from 'src/app/services/offspring.service';
import { ToastService } from 'src/app/services/toast.service';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private offspringService: OffspringService,
    private toastr: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.breederId = params['breederId'];
      this.offspringId = params['offspringId'];
      this.threadId = params['threadId'];

      if (!this.breederId) {
        this.toastr.error('Breeder information is missing', 'Error');
        this.router.navigate(['/messages']);
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
    if (this.offspringId) {
      this.router.navigate(['/offspring', this.offspringId]);
    } else {
      // Go back to messages list instead of search
      this.router.navigate(['/messages']);
    }
  }
}
