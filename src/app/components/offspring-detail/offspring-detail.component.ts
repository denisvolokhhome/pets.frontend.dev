import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location, CommonModule } from '@angular/common';
import { GalleriaModule } from 'primeng/galleria';
import { OffspringService, OffspringRead } from 'src/app/services/offspring.service';
import { FavoriteService } from 'src/app/services/favorite.service';
import { MessageService } from 'src/app/services/message.service';
import { ToastService } from 'src/app/services/toast.service';
import { AuthService } from 'src/app/services/auth.service';
import { GuestPromptModalComponent } from '../guest-prompt-modal/guest-prompt-modal.component';
import { OffspringEditComponent } from '../offspring-edit/offspring-edit.component';
import { OffspringDocumentsComponent } from '../offspring-documents/offspring-documents.component';
import { GenealogyService } from 'src/app/services/genealogy.service';
import { ApplicationFormModalComponent, ApplicationFormSubmission } from '../application-form-modal/application-form-modal.component';

@Component({
  standalone: true,
  selector: 'app-offspring-detail',
  templateUrl: './offspring-detail.component.html',
  styleUrls: ['./offspring-detail.component.css'],
  imports: [CommonModule, GalleriaModule, GuestPromptModalComponent, OffspringEditComponent, OffspringDocumentsComponent, ApplicationFormModalComponent]
})
export class OffspringDetailComponent implements OnInit {
  offspringId: string = '';
  offspring: OffspringRead | null = null;
  isLoading: boolean = true;
  isDeleting: boolean = false;
  isTogglingFavorite: boolean = false;
  showGuestModal: boolean = false;
  showEditModal: boolean = false;
  
  // View mode: 'breeder' or 'public'
  viewMode: 'breeder' | 'public' = 'breeder';
  
  // Related offsprings from same breeder
  relatedOffsprings: OffspringRead[] = [];
  isLoadingRelated: boolean = false;

  // Gallery images for PrimeNG Galleria
  images: any[] = [];
  displayCustom: boolean = false;
  activeIndex: number = 0;

  // Convert to pet
  showConvertConfirm: boolean = false;
  isConverting: boolean = false;

  // Publish toggle
  isTogglingPublish: boolean = false;

  // Application form modal (pet seeker)
  showApplicationForm: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private offspringService: OffspringService,
    private favoriteService: FavoriteService,
    private messageService: MessageService,
    private toastr: ToastService,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private genealogyService: GenealogyService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.offspringId = params['id'];
      
      // Determine view mode based on route
      const url = this.router.url;
      // If URL starts with /offspring/ (not /offsprings/), it's public view
      this.viewMode = url.startsWith('/offspring/') ? 'public' : 'breeder';
      
