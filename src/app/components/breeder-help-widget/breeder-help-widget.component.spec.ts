import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { RouterTestingModule } from '@angular/router/testing';
import { BreederHelpWidgetComponent } from './breeder-help-widget.component';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';

describe('BreederHelpWidgetComponent', () => {
  let fixture: ComponentFixture<BreederHelpWidgetComponent>;
  let currentUser$: BehaviorSubject<any>;
  let dataService: jasmine.SpyObj<DataService>;

  beforeEach(async () => {
    currentUser$ = new BehaviorSubject<any>(null);
    // Mirrors AuthService after LoginUser(): already `true` before /users/me returns.
    const isLoggedIn$ = new BehaviorSubject<boolean>(true).pipe(distinctUntilChanged());
    const authStub = {
      currentUser$,
      isLoggedIn$,
      get currentUser() { return currentUser$.value; },
      get isBreeder() { return !!currentUser$.value?.is_breeder; },
      hasValidToken: () => true,
    };
    dataService = jasmine.createSpyObj('DataService', ['getCurrentUserProfile', 'getLocations', 'getPetsByBreeder']);
    dataService.getCurrentUserProfile.and.returnValue(of({ breedery_name: '' } as any));
    dataService.getLocations.and.returnValue(of([]));
    dataService.getPetsByBreeder.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [BreederHelpWidgetComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authStub },
        { provide: DataService, useValue: dataService },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BreederHelpWidgetComponent);
  });

  it('shows the guide once the breeder user arrives after login (no refresh)', () => {
    // Just logged in: token stored, /users/me not back yet.
    fixture.detectChanges();
    expect(dataService.getCurrentUserProfile).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.guide-trigger')).toBeNull();

    // /users/me resolves with a fresh breeder account.
    currentUser$.next({ id: 'u1', is_breeder: true });
    fixture.detectChanges();

    expect(dataService.getCurrentUserProfile).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('.guide-trigger')).not.toBeNull();
  });

  it('does not reload state when the same user object is re-emitted', () => {
    currentUser$.next({ id: 'u1', is_breeder: true });
    fixture.detectChanges();
    currentUser$.next({ id: 'u1', is_breeder: true });
    expect(dataService.getCurrentUserProfile).toHaveBeenCalledTimes(1);
  });

  it('stays hidden for non-breeders', () => {
    currentUser$.next({ id: 'u2', is_breeder: false });
    fixture.detectChanges();
    expect(dataService.getCurrentUserProfile).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.guide-trigger')).toBeNull();
  });
});
