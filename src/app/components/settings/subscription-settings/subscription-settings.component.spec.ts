import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { SubscriptionSettingsComponent } from './subscription-settings.component';
import { BillingService } from '../../../services/billing.service';
import { ToastService } from '../../../services/toast.service';
import { IPlan, ISubscription } from '../../../models/billing.model';

describe('SubscriptionSettingsComponent', () => {
  let component: SubscriptionSettingsComponent;
  let fixture: ComponentFixture<SubscriptionSettingsComponent>;
  let billingServiceSpy: jasmine.SpyObj<BillingService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

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

  const mockSubscription: ISubscription = {
    id: 'sub-id',
    user_id: 'user-id',
    plan_id: 'plan-free-id',
    plan: mockFreePlan,
    status: 'active',
    current_period_start: '2024-01-01T00:00:00Z',
    current_period_end: '2024-02-01T00:00:00Z',
    stripe_customer_id: null,
    stripe_subscription_id: null
  };

  beforeEach(async () => {
    billingServiceSpy = jasmine.createSpyObj('BillingService', [
      'getPlans',
      'getSubscription',
      'createCheckoutSession'
    ]);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['error', 'success']);

    billingServiceSpy.getSubscription.and.returnValue(of(mockSubscription));
    billingServiceSpy.getPlans.and.returnValue(of([mockFreePlan, mockProPlan]));

    await TestBed.configureTestingModule({
      declarations: [SubscriptionSettingsComponent],
      providers: [
        { provide: BillingService, useValue: billingServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(SubscriptionSettingsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load subscription and plans on init', () => {
    fixture.detectChanges();

    expect(billingServiceSpy.getSubscription).toHaveBeenCalled();
    expect(billingServiceSpy.getPlans).toHaveBeenCalled();
    expect(component.subscription).toEqual(mockSubscription);
    expect(component.plans.length).toBe(2);
    expect(component.isLoading).toBeFalse();
  });

  it('should identify the current plan', () => {
    fixture.detectChanges();

    expect(component.isCurrentPlan(mockFreePlan)).toBeTrue();
    expect(component.isCurrentPlan(mockProPlan)).toBeFalse();
  });

  it('should identify paid plans', () => {
    expect(component.isPaidPlan(mockFreePlan)).toBeFalse();
    expect(component.isPaidPlan(mockProPlan)).toBeTrue();
  });

  it('should format price correctly', () => {
    expect(component.formatPrice(mockFreePlan)).toBe('Free');
    expect(component.formatPrice(mockProPlan)).toBe('$29.99/month');
  });

  it('should return correct status labels', () => {
    expect(component.getStatusLabel('active')).toBe('Active');
    expect(component.getStatusLabel('canceled')).toBe('Canceled');
    expect(component.getStatusLabel('past_due')).toBe('Past Due');
    expect(component.getStatusLabel('unknown')).toBe('unknown');
  });

  it('should show error when subscription load fails', () => {
    billingServiceSpy.getSubscription.and.returnValue(
      throwError(() => ({ message: 'Network error' }))
    );
    fixture.detectChanges();

    expect(component.errorMessage).toBe('Network error');
    expect(component.isLoading).toBeFalse();
    expect(toastServiceSpy.error).toHaveBeenCalled();
  });

  it('should show error when plans load fails', () => {
    billingServiceSpy.getPlans.and.returnValue(
      throwError(() => ({ message: 'Plans error' }))
    );
    fixture.detectChanges();

    expect(component.errorMessage).toBe('Plans error');
    expect(component.isLoading).toBeFalse();
  });

  it('should call createCheckoutSession on upgrade', () => {
    fixture.detectChanges();

    billingServiceSpy.createCheckoutSession.and.returnValue(
      of({ checkout_url: 'https://checkout.stripe.com/session123' })
    );

    component.onUpgrade(mockProPlan);

    expect(billingServiceSpy.createCheckoutSession).toHaveBeenCalledWith('plan-pro-id');
    expect(component.isRedirecting).toBeTrue();
  });

  it('should not upgrade if already on the plan', () => {
    fixture.detectChanges();
    component.onUpgrade(mockFreePlan);

    expect(billingServiceSpy.createCheckoutSession).not.toHaveBeenCalled();
  });

  it('should show error on checkout failure', () => {
    fixture.detectChanges();

    billingServiceSpy.createCheckoutSession.and.returnValue(
      throwError(() => ({ message: 'Checkout failed' }))
    );

    component.onUpgrade(mockProPlan);

    expect(component.isRedirecting).toBeFalse();
    expect(toastServiceSpy.error).toHaveBeenCalled();
  });

  it('should display current plan info in the template', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.current-plan-info')).toBeTruthy();
    expect(compiled.textContent).toContain('Free');
    expect(compiled.textContent).toContain('Active');
  });

  it('should display plan cards', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.plan-card');

    expect(cards.length).toBe(2);
  });

  it('should show Current Plan badge on active plan card', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const badges = compiled.querySelectorAll('.plan-card-badge');

    expect(badges.length).toBe(1);
    expect(badges[0].textContent?.trim()).toBe('Current Plan');
  });

  it('should show Upgrade button only on paid non-current plans', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const upgradeButtons = compiled.querySelectorAll('.btn-upgrade');

    expect(upgradeButtons.length).toBe(1);
    expect(upgradeButtons[0].textContent).toContain('Upgrade');
  });
});
