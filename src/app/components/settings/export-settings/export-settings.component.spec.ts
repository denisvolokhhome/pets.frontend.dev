import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { ExportSettingsComponent } from './export-settings.component';
import { DataExportService } from '../../../services/data-export.service';
import { DataExport } from '../../../models/data-export';
import { environment } from 'src/environments/environment';

function exp(partial: Partial<DataExport>): DataExport {
  return {
    id: 'e1', status: 'ready', file_size: 129_000_000, error: null,
    created_at: '2026-11-20T10:00:00Z', completed_at: '2026-11-20T10:01:00Z',
    expires_at: '2026-11-21T10:01:00Z', is_expired: false, ...partial,
  };
}

describe('ExportSettingsComponent', () => {
  let fixture: ComponentFixture<ExportSettingsComponent>;
  let component: ExportSettingsComponent;
  let svc: jasmine.SpyObj<DataExportService>;

  function create() {
    fixture = TestBed.createComponent(ExportSettingsComponent);
    component = fixture.componentInstance;
    spyOn(component, 'navigate');
    fixture.detectChanges();
  }
  const text = () => (fixture.nativeElement as HTMLElement).textContent || '';

  beforeEach(async () => {
    svc = jasmine.createSpyObj('DataExportService', ['start', 'latest', 'downloadLink']);
    await TestBed.configureTestingModule({
      declarations: [ExportSettingsComponent],
      providers: [{ provide: DataExportService, useValue: svc }],
    }).compileComponents();
  });

  it('shows the Export button when there is no export yet', () => {
    svc.latest.and.returnValue(of(null));
    create();
    expect(component.state).toBe('none');
    expect(text()).toContain('Export my data');
  });

  it('treats an expired export like no export', () => {
    svc.latest.and.returnValue(of(exp({ is_expired: true })));
    create();
    expect(component.state).toBe('none');
  });

  it('polls every 3 s while preparing and stops when ready', fakeAsync(() => {
    svc.latest.and.returnValues(of(exp({ status: 'running' })), of(exp({ status: 'running' })), of(exp({})));
    create();
    expect(component.state).toBe('preparing');
    expect(text()).toContain('Preparing your archive');
    tick(3000);
    expect(svc.latest).toHaveBeenCalledTimes(2);
    tick(3000);
    fixture.detectChanges();
    expect(component.state).toBe('ready');
    tick(9000);
    expect(svc.latest).toHaveBeenCalledTimes(3);
  }));

  it('starting an export enters preparing', fakeAsync(() => {
    svc.latest.and.returnValue(of(null));
    create();
    svc.start.and.returnValue(of(exp({ status: 'pending' })));
    svc.latest.and.returnValue(of(exp({ status: 'running' })));
    component.startExport();
    expect(component.state).toBe('preparing');
    component.ngOnDestroy();
    discardPeriodicTasks();
  }));

  it('ready shows the size and downloads through a one-time link', () => {
    svc.latest.and.returnValue(of(exp({})));
    svc.downloadLink.and.returnValue(of({ url: '/api/exports/download/tok' }));
    create();
    expect(text()).toContain('123 MB');
    component.download();
    expect(svc.downloadLink).toHaveBeenCalledWith('e1');
    expect(component.navigate).toHaveBeenCalledWith(`${environment.API_HOST}/api/exports/download/tok`);
  });

  it('failed shows the error and Try again starts a new export', () => {
    svc.latest.and.returnValue(of(exp({ status: 'failed', error: 'disk full' })));
    create();
    expect(component.state).toBe('failed');
    expect(text()).toContain('Try again');
    svc.start.and.returnValue(of(exp({ status: 'ready' })));
    component.startExport();
    expect(svc.start).toHaveBeenCalled();
  });

  it('shows an error state when loading fails', () => {
    svc.latest.and.returnValue(throwError(() => new Error('x')));
    create();
    expect(component.loadError).toBeTrue();
  });

  it('stops polling on destroy', fakeAsync(() => {
    svc.latest.and.returnValue(of(exp({ status: 'running' })));
    create();
    component.ngOnDestroy();
    const calls = svc.latest.calls.count();
    tick(15000);
    expect(svc.latest.calls.count()).toBe(calls);
  }));

  it('does not start polling if destroyed before the first response arrives', fakeAsync(() => {
    const pending = new Subject<DataExport | null>();
    svc.latest.and.returnValue(pending.asObservable());
    create();
    component.ngOnDestroy();
    svc.latest.and.returnValue(of(exp({ status: 'running' })));
    pending.next(exp({ status: 'running' }));
    const calls = svc.latest.calls.count();
    tick(15000);
    expect(svc.latest.calls.count()).toBe(calls);
  }));

  it('keeps polling after a failed poll', fakeAsync(() => {
    svc.latest.and.returnValues(
      of(exp({ status: 'running' })),
      throwError(() => ({ status: 502 })),
      of(exp({})),
    );
    create();
    tick(3000);
    expect(component.state).toBe('preparing');
    tick(3000);
    expect(component.state).toBe('ready');
  }));
});
