import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { OffspringModalComponent } from './offspring-modal.component';

describe('OffspringModalComponent visibility', () => {
  let svc: jasmine.SpyObj<any>;
  let toastr: jasmine.SpyObj<any>;
  let cmp: OffspringModalComponent;

  beforeEach(() => {
    svc = jasmine.createSpyObj('OffspringService', ['createOffspring', 'uploadOffspringImage', 'setPrimaryImage']);
    toastr = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning']);
    cmp = new OffspringModalComponent(new FormBuilder(), svc, toastr, jasmine.createSpyObj('Cdr', ['detectChanges']));
    cmp.breedingId = '4';
    cmp.ngOnInit();
    cmp.offspringForm.patchValue({ gender: 'Female', date_of_birth: '2026-11-01' });
  });

  it('creates offspring visible to pet seekers by default and says so', () => {
    svc.createOffspring.and.returnValue(of({ id: 'o1', is_published: true }));
    cmp.onSubmit();
    expect(svc.createOffspring).toHaveBeenCalledWith(jasmine.objectContaining({ is_published: true }));
    expect(toastr.success.calls.mostRecent().args[0]).toContain('can now see it');
  });

  it('keeps it hidden when unticked and says so', () => {
    cmp.offspringForm.patchValue({ is_published: false });
    svc.createOffspring.and.returnValue(of({ id: 'o1', is_published: false }));
    cmp.onSubmit();
    expect(svc.createOffspring).toHaveBeenCalledWith(jasmine.objectContaining({ is_published: false }));
    expect(toastr.success.calls.mostRecent().args[0]).toContain('hidden');
  });
});
