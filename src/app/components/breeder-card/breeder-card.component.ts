import { Component, EventEmitter, Input, Output, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { BreederSearchResult, Coordinates } from 'src/app/models/search';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { ReviewService } from 'src/app/services/review.service';
import { ReviewSummary, ReviewRead } from 'src/app/models/review.model';
import { environment } from 'src/environments/environment';

@Component({
  standalone: false,
  selector: 'app-breeder-card',
  templateUrl: './breeder-card.component.html',
  styleUrls: ['./breeder-card.component.css']
})
export class BreederCardComponent implements OnDestroy {
  @Input() breeder!: BreederSearchResult;
  @Input() isHighlighted: boolean = false;
  /** Current map search, used for "More near you" in the offspring modal */
  @Input() searchCenter: Coordinates | null = null;
  @Input() searchRadius: number = 40;
  @Input() searchBreedId: number | null = null;
  /** Off in the Offspring view, where the puppies are listed under the card */
  @Input() showOffspringButton: boolean = true;
  /** 'compact' = one-line group header (map Offspring view) */
  @Input() variant: 'card' | 'compact' = 'card';

  @Output() cardClick = new EventEmitter<string>();
  @Output() cardHover = new EventEmitter<string>();

  apihost = environment.API_HOST;
  showGuestModal: boolean = false;
  showOffspringModal: boolean = false;
  /** Set when a guest tapped Contact; resumed after they sign in */
  private pendingContact = false;
  private pendingContactSub?: Subscription;
  showProfilePopup: boolean = false;
  breederProfile: any = null;
  isLoadingProfile: boolean = false;

  // Profile popup drag-to-dismiss
  profileDragOffsetY = 0;
  private profileDragStartY = 0;
  private profileIsDragging = false;
  private readonly PROFILE_DISMISS_THRESHOLD = 120;
  private readonly PROFILE_CLOSE_DURATION = 280;
  isProfileClosing = false;

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
    private dataService: DataService,
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

    this.dataService.getPublicBreederProfile(this.breeder.user_id).subscribe({
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
    this.isProfileClosing = true;
    setTimeout(() => {
      this.isProfileClosing = false;
      this.profileDragOffsetY = 0;
      this.showProfilePopup = false;
      this.breederProfile = null;
    }, this.PROFILE_CLOSE_DURATION);
  }

  onProfileDragStart(event: TouchEvent): void {
    if (window.innerWidth > 640) return;
    this.profileIsDragging = true;
    this.profileDragStartY = event.touches[0].clientY;
    this.profileDragOffsetY = 0;
  }

  onProfileDragMove(event: TouchEvent): void {
    if (!this.profileIsDragging) return;
    const delta = event.touches[0].clientY - this.profileDragStartY;
    this.profileDragOffsetY = Math.max(0, delta);
  }

  onProfileDragEnd(): void {
    if (!this.profileIsDragging) return;
    this.profileIsDragging = false;
    if (this.profileDragOffsetY >= this.PROFILE_DISMISS_THRESHOLD) {
      this.profileDragOffsetY = 0;
      this.closeProfilePopup();
    } else {
      this.profileDragOffsetY = 0;
    }
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

  /** Available offspring count, or null when the API didn't send one */
  get offspringCount(): number | null {
    return this.breeder.available_offspring_count ?? null;
  }

  get hasNoOffspring(): boolean {
    return this.offspringCount === 0;
  }

  /** `tel:` link for the breeder's public phone, or null */
  get phoneHref(): string | null {
    const digits = (this.breeder.phone || '').replace(/[^0-9+]/g, '');
    return digits ? `tel:${digits}` : null;
  }

  /** Breeds to favour in suggestions: the searched breed, else this breeder's */
  get suggestionBreedIds(): number[] {
    if (this.searchBreedId) return [this.searchBreedId];
    return (this.breeder.available_breeds || []).map(b => b.breed_id);
  }

  /**
   * Open the breeder's offspring in a modal over the map
   */
  onViewOffsprings(event: Event): void {
    event.stopPropagation(); // Prevent card click event
    this.showOffspringModal = true;
  }

  closeOffspringModal(): void {
    this.showOffspringModal = false;
  }

  /** "Ask about upcoming litters" from the empty offspring modal */
  onContactFromModal(): void {
    this.showOffspringModal = false;
    this.onContactBreeder(new Event('click'));
  }

  /**
   * Handle contact breeder button click
   */
  onContactBreeder(event: Event): void {
    event.stopPropagation();
    if (!localStorage.getItem('id_token')) {
      this.pendingContact = true;
      this.showGuestModal = true;
      return;
    }
    this.openConversation();
  }

  /** Open the real conversation view with this breeder. */
  private openConversation(): void {
    this.router.navigate(['/messages/new'], {
      queryParams: { breederId: this.breeder.user_id, breederName: this.breeder.breeder_name }
    });
  }

  onGuestAuthSuccess(): void {
    this.showGuestModal = false;
    if (!this.pendingContact) return;
    this.pendingContact = false;
    // The signed-in user's profile loads a moment after the token arrives.
    // Carry on to the conversation for seekers; a breeder account stays on the
    // map (breeders don't message breeders from here).
    this.pendingContactSub?.unsubscribe();
    this.pendingContactSub = this.authService.currentUser$
      .pipe(filter(user => !!user), take(1))
      .subscribe(user => {
        if (!user!.is_breeder && user!.account_type !== 'service') this.openConversation();
      });
  }

  ngOnDestroy(): void {
    this.pendingContactSub?.unsubscribe();
  }

  /**
   * Load a page of reviews for the breeder
   */
  loadReviews(page: number): void {
    this.isLoadingReviews = true;
    this.reviewService.getBreederReviews(this.breeder.user_id, page).subscribe({
      next: (result) => {
        this.reviews = result.items;
        // Overall count comes from the review summary when available
        this.reviewTotal = this.reviewSummary?.review_count ?? result.total;
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
    if (!tagCounts) return [];
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
    return description.substring(0, maxLength) + '…';
  }
}
