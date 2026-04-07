import { Component, EventEmitter, Input, Output, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BreederSearchResult } from 'src/app/models/search';
import { AuthService } from 'src/app/services/auth.service';
import { ReviewService } from 'src/app/services/review.service';
import { ReviewSummary, ReviewRead } from 'src/app/models/review.model';
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

  // Review data
  reviewSummary: ReviewSummary | null = null;
  reviews: ReviewRead[] = [];
  reviewPage: number = 0;
  reviewTotal: number = 0;
  isLoadingReviews: boolean = false;
  topTags: { name: string; count: number }[] = [];

  constructor(
    private router: Router,
    public authService: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private reviewService: ReviewService
  ) {}

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
    this.reviewSummary = null;
    this.reviews = [];
    this.reviewPage = 0;
    this.reviewTotal = 0;
    this.topTags = [];

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

    // Fetch review summary
    this.reviewService.getBreederSummary(this.breeder.user_id).subscribe({
      next: (summary) => {
        this.reviewSummary = summary;
        this.topTags = this.getTopTags(summary.tag_counts, 3);
        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      }
    });

    // Fetch first page of reviews
    this.loadReviews(0);
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
   * Load a page of reviews for the breeder
   */
  loadReviews(page: number): void {
    this.isLoadingReviews = true;
    this.reviewService.getBreederReviews(this.breeder.user_id, page).subscribe({
      next: (result) => {
        this.reviews = result.items;
        this.reviewTotal = result.total;
        this.reviewPage = page;
        this.isLoadingReviews = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingReviews = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Get top N tags sorted by count descending
   */
  getTopTags(tagCounts: Record<string, number>, limit: number): { name: string; count: number }[] {
    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Total number of review pages
   */
  get totalReviewPages(): number {
    return Math.ceil(this.reviewTotal / 10);
  }

  /**
   * Navigate to a review page
   */
  onReviewPageChange(page: number): void {
    if (page >= 0 && page < this.totalReviewPages) {
      this.loadReviews(page);
    }
  }

  /**
   * Format a review date for display
   */
  formatReviewDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
