import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { MyWaitlistsComponent } from './my-waitlists.component';
import { WaitlistService } from '../../services/waitlist.service';
import { ConfirmService } from '../../services/confirm.service';
import { ToastService } from '../../services/toast.service';
import { ISeekerEntry } from '../../models/waitlist';

describe('MyWaitlistsComponent', () => {
  let fixture: ComponentFixture<MyWaitlistsComponent>;
  let waitlist: jasmine.SpyObj<WaitlistService>;
  let confirm: jasmine.SpyObj<ConfirmService>;

  const entry = (o: Partial<ISeekerEntry> = {}): ISeekerEntry => ({
    id: 'e1', breeder_id: 'b1', breedery_name: 'Happy Paws', status: 'active',
    list_label: 'Spring litter', position: 3, sex_preference: 'Any',
    deposit_status: 'requested', deposit_amount: '300.00', ...o
  });

  async function create(entries: ISeekerEntry[]): Promise<void> {
    waitlist.getMine.and.returnValue(of(entries));
    fixture = TestBed.createComponent(MyWaitlistsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
  const text = (): string => fixture.nativeElement.textContent || '';

  beforeEach(async () => {
    waitlist = jasmine.createSpyObj('WaitlistService', ['getMine', 'withdrawMine']);
    confirm = jasmine.createSpyObj('ConfirmService', ['confirm']);
    await TestBed.configureTestingModule({
      imports: [MyWaitlistsComponent, RouterTestingModule],
      providers: [
        { provide: WaitlistService, useValue: waitlist },
        { provide: ConfirmService, useValue: confirm },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) }
      ]
    }).compileComponents();
  });

  it("renders position, list label, breedery and deposit label", async () => {
    await create([entry()]);
    expect(text()).toContain("You're #3");
    expect(text()).toContain('Spring litter');
    expect(text()).toContain('Happy Paws');
    expect(text()).toContain('Deposit requested');
  });

  it('shows the empty state', async () => {
    await create([]);
    expect(text()).toContain("You're not on any waitlists yet.");
  });

  it('withdraws after confirm', async () => {
    await create([entry()]);
    confirm.confirm.and.resolveTo(true);
    waitlist.withdrawMine.and.returnValue(of(entry({ status: 'withdrawn', position: null })));
    (fixture.nativeElement.querySelector('[data-testid="withdraw"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(waitlist.withdrawMine).toHaveBeenCalledWith('e1');
  });

  it('does not withdraw when the confirm is declined', async () => {
    await create([entry()]);
    confirm.confirm.and.resolveTo(false);
    (fixture.nativeElement.querySelector('[data-testid="withdraw"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(waitlist.withdrawMine).not.toHaveBeenCalled();
  });

  it('has no withdraw button for finished entries', async () => {
    await create([entry({ status: 'declined', position: null })]);
    expect(fixture.nativeElement.querySelector('[data-testid="withdraw"]')).toBeNull();
  });
});