      this.loadOffspringDetails();
    });

    // Check for post-auth message thread opening
    this.route.queryParams.subscribe(queryParams => {
      if (queryParams['openMessage'] === 'true' && this.isAuthenticated()) {
        // Auto-open message thread after authentication
        this.openMessageThread();
      }
    });
  }

  loadOffspringDetails(): void {
    this.isLoading = true;
    
    // Use appropriate service method based on view mode
    const loadObservable = this.viewMode === 'public'
      ? this.offspringService.getPublicOffspring(this.offspringId)
      : this.offspringService.getOffspring(this.offspringId);
    
    loadObservable.subscribe({
      next: (data) => {
        this.offspring = data;
        this.prepareGalleryImages();
        
        // Load related offsprings for public view
        if (this.viewMode === 'public' && this.offspring?.user_id) {
          this.loadRelatedOffsprings();
        }
        
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading offspring details:', error);
        this.toastr.error(error.message || 'Failed to load offspring details', 'Error');
        this.isLoading = false;
        this.cdr.detectChanges();
        
        // Navigate back based on view mode
        if (this.viewMode === 'public') {
          this.router.navigate(['/search']);
        } else {
          this.router.navigate(['/offsprings']);
        }
      }
    });
  }

  prepareGalleryImages(): void {
    if (!this.offspring || !this.offspring.images) {
      this.images = [];
      return;
    }

    // Sort images by display_order
    const sortedImages = [...this.offspring.images].sort((a, b) => a.display_order - b.display_order);
    
    this.images = sortedImages.map(image => ({
      itemImageSrc: `http://breedly.com:8000${image.image_url}`,
      thumbnailImageSrc: `http://breedly.com:8000${image.image_url}`,
      alt: this.offspring?.name || 'Offspring',
      title: image.is_primary ? 'Primary Image' : ''
    }));
  }

  imageClick(index: number): void {
    this.activeIndex = index;
    this.displayCustom = true;
  }

  editOffspring(): void {
    this.showEditModal = true;
  }

  onOffspringSaved(): void {
    this.showEditModal = false;
    // Reload offspring details to show updated data
    this.loadOffspringDetails();
  }

  onModalClosed(): void {
    this.showEditModal = false;
  }

  deleteOffspring(): void {
    if (!this.offspring) return;

    if (confirm(`Are you sure you want to delete offspring "${this.offspring.name || 'Unnamed'}"? This action cannot be undone.`)) {
      this.isDeleting = true;
      this.offspringService.deleteOffspring(this.offspringId).subscribe({
        next: () => {
          this.toastr.success('Offspring deleted successfully', 'Success');
          this.router.navigate(['/offsprings']);
        },
        error: (error) => {
          console.error('Error deleting offspring:', error);
          this.toastr.error(error.message || 'Failed to delete offspring', 'Error');
          this.isDeleting = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  viewMessages(): void {
    // Navigate to messages view filtered by offspring
    this.router.navigate(['/messages'], { queryParams: { offspring_id: this.offspringId } });
  }

  goBack(): void {
    // Use browser history to go back to previous page
    this.location.back();
  }

  navigateToBreeding(): void {
    if (this.offspring?.breeding_id) {
      this.router.navigate(['/breeding', this.offspring.breeding_id]);
    }
  }

  navigateToPet(petId: string): void {
    if (petId) {
      this.router.navigate(['/pets', petId]);
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Available':
        return 'status-available';
      case 'Reserved':
        return 'status-reserved';
      case 'Sold':
        return 'status-sold';
      case 'Archived':
        return 'status-archived';
      default:
        return '';
    }
  }

  getStatusLabel(status: string): string {
    return status || 'Unknown';
  }

  getPrimaryImageUrl(): string {
    if (!this.offspring) return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
    
    if (this.offspring.primary_image) {
      return `http://breedly.com:8000${this.offspring.primary_image.image_url}`;
    }
    
    if (this.offspring.images && this.offspring.images.length > 0) {
      return `http://breedly.com:8000${this.offspring.images[0].image_url}`;
    }
    
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
  }

  hasImages(): boolean {
    return !!(this.offspring?.images && this.offspring.images.length > 0);
  }

  getBreedName(): string {
    return this.offspring?.breed?.name || 'Unknown';
  }

  getFatherName(): string {
    return this.offspring?.father?.name || 'Unknown';
  }

  getMotherName(): string {
    return this.offspring?.mother?.name || 'Unknown';
  }

  getFatherId(): string | null {
    return this.offspring?.father?.id || null;
  }

  getMotherId(): string | null {
    return this.offspring?.mother?.id || null;
  }

  /**
   * Load related offsprings from the same breeder (for public view)
   */
  loadRelatedOffsprings(): void {
    if (!this.offspring?.user_id) return;
    
    this.isLoadingRelated = true;
    
    this.offspringService.getPublicOffspringsByBreeder(
      this.offspring.user_id,
      undefined,
      undefined,
      'Available',
      4,
      0
    ).subscribe({
      next: (response) => {
        // Filter out current offspring
        this.relatedOffsprings = response.offsprings.filter(
          o => o.id !== this.offspringId
        ).slice(0, 3);
        this.isLoadingRelated = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading related offsprings:', error);
        this.isLoadingRelated = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Toggle favorite status (for public view)
   */
  toggleFavorite(): void {
    if (!this.isAuthenticated()) {
      // Store offspring context and show guest modal
      this.storeOffspringContext();
      this.showGuestModal = true;
      return;
    }

    if (this.isTogglingFavorite || !this.offspring) return;

    this.isTogglingFavorite = true;
    const offspringId = this.offspring.id;

    // Use the offspring's is_favorited field instead of cache
    const isCurrentlyFavorited = this.offspring.is_favorited || false;

    if (isCurrentlyFavorited) {
      // Remove from favorites
      this.favoriteService.removeFavorite(offspringId).subscribe({
        next: () => {
          if (this.offspring) {
            this.offspring.is_favorited = false;
            this.toastr.success('Removed from favorites', 'Success');
          }
          this.isTogglingFavorite = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error removing favorite:', error);
          this.toastr.error(error.message || 'Failed to remove favorite', 'Error');
          this.isTogglingFavorite = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      // Add to favorites
      this.favoriteService.addFavorite(offspringId).subscribe({
        next: () => {
          if (this.offspring) {
            this.offspring.is_favorited = true;
            this.toastr.success('Added to favorites', 'Success');
          }
          this.isTogglingFavorite = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error adding favorite:', error);
          this.toastr.error(error.message || 'Failed to add favorite', 'Error');
          this.isTogglingFavorite = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  /**
   * Contact breeder about this offspring (for public view)
   */
  contactBreeder(): void {
    if (!this.isAuthenticated()) {
      // Store offspring context and show guest modal
      this.storeOffspringContext();
      this.showGuestModal = true;
      return;
    }

    if (!this.offspring) return;

    // If breeding has an application form, show it first
    if (this.hasApplicationForm()) {
      this.showApplicationForm = true;
      return;
    }

    this.navigateToMessageThread();
  }

  hasApplicationForm(): boolean {
    return !!(this.offspring?.breeding?.application_form?.form_fields?.length);
  }

  getBreedingId(): number | null {
    return this.offspring?.breeding_id ?? null;
  }

  onApplicationFormSubmitted(submission: ApplicationFormSubmission): void {
    this.showApplicationForm = false;
    if (!this.offspring) return;

    // Navigate to messaging with the form response pre-filled as the initial message
    this.messageService.checkOffspringThread(this.offspring.id).subscribe({
      next: (response) => {
        const queryParams: any = {
          breederId: this.offspring!.user_id,
          offspringId: this.offspring!.id,
          initialMessage: submission.formattedMessage
        };
        if (response.has_thread && response.thread_id) {
          queryParams.threadId = response.thread_id;
        }
        this.router.navigate(['/messages/new'], { queryParams });
      },
      error: () => {
        this.router.navigate(['/messages/new'], {
          queryParams: {
            breederId: this.offspring!.user_id,
            offspringId: this.offspring!.id,
            initialMessage: submission.formattedMessage
          }
        });
      }
    });
  }

  onApplicationFormCancelled(): void {
    this.showApplicationForm = false;
  }

  private navigateToMessageThread(): void {
    if (!this.offspring) return;
    this.messageService.checkOffspringThread(this.offspring.id).subscribe({
      next: (response) => {
        const queryParams: any = {
          breederId: this.offspring!.user_id,
          offspringId: this.offspring!.id
        };
        if (response.has_thread && response.thread_id) {
          queryParams.threadId = response.thread_id;
        }
        this.router.navigate(['/messages/new'], { queryParams });
      },
      error: () => {
        this.router.navigate(['/messages/new'], {
          queryParams: {
            breederId: this.offspring!.user_id,
            offspringId: this.offspring!.id
          }
        });
      }
    });
  }

  /**
   * Store offspring context in session storage for post-auth redirect
   */
  private storeOffspringContext(): void {
    if (!this.offspring) return;
    
    sessionStorage.setItem('pendingOffspringContact', JSON.stringify({
      offspringId: this.offspring.id,
      offspringName: this.offspring.name,
      breederId: this.offspring.user_id,
      returnUrl: this.router.url,
      timestamp: Date.now()
    }));
  }

  /**
   * Handle successful authentication from guest modal
   */
  onAuthSuccess(): void {
    this.showGuestModal = false;
    // The guest modal component handles the redirect
  }

  /**
   * Open message thread for this offspring
   */
  private openMessageThread(): void {
    if (!this.offspring) {
      // Wait for offspring to load
      setTimeout(() => this.openMessageThread(), 100);
      return;
    }

    // Navigate to message thread with offspring context
    this.router.navigate(['/messages/new'], {
      queryParams: {
        breederId: this.offspring.user_id,
        offspringId: this.offspring.id
      }
    });
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('id_token');
  }

  /**
   * Check if offspring is favorited
   */
  isFavorited(): boolean {
    return this.offspring?.is_favorited || false;
  }

  /**
   * Check if current user is the breeder (owner)
   */
  isBreederView(): boolean {
    return this.viewMode === 'breeder';
  }

  /**
   * Check if offspring can be converted to pet
   */
  canConvertToPet(): boolean {
    return this.isBreederView() && !!this.offspring && this.offspring.status !== 'Archived';
  }

  openConvertConfirm(): void {
    this.showConvertConfirm = true;
  }

  cancelConvert(): void {
    this.showConvertConfirm = false;
  }

  confirmConvertToPet(): void {
    if (!this.offspring) return;
    this.isConverting = true;
    this.genealogyService.convertOffspringToPet(this.offspring.id).subscribe({
      next: (res) => {
        this.toastr.success(res.message, 'Converted');
        this.isConverting = false;
        this.showConvertConfirm = false;
        this.router.navigate(['/pets']);
      },
      error: (err) => {
        const detail = err?.error?.detail || 'Conversion failed.';
        if (detail === 'OFFSPRING_ALREADY_CONVERTED') {
          this.toastr.warning('This offspring has already been converted.', 'Already Converted');
        } else if (detail === 'OFFSPRING_ALREADY_ARCHIVED') {
          this.toastr.warning('This offspring is archived.', 'Archived');
        } else {
          this.toastr.error(detail, 'Error');
        }
        this.isConverting = false;
        this.showConvertConfirm = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Check if this is public view
   */
  isPublicView(): boolean {
    return this.viewMode === 'public';
  }

  /**
   * Toggle published state of this offspring (breeder only)
   */
  togglePublish(): void {
    if (!this.offspring || this.isTogglingPublish) return;
    this.isTogglingPublish = true;
    this.offspringService.togglePublish(this.offspring.id).subscribe({
      next: (updated) => {
        this.offspring = updated;
        this.isTogglingPublish = false;
        const msg = updated.is_published ? 'Offspring is now visible to pet seekers.' : 'Offspring is now hidden from pet seekers.';
        this.toastr.success(msg, updated.is_published ? 'Published' : 'Unpublished');
        this.cdr.detectChanges();
      },
      error: () => {
        this.isTogglingPublish = false;
        this.toastr.error('Failed to update publish status.', 'Error');
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Navigate to breeder profile
   */
  viewBreederProfile(): void {
    if (this.offspring?.user_id) {
      this.router.navigate(['/breeder', this.offspring.user_id]);
    }
  }

  /**
   * Check if there are related offsprings
   */
  hasRelatedOffsprings(): boolean {
    return this.relatedOffsprings.length > 0;
  }
}
