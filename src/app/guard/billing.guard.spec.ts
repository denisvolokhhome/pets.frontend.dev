import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { environment } from 'src/environments/environment';
import { BillingGuard } from './billing.guard';

describe('BillingGuard', () => {
  let guard: BillingGuard;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [RouterTestingModule] });
    guard = TestBed.inject(BillingGuard);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    // Restore the feature flag to its default (off) so other tests aren't affected.
    (environment as any).enableBilling = false;
  });

  it('redirects to /settings when the flag is off', () => {
    (environment as any).enableBilling = false;
    const result = guard.canActivate();
    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/settings');
  });

  it('allows activation when the flag is on', () => {
    (environment as any).enableBilling = true;
    expect(guard.canActivate()).toBeTrue();
  });
});
