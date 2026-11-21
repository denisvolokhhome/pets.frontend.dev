import { of } from 'rxjs';
import { OffspringListComponent } from './offspring-list.component';

describe('OffspringListComponent Add Offspring guidance', () => {
  let confirm: jasmine.SpyObj<any>;
  let router: jasmine.SpyObj<any>;
  let data: jasmine.SpyObj<any>;
  let cmp: OffspringListComponent;

  beforeEach(() => {
    confirm = jasmine.createSpyObj('ConfirmService', ['confirm']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    data = jasmine.createSpyObj('DataService', ['getBreedings', 'getPetsByBreeder']);
    const cdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);
    const auth = { currentUser: { id: 'u1' } };
    cmp = new OffspringListComponent(confirm, {} as any, {} as any, router, cdr, data, auth as any);
  });

  it('opens the form when there is an active breeding', async () => {
    data.getBreedings.and.returnValue(of([{ status: 'Voided' }, { status: 'Started' }]));
    await cmp.addOffspring();
    expect(cmp.showEditModal).toBeTrue();
    expect(cmp.modalMode).toBe('create');
    expect(confirm.confirm).not.toHaveBeenCalled();
  });

  it('suggests creating a breeding and opens Quick Breeding on the Breedings screen', async () => {
    data.getBreedings.and.returnValue(of([]));
    data.getPetsByBreeder.and.returnValue(of([{ gender: 'Male' }, { gender: 'Female' }]));
    confirm.confirm.and.resolveTo(true);
    await cmp.addOffspring();
    expect(confirm.confirm.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
      title: 'Create a breeding first', confirmText: 'Create breeding',
    }));
    expect(router.navigate).toHaveBeenCalledWith(['/breedings'], { queryParams: { new: 1, then: 'offspring' } });
    expect(cmp.showEditModal).toBeFalse();
  });

  it('stays put when the breeder cancels', async () => {
    data.getBreedings.and.returnValue(of([]));
    data.getPetsByBreeder.and.returnValue(of([{ gender: 'Male' }, { gender: 'Female' }]));
    confirm.confirm.and.resolveTo(false);
    await cmp.addOffspring();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(cmp.showEditModal).toBeFalse();
  });

  it('sends a breeder without a male+female pair to add pets first', async () => {
    data.getBreedings.and.returnValue(of([]));
    data.getPetsByBreeder.and.returnValue(of([{ gender: 'Female' }]));
    confirm.confirm.and.resolveTo(true);
    await cmp.addOffspring();
    expect(confirm.confirm.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
      title: 'Add your pets first', confirmText: 'Add pets',
    }));
    expect(router.navigate).toHaveBeenCalledWith(['/pets'], { queryParams: { new: 1 } });
  });
});
