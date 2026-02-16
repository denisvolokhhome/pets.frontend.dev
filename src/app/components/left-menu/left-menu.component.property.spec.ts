import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeftMenuComponent } from './left-menu.component';
import { AuthService } from 'src/app/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import { IUser } from 'src/app/models/user';
import * as fc from 'fast-check';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';

describe('LeftMenuComponent - Property-Based Tests', () => {
  let component: LeftMenuComponent;
  let fixture: ComponentFixture<LeftMenuComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockLocation: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    // Create mock services
    mockAuthService = jasmine.createSpyObj('AuthService', ['hasValidToken', 'IsLoggedIn'], {
      isBreeder: false,
      isPetSeeker: false,
      currentUser: null
    });

    mockRouter = jasmine.createSpyObj('Router', ['navigate'], {
      events: of({})
    });

    mockLocation = jasmine.createSpyObj('Location', ['path']);

    await TestBed.configureTestingModule({
      declarations: [LeftMenuComponent],
      imports: [RouterTestingModule, RouterModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Location, useValue: mockLocation },
        ChangeDetectorRef
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LeftMenuComponent);
    component = fixture.componentInstance;
  });

  describe('Property 15: Navigation Rendering Based on User Type', () => {
    // Generator for user data
    const userArb = fc.record({
      id: fc.uuid(),
      email: fc.emailAddress(),
      name: fc.option(fc.string({ minLength: 3, maxLength: 50 }), { nil: undefined }),
      is_breeder: fc.boolean(),
      is_active: fc.constant(true),
      is_verified: fc.constant(true)
    });

    it('should hide breeder-specific items for pet seekers', () => {
      // Feature: pet-seeker-accounts, Property 15: Navigation Rendering Based on User Type
      // Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5
      
      fc.assert(
        fc.property(
          userArb.filter(u => !u.is_breeder),
          (user: IUser) => {
            // Set up pet seeker user
            Object.defineProperty(mockAuthService, 'isBreeder', { value: false, writable: true });
            Object.defineProperty(mockAuthService, 'isPetSeeker', { value: true, writable: true });
            Object.defineProperty(mockAuthService, 'currentUser', { value: user, writable: true });
            mockAuthService.hasValidToken.and.returnValue(true);

            fixture.detectChanges();

            const compiled = fixture.nativeElement as HTMLElement;

            // Breeder-specific items should NOT be visible
            const petsLink = Array.from(compiled.querySelectorAll('a')).find(a => 
              a.textContent?.includes('Pets')
            );
            const breedingsLink = Array.from(compiled.querySelectorAll('a')).find(a => 
              a.textContent?.includes('Breedings')
            );

            expect(petsLink).toBeFalsy();
            expect(breedingsLink).toBeFalsy();

            // Messages should be visible for authenticated users
            const messagesLink = Array.from(compiled.querySelectorAll('a')).find(a => 
              a.textContent?.includes('Messages')
            );
            expect(messagesLink).toBeTruthy();

            // Dashboard should always be visible
            const dashboardLink = Array.from(compiled.querySelectorAll('a')).find(a => 
              a.textContent?.includes('Dashboard')
            );
            expect(dashboardLink).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show breeder-specific items for breeders', () => {
      // Feature: pet-seeker-accounts, Property 15: Navigation Rendering Based on User Type
      // Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5
      
      fc.assert(
        fc.property(
          userArb.filter(u => u.is_breeder),
          (user: IUser) => {
            // Set up breeder user
            Object.defineProperty(mockAuthService, 'isBreeder', { value: true, writable: true });
            Object.defineProperty(mockAuthService, 'isPetSeeker', { value: false, writable: true });
            Object.defineProperty(mockAuthService, 'currentUser', { value: user, writable: true });
            mockAuthService.hasValidToken.and.returnValue(true);

            fixture.detectChanges();

            const compiled = fixture.nativeElement as HTMLElement;

            // Breeder-specific items SHOULD be visible
            const petsLink = Array.from(compiled.querySelectorAll('a')).find(a => 
              a.textContent?.includes('Pets')
            );
            const breedingsLink = Array.from(compiled.querySelectorAll('a')).find(a => 
              a.textContent?.includes('Breedings')
            );

            expect(petsLink).toBeTruthy();
            expect(breedingsLink).toBeTruthy();

            // Messages should be visible for authenticated users
            const messagesLink = Array.from(compiled.querySelectorAll('a')).find(a => 
              a.textContent?.includes('Messages')
            );
            expect(messagesLink).toBeTruthy();

            // Dashboard should always be visible
            const dashboardLink = Array.from(compiled.querySelectorAll('a')).find(a => 
              a.textContent?.includes('Dashboard')
            );
            expect(dashboardLink).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always show messages for all authenticated users', () => {
      // Feature: pet-seeker-accounts, Property 15: Navigation Rendering Based on User Type
      // Validates: Requirements 10.3
      
      fc.assert(
        fc.property(
          userArb,
          (user: IUser) => {
            // Set up authenticated user (either type)
            Object.defineProperty(mockAuthService, 'isBreeder', { value: user.is_breeder, writable: true });
            Object.defineProperty(mockAuthService, 'isPetSeeker', { value: !user.is_breeder, writable: true });
            Object.defineProperty(mockAuthService, 'currentUser', { value: user, writable: true });
            mockAuthService.hasValidToken.and.returnValue(true);

            fixture.detectChanges();

            const compiled = fixture.nativeElement as HTMLElement;

            // Messages should ALWAYS be visible for authenticated users
            const messagesLink = Array.from(compiled.querySelectorAll('a')).find(a => 
              a.textContent?.includes('Messages')
            );
            expect(messagesLink).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show pet seeker-specific items only for pet seekers', () => {
      // Feature: pet-seeker-accounts, Property 15: Navigation Rendering Based on User Type
      // Validates: Requirements 10.4, 10.5
      
      fc.assert(
        fc.property(
          userArb,
          (user: IUser) => {
            // Set up user
            Object.defineProperty(mockAuthService, 'isBreeder', { value: user.is_breeder, writable: true });
            Object.defineProperty(mockAuthService, 'isPetSeeker', { value: !user.is_breeder, writable: true });
            Object.defineProperty(mockAuthService, 'currentUser', { value: user, writable: true });
            mockAuthService.hasValidToken.and.returnValue(true);

            fixture.detectChanges();

            const compiled = fixture.nativeElement as HTMLElement;

            // Favorites should only be visible for pet seekers
            const favoritesLink = Array.from(compiled.querySelectorAll('a')).find(a => 
              a.textContent?.includes('Favorites')
            );

            if (user.is_breeder) {
              expect(favoritesLink).toBeFalsy();
            } else {
              expect(favoritesLink).toBeTruthy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not show authenticated-only items for unauthenticated users', () => {
      // Feature: pet-seeker-accounts, Property 15: Navigation Rendering Based on User Type
      // Validates: Requirements 10.1, 10.2
      
      // Set up unauthenticated user
      Object.defineProperty(mockAuthService, 'isBreeder', { value: false, writable: true });
      Object.defineProperty(mockAuthService, 'isPetSeeker', { value: false, writable: true });
      Object.defineProperty(mockAuthService, 'currentUser', { value: null, writable: true });
      mockAuthService.hasValidToken.and.returnValue(false);

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;

      // Messages should NOT be visible for unauthenticated users
      const messagesLink = Array.from(compiled.querySelectorAll('a')).find(a => 
        a.textContent?.includes('Messages')
      );
      expect(messagesLink).toBeFalsy();

      // Breeder items should NOT be visible
      const petsLink = Array.from(compiled.querySelectorAll('a')).find(a => 
        a.textContent?.includes('Pets')
      );
      const breedingsLink = Array.from(compiled.querySelectorAll('a')).find(a => 
        a.textContent?.includes('Breedings')
      );
      expect(petsLink).toBeFalsy();
      expect(breedingsLink).toBeFalsy();

      // Pet seeker items should NOT be visible
      const favoritesLink = Array.from(compiled.querySelectorAll('a')).find(a => 
        a.textContent?.includes('Favorites')
      );
      expect(favoritesLink).toBeFalsy();
    });

    it('should maintain consistent navigation structure across user types', () => {
      // Feature: pet-seeker-accounts, Property 15: Navigation Rendering Based on User Type
      // Validates: Requirements 10.1, 10.2, 10.3
      
      fc.assert(
        fc.property(
          userArb,
          (user: IUser) => {
            // Set up user
            Object.defineProperty(mockAuthService, 'isBreeder', { value: user.is_breeder, writable: true });
            Object.defineProperty(mockAuthService, 'isPetSeeker', { value: !user.is_breeder, writable: true });
            Object.defineProperty(mockAuthService, 'currentUser', { value: user, writable: true });
            mockAuthService.hasValidToken.and.returnValue(true);

            fixture.detectChanges();

            const compiled = fixture.nativeElement as HTMLElement;
            const allLinks = compiled.querySelectorAll('a');

            // Should have at least dashboard and messages
            expect(allLinks.length).toBeGreaterThanOrEqual(2);

            // Dashboard should always be first
            const firstLink = allLinks[0];
            expect(firstLink.textContent).toContain('Dashboard');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
