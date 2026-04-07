import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService } from '../../services/review.service';
import { ToastService } from '../../services/toast.service';
import { ReviewCreate, ReviewRead } from '../../models/review.model';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review-form.component.html',
  styleUrls: ['./review-form.component.css']
})
export class ReviewFormComponent implements OnInit {
  @Input() breederId: string = '';
  @Input() breederName: string = '';
  @Input() breederImage: string | null = null;
  @Input() threadId: string = '';

  @Output() close = new EventEmitter<void>();
  @Output() reviewSubmitted = new EventEmitter<ReviewRead>();

  selectedRating: number = 0;
  hoveredRating: number = 0;
  selectedTags: Set<string> = new Set();
  comment: string = '';
  submitting: boolean = false;
  tags: string[] = [];
  readonly maxCommentLength = 2000;

  constructor(
    private reviewService: ReviewService,
    private toastr: ToastService
  ) {}

  ngOnInit(): void {
    this.reviewService.getTags().subscribe({
      next: (tags) => {
        this.tags = tags;
      },
      error: () => {
        // Tags are non-critical; form still works without them
      }
    });
  }

  selectStar(n: number): void {
    this.selectedRating = n;
  }

  hoverStar(n: number): void {
    this.hoveredRating = n;
  }

  clearHover(): void {
    this.hoveredRating = 0;
  }

  isStarActive(index: number): boolean {
    const rating = this.hoveredRating || this.selectedRating;
    return index <= rating;
  }

  toggleTag(tag: string): void {
    if (this.selectedTags.has(tag)) {
      this.selectedTags.delete(tag);
    } else {
      this.selectedTags.add(tag);
    }
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags.has(tag);
  }

  get isSubmitDisabled(): boolean {
    return this.selectedRating === 0 || this.submitting;
  }

  get characterCount(): number {
    return this.comment.length;
  }

  get remainingCharacters(): number {
    return this.maxCommentLength - this.comment.length;
  }

  onSubmit(): void {
    if (this.isSubmitDisabled) {
      return;
    }

    this.submitting = true;

    const reviewData: ReviewCreate = {
      breeder_id: this.breederId,
      thread_id: this.threadId,
      rating: this.selectedRating,
      tags: Array.from(this.selectedTags),
      comment: this.comment.trim() || undefined
    };

    this.reviewService.submitReview(reviewData).subscribe({
      next: (review) => {
        this.submitting = false;
        this.toastr.success('Your review has been submitted!', 'Review Submitted');
        this.reviewSubmitted.emit(review);
      },
      error: (error) => {
        this.submitting = false;
        this.toastr.error(
          error.message || 'Failed to submit review. Please try again.',
          'Error'
        );
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
