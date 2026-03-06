import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OffspringRead } from 'src/app/services/offspring.service';
import { FavoriteService } from 'src/app/services/favorite.service';
import { ToastService } from 'src/app/services/toast.service';
import { AuthService } from 'src/app/services/auth.service';
import { GuestPromptModalComponent } from '../guest-prompt-modal/guest-prompt-modal.component';

@Component({
  standalone: true,
  selector: 'app-offspring-card',
  templateUrl: './offspring-card.component.html',
  styleUrls: ['./offspring-card.component.css'],
  imports: [CommonModule, GuestPromptModalComponent]
})
export class OffspringCardComponent {
  @Input() offspring!: OffspringRead;
  @Input() showFavorite: boolean = true;
  @Output() favoriteToggled = new EventEmitter<string>();

  isTogglingFavorite: boolean = false;
  showGuestModal: boolean = false;

  constructor(
    private router: Router,
    private favoriteService: FavoriteService,
    private toastr: ToastService,
    private authService: AuthService
  ) {}

  /**
   * Navigate to offspring detail view
   */
  viewDetails(): void {
    if (this.offspring?.id) {
      // Navigate to public offspring detail view
      this.router.navigate(['/offspring', this.offspring.id]);
    }
  }

  /**
   * Toggle favorite status
   */
  toggleFavorite(event: Event): void {
    event.stopPropagation(); // Prevent card click
    
    if (!this.isAuthenticated()) {
      // Store offspring context and show guest modal
      this.storeOffspringContext();
      this.showGuestModal = true;
      return;
    }

    if (this.isTogglingFavorite) return;

    this.isTogglingFavorite = true;
    const offspringId = this.offspring.id;

    // Use the offspring's is_favorited field instead of cache
    const isCurrentlyFavorited = this.offspring.is_favorited || false;

    if (isCurrentlyFavorited) {
      // Remove from favorites
      this.favoriteService.removeFavorite(offspringId).subscribe({
        next: () => {
          this.offspring.is_favorited = false;
          this.favoriteToggled.emit(offspringId);
          this.toastr.success('Removed from favorites', 'Success');
          this.isTogglingFavorite = false;
        },
        error: (error: any) => {
          console.error('Error removing favorite:', error);
          this.toastr.error(error.message || 'Failed to remove favorite', 'Error');
          this.isTogglingFavorite = false;
        }
      });
    } else {
      // Add to favorites
      this.favoriteService.addFavorite(offspringId).subscribe({
        next: () => {
          this.offspring.is_favorited = true;
          this.favoriteToggled.emit(offspringId);
          this.toastr.success('Added to favorites', 'Success');
          this.isTogglingFavorite = false;
        },
        error: (error: any) => {
          console.error('Error adding favorite:', error);
          this.toastr.error(error.message || 'Failed to add favorite', 'Error');
          this.isTogglingFavorite = false;
        }
      });
    }
  }

  /**
   * Contact breeder about this offspring
   */
  contactBreeder(event: Event): void {
    event.stopPropagation(); // Prevent card click
    
    if (!this.isAuthenticated()) {
      // Store offspring context and show guest modal
      this.storeOffspringContext();
      this.showGuestModal = true;
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
   * Store offspring context in session storage for post-auth redirect
   */
  private storeOffspringContext(): void {
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
   * Get primary image URL
   */
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

  /**
   * Get status badge class
   */
  getStatusClass(): string {
    if (!this.offspring?.status) return '';
    
    switch (this.offspring.status) {
      case 'Available':
        return 'status-available';
      case 'Reserved':
        return 'status-reserved';
      case 'Sold':
        return 'status-sold';
      default:
        return '';
    }
  }

  /**
   * Get status label
   */
  getStatusLabel(): string {
    return this.offspring?.status || 'Unknown';
  }

  /**
   * Get breed name
   */
  getBreedName(): string {
    return this.offspring?.breed?.name || 'Unknown Breed';
  }

  /**
   * Check if price should be displayed
   */
  shouldShowPrice(): boolean {
    return !!(this.offspring?.price && this.offspring.price > 0);
  }

  /**
   * Format price
   */
  formatPrice(): string {
    if (!this.offspring?.price) return '';
    return `$${this.offspring.price.toLocaleString()}`;
  }
}
