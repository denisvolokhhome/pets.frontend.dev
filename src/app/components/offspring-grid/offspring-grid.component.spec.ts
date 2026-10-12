import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';

import { OffspringGridComponent } from './offspring-grid.component';
import { OffspringService } from 'src/app/services/offspring.service';
import { DataService } from 'src/app/services/data.service';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';

describe('OffspringGridComponent waitlist entry point', () => {
  let fixture: ComponentFixture<OffspringGridComponent>;
  let auth: { currentUser: any; isPetSeeker: boolean };
  const original = environment.enableWaitlist;

  function create(): void {
    fixture = TestBed.createComponent(OffspringGridComponent);
    fixture.detectChanges();
  }
  const joinBtn = (): HTMLElement | null => fixture.nativeElement.querySelector('[data-testid="join-waitlist"]');

  beforeEach(async () => {
    auth = { currentUser: null, isPetSeeker: false };
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

  afterEach(() => { (environment as any).enableWaitlist = original; });

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
    create();
    expect(joinBtn()).toBeNull();
  });
});
