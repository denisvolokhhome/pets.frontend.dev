import { Component } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-refund-policy',
  templateUrl: './refund-policy.component.html',
  styleUrls: ['./refund-policy.component.css']
})
export class RefundPolicyComponent {
  lastUpdated = 'April 20, 2026';

  downloadPolicy(): void {
    const blob = new Blob([this.getText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'breedly-refund-policy.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  private getText(): string {
    return `BREEDLY REFUND AND CANCELLATION POLICY
Last Updated: April 20, 2026

This policy applies to Breedly subscription fees paid by Breeders.
It does not govern transactions between breeders and pet seekers for
the purchase of animals — those are private transactions.

================================================================================

1. SCOPE

This Refund and Cancellation Policy covers:
- Breedly subscription plan fees (monthly or annual)
- Any one-time platform fees charged by Breedly

It does NOT cover:
- Money exchanged between breeders and pet seekers for animals
- Third-party services (Stripe processing fees are non-refundable)

================================================================================

2. SUBSCRIPTION CANCELLATION

2.1 How to Cancel
You may cancel your Breedly subscription at any time through:
- Your account Settings > Subscription page
- By contacting us at billing@breedly.us or (240) 242-9483

2.2 When Cancellation Takes Effect
Cancellation takes effect at the end of your current billing period.
You will retain full access to your subscription features until that date.
You will not be charged for the next billing period.

2.3 No Partial Refunds for Cancellation
We do not provide refunds for the unused portion of a billing period when
you cancel mid-cycle. Your access continues until the period ends.

================================================================================

3. REFUNDS

3.1 General Policy
Subscription fees are non-refundable except in the circumstances described
in Sections 3.2 and 3.3 below.

3.2 Eligible Refund Circumstances
You may be eligible for a full or partial refund if:

- Duplicate charge: You were charged more than once for the same billing period.
- Charge after cancellation: You were charged after a confirmed cancellation.
- Service unavailability: Breedly was completely unavailable for more than
  72 consecutive hours during a paid billing period due to our fault.
- Billing error: An error on our part resulted in an incorrect charge amount.

3.3 How to Request a Refund
To request a refund, contact us within 30 days of the charge:
- Email: billing@breedly.us
- Phone: (240) 242-9483
- Include your account email, the charge date, and the reason for your request.

We will review your request and respond within 5 business days.
Approved refunds are processed back to your original payment method within
5–10 business days, depending on your bank or card issuer.

3.4 Refunds Required by Law
Nothing in this policy limits any rights you may have under applicable
federal or state consumer protection law.

================================================================================

4. PLAN CHANGES

4.1 Upgrading
If you upgrade to a higher-tier plan mid-cycle, you will be charged a
prorated amount for the remainder of the current billing period.

4.2 Downgrading
If you downgrade to a lower-tier plan, the change takes effect at the
start of your next billing period. No refund is issued for the difference
in the current period.

================================================================================

5. FREE TRIALS

If Breedly offers a free trial period, no charge is made during the trial.
You may cancel before the trial ends to avoid being charged. If you do not
cancel, your subscription begins automatically at the end of the trial period.

================================================================================

6. ANIMAL PURCHASE TRANSACTIONS

Breedly is a marketplace platform. We are not a party to transactions between
breeders and pet seekers. Any refund, return, or dispute regarding the purchase
of an animal must be resolved directly between the buyer and the breeder.

Breedly does not mediate, arbitrate, or provide refunds for animal purchase
transactions.

================================================================================

7. CHARGEBACKS

If you initiate a chargeback with your bank or card issuer without first
contacting us to resolve the issue, we reserve the right to suspend your
account pending resolution. We encourage you to contact us first at
billing@breedly.us — most issues can be resolved quickly.

================================================================================

8. CONTACT US

For billing and refund questions:

Email:   billing@breedly.us
Phone:   (240) 242-9483
Website: https://breedly.us
State:   Maryland, United States

================================================================================

© 2026 Breedly. All rights reserved.
`;
  }
}
