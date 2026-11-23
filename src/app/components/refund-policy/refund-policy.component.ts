import { Component, ElementRef } from '@angular/core';

import { downloadTextFile, policyTextFromPage } from '../shared/policy-text';

@Component({
  standalone: false,
  selector: 'app-refund-policy',
  templateUrl: './refund-policy.component.html',
  styleUrls: ['./refund-policy.component.css']
})
export class RefundPolicyComponent {
  lastUpdated = 'November 22, 2026';

  constructor(private el: ElementRef<HTMLElement>) {}

  downloadPolicy(): void {
    downloadTextFile(this.getPolicyText(), 'breedly-refund-policy.txt');
  }

  /** The downloaded file is built from the rendered page, so it always matches it. */
  getPolicyText(): string {
    return policyTextFromPage(this.el.nativeElement);
  }
}
