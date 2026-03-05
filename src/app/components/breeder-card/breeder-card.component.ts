import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { BreederSearchResult } from 'src/app/models/search';
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

  constructor(private router: Router) {}

  /**
   * Get the full image URL for the breeder thumbnail
   */
  getImageUrl(imagePath: string | null): string {
    if (!imagePath) {
      return 'assets/icons/default-breeder.png'; // Fallback image
    }
    
    // Remove 'app/' prefix if present
    const cleanPath = imagePath.startsWith('app/') ? imagePath.substring(4) : imagePath;
    
    // Use /storage endpoint
    return `${this.apihost}/storage/${cleanPath}`;
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
    event.stopPropagation(); // Prevent card click event
    // TODO: Navigate to breeder profile page
    console.log('View profile for breeder:', this.breeder.user_id);
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
    event.stopPropagation(); // Prevent card click event
    this.showContactModal = true;
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
