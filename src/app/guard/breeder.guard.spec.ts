import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../services/auth.service';
import { BreederGuard } from './breeder.guard';
import { of } from 'rxjs';
import { IUser } from '../models/user';

describe('BreederGuard', () => {
  let guard: BreederGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let toastrService: jasmine.SpyObj<ToastrService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['IsLoggedIn']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const toastrServiceSpy = jasmine.createSpyObj('ToastrService', ['error', 'success', 'warning']);

    TestBed.configureTestingModule({
      providers: [
        BreederGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ToastrService, useValue: toastrServiceSpy }
      ]
    });
    
    guard = TestBed.inject(BreederGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    toastrService = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {
    it('should allow access for breeder users', (done) => {
      // Arrange
      const breederUser: IUser = {
        id: '123',
        email: 'breeder@test.com',
        name: 'Test Breeder',
        is_breeder: true
      };
      authService.IsLoggedIn.and.returnValue(of(breederUser));

      // Act
      const result = guard.canActivate({} as any, {} as any);

      // Assert
      if (result instanceof Promise) {
        result.then((canActivate) => {
          expect(canActivate).toBe(true);
          expect(router.navigate).not.toHaveBeenCalled();
          expect(toastrService.error).not.toHaveBeenCalled();
          done();
        });
      } else if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((canActivate) => {
          expect(canActivate).toBe(true);
          expect(router.navigate).not.toHaveBeenCalled();
          expect(toastrService.error).not.toHaveBeenCalled();
          done();
        });
      }
    });

    it('should block access for pet seeker users', (done) => {
      // Arrange
      const petSeekerUser: IUser = {
        id: '456',
        email: 'petseeker@test.com',
        name: 'Test Pet Seeker',
        is_breeder: false
      };
      authService.IsLoggedIn.and.returnValue(of(petSeekerUser));

      // Act
      const result = guard.canActivate({} as any, {} as any);

      // Assert
      if (result instanceof Promise) {
        result.then((canActivate) => {
          expect(canActivate).toBe(false);
          expect(router.navigate).toHaveBeenCalledWith(['dashboard']);
          expect(toastrService.error).toHaveBeenCalledWith(
            'This page is only accessible to breeders',
            'Access Denied'
          );
          done();
        });
      } else if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((canActivate) => {
          expect(canActivate).toBe(false);
          expect(router.navigate).toHaveBeenCalledWith(['dashboard']);
          expect(toastrService.error).toHaveBeenCalledWith(
            'This page is only accessible to breeders',
            'Access Denied'
          );
          done();
        });
      }
    });

    it('should redirect to login for unauthenticated users', (done) => {
      // Arrange
      authService.IsLoggedIn.and.returnValue(of(null));

      // Act
      const result = guard.canActivate({} as any, {} as any);

      // Assert
      if (result instanceof Promise) {
        result.then((canActivate) => {
          expect(canActivate).toBe(false);
          expect(router.navigate).toHaveBeenCalledWith(['login']);
          expect(toastrService.error).toHaveBeenCalledWith(
            'Please log in to access this page',
            'Authentication Required'
          );
          done();
        });
      } else if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((canActivate) => {
          expect(canActivate).toBe(false);
          expect(router.navigate).toHaveBeenCalledWith(['login']);
          expect(toastrService.error).toHaveBeenCalledWith(
            'Please log in to access this page',
            'Authentication Required'
          );
          done();
        });
      }
    });

    it('should handle undefined user object', (done) => {
      // Arrange
      authService.IsLoggedIn.and.returnValue(of(undefined as any));

      // Act
      const result = guard.canActivate({} as any, {} as any);

      // Assert
      if (result instanceof Promise) {
        result.then((canActivate) => {
          expect(canActivate).toBe(false);
          expect(router.navigate).toHaveBeenCalledWith(['login']);
          done();
        });
      } else if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((canActivate) => {
          expect(canActivate).toBe(false);
          expect(router.navigate).toHaveBeenCalledWith(['login']);
          done();
        });
      }
    });

    it('should verify breeder status correctly when is_breeder is explicitly false', (done) => {
      // Arrange
      const petSeekerUser: IUser = {
        id: '789',
        email: 'another@test.com',
        is_breeder: false
      };
      authService.IsLoggedIn.and.returnValue(of(petSeekerUser));

      // Act
      const result = guard.canActivate({} as any, {} as any);

      // Assert
      if (result instanceof Promise) {
        result.then((canActivate) => {
          expect(canActivate).toBe(false);
          expect(toastrService.error).toHaveBeenCalled();
          done();
        });
      } else if (typeof result === 'object' && 'subscribe' in result) {
        result.subscribe((canActivate) => {
          expect(canActivate).toBe(false);
          expect(toastrService.error).toHaveBeenCalled();
          done();
        });
      }
    });
  });
});
