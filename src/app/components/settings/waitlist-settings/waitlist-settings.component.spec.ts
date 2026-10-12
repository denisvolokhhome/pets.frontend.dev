import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { WaitlistSettingsComponent } from './waitlist-settings.component';
import { WaitlistService } from '../../../services/waitlist.service';
import { ToastService } from '../../../services/toast.service';

describe('WaitlistSettingsComponent', () => {
  let fixture: ComponentFixture<WaitlistSettingsComponent>;
  let waitlist: jasmine.SpyObj<WaitlistService>;

  beforeEach(async () => {
    waitlist = jasmine.createSpyObj('WaitlistService', ['getSettings', 'updateSettings']);
    waitlist.getSettings.and.returnValue(of({ deposit_amount: '250.00', deposit_policy: 'Refundable' }));
    waitlist.updateSettings.and.callFake(b => of(b));
    await TestBed.configureTestingModule({
      declarations: [WaitlistSettingsComponent],
      imports: [FormsModule],
      providers: [
        { provide: WaitlistService, useValue: waitlist },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(WaitlistSettingsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('loads current settings', () => {
    expect(fixture.componentInstance.amount).toBe('250.00');
    expect(fixture.componentInstance.policy).toBe('Refundable');
  });

  it('saves amount and policy', () => {
    fixture.componentInstance.amount = '300';
    fixture.componentInstance.policy = 'Non-refundable after 30 days';
    fixture.componentInstance.save();
    expect(waitlist.updateSettings).toHaveBeenCalledWith({
      deposit_amount: '300', deposit_policy: 'Non-refundable after 30 days'
    });
  });

  it('sends null for blank values', () => {
    fixture.componentInstance.amount = '';
    fixture.componentInstance.policy = '  ';
    fixture.componentInstance.save();
    expect(waitlist.updateSettings).toHaveBeenCalledWith({ deposit_amount: null, deposit_policy: null });
  });

  it('rejects a negative amount', () => {
    fixture.componentInstance.amount = '-5';
    fixture.componentInstance.save();
    expect(waitlist.updateSettings).not.toHaveBeenCalled();
  });

  it('on load failure hides the form, never saves, and offers retry', () => {
    waitlist.getSettings.and.returnValue(throwError(() => new Error('boom')));
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('form')).toBeNull();
    expect(el.querySelector('[data-testid="retry"]')).not.toBeNull();
    fixture.componentInstance.save();
    expect(waitlist.updateSettings).not.toHaveBeenCalled();
    waitlist.getSettings.and.returnValue(of({ deposit_amount: '5', deposit_policy: null }));
    (el.querySelector('[data-testid="retry"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('form')).not.toBeNull();
    expect(fixture.componentInstance.amount).toBe('5');
  });
});
