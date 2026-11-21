import { of } from 'rxjs';
import { OffspringEditComponent } from './offspring-edit.component';

describe('OffspringEditComponent publish checkbox', () => {
  let svc: jasmine.SpyObj<any>;
  let cmp: OffspringEditComponent;

  beforeEach(() => {
    svc = jasmine.createSpyObj('OffspringService', ['updateOffspring', 'createOffspring']);
    svc.updateOffspring.and.returnValue(of({}));
    svc.createOffspring.and.returnValue(of({ id: 'new' }));
    const toastr = jasmine.createSpyObj('ToastService', ['success', 'error']);
    const cdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges', 'markForCheck']);
    cmp = new OffspringEditComponent({} as any, svc, {} as any, toastr, cdr);
  });

  it('pre-fills from the offspring and sends is_published on update', () => {
    cmp.mode = 'edit';
    cmp.offspring = { id: 'o1', breeding_id: 1, gender: 'Male', date_of_birth: '2026-11-08',
                      status: 'Available', price: null, is_published: false } as any;
    cmp.populateForm();
    expect(cmp.form.get('is_published')!.value).toBeFalse();

    cmp.form.get('is_published')!.setValue(true);
    cmp.updateOffspring();
    expect(svc.updateOffspring).toHaveBeenCalledWith('o1', jasmine.objectContaining({ is_published: true }));
  });

  it('sends is_published on create (visible by default)', () => {
    cmp.mode = 'create';
    cmp.form.patchValue({ breeding_id: 1, gender: 'Female', date_of_birth: '2026-11-08' });
    cmp.createOffspring();
    expect(svc.createOffspring).toHaveBeenCalledWith(jasmine.objectContaining({ is_published: true }));
  });
});
