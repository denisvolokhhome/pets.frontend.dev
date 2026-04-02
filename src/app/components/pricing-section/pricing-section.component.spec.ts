import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PricingSectionComponent } from './pricing-section.component';
import { BillingService } from '../../services/billing.service';
import { IPlan } from '../../models/billing.model';

describe('PricingSectionComponent', () => {
  let component: PricingSectionComponent;
  let fixture: ComponentFixture<PricingSectionComponent>;
  let billingServiceSpy: jasmine.SpyObj<BillingService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockFreePlan: IPlan = {
    id: 'plan-free-id',
    name: 'Free',
    price: 0,
    currency: 'usd',
    billing_interval: 'month',
    max_pets: 5,
    max_published_locations: 1,
    max_simultaneous_offsprings: 20,
    is_default: true
  };

  const mockProPlan: IPlan = {
    id: 'plan-pro-id',
    name: 'Pro',
    price: 29.99,
    currency: 'usd',
    billing_interval: 'month',
    max_pets: 50,
    max_published_locations: 10,
    max_simultaneous_offsprings: 100,
    is_default: false
  };

  beforeEach(async () => {
    billingServiceSpy = jasmine.createSpyObj('BillingService', ['getPlans']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    billingServiceSpy.getPlans.and.returnValue(of([mockFreePlan, mockProPlan]));

    await TestBed.configureTestingModule({
      declarations: [PricingSectionComponent],
      providers: [
        { provide: BillingService, useValue: billingServiceSpy },
        { provide: Router, useValue: routerSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(PricingSectionComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load plans on init', () => {
    fixture.detectChanges();

    expect(billingServiceSpy.getPlans).toHaveBeenCalled();
    expect(component.plans.length).toBe(2);
    expect(component.isLoading).toBeFalse();
  });

  it('should format price as "Free" for free plans', () => {
    expect(component.formatPrice(mockFreePlan)).toBe('Free');
  });

  it('should format price with dollar sign and interval for paid plans', () => {
    expect(component.formatPrice(mockProPlan)).toBe('$29.99/month');
  });

  it('should navigate to /register on Get Started click', () => {
    component.onGetStarted();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/register']);
  });

  it('should show error when plans load fails', () => {
    billingServiceSpy.getPlans.and.returnValue(
      throwError(() => ({ message: 'Network error' }))
    );
    fixture.detectChanges();

    expect(component.errorMessage).toBe('Network error');
    expect(component.isLoading).toBeFalse();
  });

  it('should display plan cards in the template', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.plan-card');

    expect(cards.length).toBe(2);
  });

  it('should have id="pricing" on the root section', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const section = compiled.querySelector('#pricing');

    expect(section).toBeTruthy();
  });

  it('should display Get Started button on each plan card', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('.btn-get-started');

    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent?.trim()).toContain('Get Started');
  });

  it('should display plan names and usage limits', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Free');
    expect(compiled.textContent).toContain('Pro');
    expect(compiled.textContent).toContain('5 Pets');
    expect(compiled.textContent).toContain('50 Pets');
  });
});
