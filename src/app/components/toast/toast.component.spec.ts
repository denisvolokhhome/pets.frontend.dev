import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastComponent } from './toast.component';
import { ToastService, Toast } from '../../services/toast.service';
import { Subject } from 'rxjs';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;
  let toastService: jasmine.SpyObj<ToastService>;
  let toastSubject: Subject<Toast>;

  beforeEach(async () => {
    toastSubject = new Subject<Toast>();
    
    const toastServiceSpy = jasmine.createSpyObj('ToastService', [], {
      toasts$: toastSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      declarations: [ToastComponent],
      providers: [
        { provide: ToastService, useValue: toastServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display toast when service emits', () => {
    const toast: Toast = {
      id: 'test-1',
      message: 'Test message',
      type: 'success',
      duration: 3000
    };

    toastSubject.next(toast);
    fixture.detectChanges();

    expect(component.toasts.length).toBe(1);
    expect(component.toasts[0]).toEqual(toast);

    const toastElement = fixture.nativeElement.querySelector('.toast');
    expect(toastElement).toBeTruthy();
    expect(toastElement.textContent).toContain('Test message');
  });

  it('should remove toast after duration', fakeAsync(() => {
    const toast: Toast = {
      id: 'test-1',
      message: 'Test message',
      type: 'success',
      duration: 1000
    };

    toastSubject.next(toast);
    fixture.detectChanges();

    expect(component.toasts.length).toBe(1);

    tick(1000);

    expect(component.toasts.length).toBe(0);
  }));

  it('should remove toast when close button is clicked', () => {
    const toast: Toast = {
      id: 'test-1',
      message: 'Test message',
      type: 'success',
      duration: 3000
    };

    toastSubject.next(toast);
    fixture.detectChanges();

    expect(component.toasts.length).toBe(1);

    const closeButton = fixture.nativeElement.querySelector('.toast-close');
    closeButton.click();
    fixture.detectChanges();

    expect(component.toasts.length).toBe(0);
  });

  it('should display multiple toasts', () => {
    const toast1: Toast = {
      id: 'test-1',
      message: 'Message 1',
      type: 'success',
      duration: 3000
    };

    const toast2: Toast = {
      id: 'test-2',
      message: 'Message 2',
      type: 'error',
      duration: 3000
    };

    toastSubject.next(toast1);
    toastSubject.next(toast2);
    fixture.detectChanges();

    expect(component.toasts.length).toBe(2);

    const toastElements = fixture.nativeElement.querySelectorAll('.toast');
    expect(toastElements.length).toBe(2);
  });

  it('should apply correct CSS class for toast type', () => {
    const types: Toast['type'][] = ['success', 'error', 'warning', 'info'];

    types.forEach((type, index) => {
      const toast: Toast = {
        id: `test-${index}`,
        message: `${type} message`,
        type,
        duration: 3000
      };

      toastSubject.next(toast);
    });

    fixture.detectChanges();

    const toastElements = fixture.nativeElement.querySelectorAll('.toast');
    expect(toastElements[0].classList.contains('toast-success')).toBe(true);
    expect(toastElements[1].classList.contains('toast-error')).toBe(true);
    expect(toastElements[2].classList.contains('toast-warning')).toBe(true);
    expect(toastElements[3].classList.contains('toast-info')).toBe(true);
  });

  it('should return correct icon for each toast type', () => {
    expect(component.getIcon('success')).toBe('✓');
    expect(component.getIcon('error')).toBe('✕');
    expect(component.getIcon('warning')).toBe('⚠');
    expect(component.getIcon('info')).toBe('ℹ');
  });

  it('should unsubscribe on destroy', () => {
    spyOn(component['subscription']!, 'unsubscribe');
    component.ngOnDestroy();
    expect(component['subscription']!.unsubscribe).toHaveBeenCalled();
  });
});
