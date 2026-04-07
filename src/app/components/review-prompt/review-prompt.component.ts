import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService } from '../../services/review.service';
import { ReviewEligibility, ReviewRead } from '../../models/review.model';
import { ReviewFormComponent } from '../review-form/review-form.component';

@Component({
  selector: 'app-review-prompt',
  standalone: true,
  imports: [CommonModule, ReviewFormComponent],
  templateUrl: './review-prompt.component.html',
  styleUrls: ['./review-prompt.component.css']
})
export class ReviewPromptComponent implements OnInit {
  @Input() breederId: string = '';
  @Input() breederName: string = '';
  @Input() breederImage: string | null = null;
  @Input() threadId: string = '';
  @Input() isBreeder: boolean = false;

  state: 'loading' | 'eligible' | 'already_reviewed' | 'hidden' = 'loading';
  showForm: boolean = false;
  submittedRating: number = 0;

  constructor(private reviewService: ReviewService) {}

  ngOnInit(): void {
    if (this.isBreeder) {
      this.state = 'hidden';
      return;
    }

    this.reviewService.checkEligibility(this.breederId, this.threadId).subscribe({
      next: (result: ReviewEligibility) => {
        if (result.eligible) {
          this.state = 'eligible';
        } else if (result.reason === 'already_reviewed') {
          this.state = 'already_reviewed';
        } else {
          this.state = 'hidden';
        }
      },
      error: () => {
        this.state = 'hidden';
      }
    });
  }

  openForm(): void {
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
  }

  onReviewSubmitted(review: ReviewRead): void {
    this.showForm = false;
    this.submittedRating = review.rating;
    this.state = 'already_reviewed';
  }
}
