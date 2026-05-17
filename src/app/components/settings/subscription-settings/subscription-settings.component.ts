import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BillingService } from '../../../services/billing.service';
import { IPlan, ISubscription } from '../../../models/billing.model';
import { ToastService } from '../../../services/toast.service';

@Component({
  standalone: false,
  selector: 'app-subscription-settings',
  templateUrl: './subscription-settings.component.html',
  styleUrls: ['./subscription-settings.component.css']
})
export class SubscriptionSettingsComponent implements OnInit {
  subscription: ISubscription | null = null;
  plans: IPlan[] = [];
  isLoading = true;
  isRedirecting = false;
  isDowngrading = false;
  isOpeningPortal = false;
  isVerifyingSession = false;
  downgradeViolations: string[] = [];
  errorMessage: string | null = null;

  constructor(
    private billingService: BillingService,
    private toastr: ToastService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check if we're returning from a Stripe Checkout session
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    const canceled = this.route.snapshot.queryParamMap.get('canceled');

    if (sessionId) {
      this.verifyAndLoadSession(sessionId);
    } else {
      if (canceled === 'true') {
        this.toastr.info('Payment was canceled. Your plan has not changed.', 'Canceled');
      }
      this.loadData();
    }
  }

  /**
   * Verify the Stripe session and apply the plan upgrade, then load plans.
   * This is the reliable path for post-payment redirect — doesn't depend on webhooks.
   */
  private verifyAndLoadSession(sessionId: string): void {
    this.isLoading = true;
    this.isVerifyingSession = true;
    this.errorMessage = null;

    this.billingService.verifyCheckoutSession(sessionId).subscribe({
      next: (sub) => {
        this.subscription = sub;
        this.isVerifyingSession = false;
        this.toastr.success(`You are now on the ${sub.plan.name} plan!`, 'Subscription Updated');
        this.loadPlans();
      },
      error: (err) => {
        this.isVerifyingSession = false;
        // Session verify failed — fall back to normal load
        // (webhook may have already processed it)
        this.toastr.warning('Could not verify payment session. Loading current plan...', 'Notice');
        this.loadData();
      }
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.billingService.getSubscription().subscribe({
      next: (sub) => {
        this.subscription = sub;
        this.loadPlans();
      },
      error: (err) => {
        this.errorMessage = err.message || 'Unable to load subscription information.';
        this.toastr.error(this.errorMessage!, 'Error');
        this.isLoading = false;
      }
    });
  }

  private loadPlans(): void {
    this.billingService.getPlans().subscribe({
      next: (plans) => {
        this.plans = plans;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Unable to load plans.';
        this.toastr.error(this.errorMessage!, 'Error');
        this.isLoading = false;
      }
    });
  }

  isCurrentPlan(plan: IPlan): boolean {
    return this.subscription?.plan_id === plan.id;
  }

  isPaidPlan(plan: IPlan): boolean {
    return plan.price > 0;
  }

  isDowngradePlan(plan: IPlan): boolean {
    if (!this.subscription) return false;
    // Don't show downgrade button if this plan is already the pending downgrade target
    if (this.subscription.pending_plan_id === plan.id) return false;
    return plan.price < this.subscription.plan.price;
  }

  get hasPendingDowngrade(): boolean {
    return !!(this.subscription?.pending_plan_id && this.subscription?.pending_plan_effective_date);
  }

  get pendingDowngradeDate(): string {
    if (!this.subscription?.pending_plan_effective_date) return '';
    return new Date(this.subscription.pending_plan_effective_date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  /** Show portal button if user has ever had a Stripe customer ID (even after downgrade) */
  get hasStripeCustomer(): boolean {
    return !!this.subscription?.stripe_customer_id;
  }

  onDowngrade(plan: IPlan): void {
    if (this.isDowngrading || this.isCurrentPlan(plan)) return;
    this.downgradeViolations = [];
    this.isDowngrading = true;

    this.billingService.subscribe(plan.id).subscribe({
      next: (sub) => {
        this.subscription = sub;
        this.isDowngrading = false;
        if (sub.pending_plan_id) {
          this.toastr.info(
            `Your plan will switch to ${sub.pending_plan?.name ?? 'the new plan'} on ${this.pendingDowngradeDate}.`,
            'Downgrade Scheduled'
          );
        } else {
          this.toastr.success(`You are now on the ${sub.plan.name} plan.`, 'Plan Changed');
        }
        this.loadData();
      },
      error: (err) => {
        this.isDowngrading = false;
        if (err.status === 422 && err.error?.detail?.violations) {
          this.downgradeViolations = err.error.detail.violations;
        } else {
          const msg = err.error?.detail?.message || err.message || 'Failed to change plan.';
          this.toastr.error(msg, 'Downgrade Error');
        }
      }
    });
  }

  formatPrice(plan: IPlan): string {
    if (plan.price === 0) {
      return 'Free';
    }
    return `$${plan.price}/${plan.billing_interval}`;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Active';
      case 'canceled': return 'Canceled';
      case 'past_due': return 'Past Due';
      default: return status;
    }
  }

  onUpgrade(plan: IPlan): void {
    if (this.isRedirecting || this.isCurrentPlan(plan)) return;

    this.isRedirecting = true;
    this.billingService.createCheckoutSession(plan.id).subscribe({
      next: (response) => {
        window.location.href = response.checkout_url;
      },
      error: (err) => {
        this.isRedirecting = false;
        const msg = err.message || 'Failed to start checkout. Please try again.';
        this.toastr.error(msg, 'Checkout Error');
      }
    });
  }

  get hasActivePaymentPlan(): boolean {
    // Show portal button if user has a Stripe customer ID — even after downgrading to Free
    return !!this.subscription &&
      this.subscription.status === 'active' &&
      !!this.subscription.stripe_customer_id;
  }

  /** Cancel a scheduled downgrade by re-subscribing to the current plan */
  onCancelDowngrade(): void {
    if (!this.subscription || this.isDowngrading) return;
    this.isDowngrading = true;
    // Re-subscribe to current plan clears the pending downgrade on the backend
    this.billingService.cancelPendingDowngrade(this.subscription.id).subscribe({
      next: (sub) => {
        this.subscription = sub;
        this.isDowngrading = false;
        this.toastr.success('Scheduled downgrade has been canceled.', 'Downgrade Canceled');
      },
      error: (err) => {
        this.isDowngrading = false;
        this.toastr.error(err.message || 'Failed to cancel downgrade.', 'Error');
      }
    });
  }

  onViewInvoices(): void {
    if (this.isOpeningPortal) return;
    this.isOpeningPortal = true;
    this.billingService.createPortalSession().subscribe({
      next: (response) => {
        window.location.href = response.portal_url;
      },
      error: (err) => {
        this.isOpeningPortal = false;
        const msg = err.message || 'Failed to open billing portal. Please try again.';
        this.toastr.error(msg, 'Portal Error');
      }
    });
  }
}
