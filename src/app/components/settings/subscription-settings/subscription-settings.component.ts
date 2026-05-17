import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BillingService } from '../../../services/billing.service';
import { IPlan, ISubscription, IInvoice } from '../../../models/billing.model';
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
  invoices: IInvoice[] = [];
  isLoading = true;
  isLoadingInvoices = false;
  isRedirecting = false;
  isOpeningPortal = false;
  isVerifyingSession = false;
  downloadingInvoiceId: string | null = null;
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
        this.loadInvoices();
      },
      error: (err) => {
        this.errorMessage = err.message || 'Unable to load plans.';
        this.toastr.error(this.errorMessage!, 'Error');
        this.isLoading = false;
      }
    });
  }

  private loadInvoices(): void {
    this.isLoadingInvoices = true;
    this.billingService.getInvoices().subscribe({
      next: (invoices) => {
        this.invoices = invoices;
        this.isLoadingInvoices = false;
      },
      error: () => {
        this.isLoadingInvoices = false;
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

  get hasActivePaymentPlan(): boolean {
    return !!this.subscription &&
      this.subscription.status === 'active' &&
      this.subscription.plan.price > 0 &&
      !!this.subscription.stripe_customer_id;
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

  onDownloadInvoice(invoice: IInvoice): void {
    if (this.downloadingInvoiceId) return;
    this.downloadingInvoiceId = invoice.id;

    this.billingService.downloadInvoice(invoice.id).subscribe({
      next: (response) => {
        this.downloadingInvoiceId = null;
        const url = response.invoice_pdf || response.hosted_invoice_url;
        if (url) {
          window.open(url, '_blank');
        } else {
          this.toastr.warning('No download link available for this invoice.', 'Not Available');
        }
      },
      error: (err) => {
        this.downloadingInvoiceId = null;
        this.toastr.error(err.message || 'Failed to get invoice download link.', 'Error');
      }
    });
  }

  formatInvoiceAmount(invoice: IInvoice): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency.toUpperCase()
    }).format(invoice.amount);
  }

  formatInvoiceDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  formatInvoicePeriod(invoice: IInvoice): string {
    const start = new Date(invoice.period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const end = new Date(invoice.period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} – ${end}`;
  }

  get paidInvoices(): IInvoice[] {
    return this.invoices.filter(i => i.status === 'paid');
  }
}
