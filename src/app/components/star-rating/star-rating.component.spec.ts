import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StarRatingComponent, StarState } from './star-rating.component';

describe('StarRatingComponent', () => {
  let component: StarRatingComponent;
  let fixture: ComponentFixture<StarRatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StarRatingComponent],
      imports: [CommonModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(StarRatingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to 0 rating and 0 reviewCount', () => {
    expect(component.rating).toBe(0);
    expect(component.reviewCount).toBe(0);
  });

  it('should compute all empty stars for rating 0', () => {
    const stars = component.computeStars(0);
    expect(stars).toEqual(['empty', 'empty', 'empty', 'empty', 'empty']);
  });

  it('should compute all full stars for rating 5', () => {
    const stars = component.computeStars(5);
    expect(stars).toEqual(['full', 'full', 'full', 'full', 'full']);
  });

  it('should compute 3 full and 2 empty stars for rating 3', () => {
    const stars = component.computeStars(3);
    expect(stars).toEqual(['full', 'full', 'full', 'empty', 'empty']);
  });

  it('should compute half star for rating 3.5', () => {
    const stars = component.computeStars(3.5);
    expect(stars).toEqual(['full', 'full', 'full', 'half', 'empty']);
  });

  it('should compute half star for rating 4.3', () => {
    const stars = component.computeStars(4.3);
    expect(stars).toEqual(['full', 'full', 'full', 'full', 'half']);
  });

  it('should clamp rating above 5 to all full stars', () => {
    const stars = component.computeStars(6);
    expect(stars).toEqual(['full', 'full', 'full', 'full', 'full']);
  });

  it('should clamp negative rating to all empty stars', () => {
    const stars = component.computeStars(-1);
    expect(stars).toEqual(['empty', 'empty', 'empty', 'empty', 'empty']);
  });

  it('should show "New" label when reviewCount is 0', () => {
    component.rating = 0;
    component.reviewCount = 0;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const newBadge = el.querySelector('.star-rating__new');
    const countText = el.querySelector('.star-rating__count');

    expect(newBadge).toBeTruthy();
    expect(newBadge?.textContent?.trim()).toBe('New');
    expect(countText).toBeNull();
  });

  it('should show review count text when reviewCount > 0', () => {
    component.rating = 4;
    component.reviewCount = 12;
    component.ngOnChanges();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const countText = el.querySelector('.star-rating__count');
    const newBadge = el.querySelector('.star-rating__new');

    expect(countText?.textContent?.trim()).toBe('(12 reviews)');
    expect(newBadge).toBeNull();
  });

  it('should show singular "review" for count of 1', () => {
    expect(component.getReviewCountText()).toBe('(0 reviews)');
    component.reviewCount = 1;
    expect(component.getReviewCountText()).toBe('(1 review)');
  });

  it('should render correct number of filled star icons', () => {
    component.rating = 3;
    component.reviewCount = 5;
    component.ngOnChanges();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const filledStars = el.querySelectorAll('.bi-star-fill');
    const emptyStars = el.querySelectorAll('.bi-star');

    expect(filledStars.length).toBe(3);
    expect(emptyStars.length).toBe(2);
  });

  it('should have accessible aria-label', () => {
    component.rating = 4.5;
    component.reviewCount = 8;
    component.ngOnChanges();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const ratingDiv = el.querySelector('.star-rating');
    expect(ratingDiv?.getAttribute('aria-label')).toBe('Rating: 4.5 out of 5 stars, 8 reviews');
  });
});
