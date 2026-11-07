import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { of, throwError } from 'rxjs';

import { BreedingWaitlistComponent } from './breeding-waitlist.component';
import { WaitlistService } from '../../services/waitlist.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { IWaitlistEntry } from '../../models/waitlist';

function entry(id: string, name: string, over: Partial<IWaitlistEntry> = {}): IWaitlistEntry {
  return {
    id, breeder_id: 'b1', user_id: null, source: 'manual', display_name: name,
    contact_email: null, contact_phone: null, breeding_id: 7, breeding_label: null,
    request_breeding_id: null, status: 'active', sex_preference: 'Any', preference_notes: null,
    application_answers: null, queue_date: null, position: 1, position_override: null,
    override_note: null, deposit_status: 'received', deposit_amount: null, deposit_received_on: null,
    deposit_method: null, offspring_id: null, possible_duplicate: false, created_at: '2026-01-01',
    ...over
  };
}

const A = entry('a', 'Alice');
const B = entry('b', 'Bob', { position: 2, position_override: 2, override_note: 'Long-time client' });
const C = entry('c', 'Cara', { position: 3, deposit_status: 'none' });
const PUPS = [
  { id: 'o1', name: 'Rex', gender: 'Male', status: 'Available' },
  { id: 'o2', name: 'Pip', gender: 'Female', status: 'Sold' }
];

