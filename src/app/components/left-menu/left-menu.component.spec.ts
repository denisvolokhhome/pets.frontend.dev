import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { LeftMenuComponent } from './left-menu.component';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';
import { MessageService } from 'src/app/services/message.service';

describe('LeftMenuComponent mobile bottom bar', () => {
  let fixture: ComponentFixture<LeftMenuComponent>;

  function render(role: 'breeder' | 'seeker', unread = 0): HTMLElement {
    const auth = {
      isBreeder: role === 'breeder',
      isPetSeeker: role === 'seeker',
      isServiceProvider: false,
      hasValidToken: () => true
    };
    TestBed.configureTestingModule({
      declarations: [LeftMenuComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: MessageService, useValue: { getUnreadCount: () => of({ unread_count: unread }) } }
      ]
    });
    fixture = TestBed.createComponent(LeftMenuComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function tabs(el: HTMLElement): string[] {
    return Array.from(el.querySelectorAll('.mobile-bottom-nav .mobile-nav-item > span:not(.mobile-nav-icon)'))
      .map(s => s.textContent!.trim());
  }

  it('gives breeders five tabs, without Settings', () => {
    expect(tabs(render('breeder'))).toEqual(['Home', 'Pets', 'Breedings', 'Offsprings', 'Messages']);
  });

  it('keeps Settings for pet seekers', () => {
    expect(tabs(render('seeker'))).toEqual(['Home', 'Search', 'Favorites', 'Messages', 'Settings']);
  });

  it('shows the unread message count on the Messages tab', () => {
    const badge = render('breeder', 3).querySelector('.mobile-bottom-nav .mobile-nav-badge');
    expect(badge?.textContent?.trim()).toBe('3');
  });

  it('caps the badge at 9+', () => {
    const badge = render('breeder', 42).querySelector('.mobile-bottom-nav .mobile-nav-badge');
    expect(badge?.textContent?.trim()).toBe('9+');
  });

  it('hides the badge when there are no unread messages', () => {
    expect(render('breeder', 0).querySelector('.mobile-bottom-nav .mobile-nav-badge')).toBeNull();
  });
});

describe('LeftMenuComponent waitlist item', () => {
  const original = environment.enableWaitlist;
  afterEach(() => { environment.enableWaitlist = original; });

  function links(flag: boolean, role: 'breeder' | 'seeker'): string[] {
    environment.enableWaitlist = flag;
    TestBed.configureTestingModule({
      declarations: [LeftMenuComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: { isBreeder: role === 'breeder', isPetSeeker: role === 'seeker', isServiceProvider: false, hasValidToken: () => true } },
        { provide: MessageService, useValue: { getUnreadCount: () => of({ unread_count: 0 }) } }
      ]
    });
    const fixture = TestBed.createComponent(LeftMenuComponent);
    fixture.detectChanges();
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a.side-link')).map(a => a.getAttribute('href') || '');
  }

  it('flag off: breeder has no Waitlist link', () => {
    expect(links(false, 'breeder')).not.toContain('/waitlist');
  });
  it('flag on: breeder has the Waitlist link', () => {
    expect(links(true, 'breeder')).toContain('/waitlist');
  });
  it('flag on: seeker has no breeder Waitlist link', () => {
    expect(links(true, 'seeker')).not.toContain('/waitlist');
  });
});
