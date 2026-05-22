import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';

import { AuthService } from './auth.service';
import { IUser } from '../models/user';

// ── Helpers ───────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<IUser>): IUser {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'test@example.com',
    is_breeder: false,
    ...overrides,
  };
}

describe('AuthService — account type getters', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
  });

  // ── isBreeder ─────────────────────────────────────────────────────────────

  describe('isBreeder', () => {
    it('returns true when user has is_breeder=true', () => {
      (service as any).currentUserSubject.next(makeUser({ is_breeder: true, account_type: 'breeder' }));
      expect(service.isBreeder).toBeTrue();
    });

    it('returns false when user has is_breeder=false', () => {
      (service as any).currentUserSubject.next(makeUser({ is_breeder: false, account_type: 'pet_seeker' }));
      expect(service.isBreeder).toBeFalse();
    });

    it('returns false when no user is logged in', () => {
      (service as any).currentUserSubject.next(null);
      expect(service.isBreeder).toBeFalse();
    });
  });

  // ── isPetSeeker ───────────────────────────────────────────────────────────

  describe('isPetSeeker', () => {
    it('returns true when account_type is pet_seeker', () => {
      (service as any).currentUserSubject.next(makeUser({ is_breeder: false, account_type: 'pet_seeker' }));
      expect(service.isPetSeeker).toBeTrue();
    });

    it('returns true for legacy user with is_breeder=false and no account_type', () => {
      (service as any).currentUserSubject.next(makeUser({ is_breeder: false, account_type: undefined }));
      expect(service.isPetSeeker).toBeTrue();
    });

    it('returns false when account_type is breeder', () => {
      (service as any).currentUserSubject.next(makeUser({ is_breeder: true, account_type: 'breeder' }));
      expect(service.isPetSeeker).toBeFalse();
    });

    it('returns false when account_type is service (service providers are NOT pet seekers)', () => {
      (service as any).currentUserSubject.next(makeUser({ is_breeder: false, account_type: 'service' }));
      expect(service.isPetSeeker).toBeFalse();
    });

    it('returns false when no user is logged in', () => {
      (service as any).currentUserSubject.next(null);
      expect(service.isPetSeeker).toBeFalse();
    });
  });

  // ── isServiceProvider ─────────────────────────────────────────────────────

  describe('isServiceProvider', () => {
    it('returns true when account_type is service', () => {
      (service as any).currentUserSubject.next(makeUser({ is_breeder: false, account_type: 'service' }));
      expect(service.isServiceProvider).toBeTrue();
    });

    it('returns false when account_type is breeder', () => {
      (service as any).currentUserSubject.next(makeUser({ is_breeder: true, account_type: 'breeder' }));
      expect(service.isServiceProvider).toBeFalse();
    });

    it('returns false when account_type is pet_seeker', () => {
      (service as any).currentUserSubject.next(makeUser({ is_breeder: false, account_type: 'pet_seeker' }));
      expect(service.isServiceProvider).toBeFalse();
    });

    it('returns false when account_type is undefined', () => {
      (service as any).currentUserSubject.next(makeUser({ is_breeder: false, account_type: undefined }));
      expect(service.isServiceProvider).toBeFalse();
    });

    it('returns false when no user is logged in', () => {
      (service as any).currentUserSubject.next(null);
      expect(service.isServiceProvider).toBeFalse();
    });
  });

  // ── mutual exclusivity ────────────────────────────────────────────────────

  describe('mutual exclusivity', () => {
    it('a breeder is not a pet seeker and not a service provider', () => {
      (service as any).currentUserSubject.next(makeUser({ is_breeder: true, account_type: 'breeder' }));
      expect(service.isBreeder).toBeTrue();
      expect(service.isPetSeeker).toBeFalse();
      expect(service.isServiceProvider).toBeFalse();
    });

    it('a pet seeker is not a breeder and not a service provider', () => {
      (service as any).currentUserSubject.next(makeUser({ is_breeder: false, account_type: 'pet_seeker' }));
      expect(service.isBreeder).toBeFalse();
      expect(service.isPetSeeker).toBeTrue();
      expect(service.isServiceProvider).toBeFalse();
    });

    it('a service provider is not a breeder and not a pet seeker', () => {
      (service as any).currentUserSubject.next(makeUser({ is_breeder: false, account_type: 'service' }));
      expect(service.isBreeder).toBeFalse();
      expect(service.isPetSeeker).toBeFalse();
      expect(service.isServiceProvider).toBeTrue();
    });
  });
});
