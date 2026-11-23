import { Component, ElementRef } from '@angular/core';

import { downloadTextFile, policyTextFromPage } from '../shared/policy-text';

@Component({
  standalone: false,
  selector: 'app-cookie-policy',
  templateUrl: './cookie-policy.component.html',
  styleUrls: ['./cookie-policy.component.css']
})
export class CookiePolicyComponent {
  lastUpdated = 'November 22, 2026';

  constructor(private el: ElementRef<HTMLElement>) {}

  downloadPolicy(): void {
    downloadTextFile(this.getPolicyText(), 'breedly-cookie-policy.txt');
  }

  /** The downloaded file is built from the rendered page, so it always matches it. */
  getPolicyText(): string {
    return policyTextFromPage(this.el.nativeElement);
  }
}
