import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';

import { OffspringGridComponent } from './offspring-grid.component';
import { OffspringService } from 'src/app/services/offspring.service';
import { DataService } from 'src/app/services/data.service';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';

describe('OffspringGridComponent waitlist entry point', () => {
  let fixture: ComponentFixture<OffspringGridComponent>;
  let auth: { currentUser: any; isPetSeeker: boolean; token: boolean; hasValidToken: () => boolean };
  const original = environment.enableWaitlist;

  function create(): void {
    fixture = TestBed.createComponent(OffspringGridComponent);
    fixture.detectChanges();
  }
  const joinBtn = (): HTMLElement | null => fixture.nativeElement.querySelector('[data-testid="join-waitlist"]');

  beforeEach(async () => {
    auth = { currentUser: null, isPetSeeker: false, token: false, hasValidToken: () => auth.token };
    localStorage.removeItem('post_signup_redirect');
    const offspringSvc = jasmine.createSpyObj('OffspringService', ['getPublicOffspringsByBreeder']);
    offspringSvc.getPublicOffspringsByBreeder.and.returnValue(of({ offsprings: [], total: 0 }));
    const data = jasmine.createSpyObj('DataService', ['getPublicBreederProfile']);
    data.getPublicBreederProfile.and.returnValue(of({}));
    await TestBed.configureTestingModule({
      declarations: [OffspringGridComponent],
      imports: [FormsModule, HttpClientTestingModule, RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        MessageService,
        { provide: OffspringService, useValue: offspringSvc },
        { provide: DataService, useValue: data },
        { provide: AuthService, useValue: auth },
        { provide: ActivatedRoute, useValue: { params: of({ id: 'b1' }) } }
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

  it('shows the Join button when the flag is on', () => {
    (environment as any).enableWaitlist = true;
    create();
    expect(joinBtn()).toBeTruthy();
  });

  it('hides the Join button when the viewer is that breeder', () => {
    (environment as any).enableWaitlist = true;
    auth.currentUser = { id: 'b1' };
    auth.token = true;
    create();
    expect(joinBtn()).toBeNull();
  });

  it('hides the Join button when a token exists but the user is not loaded yet', () => {
    (environment as any).enableWaitlist = true;
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
});
