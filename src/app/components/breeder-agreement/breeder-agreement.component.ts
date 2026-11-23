import { Component, ElementRef } from '@angular/core';

import { downloadTextFile, policyTextFromPage } from '../shared/policy-text';

@Component({
  standalone: false,
  selector: 'app-breeder-agreement',
  templateUrl: './breeder-agreement.component.html',
  styleUrls: ['./breeder-agreement.component.css']
})
export class BreederAgreementComponent {
  lastUpdated = 'November 22, 2026';

  constructor(private el: ElementRef<HTMLElement>) {}

  downloadAgreement(): void {
    downloadTextFile(this.getPolicyText(), 'breedly-breeder-agreement.txt');
  }

  /** The downloaded file is built from the rendered page, so it always matches it. */
  getPolicyText(): string {
    return policyTextFromPage(this.el.nativeElement);
  }
}