describe('BreedingWaitlistComponent', () => {
  let fixture: ComponentFixture<BreedingWaitlistComponent>;
  let component: BreedingWaitlistComponent;
  let service: jasmine.SpyObj<WaitlistService>;
  let toast: jasmine.SpyObj<ToastService>;

  function render(opts: { voided?: boolean; offspring?: any[]; entries?: IWaitlistEntry[]; general?: IWaitlistEntry[] } = {}): HTMLElement {
    service.getLitterWaitlist.and.returnValue(of({ breeding_id: 7, entries: opts.entries ?? [A, B, C] }));
    service.getBreederWaitlist.and.returnValue(of({ pending: [], general: opts.general ?? [], deposits_to_settle: [] }));
    fixture = TestBed.createComponent(BreedingWaitlistComponent);
    component = fixture.componentInstance;
    component.breedingId = 7;
    component.offspring = opts.offspring ?? [];
    component.voided = opts.voided ?? false;
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  const q = (el: HTMLElement, sel: string) => el.querySelector(sel) as HTMLElement;
  const qa = (el: HTMLElement, sel: string) => Array.from(el.querySelectorAll(sel)) as HTMLElement[];

  beforeEach(() => {
    service = jasmine.createSpyObj('WaitlistService', [
      'getLitterWaitlist', 'getBreederWaitlist', 'reorder', 'resetOrder', 'move', 'match', 'pass', 'withdraw'
    ]);
    toast = jasmine.createSpyObj('ToastService', ['success', 'error']);
    TestBed.configureTestingModule({
      declarations: [BreedingWaitlistComponent],
      imports: [FormsModule, DragDropModule],
      providers: [
        { provide: WaitlistService, useValue: service },
        { provide: ToastService, useValue: toast },
        { provide: ConfirmService, useValue: { confirm: () => Promise.resolve(true) } }
      ]
    });
  });

  it('renders positions, names and the override note', () => {
    const el = render();
    const rows = qa(el, '[data-testid="wl-row"]');
    expect(rows.length).toBe(3);
    expect(rows[0].textContent).toContain('#1');
    expect(rows[0].textContent).toContain('Alice');
    expect(rows[1].textContent).toContain('#2');
    expect(rows[1].querySelector('.override-note')!.textContent).toContain('Long-time client');
  });

  it('up button calls reorder with position - 1 and reloads', () => {
    service.reorder.and.returnValue(of(B));
    const el = render();
    q(qa(el, '[data-testid="wl-row"]')[1], '[aria-label="Move up"]').click();
    expect(service.reorder).toHaveBeenCalledWith('b', 1);
    expect(service.getLitterWaitlist).toHaveBeenCalledTimes(2);
  });

  it('down button calls reorder with position + 1, ends are disabled', () => {
    service.reorder.and.returnValue(of(B));
    const el = render();
    const rows = qa(el, '[data-testid="wl-row"]');
    expect((q(rows[0], '[aria-label="Move up"]') as HTMLButtonElement).disabled).toBeTrue();
    expect((q(rows[2], '[aria-label="Move down"]') as HTMLButtonElement).disabled).toBeTrue();
    q(rows[1], '[aria-label="Move down"]').click();
    expect(service.reorder).toHaveBeenCalledWith('b', 3);
  });

  it('drop with a changed index reorders; unchanged does nothing', () => {
    service.reorder.and.returnValue(of(A));
    render();
    component.drop({ previousIndex: 0, currentIndex: 0 } as any);
    expect(service.reorder).not.toHaveBeenCalled();
    component.drop({ previousIndex: 0, currentIndex: 2 } as any);
    expect(service.reorder).toHaveBeenCalledWith('a', 3);
  });

  it('"Add a note" after a move re-sends the same position with the note', () => {
    service.reorder.and.returnValue(of(B));
    const el = render();
    service.getLitterWaitlist.and.returnValue(of({ breeding_id: 7, entries: [B, A, C] }));
    q(qa(el, '[data-testid="wl-row"]')[1], '[aria-label="Move up"]').click();
    fixture.detectChanges();
    q(el, '[data-testid="add-note"]').click();
    fixture.detectChanges();
    component.noteText = 'Vet referral';
    fixture.detectChanges();
    q(el, '[data-testid="save-note"]').click();
    expect(service.reorder).toHaveBeenCalledWith('b', 1, 'Vet referral');
  });

  it('reset button shows only with an override and calls resetOrder', () => {
    service.resetOrder.and.returnValue(of({}));
    const el = render();
    q(el, '[data-testid="reset-order"]').click();
    expect(service.resetOrder).toHaveBeenCalledWith(7);
    const el2 = render({ entries: [A, C] });
    expect(q(el2, '[data-testid="reset-order"]')).toBeNull();
  });

  it('match calls the service with the chosen offspring and emits changed', () => {
    service.match.and.returnValue(of(A));
    const el = render({ offspring: PUPS });
    const emitted = jasmine.createSpy('changed');
    component.changed.subscribe(emitted);
    const row = qa(el, '[data-testid="wl-row"]')[0];
    const select = q(row, '[data-testid="match-select"]') as HTMLSelectElement;
    expect(select.options.length).toBe(2); // placeholder + the one Available pup
    component.matchChoice['a'] = 'o1';
    fixture.detectChanges();
    q(row, '[data-testid="match-btn"]').click();
    expect(service.match).toHaveBeenCalledWith('a', 'o1');
    expect(emitted).toHaveBeenCalled();
  });

  it('offspring but none Available: Withdraw and Pass shown, Match hidden', () => {
    const el = render({ offspring: [PUPS[1]] });
    expect(q(el, '[data-testid="match-select"]')).toBeNull();
    expect(q(el, '[data-testid="match-btn"]')).toBeNull();
    expect(q(el, '[data-testid="pass-btn"]')).not.toBeNull();
    expect(q(el, '[data-testid="withdraw-btn"]')).not.toBeNull();
  });

  it('no offspring: only Withdraw is shown, in the row header next to up/down (no action strip)', () => {
    const el = render({ offspring: [] });
    expect(q(el, '[data-testid="pass-btn"]')).toBeNull();
    expect(q(el, '[data-testid="match-select"]')).toBeNull();
    const row = qa(el, '[data-testid="wl-row"]')[0];
    expect(row.querySelector('.wl-move [data-testid="withdraw-btn"]')).not.toBeNull();
    expect(row.querySelector('.wl-move [data-testid="withdraw-btn"]')!.classList).toContain('ui-icon-btn--danger');
    expect(row.querySelector('.wl-match')).toBeNull();
    expect(row.querySelectorAll('[data-testid="withdraw-btn"]').length).toBe(1);
  });

  it('with offspring, Withdraw stays in the action strip with Match/Pass', () => {
    const el = render({ offspring: PUPS });
    const row = qa(el, '[data-testid="wl-row"]')[0];
    expect(row.querySelector('.wl-match [data-testid="withdraw-btn"]')).not.toBeNull();
    expect(row.querySelector('.wl-move [data-testid="withdraw-btn"]')).toBeNull();
  });

  it('note save uses the entry CURRENT position after a reload reordered the list', () => {
    service.reorder.and.returnValue(of(B));
    const el = render();
    q(qa(el, '[data-testid="wl-row"]')[1], '[aria-label="Move up"]').click(); // b -> 1
    service.getLitterWaitlist.and.returnValue(of({ breeding_id: 7, entries: [A, C, B] }));
    component.load();
    fixture.detectChanges();
    q(el, '[data-testid="add-note"]').click();
    fixture.detectChanges();
    component.noteText = 'Why';
    fixture.detectChanges();
    q(el, '[data-testid="save-note"]').click();
    expect(service.reorder).toHaveBeenCalledWith('b', 3, 'Why');
  });

  it('prunes a match choice whose offspring is no longer Available', () => {
    render({ offspring: PUPS });
    component.matchChoice['a'] = 'o1';
    component.offspring = [PUPS[1]];
    component.load();
    expect(component.matchChoice['a']).toBeUndefined();
  });

  it('does not load when voided', () => {
    render({ voided: true });
    expect(service.getLitterWaitlist).not.toHaveBeenCalled();
  });

  it('Pass calls pass', () => {
    service.pass.and.returnValue(of(A));
    const el = render({ offspring: PUPS });
    q(qa(el, '[data-testid="wl-row"]')[0], '[data-testid="pass-btn"]').click();
    expect(service.pass).toHaveBeenCalledWith('a');
  });

  it('withdraw with a received deposit asks refunded or kept', () => {
    service.withdraw.and.returnValue(of(A));
    const el = render({ offspring: PUPS });
    q(qa(el, '[data-testid="wl-row"]')[0], '[data-testid="withdraw-btn"]').click();
    fixture.detectChanges();
    q(el, '[data-testid="withdraw-kept"]').click();
    expect(service.withdraw).toHaveBeenCalledWith('a', 'forfeited');
  });

  it('add from general list moves the entry here; picker hidden when empty', () => {
    service.move.and.returnValue(of(A));
    const el = render({ general: [entry('g1', 'Gina', { breeding_id: null })] });
    q(el, '[data-testid="add-general"]').click();
    fixture.detectChanges();
    q(el, '[data-testid="general-option"]').click();
    expect(service.move).toHaveBeenCalledWith('g1', 7);
    const el2 = render({ general: [] });
    expect(q(el2, '[data-testid="add-general"]')).toBeNull();
  });

  it('an action error toasts and reloads the list', () => {
    service.reorder.and.returnValue(throwError(() => ({ status: 409, error: { detail: 'Changed elsewhere' } })));
    const el = render();
    q(qa(el, '[data-testid="wl-row"]')[1], '[aria-label="Move up"]').click();
    expect(toast.error).toHaveBeenCalled();
    expect(service.getLitterWaitlist).toHaveBeenCalledTimes(2);
  });

  it('voided is read-only with the message and no actions', () => {
    const el = render({ voided: true, offspring: PUPS });
    expect(el.textContent).toContain('This breeding was voided — entries returned to the general list.');
    expect(qa(el, 'button').length).toBe(0);
    expect(qa(el, '[data-testid="wl-row"]').length).toBe(0);
  });
});
