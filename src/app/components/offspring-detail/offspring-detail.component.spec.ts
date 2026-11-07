import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';

import { OffspringDetailComponent } from './offspring-detail.component';
import { OffspringService } from 'src/app/services/offspring.service';
import { AuthService } from 'src/app/services/auth.service';
import { WaitlistService } from 'src/app/services/waitlist.service';
import { environment } from 'src/environments/environment';

describe('OffspringDetailComponent waitlist entry point', () => {
  let fixture: ComponentFixture<OffspringDetailComponent>;
  let auth: { currentUser: any; isPetSeeker: boolean; isBreeder: boolean; token: boolean; hasValidToken: () => boolean };
  const original = environment.enableWaitlist;

  const offspring: any = {
    id: 'o1', name: 'Rex', user_id: 'b1', breeding_id: 5, status: 'Available',
    images: [], is_favorited: false
  };

  function create(): void {
    fixture = TestBed.createComponent(OffspringDetailComponent);
    fixture.detectChanges();
  }
  const joinBtn = (): HTMLElement | null => fixture.nativeElement.querySelector('[data-testid="join-waitlist"]');

  beforeEach(async () => {
    auth = { currentUser: null, isPetSeeker: false, isBreeder: false, token: false, hasValidToken: () => auth.token };
    localStorage.removeItem('post_signup_redirect');
    const offspringSvc = jasmine.createSpyObj('OffspringService', ['getPublicOffspring', 'getOffspring', 'getPublicOffspringsByBreeder']);
    offspringSvc.getPublicOffspring.and.returnValue(of(offspring));
    offspringSvc.getPublicOffspringsByBreeder.and.returnValue(of({ offsprings: [], total: 0 }));
    await TestBed.configureTestingModule({
      imports: [OffspringDetailComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        MessageService,
        { provide: OffspringService, useValue: offspringSvc },
        { provide: AuthService, useValue: auth },
        { provide: WaitlistService, useValue: jasmine.createSpyObj('WaitlistService', ['getInfo']) },
        { provide: ActivatedRoute, useValue: {
          params: of({ id: 'o1' }), queryParams: of({}),
          snapshot: { routeConfig: { path: 'offspring/:id' } }
        } }
      ]
    }).compileComponents();
  });

  afterEach(() => {
    (environment as any).enableWaitlist = original;
    localStorage.removeItem('post_signup_redirect');
  });

  it('hides the Join button when the flag is off', () => {
    (environment as any).enableWaitlist = false;
    create();
    expect(joinBtn()).toBeNull();
  });

  it('shows the Join button for logged-out visitors when the flag is on', () => {
    (environment as any).enableWaitlist = true;
    create();
    expect(joinBtn()).toBeTruthy();
  });

  it('hides the Join button for breeders', () => {
    (environment as any).enableWaitlist = true;
    auth.currentUser = { id: 'b1' };
    auth.isBreeder = true;
    auth.token = true;
    create();
    expect(joinBtn()).toBeNull();
  });

  it('logged-out click remembers the page and goes to login', () => {
    (environment as any).enableWaitlist = true;
    create();
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    joinBtn()!.click();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    const stored = JSON.parse(localStorage.getItem('post_signup_redirect') || 'null');
    expect(stored?.url).toBe(router.url);
  });

  it('hides the Join button when a token exists but the user is not loaded yet', () => {
    (environment as any).enableWaitlist = true;
    auth.token = true;
    create();
    expect(joinBtn()).toBeNull();
  });
});
