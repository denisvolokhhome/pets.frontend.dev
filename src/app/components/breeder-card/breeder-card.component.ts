import { Component, EventEmitter, Input, Output, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BreederSearchResult } from 'src/app/models/search';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';

@Component({
  standalone: false,
  selector: 'app-breeder-card',
  templateUrl: './breeder-card.component.html',
  styleUrls: ['./breeder-card.component.css']
})
export class BreederCardComponent {
  @Input() breeder!: BreederSearchResult;
  @Input() isHighlighted: boolean = false;

  @Output() cardClick = new EventEmitter<string>();
  @Output() cardHover = new EventEmitter<string>();

  apihost = environment.API_HOST;
  showContactModal: boolean = false;
  showGuestModal: boolean = false;
  showProfilePopup: boolean = false;
  breederProfile: any = null;
  isLoadingProfile: boolean = false;

  constructor(private router: Router, public authService: AuthService, private http: HttpClient, private cdr: ChangeDetectorRef) {}

  /**
   * Get the full image URL for the breeder thumbnail
   */
  getImageUrl(imagePath: string | null): string {
    if (!imagePath) {
      return 'assets/icons/default-breeder.png'; // Fallback image
    }
    
    // Backend returns 'app/filename.png', just prepend storage URL
    return `${this.apihost}/storage/${imagePath}`;
  }

  /**
   * Format distance to 1 decimal place with "miles" unit
   */
  formatDistance(distance: number): string {
    return `${distance.toFixed(1)} miles`;
  }

  /**
   * Get comma-separated list of available breed names
   */
  getBreedNames(): string {
    if (!this.breeder.available_breeds || this.breeder.available_breeds.length === 0) {
      return 'No breeds listed';
    }
    return this.breeder.available_breeds.map(b => b.breed_name).join(', ');
  }

  /**
   * Handle card click event
   */
  onCardClick(): void {
    this.cardClick.emit(this.breeder.user_id);
  }

  /**
   * Handle card hover event
   */
  onCardHover(): void {
    this.cardHover.emit(this.breeder.user_id);
  }

  /**
   * Handle view profile button click
   */
  onViewProfile(event: Event): void {
    event.stopPropagation();
    this.isLoadingProfile = true;
    this.showProfilePopup = true;
    this.http.get<any>(`${environment.API_URL}/users/breeder/${this.breeder.user_id}/public`).subscribe({
      next: (profile) => {
        this.breederProfile = profile;
        this.isLoadingProfile = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingProfile = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeProfilePopup(): void {
    this.showProfilePopup = false;
    this.breederProfile = null;
  }

  getProfileImageUrl(): string | null {
    return this.breederProfile?.profile_image_url
      ? `${this.apihost}${this.breederProfile.profile_image_url}`
      : null;
  }

  getLocationText(): string {
    const loc = this.breederProfile?.location;
    if (!loc) return '';
    return [loc.city, loc.state].filter(Boolean).join(', ');
  }

  /**
   * Handle view offsprings button click
   */
  onViewOffsprings(event: Event): void {
    event.stopPropagation(); // Prevent card click event
    this.router.navigate(['/breeder', this.breeder.user_id, 'offsprings']);
  }

  /**
   * Handle contact breeder button click
   */
  onContactBreeder(event: Event): void {
    event.stopPropagation();
    if (!localStorage.getItem('id_token')) {
      this.showGuestModal = true;
      return;
    }
    this.showContactModal = true;
  }

  onGuestAuthSuccess(): void {
    this.showGuestModal = false;
  }

  /**
   * Handle contact modal close
   */
  onContactModalClose(): void {
    this.showContactModal = false;
  }

  /**
   * Handle message sent successfully
   */
  onMessageSent(): void {
    this.showContactModal = false;
  }

  /**
   * Truncate description to specified length
   */
  truncateDescription(description: string | null, maxLength: number = 100): string {
    if (!description) {
      return 'No description available';
    }
    if (description.length <= maxLength) {
      return description;
    }
    return description.substring(0, maxLength) + '...';
  }
}
