import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import * as fc from 'fast-check';
import { ReviewFormComponent } from './review-form.component';
import { ReviewService } from '../../services/review.service';
import { ToastService } from '../../services/toast.service';

// Feature: breeder-reviews, Properties 10–12 (Frontend)

const ALL_TAGS = [
  'Communication',
  'Animal Care',
  'Accuracy of Description',
  'Responsiveness',
  'Professionalism',
  'Punctuality',
  'Transparency',
  'Facility Cleanliness',
];

describe('ReviewFormComponent Property Tests', () => {
  let component: ReviewFormComponent;
  let fixture: ComponentFixture<ReviewFormComponent>;
  let reviewServiceSpy: jasmine.SpyObj<ReviewService>;
  let toastrSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    reviewServiceSpy = jasmine.createSpyObj('ReviewService', ['getTags', 'submitReview']);
    toastrSpy = jasmine.createSpyObj('ToastService', ['success', 'error']);

    reviewServiceSpy.getTags.and.returnValue(of(ALL_TAGS));

    await TestBed.configureTestingModule({
      imports: [ReviewFormComponent, FormsModule],
      providers: [
        { provide: ReviewService, useValue: reviewServiceSpy },
        { provide: ToastService, useValue: toastrSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewFormComponent);
    component = fixture.componentInstance;
    component.breederId = 'breeder-1';
    component.breederName = 'Test Breeder';
    component.threadId = 'thread-1';
    fixture.detectChanges();
  });

  // Feature: breeder-reviews, Property 10: Star selection enables submit
  // **Validates: Requirements 8.4, 8.7**
  describe('Property 10: Star selection enables submit', () => {
    it('should highlight stars 1..N and enable submit for any star N in [1,5]', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 5 }), (n: number) => {
          // Reset state
          component.selectedRating = 0;
          component.hoveredRating = 0;

          component.selectStar(n);

          // Stars 1..N should be active
          for (let i = 1; i <= n; i++) {
            expect(component.isStarActive(i))
              .withContext(`Star ${i} should be active when rating is ${n}`)
              .toBeTrue();
          }

          // Stars N+1..5 should be inactive
          for (let i = n + 1; i <= 5; i++) {
            expect(component.isStarActive(i))
              .withContext(`Star ${i} should be inactive when rating is ${n}`)
              .toBeFalse();
          }

          // Submit should be enabled
          expect(component.isSubmitDisabled)
            .withContext(`Submit should be enabled when rating is ${n}`)
            .toBeFalse();
        }),
        { numRuns: 100 }
      );
    });

    it('should have submit disabled when rating is 0', () => {
      component.selectedRating = 0;
      component.hoveredRating = 0;
      expect(component.isSubmitDisabled).toBeTrue();
    });
  });

  // Feature: breeder-reviews, Property 11: Tag toggle is an involution
  // **Validates: Requirements 8.5**
  describe('Property 11: Tag toggle is an involution', () => {
    it('should restore original tag selection state after toggling twice', () => {
      fc.assert(
        fc.property(fc.constantFrom(...ALL_TAGS), (tag: string) => {
          // Capture original state
          const originalState = component.isTagSelected(tag);

          // Toggle once — state should flip
          component.toggleTag(tag);
          expect(component.isTagSelected(tag))
            .withContext(`Tag "${tag}" should flip after first toggle`)
            .toBe(!originalState);

          // Toggle again — state should restore
          component.toggleTag(tag);
          expect(component.isTagSelected(tag))
            .withContext(`Tag "${tag}" should restore after second toggle`)
            .toBe(originalState);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: breeder-reviews, Property 12: Character counter accuracy
  // **Validates: Requirements 8.6**
  describe('Property 12: Character counter accuracy', () => {
    it('should show correct character count and remaining for any string up to 2000 chars', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 2000 }),
          (text: string) => {
            component.comment = text;

            expect(component.characterCount)
              .withContext(`characterCount should equal text length ${text.length}`)
              .toBe(text.length);

            expect(component.remainingCharacters)
              .withContext(`remainingCharacters should equal 2000 - ${text.length}`)
              .toBe(2000 - text.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
