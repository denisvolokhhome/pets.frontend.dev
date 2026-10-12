import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';

import { TopMenuComponent } from './top-menu.component';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';

describe('TopMenuComponent waitlist items', () => {
  const original = environment.enableWaitlist;
  afterEach(() => { environment.enableWaitlist = original; });

  function hrefs(flag: boolean, role: 'breeder' | 'seeker'): string[] {
    environment.enableWaitlist = flag;
    TestBed.configureTestingModule({
      declarations: [TopMenuComponent],
      imports: [RouterTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{
        provide: AuthService,
        useValue: {
          isBreeder: role === 'breeder', isPetSeeker: role === 'seeker', isServiceProvider: false,
          isLoggedIn$: new BehaviorSubject<boolean>(true), hasValidToken: () => true
        }
      }]
    });
    const fixture = TestBed.createComponent(TopMenuComponent);
    fixture.componentInstance.isMobileMenuOpen = true;
    fixture.detectChanges();
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a')).map(a => a.getAttribute('href') || '');
  }

  it('flag off: neither item shows', () => {
    expect(hrefs(false, 'breeder')).not.toContain('/waitlist');
    TestBed.resetTestingModule();
    expect(hrefs(false, 'seeker')).not.toContain('/my-waitlists');
  });
  it('flag on: breeder sees Waitlist, not My waitlists', () => {
    const h = hrefs(true, 'breeder');
    expect(h).toContain('/waitlist');
    expect(h).not.toContain('/my-waitlists');
  });
  it('flag on: seeker sees My waitlists, not Waitlist', () => {
    const h = hrefs(true, 'seeker');
    expect(h).toContain('/my-waitlists');
    expect(h).not.toContain('/waitlist');
  });
});
