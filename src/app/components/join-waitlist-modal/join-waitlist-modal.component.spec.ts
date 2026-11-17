import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { JoinWaitlistModalComponent } from './join-waitlist-modal.component';
import { WaitlistService } from '../../services/waitlist.service';
import { ToastService } from '../../services/toast.service';
import { IWaitlistInfo } from '../../models/waitlist';

describe('JoinWaitlistModalComponent', () => {
  let fixture: ComponentFixture<JoinWaitlistModalComponent>;
  let component: JoinWaitlistModalComponent;
  let waitlist: jasmine.SpyObj<WaitlistService>;
  let toast: jasmine.SpyObj<ToastService>;

  const info: IWaitlistInfo = {
    breeder_id: 'b1',
    breedery_name: 'Happy Paws',
    deposit_amount: '300.00',
    deposit_policy: 'Refundable until the litter is born.',
    application_form: {
      id: 1,
      form_fields: [
        { id: 'home', type: 'text', label: 'Describe your home', required: true },
        { id: 'extra', type: 'textarea', label: 'Anything else', required: false }
      ]
    },
    has_active_entry: false
  };

  function create(i: IWaitlistInfo = info): void {
    waitlist.getInfo.and.returnValue(of(i));
    fixture = TestBed.createComponent(JoinWaitlistModalComponent);
    component = fixture.componentInstance;
    component.breederId = 'b1';
    component.breedingId = 7;
    fixture.detectChanges();
  }

  const el = (): HTMLElement => fixture.nativeElement;
  const submitBtn = (): HTMLButtonElement => el().querySelector('[data-testid="submit"]') as HTMLButtonElement;

  beforeEach(async () => {
    waitlist = jasmine.createSpyObj('WaitlistService', ['getInfo', 'requestSpot']);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    await TestBed.configureTestingModule({
      imports: [JoinWaitlistModalComponent, RouterTestingModule],
      providers: [
        { provide: WaitlistService, useValue: waitlist },
        { provide: ToastService, useValue: toast }
      ]
    }).compileComponents();
  });

  it('renders breedery, deposit amount and policy', () => {
    create();
    expect(waitlist.getInfo).toHaveBeenCalledWith('b1', 7);
    const text = el().textContent || '';
    expect(text).toContain('Happy Paws');
    expect(text).toContain('Deposit: $300');
    expect(text).toContain('Refundable until the litter is born.');
  });

  it('blocks submit when a required field is empty', () => {
    create();
    submitBtn().click();
    fixture.detectChanges();
    expect(waitlist.requestSpot).not.toHaveBeenCalled();
    expect(el().textContent).toContain('"Describe your home" is required.');
  });

  it('submits with answers, sex preference and breeding id', () => {
    create();
    waitlist.requestSpot.and.returnValue(of({} as any));
    spyOn(component.joined, 'emit');
    component.answers['home'] = 'A house with a yard';
    component.sexPreference = 'Female';
    component.notes = 'Gentle please';
    submitBtn().click();
    expect(waitlist.requestSpot).toHaveBeenCalledWith('b1', {
      request_breeding_id: 7,
      sex_preference: 'Female',
      preference_notes: 'Gentle please',
      application_answers: { home: 'A house with a yard', extra: '' }
    });
    expect(toast.success).toHaveBeenCalled();
    expect(component.joined.emit).toHaveBeenCalled();
  });

  it('defaults sex preference to Any', () => {
    create();
    expect(component.sexPreference).toBe('Any');
  });

  it('shows an inline message on 409', () => {
    create();
    waitlist.requestSpot.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    component.answers['home'] = 'x';
    submitBtn().click();
    fixture.detectChanges();
    expect(el().textContent).toContain('already on this breeder');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('shows the already-on-list state with a link to My waitlists', () => {
    create({ ...info, has_active_entry: true });
    expect(el().textContent).toContain("You're already on this breeder's waitlist");
    expect(el().querySelector('a[href="/my-waitlists"]')).toBeTruthy();
    expect(submitBtn()).toBeNull();
  });
});
