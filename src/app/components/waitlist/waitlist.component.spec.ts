import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { WaitlistComponent } from './waitlist.component';
import { WaitlistService } from '../../services/waitlist.service';
import { DataService } from '../../services/data.service';
import { ConfirmService } from '../../services/confirm.service';
import { ToastService } from '../../services/toast.service';
import { IWaitlistEntry } from '../../models/waitlist';

describe('WaitlistComponent', () => {
  let fixture: ComponentFixture<WaitlistComponent>;
  let waitlist: jasmine.SpyObj<WaitlistService>;
  let data: jasmine.SpyObj<DataService>;
  let confirm: jasmine.SpyObj<ConfirmService>;

  const entry = (o: Partial<IWaitlistEntry> = {}): IWaitlistEntry => ({
    id: 'e1', breeder_id: 'b1', user_id: null, source: 'request', display_name: 'Ann Seeker',
    contact_email: 'ann@x.com', contact_phone: null, breeding_id: null, breeding_label: null,
    request_breeding_id: null, status: 'pending', sex_preference: 'Any', preference_notes: 'Wants a red one',
    application_answers: { 'Do you have a fenced yard?': 'Yes, 6 ft fence', 'Other pets at home': 'One cat' }, queue_date: '2026-09-01', position: null,
    position_override: null, override_note: null, deposit_status: 'none', deposit_amount: null,
    deposit_received_on: null, deposit_method: null, offspring_id: null, possible_duplicate: false,
    created_at: '2026-09-01T00:00:00Z', ...o
  });
  const pending = entry();
  const g1 = entry({ id: 'g1', status: 'active', display_name: 'Bob First', position: 1, deposit_status: 'received', possible_duplicate: true });
  const g2 = entry({ id: 'g2', status: 'active', display_name: 'Cy Second', position: 2 });

  const text = (): string => fixture.nativeElement.textContent || '';
  const q = (sel: string): HTMLElement => fixture.nativeElement.querySelector(sel);

  async function create(): Promise<void> {
    fixture = TestBed.createComponent(WaitlistComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    sessionStorage.removeItem('waitlist_section');
    waitlist = jasmine.createSpyObj('WaitlistService',
      ['getBreederWaitlist', 'approve', 'decline', 'move', 'withdraw', 'getEvents', 'updateDeposit']);
    waitlist.getBreederWaitlist.and.returnValue(of({ pending: [pending], general: [g1, g2], deposits_to_settle: [] }));
    data = jasmine.createSpyObj('DataService', ['getBreedings']);
    data.getBreedings.and.returnValue(of([
      { id: 5, description: 'Spring litter', status: 'Started' },
      { id: 6, description: 'Old', status: 'Voided' },
      { id: 7, description: null, status: 'Done' }
    ]));
    confirm = jasmine.createSpyObj('ConfirmService', ['confirm']);
    await TestBed.configureTestingModule({
      declarations: [WaitlistComponent],
      imports: [FormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: WaitlistService, useValue: waitlist },
        { provide: DataService, useValue: data },
        { provide: ConfirmService, useValue: confirm },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) }
      ]
    }).compileComponents();
  });

  it('renders pending requests with preferences and answers', async () => {
    await create();
    expect(text()).toContain('Ann Seeker');
    expect(text()).toContain('Wants a red one');
    expect(text()).not.toContain('Yes, 6 ft fence');
    (q('[data-testid="toggle-answers"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(text()).toContain('Do you have a fenced yard?');
    expect(text()).toContain('Yes, 6 ft fence');
    expect(text()).toContain('Other pets at home');
  });

  it('renders the general list in order with deposit badge and duplicate flag', async () => {
    await create();
    (q('[data-testid="tab-general"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('tr[data-testid="general-row"]');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Bob First');
    expect(rows[0].textContent).toContain('Deposit received');
    expect(rows[0].querySelector('[data-testid="deposit-badge"]')?.className).toContain('ui-badge--success');
    expect(rows[1].querySelector('[data-testid="deposit-badge"]')?.className).toContain('ui-badge--neutral');
    expect(rows[0].textContent).toContain('Possible duplicate');
    expect(rows[1].textContent).toContain('Cy Second');
    expect(rows[1].textContent).not.toContain('Possible duplicate');
  });

  it('persists the active section to sessionStorage', async () => {
    await create();
    (q('[data-testid="tab-general"]') as HTMLButtonElement).click();
    expect(sessionStorage.getItem('waitlist_section')).toBe('general');
  });

  it('approve calls the service and refreshes', async () => {
    waitlist.approve.and.returnValue(of({ ...pending, status: 'active' }));
    await create();
    (q('[data-testid="approve"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(waitlist.approve).toHaveBeenCalledWith('e1');
    expect(waitlist.getBreederWaitlist).toHaveBeenCalledTimes(2);
  });

  it('decline calls the service after confirm', async () => {
    confirm.confirm.and.resolveTo(true);
    waitlist.decline.and.returnValue(of({ ...pending, status: 'declined' }));
    await create();
    (q('[data-testid="decline"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(waitlist.decline).toHaveBeenCalledWith('e1');
  });

  it('moves to a litter chosen from non-voided breedings', async () => {
    waitlist.move.and.returnValue(of(g1));
    await create();
    (q('[data-testid="tab-general"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (q('[data-testid="move-btn"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const options = Array.from(fixture.nativeElement.querySelectorAll('[data-testid="move-select"] option'))
      .map(o => (o as HTMLElement).textContent!.trim());
    expect(options).toContain('Spring litter');
    expect(options).toContain('Breeding #7');
    expect(options).not.toContain('Old');
    fixture.componentInstance.moveBreedingId = 5;
    (q('[data-testid="move-confirm"]') as HTMLButtonElement).click();
    expect(waitlist.move).toHaveBeenCalledWith('g1', 5);
  });

  it('withdraw with a received deposit asks refunded or kept', async () => {
    waitlist.withdraw.and.returnValue(of(g1));
    await create();
    (q('[data-testid="tab-general"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelectorAll('[data-testid="withdraw-btn"]')[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(text()).toContain('Refunded or kept?');
    (q('[data-testid="withdraw-kept"]') as HTMLButtonElement).click();
    expect(waitlist.withdraw).toHaveBeenCalledWith('g1', 'forfeited');
    expect(confirm.confirm).not.toHaveBeenCalled();
  });

  it('withdraw without a received deposit uses a plain confirm', async () => {
    confirm.confirm.and.resolveTo(true);
    waitlist.withdraw.and.returnValue(of(g2));
    await create();
    (q('[data-testid="tab-general"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelectorAll('[data-testid="withdraw-btn"]')[1] as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(waitlist.withdraw).toHaveBeenCalledWith('g2', undefined);
  });

  it('shows history events', async () => {
    waitlist.getEvents.and.returnValue(of([
      { id: 'v1', type: 'approved', actor_id: null, payload: {}, created_at: '2026-09-02T00:00:00Z' }
    ]));
    await create();
    (q('[data-testid="tab-general"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    (q('[data-testid="history-btn"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(waitlist.getEvents).toHaveBeenCalledWith('g1');
    expect(text()).toContain('Approved');
  });

  it('builds the name sub-line without a stray separator when there are no contact details', async () => {
    const bare = entry({ id: 'g3', status: 'active', display_name: 'No Contact', position: 1,
      contact_email: null, contact_phone: null, sex_preference: 'Female' });
    waitlist.getBreederWaitlist.and.returnValue(of({ pending: [], general: [bare, g2], deposits_to_settle: [] }));
    await create();
    (q('[data-testid="tab-general"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const subs = fixture.nativeElement.querySelectorAll('tr[data-testid="general-row"] .ui-cell-sub');
    expect(subs[0].textContent.trim()).toBe('Female');
    expect(subs[1].textContent.trim()).toBe('ann@x.com');
  });

  it('general table hides queue date and moves the deposit badge under the name on small screens', async () => {
    await create();
    (q('[data-testid="tab-general"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const ths = Array.from(fixture.nativeElement.querySelectorAll('.ui-table th')) as HTMLElement[];
    const th = (label: string) => ths.find(h => h.textContent!.trim() === label)!;
    expect(th('Deposit').classList).toContain('hide-sm');
    expect(th('Queue date').classList).toContain('hide-sm');
    const row = fixture.nativeElement.querySelector('tr[data-testid="general-row"]');
    expect(row.querySelector('.name-deposit [data-testid="deposit-badge-sm"]')?.textContent).toContain('Deposit received');
    expect(row.querySelectorAll('td.hide-sm').length).toBe(2);
  });

  describe('deposits to settle', () => {
    const w1 = entry({ id: 'w1', status: 'withdrawn', display_name: 'Wes Gone', deposit_status: 'received',
      deposit_amount: '300.00', deposit_received_on: '2026-09-05', deposit_method: 'Zelle' });

    it('is hidden when nothing needs settling', async () => {
      await create();
      expect(q('[data-testid="settle-section"]')).toBeNull();
    });

    it('lists withdrawn entries with a received deposit and records Refunded / Kept', async () => {
      waitlist.getBreederWaitlist.and.returnValue(of({ pending: [], general: [], deposits_to_settle: [w1] }));
      waitlist.updateDeposit.and.returnValue(of({ ...w1, deposit_status: 'refunded' }));
      await create();
      const section = q('[data-testid="settle-section"]');
      expect(section.textContent).toContain('Deposits to settle');
      expect(section.textContent).toContain('Wes Gone');
      (q('[data-testid="settle-refunded"]') as HTMLButtonElement).click();
      expect(waitlist.updateDeposit).toHaveBeenCalledWith('w1', {
        deposit_status: 'refunded', deposit_amount: '300.00', deposit_received_on: '2026-09-05', deposit_method: 'Zelle'
      });
      expect(waitlist.getBreederWaitlist).toHaveBeenCalledTimes(2);
      (q('[data-testid="settle-kept"]') as HTMLButtonElement).click();
      expect(waitlist.updateDeposit.calls.mostRecent().args[1].deposit_status).toBe('forfeited');
    });
  });
});
