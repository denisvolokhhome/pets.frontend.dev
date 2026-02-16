import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { PetSeekerRegistrationComponent } from './pet-seeker-registration.component';
import { AuthService } from 'src/app/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('PetSeekerRegistrationComponent', () => {
  let component: PetSeekerRegistrationComponent;
  let fixture: ComponentFixture<PetSeekerRegistrationComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let toastrService: jasmine.SpyObj<ToastrService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'RegisterPetSeeker',
      'IsLoggedIn',
      'signInWithGoogle',
    ]);
    const toastrServiceSpy = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
      'warning',
      'info',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [PetSeekerRegistrationComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastrService, useValue: toastrServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    toastrService = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Default: user is not logged in
    authService.IsLoggedIn.and.returnValue(of(null));

    fixture = TestBed.createComponent(PetSeekerRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    it('should have invalid form when empty', () => {
      expect(component.registerForm.valid).toBeFalsy();
    });

    it('should require email field', () => {
      const emailControl = component.registerForm.get('email');
      expect(emailControl?.valid).toBeFalsy();
      expect(emailControl?.hasError('required')).toBeTruthy();
    });

    it('should require password field', () => {
      const passwordControl = component.registerForm.get('password');
      expect(passwordControl?.valid).toBeFalsy();
      expect(passwordControl?.hasError('required')).toBeTruthy();
    });

    it('should validate email format', () => {
      const emailControl = component.registerForm.get('email');
      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBeTruthy();

      emailControl?.setValue('valid@email.com');
      expect(emailControl?.hasError('email')).toBeFalsy();
    });

    it('should make name field optional', () => {
      component.registerForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(component.registerForm.valid).toBeTruthy();
    });

    it('should be valid with all required fields', () => {
      component.registerForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });
      expect(component.registerForm.valid).toBeTruthy();
    });
  });

  describe('Successful Registration Flow', () => {
    it('should call RegisterPetSeeker with form data on valid submission', () => {
      const mockResponse = { access_token: 'test-token' };
      authService.RegisterPetSeeker.and.returnValue(of(mockResponse));

      component.registerForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      component.proceedRegistration();

      expect(authService.RegisterPetSeeker).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });
    });

    it('should store JWT token on successful registration', () => {
      const mockResponse = { access_token: 'test-token-123' };
      authService.RegisterPetSeeker.and.returnValue(of(mockResponse));

      component.registerForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      component.proceedRegistration();

      expect(localStorage.getItem('id_token')).toBe('test-token-123');
    });

    it('should show success message on successful registration', () => {
      const mockResponse = { access_token: 'test-token' };
      authService.RegisterPetSeeker.and.returnValue(of(mockResponse));

      component.registerForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      component.proceedRegistration();

      expect(toastrService.success).toHaveBeenCalledWith(
        'Welcome to Breedly!',
        'Account Created Successfully'
      );
    });

    it('should redirect to dashboard on successful registration', () => {
      const mockResponse = { access_token: 'test-token' };
      authService.RegisterPetSeeker.and.returnValue(of(mockResponse));

      component.registerForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      component.proceedRegistration();

      expect(router.navigate).toHaveBeenCalledWith(['dashboard']);
    });

    it('should send undefined for empty name field', () => {
      const mockResponse = { access_token: 'test-token' };
      authService.RegisterPetSeeker.and.returnValue(of(mockResponse));

      component.registerForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
        name: '',
      });

      component.proceedRegistration();

      expect(authService.RegisterPetSeeker).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        name: undefined,
      });
    });
  });

  describe('Error Handling', () => {
    it('should show warning when form is invalid', () => {
      component.registerForm.patchValue({
        email: '',
        password: '',
      });

      component.proceedRegistration();

      expect(toastrService.warning).toHaveBeenCalledWith('Please enter valid data');
      expect(authService.RegisterPetSeeker).not.toHaveBeenCalled();
    });

    it('should handle user already exists error', () => {
      const errorResponse = new HttpErrorResponse({
        error: { detail: 'REGISTER_USER_ALREADY_EXISTS' },
        status: 400,
      });
      authService.RegisterPetSeeker.and.returnValue(throwError(() => errorResponse));

      component.registerForm.patchValue({
        email: 'existing@example.com',
        password: 'password123',
      });

      component.proceedRegistration();

      expect(toastrService.info).toHaveBeenCalledWith(
        'If you already have an account, please sign in.',
        'Account Check'
      );
      expect(router.navigate).toHaveBeenCalledWith(['login'], {
        queryParams: { email: 'existing@example.com' },
      });
    });

    it('should handle 400 bad request error', () => {
      const errorResponse = new HttpErrorResponse({
        error: { detail: 'Some validation error' },
        status: 400,
      });
      authService.RegisterPetSeeker.and.returnValue(throwError(() => errorResponse));

      component.registerForm.patchValue({
        email: 'test@example.com',
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
      authService.RegisterPetSeeker.and.returnValue(throwError(() => errorResponse));

      component.registerForm.patchValue({
        email: 'test@example.com',
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
      authService.RegisterPetSeeker.and.returnValue(throwError(() => errorResponse));

      component.registerForm.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      component.proceedRegistration();

      expect(toastrService.error).toHaveBeenCalledWith(
        'An unexpected error occurred. Please try again later.',
        'Registration Failed'
      );
    });
  });

  describe('Google SSO', () => {
    it('should call signInWithGoogle when Google button is clicked', () => {
      component.signInWithGoogle();
      expect(authService.signInWithGoogle).toHaveBeenCalled();
    });
  });

  describe('Redirect if logged in', () => {
    it('should redirect to dashboard if user is already logged in', () => {
      const mockUser = { id: '123', email: 'test@example.com', is_breeder: false };
      authService.IsLoggedIn.and.returnValue(of(mockUser));

      const newFixture = TestBed.createComponent(PetSeekerRegistrationComponent);
      newFixture.detectChanges();

      expect(router.navigate).toHaveBeenCalledWith(['dashboard']);
    });
  });
});
