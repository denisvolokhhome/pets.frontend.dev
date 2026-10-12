import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { WaitlistCardComponent } from './waitlist-card.component';
import { WaitlistService } from '../../services/waitlist.service';
import { AuthService } from '../../services/auth.service';
import { environment } from 'src/environments/environment';
import { IWaitlistEntry } from '../../models/waitlist';

describe('WaitlistCardComponent', () => {
  let waitlist: jasmine.SpyObj<WaitlistService>;
  let isBreeder: boolean;
  const original = environment.enableWaitlist;

  function render(pendingCount: number): HTMLElement {
    waitlist.getBreederWaitlist.and.returnValue(of({
      pending: Array.from({ length: pendingCount }, () => ({} as IWaitlistEntry)), general: [], deposits_to_settle: []
    }));
    const fixture: ComponentFixture<WaitlistCardComponent> = TestBed.createComponent(WaitlistCardComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  beforeEach(() => {
    isBreeder = true;
    environment.enableWaitlist = true;
    waitlist = jasmine.createSpyObj('WaitlistService', ['getBreederWaitlist']);
    TestBed.configureTestingModule({
      declarations: [WaitlistCardComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: WaitlistService, useValue: waitlist },
        { provide: AuthService, useValue: { get isBreeder() { return isBreeder; } } }
      ]
    });
  });
  afterEach(() => { environment.enableWaitlist = original; });

  it('shows the pending count with a link', () => {
    const el = render(3);
    expect(el.querySelector('.waitlist-card')?.textContent).toContain('3');
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/waitlist');
  });

  it('is hidden at zero pending', () => {
    expect(render(0).querySelector('.waitlist-card')).toBeNull();
  });

  it('is hidden and makes no request when the flag is off', () => {
    environment.enableWaitlist = false;
    expect(render(2).querySelector('.waitlist-card')).toBeNull();
    expect(waitlist.getBreederWaitlist).not.toHaveBeenCalled();
  });

  it('is hidden for non-breeders', () => {
    isBreeder = false;
    expect(render(2).querySelector('.waitlist-card')).toBeNull();
    expect(waitlist.getBreederWaitlist).not.toHaveBeenCalled();
  });
});
