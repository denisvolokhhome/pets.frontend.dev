import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { environment } from 'src/environments/environment';
import { WaitlistGuard } from './waitlist.guard';

describe('WaitlistGuard', () => {
  let guard: WaitlistGuard;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [RouterTestingModule] });
    guard = TestBed.inject(WaitlistGuard);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    // Restore the feature flag to its default (off) so other tests aren't affected.
    (environment as any).enableWaitlist = false;
  });

  it('redirects to /dashboard when the flag is off', () => {
    (environment as any).enableWaitlist = false;
    const result = guard.canActivate();
    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/dashboard');
  });

  it('allows activation when the flag is on', () => {
    (environment as any).enableWaitlist = true;
    expect(guard.canActivate()).toBeTrue();
  });
});
