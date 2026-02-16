import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { GuestToAccountComponent } from './guest-to-account.component';
import { AuthService } from 'src/app/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('GuestToAccountComponent', () => {
  let component: GuestToAccountComponent;
  let fixture: ComponentFixture<GuestToAccountComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let toastrService: jasmine.SpyObj<ToastrService>;
  let router: jasmine.SpyObj<Router>;
  let activatedRoute: any;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'ConvertGuestToAccount',
      'IsLoggedIn',
    ]);
    const toastrServiceSpy = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
      'warning',
      'info',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Mock ActivatedRoute with queryParams
    activatedRoute = {
      queryParams: of({ email: 'guest@example.com' }),
    };

    await TestBed.configureTestingModule({
      declarations: [GuestToAccountComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastrService, useValue: toastrServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    toastrService = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Default: user is not logged in
    authService.IsLoggedIn.and.returnValue(of(null));

    fixture = TestBed.createComponent(GuestToAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should pre-fill email from query parameter', () => {
      expect(component.registerForm.get('email')?.value).toBe('guest@example.com');
    });

    it('should disable email field', () => {
      expect(component.registerForm.get('email')?.disabled).toBeTruthy();
    });

    it('should have password field enabled', () => {
      expect(component.registerForm.get('password')?.disabled).toBeFalsy();
    });

    it('should have name field enabled and optional', () => {
      expect(component.registerForm.get('name')?.disabled).toBeFalsy();
      component.registerForm.patchValue({
        password: 'password123',
      });
      expect(component.registerForm.valid).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should require password field', () => {
      const passwordControl = component.registerForm.get('password');
      expect(passwordControl?.valid).toBeFalsy();
      expect(passwordControl?.hasError('required')).toBeTruthy();
    });

    it('should be valid with password only', () => {
      component.registerForm.patchValue({
        password: 'password123',
      });
      expect(component.registerForm.valid).toBeTruthy();
    });

    it('should be valid with password and name', () => {
      component.registerForm.patchValue({
        password: 'password123',
        name: 'Test User',
      });
      expect(component.registerForm.valid).toBeTruthy();
    });
  });

  describe('Successful Registration Flow', () => {
    it('should call ConvertGuestToAccount with form data including disabled email', () => {
      const mockResponse = {
        access_token: 'test-token',
        linked_messages_count: 2,
      };
      authService.ConvertGuestToAccount.and.returnValue(of(mockResponse));

      component.registerForm.patchValue({
        password: 'password123',
        name: 'Test User',
      });

      component.proceedRegistration();

      expect(authService.ConvertGuestToAccount).toHaveBeenCalledWith({
        email: 'guest@example.com',
        password: 'password123',
        name: 'Test User',
      });
    });

    it('should store JWT token on successful registration', () => {
      const mockResponse = {
        access_token: 'test-token-123',
        linked_messages_count: 1,
      };
      authService.ConvertGuestToAccount.and.returnValue(of(mockResponse));

      component.registerForm.patchValue({
        password: 'password123',
      });

      component.proceedRegistration();

      expect(localStorage.getItem('id_token')).toBe('test-token-123');
    });

    it('should show success message with linked messages count', () => {
      const mockResponse = {
        access_token: 'test-token',
        linked_messages_count: 3,
      };
      authService.ConvertGuestToAccount.and.returnValue(of(mockResponse));

      component.registerForm.patchValue({
        password: 'password123',
      });

      component.proceedRegistration();

      expect(toastrService.success).toHaveBeenCalledWith(
        '3 previous message(s) linked to your account',
        'Account Created Successfully',
        { timeOut: 5000 }
      );
    });

    it('should show welcome message when no messages linked', () => {
      const mockResponse = {
        access_token: 'test-token',
        linked_messages_count: 0,
      };
      authService.ConvertGuestToAccount.and.returnValue(of(mockResponse));

      component.registerForm.patchValue({
        password: 'password123',
      });

      component.proceedRegistration();

      expect(toastrService.success).toHaveBeenCalledWith(
        'Welcome to Breedly!',
        'Account Created Successfully',
        { timeOut: 5000 }
      );
    });

    it('should redirect to messages dashboard on successful registration', () => {
      const mockResponse = {
        access_token: 'test-token',
        linked_messages_count: 2,
      };
      authService.ConvertGuestToAccount.and.returnValue(of(mockResponse));

      component.registerForm.patchValue({
        password: 'password123',
      });

      component.proceedRegistration();

      expect(router.navigate).toHaveBeenCalledWith(['settings/messages']);
    });

    it('should send undefined for empty name field', () => {
      const mockResponse = {
        access_token: 'test-token',
        linked_messages_count: 1,
      };
      authService.ConvertGuestToAccount.and.returnValue(of(mockResponse));

      component.registerForm.patchValue({
        password: 'password123',
        name: '',
      });

      component.proceedRegistration();

      expect(authService.ConvertGuestToAccount).toHaveBeenCalledWith({
        email: 'guest@example.com',
        password: 'password123',
        name: undefined,
      });
    });
  });

  describe('Error Handling', () => {
    it('should show warning when form is invalid', () => {
      component.registerForm.patchValue({
        password: '',
      });

      component.proceedRegistration();

      expect(toastrService.warning).toHaveBeenCalledWith('Please enter a valid password');
      expect(authService.ConvertGuestToAccount).not.toHaveBeenCalled();
    });

    it('should handle user already exists error', () => {
      const errorResponse = new HttpErrorResponse({
        error: { detail: 'REGISTER_USER_ALREADY_EXISTS' },
        status: 400,
      });
      authService.ConvertGuestToAccount.and.returnValue(throwError(() => errorResponse));

      component.registerForm.patchValue({
        password: 'password123',
      });

      component.proceedRegistration();

      expect(toastrService.info).toHaveBeenCalledWith(
        'If you already have an account, please sign in.',
        'Account Check'
      );
      expect(router.navigate).toHaveBeenCalledWith(['login'], {
        queryParams: { email: 'guest@example.com' },
      });
    });

    it('should handle 400 bad request error', () => {
      const errorResponse = new HttpErrorResponse({
        error: { detail: 'Some validation error' },
        status: 400,
      });
      authService.ConvertGuestToAccount.and.returnValue(throwError(() => errorResponse));

      component.registerForm.patchValue({
        password: 'password123',
      });

      component.proceedRegistration();

      expect(toastrService.error).toHaveBeenCalledWith(
        'Please check your information and try again.',
        'Invalid Registration Data'
      );
    });

    it('should handle connection error', () => {
      const errorResponse = new HttpErrorResponse({
        error: null,
        status: 0,
      });
      authService.ConvertGuestToAccount.and.returnValue(throwError(() => errorResponse));

      component.registerForm.patchValue({
        password: 'password123',
      });

      component.proceedRegistration();

      expect(toastrService.error).toHaveBeenCalledWith(
        'Unable to connect to the server. Please check your connection.',
        'Connection Error'
      );
    });

    it('should handle unexpected error', () => {
      const errorResponse = new HttpErrorResponse({
        error: { detail: 'Unexpected error' },
        status: 500,
      });
      authService.ConvertGuestToAccount.and.returnValue(throwError(() => errorResponse));

      component.registerForm.patchValue({
        password: 'password123',
      });

      component.proceedRegistration();

      expect(toastrService.error).toHaveBeenCalledWith(
        'An unexpected error occurred. Please try again later.',
        'Registration Failed'
      );
    });
  });

  describe('Redirect if logged in', () => {
    it('should redirect to dashboard if user is already logged in', () => {
      const mockUser = { id: '123', email: 'test@example.com', is_breeder: false };
      authService.IsLoggedIn.and.returnValue(of(mockUser));

      const newFixture = TestBed.createComponent(GuestToAccountComponent);
      newFixture.detectChanges();

      expect(router.navigate).toHaveBeenCalledWith(['dashboard']);
    });
  });

  describe('No email in query params', () => {
    it('should handle missing email query parameter', () => {
      activatedRoute.queryParams = of({});

      const newFixture = TestBed.createComponent(GuestToAccountComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.registerForm.get('email')?.value).toBe('');
    });
  });
});
