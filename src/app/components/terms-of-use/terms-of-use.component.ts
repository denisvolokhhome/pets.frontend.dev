import { Component, ElementRef } from '@angular/core';

import { downloadTextFile, policyTextFromPage } from '../shared/policy-text';

@Component({
  standalone: false,
  selector: 'app-terms-of-use',
  templateUrl: './terms-of-use.component.html',
  styleUrls: ['./terms-of-use.component.css']
})
export class TermsOfUseComponent {
  lastUpdated = 'November 22, 2026';

  constructor(private el: ElementRef<HTMLElement>) {}

  downloadTerms(): void {
    downloadTextFile(this.getPolicyText(), 'breedly-terms-of-use.txt');
  }

  /** The downloaded file is built from the rendered page, so it always matches it. */
  getPolicyText(): string {
    return policyTextFromPage(this.el.nativeElement);
  }
}
