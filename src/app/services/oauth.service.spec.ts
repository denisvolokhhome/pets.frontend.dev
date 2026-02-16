import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OAuthService } from './oauth.service';
import { environment } from 'src/environments/environment';

describe('OAuthService', () => {
  let service: OAuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OAuthService]
    });

    service = TestBed.inject(OAuthService);
    httpMock = TestBed.inject(HttpTestingController);

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

  describe('initiateGoogleOAuth', () => {
    it('should fetch authorization URL from backend and redirect', (done) => {
      const mockResponse = {
        authorization_url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test'
      };

      // Spy on the redirect method to prevent actual redirect
      spyOn<any>(service, 'redirectToUrl');

      service.initiateGoogleOAuth().subscribe((response) => {
        expect(response.authorization_url).toBe(mockResponse.authorization_url);
        expect((service as any).redirectToUrl).toHaveBeenCalledWith(mockResponse.authorization_url);
        done();
      });

      const req = httpMock.expectOne(`${environment.API_URL}/auth/google/authorize`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle errors when fetching authorization URL', (done) => {
      spyOn<any>(service, 'redirectToUrl');

      service.initiateGoogleOAuth().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.API_URL}/auth/google/authorize`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('handleGoogleCallback', () => {
    it('should exchange authorization code for JWT token', (done) => {
      const mockCode = 'test-auth-code';
      const mockResponse = {
        access_token: 'mock-jwt-token',
        token_type: 'bearer',
        user: {
          id: '123',
          email: 'test@example.com',
          is_breeder: false
        }
      };

      service.handleGoogleCallback(mockCode).subscribe((response) => {
        expect(response.access_token).toBe('mock-jwt-token');
        expect(response.user.email).toBe('test@example.com');
        expect(localStorage.getItem('id_token')).toBe('mock-jwt-token');
        done();
      });

      const req = httpMock.expectOne(
        `${environment.API_URL}/auth/google/callback?code=${mockCode}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should store JWT token in localStorage', (done) => {
      const mockCode = 'test-auth-code';
      const mockResponse = {
        access_token: 'stored-token',
        token_type: 'bearer',
        user: { id: '123', email: 'test@example.com', is_breeder: false }
      };

      expect(localStorage.getItem('id_token')).toBeNull();

      service.handleGoogleCallback(mockCode).subscribe(() => {
        expect(localStorage.getItem('id_token')).toBe('stored-token');
        done();
      });

      const req = httpMock.expectOne(
        `${environment.API_URL}/auth/google/callback?code=${mockCode}`
      );
      req.flush(mockResponse);
    });

    it('should handle invalid authorization code', (done) => {
      const mockCode = 'invalid-code';

      service.handleGoogleCallback(mockCode).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(
        `${environment.API_URL}/auth/google/callback?code=${mockCode}`
      );
      req.flush('Invalid authorization code', { 
        status: 400, 
        statusText: 'Bad Request' 
      });
    });

    it('should not store token if response is missing access_token', (done) => {
      const mockCode = 'test-auth-code';
      const mockResponse = {
        token_type: 'bearer',
        user: { id: '123', email: 'test@example.com', is_breeder: false }
      };

      service.handleGoogleCallback(mockCode).subscribe(() => {
        expect(localStorage.getItem('id_token')).toBeNull();
        done();
      });

      const req = httpMock.expectOne(
        `${environment.API_URL}/auth/google/callback?code=${mockCode}`
      );
      req.flush(mockResponse);
    });
  });
});
