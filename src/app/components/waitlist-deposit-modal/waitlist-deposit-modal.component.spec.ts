import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { WaitlistDepositModalComponent } from './waitlist-deposit-modal.component';
import { WaitlistService } from '../../services/waitlist.service';
import { ToastService } from '../../services/toast.service';
import { IWaitlistEntry } from '../../models/waitlist';

describe('WaitlistDepositModalComponent', () => {
  let fixture: ComponentFixture<WaitlistDepositModalComponent>;
  let cmp: WaitlistDepositModalComponent;
  let waitlist: jasmine.SpyObj<WaitlistService>;
  const entry = { id: 'e1', display_name: 'Ann', deposit_status: 'requested', deposit_amount: '300.00',
    deposit_received_on: null, deposit_method: null } as IWaitlistEntry;

  beforeEach(async () => {
    waitlist = jasmine.createSpyObj('WaitlistService', ['updateDeposit']);
    waitlist.updateDeposit.and.returnValue(of(entry));
    await TestBed.configureTestingModule({
      declarations: [WaitlistDepositModalComponent],
      imports: [FormsModule],
      providers: [
        { provide: WaitlistService, useValue: waitlist },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(WaitlistDepositModalComponent);
    cmp = fixture.componentInstance;
    cmp.entry = entry;
    fixture.detectChanges();
  });

  it('prefills from the entry', () => {
    expect(cmp.status).toBe('requested');
    expect(cmp.amount).toBe('300.00');
  });

  it('requires a received-on date when status is received', () => {
    cmp.status = 'received';
    cmp.receivedOn = '';
    cmp.save();
    expect(waitlist.updateDeposit).not.toHaveBeenCalled();
    expect(cmp.errors['receivedOn']).toBeTruthy();
  });

  it('saves with a date when received', () => {
    spyOn(cmp.saved, 'emit');
    cmp.status = 'received';
    cmp.receivedOn = '2026-10-01';
    cmp.method = 'Venmo';
    cmp.save();
    expect(waitlist.updateDeposit).toHaveBeenCalledWith('e1', {
      deposit_status: 'received', deposit_amount: '300.00',
      deposit_received_on: '2026-10-01', deposit_method: 'Venmo'
    });
    expect(cmp.saved.emit).toHaveBeenCalled();
  });

  it('does not require a date for other statuses', () => {
    cmp.status = 'requested';
    cmp.save();
    expect(waitlist.updateDeposit).toHaveBeenCalled();
  });
});
