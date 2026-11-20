import { of, throwError } from 'rxjs';
import { OffspringListComponent } from './offspring-list.component';

describe('OffspringListComponent publish toggle', () => {
  let svc: jasmine.SpyObj<any>;
  let toastr: jasmine.SpyObj<any>;
  let cmp: OffspringListComponent;

  beforeEach(() => {
    svc = jasmine.createSpyObj('OffspringService', ['updateOffspring']);
    toastr = jasmine.createSpyObj('ToastService', ['success', 'error']);
    const cdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);
    cmp = new OffspringListComponent({} as any, svc, toastr, {} as any, cdr, {} as any, {} as any);
  });

  it('publishes an unpublished offspring with an explicit is_published=true', () => {
    const o: any = { id: 'o1', is_published: false };
    svc.updateOffspring.and.returnValue(of({ ...o, is_published: true }));
    cmp.togglePublish(o);
    expect(svc.updateOffspring).toHaveBeenCalledWith('o1', { is_published: true });
    expect(o.is_published).toBeTrue();
    expect(cmp.isTogglingPublish['o1']).toBeFalse();
  });

  it('unpublishes a published offspring', () => {
    const o: any = { id: 'o1', is_published: true };
    svc.updateOffspring.and.returnValue(of({ ...o, is_published: false }));
    cmp.togglePublish(o);
    expect(svc.updateOffspring).toHaveBeenCalledWith('o1', { is_published: false });
    expect(o.is_published).toBeFalse();
  });

  it('ignores clicks while a request is in flight and keeps state on error', () => {
    const o: any = { id: 'o1', is_published: false };
    cmp.isTogglingPublish['o1'] = true;
    cmp.togglePublish(o);
    expect(svc.updateOffspring).not.toHaveBeenCalled();

    cmp.isTogglingPublish['o1'] = false;
    svc.updateOffspring.and.returnValue(throwError(() => new Error('boom')));
    cmp.togglePublish(o);
    expect(o.is_published).toBeFalse();
    expect(toastr.error).toHaveBeenCalled();
  });
});
