import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { WaitlistManualModalComponent } from './waitlist-manual-modal.component';
import { WaitlistService } from '../../services/waitlist.service';
import { ToastService } from '../../services/toast.service';
import { IWaitlistEntry } from '../../models/waitlist';

describe('WaitlistManualModalComponent', () => {
  let cmp: WaitlistManualModalComponent;
  let waitlist: jasmine.SpyObj<WaitlistService>;

  beforeEach(async () => {
    waitlist = jasmine.createSpyObj('WaitlistService', ['addManual']);
    waitlist.addManual.and.returnValue(of({} as IWaitlistEntry));
    await TestBed.configureTestingModule({
      declarations: [WaitlistManualModalComponent],
      imports: [FormsModule],
      providers: [
        { provide: WaitlistService, useValue: waitlist },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) }
      ]
    }).compileComponents();
    const fixture = TestBed.createComponent(WaitlistManualModalComponent);
    cmp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('requires a name', () => {
    cmp.email = 'a@b.com';
    cmp.save();
    expect(waitlist.addManual).not.toHaveBeenCalled();
    expect(cmp.errors['name']).toBeTruthy();
  });

  it('requires email or phone', () => {
    cmp.name = 'Ann';
    cmp.save();
    expect(waitlist.addManual).not.toHaveBeenCalled();
    expect(cmp.errors['contact']).toBeTruthy();
  });

  it('saves with a phone only', () => {
    spyOn(cmp.added, 'emit');
    cmp.name = ' Ann ';
    cmp.phone = '555-1234';
    cmp.save();
    expect(waitlist.addManual).toHaveBeenCalledWith({
      contact_name: 'Ann', contact_email: null, contact_phone: '555-1234',
      sex_preference: 'Any', preference_notes: null
    });
    expect(cmp.added.emit).toHaveBeenCalled();
  });
});
