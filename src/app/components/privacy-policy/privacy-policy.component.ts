import { Component, ElementRef } from '@angular/core';

import { downloadTextFile, policyTextFromPage } from '../shared/policy-text';

@Component({
  standalone: false,
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.css']
})
export class PrivacyPolicyComponent {
  lastUpdated = 'November 24, 2026';

  constructor(private el: ElementRef<HTMLElement>) {}

  downloadPolicy(): void {
    downloadTextFile(this.getPolicyText(), 'breedly-privacy-policy.txt');
  }

  /** The downloaded file is built from the rendered page, so it always matches it. */
  getPolicyText(): string {
    return policyTextFromPage(this.el.nativeElement);
  }
}
