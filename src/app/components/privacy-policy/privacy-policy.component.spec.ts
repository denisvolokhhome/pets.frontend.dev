import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { PrivacyPolicyComponent } from './privacy-policy.component';

describe('PrivacyPolicyComponent', () => {
  let fixture: ComponentFixture<PrivacyPolicyComponent>;
  const squash = (s: string): string => s.replace(/\s+/g, ' ');
  const retention = 'Retained until the breeder deletes their account. Anyone listed on a breeder\'s waitlist '
    + 'can ask the breeder, or contact privacy@breedly.us, to have their details removed.';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PrivacyPolicyComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(PrivacyPolicyComponent);
    fixture.detectChanges();
  });

  it('waitlist retention matches what breeders can do (withdraw keeps the record)', () => {
    const page = squash(fixture.nativeElement.textContent || '');
    const text = squash((fixture.componentInstance as any).getPolicyText());
    for (const doc of [page, text]) {
      expect(doc).toContain(retention);
      expect(doc).not.toContain('removes the entry');
    }
  });
});
