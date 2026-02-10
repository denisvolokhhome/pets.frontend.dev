import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { BreederSearchResult } from 'src/app/models/search';

@Component({
  standalone: false,
  selector: 'app-breeder-card-list',
  templateUrl: './breeder-card-list.component.html',
  styleUrls: ['./breeder-card-list.component.css']
})
export class BreederCardListComponent implements OnChanges, AfterViewInit {
  @Input() breeders: BreederSearchResult[] = [];
  @Input() highlightedId: string | null = null;
  @Input() isLoading: boolean = false;

  @Output() cardClick = new EventEmitter<string>();
  @Output() cardHover = new EventEmitter<string>();

  @ViewChild('cardListContainer') cardListContainer!: ElementRef<HTMLDivElement>;

  // Lazy loading configuration
  visibleBreeders: BreederSearchResult[] = [];
  private readonly INITIAL_LOAD_COUNT = 20;
  private readonly LOAD_MORE_COUNT = 10;
  private currentLoadedCount = 0;

  // Skeleton loader configuration
  skeletonCount = 3;

  ngAfterViewInit(): void {
    // Set up intersection observer for lazy loading
    this.setupLazyLoading();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['breeders']) {
      this.resetLazyLoading();
    }

    if (changes['highlightedId'] && this.highlightedId) {
      this.scrollToCard(this.highlightedId);
    }
  }

  /**
   * Reset lazy loading when breeders list changes
   */
  private resetLazyLoading(): void {
    this.currentLoadedCount = 0;
    this.loadMoreBreeders();
  }

  /**
   * Load more breeders for lazy loading
   */
  private loadMoreBreeders(): void {
    const loadCount = this.currentLoadedCount === 0 
      ? this.INITIAL_LOAD_COUNT 
      : this.LOAD_MORE_COUNT;

    const endIndex = Math.min(
      this.currentLoadedCount + loadCount,
      this.breeders.length
    );

    this.visibleBreeders = this.breeders.slice(0, endIndex);
    this.currentLoadedCount = endIndex;
  }

  /**
   * Set up intersection observer for lazy loading
   */
  private setupLazyLoading(): void {
    if (!this.cardListContainer) {
      return;
    }

    const options = {
      root: this.cardListContainer.nativeElement,
      rootMargin: '100px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && this.hasMoreToLoad()) {
          this.loadMoreBreeders();
        }
      });
    }, options);

    // Observe the last card
    const observeLastCard = () => {
      const cards = this.cardListContainer.nativeElement.querySelectorAll('.breeder-card-wrapper');
      if (cards.length > 0) {
        const lastCard = cards[cards.length - 1];
        observer.observe(lastCard);
      }
    };

    // Initial observation
    setTimeout(observeLastCard, 100);

    // Re-observe when cards change
    const mutationObserver = new MutationObserver(observeLastCard);
    mutationObserver.observe(this.cardListContainer.nativeElement, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Check if there are more breeders to load
   */
  hasMoreToLoad(): boolean {
    return this.currentLoadedCount < this.breeders.length;
  }

  /**
   * Scroll to a specific card by breeder ID
   */
  scrollToCard(breederId: string): void {
    if (!this.cardListContainer) {
      return;
    }

    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      const cardElement = this.cardListContainer.nativeElement.querySelector(
        `[data-breeder-id="${breederId}"]`
      );

      if (cardElement) {
        cardElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }, 100);
  }

  /**
   * Handle card click event
   */
  onCardClick(breederId: string): void {
    this.cardClick.emit(breederId);
  }

  /**
   * Handle card hover event
   */
  onCardHover(breederId: string): void {
    this.cardHover.emit(breederId);
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByBreederId(index: number, breeder: BreederSearchResult): string {
    return breeder.user_id;
  }

  /**
   * Generate array for skeleton loaders
   */
  getSkeletonArray(): number[] {
    return Array(this.skeletonCount).fill(0).map((_, i) => i);
  }

  /**
   * Check if a breeder is highlighted
   */
  isBreederHighlighted(breederId: string): boolean {
    return this.highlightedId === breederId;
  }
}
