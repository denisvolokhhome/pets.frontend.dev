import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewPromptComponent } from './review-prompt.component';
import { ReviewService } from '../../services/review.service';
import { of, throwError } from 'rxjs';
import { ReviewEligibility, ReviewRead } from '../../models/review.model';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ReviewPromptComponent', () => {
  let component: ReviewPromptComponent;
  let fixture: ComponentFixture<ReviewPromptComponent>;
  let reviewServiceSpy: jasmine.SpyObj<ReviewService>;

  beforeEach(async () => {
    reviewServiceSpy = jasmine.createSpyObj('ReviewService', ['checkEligibility']);

    await TestBed.configureTestingModule({
      imports: [ReviewPromptComponent],
      providers: [
        { provide: ReviewService, useValue: reviewServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(ReviewPromptComponent);
    component = fixture.componentInstance;
    component.breederId = 'breeder-123';
    component.breederName = 'John Doe';
    component.threadId = 'thread-456';
  }

  it('should create', () => {
    reviewServiceSpy.checkEligibility.and.returnValue(of({ eligible: true, reason: null }));
    createComponent();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should set state to hidden when isBreeder is true', () => {
    createComponent();
    component.isBreeder = true;
    fixture.detectChanges();
    expect(component.state).toBe('hidden');
    expect(reviewServiceSpy.checkEligibility).not.toHaveBeenCalled();
  });

  it('should set state to eligible when eligibility returns eligible: true', () => {
    const eligibility: ReviewEligibility = { eligible: true, reason: null };
    reviewServiceSpy.checkEligibility.and.returnValue(of(eligibility));
    createComponent();
    fixture.detectChanges();
    expect(component.state).toBe('eligible');
    expect(reviewServiceSpy.checkEligibility).toHaveBeenCalledWith('breeder-123', 'thread-456');
  });

  it('should set state to already_reviewed when reason is already_reviewed', () => {
    const eligibility: ReviewEligibility = { eligible: false, reason: 'already_reviewed' };
    reviewServiceSpy.checkEligibility.and.returnValue(of(eligibility));
    createComponent();
    fixture.detectChanges();
    expect(component.state).toBe('already_reviewed');
  });

  it('should set state to hidden when reason is no_location_shared', () => {
    const eligibility: ReviewEligibility = { eligible: false, reason: 'no_location_shared' };
    reviewServiceSpy.checkEligibility.and.returnValue(of(eligibility));
    createComponent();
    fixture.detectChanges();
    expect(component.state).toBe('hidden');
  });

  it('should set state to hidden on eligibility check error', () => {
    reviewServiceSpy.checkEligibility.and.returnValue(throwError(() => new Error('Network error')));
    createComponent();
    fixture.detectChanges();
    expect(component.state).toBe('hidden');
  });

  it('should show prompt text with breeder name when eligible', () => {
    reviewServiceSpy.checkEligibility.and.returnValue(of({ eligible: true, reason: null }));
    createComponent();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('How was your experience with John Doe?');
  });

  it('should show Rate button when eligible', () => {
    reviewServiceSpy.checkEligibility.and.returnValue(of({ eligible: true, reason: null }));
    createComponent();
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.rate-button');
    expect(button).toBeTruthy();
    expect(button.textContent.trim()).toBe('Rate');
  });

  it('should toggle showForm when Rate button is clicked', () => {
    reviewServiceSpy.checkEligibility.and.returnValue(of({ eligible: true, reason: null }));
    createComponent();
    fixture.detectChanges();
    expect(component.showForm).toBeFalse();
    component.openForm();
    expect(component.showForm).toBeTrue();
  });

  it('should close form when closeForm is called', () => {
    reviewServiceSpy.checkEligibility.and.returnValue(of({ eligible: true, reason: null }));
    createComponent();
    fixture.detectChanges();
    component.openForm();
    expect(component.showForm).toBeTrue();
    component.closeForm();
    expect(component.showForm).toBeFalse();
  });

  it('should update state to already_reviewed when review is submitted', () => {
    reviewServiceSpy.checkEligibility.and.returnValue(of({ eligible: true, reason: null }));
    createComponent();
    fixture.detectChanges();
    component.openForm();

    const mockReview: ReviewRead = {
      id: 'review-1',
      reviewer_id: 'user-1',
      breeder_id: 'breeder-123',
      thread_id: 'thread-456',
      rating: 4,
      tags: ['Communication'],
      comment: null,
      created_at: new Date().toISOString(),
      reviewer_name: 'Test User'
    };

    component.onReviewSubmitted(mockReview);
    expect(component.state).toBe('already_reviewed');
    expect(component.submittedRating).toBe(4);
    expect(component.showForm).toBeFalse();
  });

  it('should display submitted rating in summary after review', () => {
    reviewServiceSpy.checkEligibility.and.returnValue(of({ eligible: true, reason: null }));
    createComponent();
    fixture.detectChanges();

    const mockReview: ReviewRead = {
      id: 'review-1',
      reviewer_id: 'user-1',
      breeder_id: 'breeder-123',
      thread_id: 'thread-456',
      rating: 5,
      tags: [],
      comment: null,
      created_at: new Date().toISOString(),
      reviewer_name: 'Test User'
    };

    component.onReviewSubmitted(mockReview);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('You rated John Doe 5 stars');
  });

  it('should not render anything when state is hidden', () => {
    reviewServiceSpy.checkEligibility.and.returnValue(of({ eligible: false, reason: 'no_location_shared' }));
    createComponent();
    fixture.detectChanges();
    const promptEl = fixture.nativeElement.querySelector('.review-prompt');
    expect(promptEl).toBeNull();
  });
});
