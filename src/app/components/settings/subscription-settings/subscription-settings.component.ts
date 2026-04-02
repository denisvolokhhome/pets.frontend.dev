import { Component, OnInit } from '@angular/core';
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
  errorMessage: string | null = null;

  constructor(
    private billingService: BillingService,
    private toastr: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
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
}
