import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ReviewFormComponent } from './review-form.component';
import { ReviewService } from '../../services/review.service';
import { ToastService } from '../../services/toast.service';
import { ReviewRead } from '../../models/review.model';

describe('ReviewFormComponent', () => {
  let component: ReviewFormComponent;
  let fixture: ComponentFixture<ReviewFormComponent>;
  let reviewServiceSpy: jasmine.SpyObj<ReviewService>;
  let toastrSpy: jasmine.SpyObj<ToastService>;

  const mockTags = ['Communication', 'Animal Care', 'Responsiveness'];

  const mockReview: ReviewRead = {
    id: 'review-1',
    reviewer_id: 'user-1',
    breeder_id: 'breeder-1',
    thread_id: 'thread-1',
    rating: 4,
    tags: ['Communication'],
    comment: 'Great experience',
    created_at: '2024-01-01T00:00:00Z',
    reviewer_name: 'Test User'
  };

  beforeEach(async () => {
    reviewServiceSpy = jasmine.createSpyObj('ReviewService', ['getTags', 'submitReview']);
    toastrSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    reviewServiceSpy.getTags.and.returnValue(of(mockTags));
    reviewServiceSpy.submitReview.and.returnValue(of(mockReview));

    await TestBed.configureTestingModule({
      imports: [ReviewFormComponent, FormsModule],
      providers: [
        { provide: ReviewService, useValue: reviewServiceSpy },
        { provide: ToastService, useValue: toastrSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewFormComponent);
    component = fixture.componentInstance;
    component.breederId = 'breeder-1';
    component.breederName = 'Test Breeder';
    component.threadId = 'thread-1';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch tags on init', () => {
    expect(reviewServiceSpy.getTags).toHaveBeenCalled();
    expect(component.tags).toEqual(mockTags);
  });

  it('should display breeder name in the question', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('How was your experience with Test Breeder?');
  });

  it('should display disclaimer text', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Ratings and reviews are visible to everyone on Breedly');
  });

  it('should render 5 star buttons', () => {
    const stars = fixture.nativeElement.querySelectorAll('.star-button');
    expect(stars.length).toBe(5);
  });

  it('should highlight stars up to selected rating', () => {
    component.selectStar(3);
    fixture.detectChanges();

    expect(component.selectedRating).toBe(3);
    expect(component.isStarActive(1)).toBeTrue();
    expect(component.isStarActive(2)).toBeTrue();
    expect(component.isStarActive(3)).toBeTrue();
    expect(component.isStarActive(4)).toBeFalse();
    expect(component.isStarActive(5)).toBeFalse();
  });

  it('should disable submit when no rating selected', () => {
    expect(component.isSubmitDisabled).toBeTrue();
  });

  it('should enable submit when rating is selected', () => {
    component.selectStar(4);
    expect(component.isSubmitDisabled).toBeFalse();
  });

  it('should toggle tags on click', () => {
    component.toggleTag('Communication');
    expect(component.isTagSelected('Communication')).toBeTrue();

    component.toggleTag('Communication');
    expect(component.isTagSelected('Communication')).toBeFalse();
  });

  it('should track character count', () => {
    component.comment = 'Hello';
    expect(component.characterCount).toBe(5);
    expect(component.remainingCharacters).toBe(1995);
  });

  it('should submit review and show success toast', () => {
    component.selectStar(4);
    component.toggleTag('Communication');
    component.comment = 'Great experience';

    const emitSpy = spyOn(component.reviewSubmitted, 'emit');

    component.onSubmit();

    expect(reviewServiceSpy.submitReview).toHaveBeenCalledWith({
      breeder_id: 'breeder-1',
      thread_id: 'thread-1',
      rating: 4,
      tags: ['Communication'],
      comment: 'Great experience'
    });
    expect(toastrSpy.success).toHaveBeenCalledWith('Your review has been submitted!', 'Review Submitted');
    expect(emitSpy).toHaveBeenCalledWith(mockReview);
  });

  it('should show error toast on submission failure', () => {
    reviewServiceSpy.submitReview.and.returnValue(
      throwError(() => ({ message: 'Review already submitted for this interaction' }))
    );

    component.selectStar(3);
    component.onSubmit();

    expect(toastrSpy.error).toHaveBeenCalledWith(
      'Review already submitted for this interaction',
      'Error'
    );
    expect(component.submitting).toBeFalse();
  });

  it('should emit close event when close button clicked', () => {
    const closeSpy = spyOn(component.close, 'emit');
    component.onClose();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should not submit when rating is 0', () => {
    component.onSubmit();
    expect(reviewServiceSpy.submitReview).not.toHaveBeenCalled();
  });

  it('should show default avatar when no breeder image', () => {
    component.breederImage = null;
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('.breeder-avatar i.bi-person-circle');
    expect(icon).toBeTruthy();
  });

  it('should display submit button disabled state in DOM', () => {
    fixture.detectChanges();
    const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.submit-button');
    expect(submitBtn.disabled).toBeTrue();

    component.selectStar(2);
    fixture.detectChanges();
    expect(submitBtn.disabled).toBeFalse();
  });
});
