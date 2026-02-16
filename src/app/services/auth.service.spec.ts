import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { OAuthService } from './oauth.service';
import { IUser } from '../models/user';
import { environment } from 'src/environments/environment';
import { of, throwError } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;
  let oauthServiceSpy: jasmine.SpyObj<OAuthService>;

  const mockBreederUser: IUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'breeder@example.com',
    name: 'Test Breeder',
    is_breeder: true,
    is_active: true,
    is_verified: true
  };

  const mockPetSeekerUser: IUser = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    email: 'petseeker@example.com',
    name: 'Test Pet Seeker',
    is_breeder: false,
    is_active: true,
    is_verified: true
  };

  beforeEach(() => {
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);
    const oauthSpyObj = jasmine.createSpyObj('OAuthService', ['initiateGoogleOAuth', 'handleGoogleCallback']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpyObj },
        { provide: OAuthService, useValue: oauthSpyObj }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    oauthServiceSpy = TestBed.inject(OAuthService) as jasmine.SpyObj<OAuthService>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('User Type Detection', () => {
    it('should correctly identify a breeder user', (done) => {
      localStorage.setItem('id_token', 'mock-token');

      service.IsLoggedIn().subscribe(() => {
        expect(service.isBreeder).toBe(true);
        expect(service.isPetSeeker).toBe(false);
        expect(service.currentUser?.is_breeder).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.API_URL}/auth/users/me`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBreederUser);
    });

    it('should correctly identify a pet seeker user', (done) => {
      localStorage.setItem('id_token', 'mock-token');

      service.IsLoggedIn().subscribe(() => {
        expect(service.isBreeder).toBe(false);
        expect(service.isPetSeeker).toBe(true);
        expect(service.currentUser?.is_breeder).toBe(false);
        done();
      });

      const req = httpMock.expectOne(`${environment.API_URL}/auth/users/me`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPetSeekerUser);
    });

    it('should return false for both user types when not logged in', () => {
      expect(service.isBreeder).toBe(false);
      expect(service.isPetSeeker).toBe(false);
      expect(service.currentUser).toBeNull();
    });

    it('should update currentUser observable when user logs in', (done) => {
      localStorage.setItem('id_token', 'mock-token');

      service.currentUser$.subscribe((user) => {
        if (user) {
          expect(user.email).toBe(mockBreederUser.email);
          expect(user.is_breeder).toBe(true);
          done();
        }
      });

      service.IsLoggedIn().subscribe();

      const req = httpMock.expectOne(`${environment.API_URL}/auth/users/me`);
      req.flush(mockBreederUser);
    });
  });

  describe('OAuth Flow Initiation', () => {
    it('should call OAuth service to initiate Google sign-in', () => {
      const mockResponse = { authorization_url: 'https://accounts.google.com/oauth' };
      oauthServiceSpy.initiateGoogleOAuth.and.returnValue(of(mockResponse));

      service.signInWithGoogle();

      expect(oauthServiceSpy.initiateGoogleOAuth).toHaveBeenCalled();
    });

    it('should handle errors when OAuth initiation fails', () => {
      const consoleErrorSpy = spyOn(console, 'error');
      oauthServiceSpy.initiateGoogleOAuth.and.returnValue(
        throwError(() => new Error('OAuth initiation failed'))
      );

      service.signInWithGoogle();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initiate Google OAuth:',
        jasmine.any(Error)
      );
    });
  });

  describe('OAuth Callback Handling', () => {
    it('should handle Google OAuth callback and store token', (done) => {
      const mockCode = 'mock-auth-code';
      const mockResponse = {
        access_token: 'mock-jwt-token',
        token_type: 'bearer',
        user: mockPetSeekerUser
      };

      // The OAuth service stores the token in its tap operator
      localStorage.setItem('id_token', 'mock-jwt-token');
      oauthServiceSpy.handleGoogleCallback.and.returnValue(of(mockResponse));

      service.handleGoogleCallback(mockCode).subscribe(() => {
        expect(oauthServiceSpy.handleGoogleCallback).toHaveBeenCalledWith(mockCode);
        done();
      });

      // Expect the IsLoggedIn call to fetch user data
      const req = httpMock.expectOne(`${environment.API_URL}/auth/users/me`);
      req.flush(mockPetSeekerUser);
    });

    it('should update login state after successful OAuth callback', (done) => {
      const mockCode = 'mock-auth-code';
      const mockResponse = {
        access_token: 'mock-jwt-token',
        token_type: 'bearer',
        user: mockPetSeekerUser
      };

      localStorage.setItem('id_token', 'mock-jwt-token');
      oauthServiceSpy.handleGoogleCallback.and.returnValue(of(mockResponse));

      let loginStateChecked = false;
      service.isLoggedIn$.subscribe((isLoggedIn) => {
        if (isLoggedIn && !loginStateChecked) {
          loginStateChecked = true;
          expect(isLoggedIn).toBe(true);
          done();
        }
      });

      service.handleGoogleCallback(mockCode).subscribe();

      const req = httpMock.expectOne(`${environment.API_URL}/auth/users/me`);
      req.flush(mockPetSeekerUser);
    });

    it('should handle OAuth callback errors gracefully', (done) => {
      const mockCode = 'invalid-code';
      const consoleErrorSpy = spyOn(console, 'error');

      oauthServiceSpy.handleGoogleCallback.and.returnValue(
        throwError(() => new Error('Invalid authorization code'))
      );

      service.handleGoogleCallback(mockCode).subscribe((result) => {
        expect(result).toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Google OAuth callback failed:',
          jasmine.any(Error)
        );
        done();
      });
    });
  });

  describe('Token Storage', () => {
    it('should store token in localStorage on successful login', (done) => {
      const mockLoginResponse = { access_token: 'test-token' };
      const loginData = { email: 'test@example.com', password: 'password123' };

      service.LoginUser(loginData).subscribe(() => {
        expect(localStorage.getItem('id_token')).toBe('test-token');
        done();
      });

      const req = httpMock.expectOne(`${environment.API_URL}/auth/jwt/login`);
      expect(req.request.method).toBe('POST');
      req.flush(mockLoginResponse);

      // Handle the IsLoggedIn call that happens after login
      const userReq = httpMock.expectOne(`${environment.API_URL}/auth/users/me`);
      userReq.flush(mockBreederUser);
    });

    it('should remove token from localStorage on logout', (done) => {
      localStorage.setItem('id_token', 'test-token');

      service.LogoutUser().subscribe(() => {
        expect(localStorage.getItem('id_token')).toBeNull();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
        done();
      });

      const req = httpMock.expectOne(`${environment.API_URL}/auth/jwt/logout`);
      req.flush({});
    });

    it('should clear user state on logout', (done) => {
      localStorage.setItem('id_token', 'test-token');
      
      // Set up initial user state
      service.IsLoggedIn().subscribe(() => {
        expect(service.currentUser).not.toBeNull();

        // Now logout
        service.LogoutUser().subscribe(() => {
          expect(service.currentUser).toBeNull();
          expect(service.isBreeder).toBe(false);
          expect(service.isPetSeeker).toBe(false);
          done();
        });

        const logoutReq = httpMock.expectOne(`${environment.API_URL}/auth/jwt/logout`);
        logoutReq.flush({});
      });

      const userReq = httpMock.expectOne(`${environment.API_URL}/auth/users/me`);
      userReq.flush(mockBreederUser);
    });

    it('should check for valid token in localStorage', () => {
      expect(service.hasValidToken()).toBe(false);

      localStorage.setItem('id_token', 'test-token');
      expect(service.hasValidToken()).toBe(true);

      localStorage.removeItem('id_token');
      expect(service.hasValidToken()).toBe(false);
    });
  });

  describe('Session Expiration', () => {
    it('should clear token and user state on session expiration', () => {
      localStorage.setItem('id_token', 'expired-token');
      
      service.handleSessionExpired();

      expect(localStorage.getItem('id_token')).toBeNull();
      expect(service.currentUser).toBeNull();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
    });
  });
});
