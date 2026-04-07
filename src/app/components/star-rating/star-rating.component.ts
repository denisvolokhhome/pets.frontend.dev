import { Component, Input, OnChanges } from '@angular/core';

export type StarState = 'full' | 'half' | 'empty';

@Component({
  standalone: false,
  selector: 'app-star-rating',
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.css']
})
export class StarRatingComponent implements OnChanges {
  @Input() rating: number = 0;
  @Input() reviewCount: number = 0;

  stars: StarState[] = ['empty', 'empty', 'empty', 'empty', 'empty'];

  ngOnChanges(): void {
    this.stars = this.computeStars(this.rating);
  }

  computeStars(rating: number): StarState[] {
    const clamped = Math.max(0, Math.min(5, rating));
    const result: StarState[] = [];
    for (let i = 1; i <= 5; i++) {
      if (clamped >= i) {
        result.push('full');
      } else if (clamped >= i - 0.5) {
        result.push('half');
      } else {
        result.push('empty');
      }
    }
    return result;
  }

  getReviewCountText(): string {
    if (this.reviewCount === 1) {
      return '(1 review)';
    }
    return `(${this.reviewCount} reviews)`;
  }
}
