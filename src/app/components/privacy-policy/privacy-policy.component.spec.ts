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

  it('says Breedly is free and promises 60 days notice before any charge', () => {
    const page = squash(fixture.nativeElement.textContent || '');
    expect(page).toContain('Breedly is free.');
    expect(page).toContain('at least 60 days in advance');
  });

  it('only promises deletion timelines the team actually meets', () => {
    const page = squash(fixture.nativeElement.textContent || '');
    expect(page).toContain('within 30 days of your request');
    expect(page).not.toContain('90 days');
    expect(page).not.toContain('12 months');
  });

  it('the downloaded text is built from the page itself', () => {
    const text = (fixture.componentInstance as any).getPolicyText() as string;
    expect(text.startsWith('PRIVACY POLICY\nLast Updated: November 24, 2026')).toBeTrue();
    expect(text).toContain('3.4 What We Do Not Collect');
    expect(text).not.toContain('Download Privacy Policy');
  });
});
