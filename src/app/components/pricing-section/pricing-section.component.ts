import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { BillingService } from '../../services/billing.service';
import { IPlan } from '../../models/billing.model';

@Component({
  standalone: false,
  selector: 'app-pricing-section',
  templateUrl: './pricing-section.component.html',
  styleUrls: ['./pricing-section.component.css']
})
export class PricingSectionComponent implements OnInit {
  plans: IPlan[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  constructor(
    private billingService: BillingService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.billingService.getPlans().subscribe({
      next: (plans) => {
        this.plans = plans;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = err.message || 'Unable to load pricing information.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  formatPrice(plan: IPlan): string {
    if (+plan.price === 0) {
      return 'Free';
    }
    return `$${plan.price}/${plan.billing_interval}`;
  }

  onGetStarted(): void {
    this.router.navigate(['/register']);
  }
}
