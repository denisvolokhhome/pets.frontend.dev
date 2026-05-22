import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ServiceProviderRegistrationComponent } from './service-provider-registration.component';
import { ServiceProviderService } from 'src/app/services/service-provider.service';
import { IServiceCategory } from 'src/app/models/service-category';
import { CommonModule } from '@angular/common';

const MOCK_CATEGORIES: IServiceCategory[] = [
  { id: 1, name: 'Grooming', slug: 'grooming', is_active: true },
  { id: 2, name: 'Dog Walking', slug: 'dog-walking', is_active: true },
  { id: 3, name: 'Cat Sitting', slug: 'cat-sitting', is_active: true },
];

describe('ServiceProviderRegistrationComponent', () => {
  let component: ServiceProviderRegistrationComponent;
  let fixture: ComponentFixture<ServiceProviderRegistrationComponent>;
  let mockServiceProviderService: jasmine.SpyObj<ServiceProviderService>;

  beforeEach(async () => {
    mockServiceProviderService = jasmine.createSpyObj('ServiceProviderService', ['getCategories']);
    mockServiceProviderService.getCategories.and.returnValue(of(MOCK_CATEGORIES));

    await TestBed.configureTestingModule({
      declarations: [ServiceProviderRegistrationComponent],
      imports: [CommonModule],
      providers: [
        { provide: ServiceProviderService, useValue: mockServiceProviderService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceProviderRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load categories on init', () => {
    expect(mockServiceProviderService.getCategories).toHaveBeenCalledTimes(1);
    expect(component.categories.length).toBe(3);
  });

  it('should show loading state while fetching', () => {
    // Reset and check loading flag before detectChanges
    component.isLoading = true;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.spr-loading')).toBeTruthy();
  });

  it('should display category cards after loading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.spr-card');
    expect(cards.length).toBe(3);
  });

  it('should toggle category selection on click', () => {
    expect(component.isSelected(1)).toBeFalse();
    component.toggleCategory(1);
    expect(component.isSelected(1)).toBeTrue();
    component.toggleCategory(1);
    expect(component.isSelected(1)).toBeFalse();
  });

  it('should emit selected category IDs when toggling', () => {
    const emittedValues: number[][] = [];
    component.categoriesSelected.subscribe((ids) => emittedValues.push(ids));

    component.toggleCategory(1);
    component.toggleCategory(3);

    expect(emittedValues.length).toBe(2);
    expect(emittedValues[0]).toEqual([1]);
    expect(emittedValues[1]).toContain(1);
    expect(emittedValues[1]).toContain(3);
  });

  it('should allow selecting multiple categories simultaneously', () => {
    component.toggleCategory(1);
    component.toggleCategory(2);
    component.toggleCategory(3);
    expect(component.selectedIds.size).toBe(3);
  });

  it('should show validation error when showError=true and nothing selected', () => {
    component.showError = true;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.spr-validation-error')).toBeTruthy();
    expect(compiled.querySelector('.spr-validation-error')?.textContent).toContain(
      'Please select at least one service category'
    );
  });

  it('should NOT show validation error when showError=true but categories are selected', () => {
    component.showError = true;
    component.toggleCategory(1);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.spr-validation-error')).toBeNull();
  });

  it('should NOT show validation error when showError=false', () => {
    component.showError = false;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.spr-validation-error')).toBeNull();
  });

  it('should show error banner when categories fail to load', () => {
    mockServiceProviderService.getCategories.and.returnValue(
      throwError(() => new Error('Network error'))
    );
    component.ngOnInit();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.spr-error-banner')).toBeTruthy();
  });

  it('hasError getter returns true only when showError=true and nothing selected', () => {
    component.showError = false;
    expect(component.hasError).toBeFalse();

    component.showError = true;
    expect(component.hasError).toBeTrue();

    component.toggleCategory(1);
    expect(component.hasError).toBeFalse();
  });
});
