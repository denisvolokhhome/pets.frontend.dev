import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from 'src/app/services/auth.service';
import { IUser } from 'src/app/models/user';
import * as fc from 'fast-check';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('DashboardComponent - Property-Based Tests', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    // Create mock auth service
    mockAuthService = jasmine.createSpyObj('AuthService', ['IsLoggedIn'], {
      isBreeder: false,
      isPetSeeker: false,
      currentUser: null
    });
    mockAuthService.IsLoggedIn.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ],
      schemas: [NO_ERRORS_SCHEMA] // Allow unknown elements and attributes
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  describe('Property 6: Dashboard Content Based on User Type', () => {
    // Generator for user data
    const userArb = fc.record({
      id: fc.uuid(),
      email: fc.emailAddress(),
      name: fc.option(fc.string({ minLength: 3, maxLength: 50 }), { nil: undefined }),
      is_breeder: fc.boolean(),
      is_active: fc.constant(true),
      is_verified: fc.constant(true)
    });

    it('should display breeder-specific features only for breeders', () => {
      // Feature: pet-seeker-accounts, Property 6: Dashboard Content Based on User Type
      // Validates: Requirements 5.1, 5.3, 5.4, 5.5
      
      fc.assert(
        fc.property(
          userArb.filter(u => u.is_breeder),
          (user: IUser) => {
            // Set up breeder user
            Object.defineProperty(mockAuthService, 'isBreeder', { value: true, writable: true, configurable: true });
            Object.defineProperty(mockAuthService, 'isPetSeeker', { value: false, writable: true, configurable: true });
            Object.defineProperty(mockAuthService, 'currentUser', { value: user, writable: true, configurable: true });

            fixture.detectChanges();

            const compiled = fixture.nativeElement as HTMLElement;

            // Should display breeder dashboard
            const breederDashboard = compiled.querySelector('.breeder-dashboard');
            expect(breederDashboard).toBeTruthy();

            // Should NOT display pet seeker dashboard
            const petSeekerDashboard = compiled.querySelector('.pet-seeker-dashboard');
            expect(petSeekerDashboard).toBeFalsy();

            // Should display breeder-specific quick actions
            const quickActions = compiled.querySelectorAll('.breeder-dashboard a');
            const actionTexts = Array.from(quickActions).map(a => a.textContent?.trim() || '');
            
            // Should have breeder-specific actions
            expect(actionTexts.some(text => text.includes('Add New Pet'))).toBe(true);
            expect(actionTexts.some(text => text.includes('Manage Breedings'))).toBe(true);

            // Should display messages section (available for all authenticated users)
            const messagesSection = compiled.querySelector('app-messages-list');
            expect(messagesSection).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display pet seeker-specific features only for pet seekers', () => {
      // Feature: pet-seeker-accounts, Property 6: Dashboard Content Based on User Type
      // Validates: Requirements 5.1, 5.3, 5.4, 5.5
      
      fc.assert(
        fc.property(
          userArb.filter(u => !u.is_breeder),
          (user: IUser) => {
            // Set up pet seeker user
            Object.defineProperty(mockAuthService, 'isBreeder', { value: false, writable: true, configurable: true });
            Object.defineProperty(mockAuthService, 'isPetSeeker', { value: true, writable: true, configurable: true });
            Object.defineProperty(mockAuthService, 'currentUser', { value: user, writable: true, configurable: true });

            fixture.detectChanges();

            const compiled = fixture.nativeElement as HTMLElement;

            // Should display pet seeker dashboard
            const petSeekerDashboard = compiled.querySelector('.pet-seeker-dashboard');
            expect(petSeekerDashboard).toBeTruthy();

            // Should NOT display breeder dashboard
            const breederDashboard = compiled.querySelector('.breeder-dashboard');
            expect(breederDashboard).toBeFalsy();

            // Should display pet seeker-specific quick actions
            const quickActions = compiled.querySelectorAll('.pet-seeker-dashboard a');
            const actionTexts = Array.from(quickActions).map(a => a.textContent?.trim() || '');
            
            // Should have pet seeker-specific actions
            expect(actionTexts.some(text => text.includes('Search Pets'))).toBe(true);

            // Should NOT have breeder-specific actions
            expect(actionTexts.some(text => text.includes('Add New Pet'))).toBe(false);
            expect(actionTexts.some(text => text.includes('Manage Breedings'))).toBe(false);

            // Should display messages section (available for all authenticated users)
            const messagesSection = compiled.querySelector('app-messages-list');
            expect(messagesSection).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should hide breeder-specific menu items for pet seekers', () => {
      // Feature: pet-seeker-accounts, Property 6: Dashboard Content Based on User Type
      // Validates: Requirements 5.3
      
      fc.assert(
        fc.property(
          userArb.filter(u => !u.is_breeder),
          (user: IUser) => {
            // Set up pet seeker user
            Object.defineProperty(mockAuthService, 'isBreeder', { value: false, writable: true, configurable: true });
            Object.defineProperty(mockAuthService, 'isPetSeeker', { value: true, writable: true, configurable: true });
            Object.defineProperty(mockAuthService, 'currentUser', { value: user, writable: true, configurable: true });

            fixture.detectChanges();

            const compiled = fixture.nativeElement as HTMLElement;

            // Should NOT display breeder-specific items
            const allText = compiled.textContent || '';
            
            // Breeder-specific terms should not appear
            expect(allText.includes('My Pets')).toBe(false);
            expect(allText.includes('Active Breedings')).toBe(false);
            expect(allText.includes('Manage Breedings')).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always include messages component for both user types', () => {
      // Feature: pet-seeker-accounts, Property 6: Dashboard Content Based on User Type
      // Validates: Requirements 5.2, 5.4
      
      fc.assert(
        fc.property(
          userArb,
          (user: IUser) => {
            // Set up user (either type)
            Object.defineProperty(mockAuthService, 'isBreeder', { value: user.is_breeder, writable: true, configurable: true });
            Object.defineProperty(mockAuthService, 'isPetSeeker', { value: !user.is_breeder, writable: true, configurable: true });
            Object.defineProperty(mockAuthService, 'currentUser', { value: user, writable: true, configurable: true });

            fixture.detectChanges();

            const compiled = fixture.nativeElement as HTMLElement;

            // Messages component should ALWAYS be present
            const messagesSection = compiled.querySelector('app-messages-list');
            expect(messagesSection).toBeTruthy();

            // Messages text should be visible
            const allText = compiled.textContent || '';
            expect(allText.includes('Messages')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display user name or email in dashboard header', () => {
      // Feature: pet-seeker-accounts, Property 6: Dashboard Content Based on User Type
      // Validates: Requirements 5.1, 5.5
      
      fc.assert(
        fc.property(
          userArb,
          (user: IUser) => {
            // Set up user
            Object.defineProperty(mockAuthService, 'isBreeder', { value: user.is_breeder, writable: true, configurable: true });
            Object.defineProperty(mockAuthService, 'isPetSeeker', { value: !user.is_breeder, writable: true, configurable: true });
            Object.defineProperty(mockAuthService, 'currentUser', { value: user, writable: true, configurable: true });

            fixture.detectChanges();

            const compiled = fixture.nativeElement as HTMLElement;
            const allText = compiled.textContent || '';

            // Should display either name or email
            if (user.name) {
              expect(allText.includes(user.name)).toBe(true);
            } else {
              expect(allText.includes(user.email)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render different dashboard titles based on user type', () => {
      // Feature: pet-seeker-accounts, Property 6: Dashboard Content Based on User Type
      // Validates: Requirements 5.1
      
      fc.assert(
        fc.property(
          userArb,
          (user: IUser) => {
            // Set up user
            Object.defineProperty(mockAuthService, 'isBreeder', { value: user.is_breeder, writable: true, configurable: true });
            Object.defineProperty(mockAuthService, 'isPetSeeker', { value: !user.is_breeder, writable: true, configurable: true });
            Object.defineProperty(mockAuthService, 'currentUser', { value: user, writable: true, configurable: true });

            fixture.detectChanges();

            const compiled = fixture.nativeElement as HTMLElement;
            const allText = compiled.textContent || '';

            if (user.is_breeder) {
              expect(allText.includes('Breeder Dashboard')).toBe(true);
              expect(allText.includes('Pet Seeker Dashboard')).toBe(false);
            } else {
              expect(allText.includes('Pet Seeker Dashboard')).toBe(true);
              expect(allText.includes('Breeder Dashboard')).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show loading state when user is not loaded', () => {
      // Feature: pet-seeker-accounts, Property 6: Dashboard Content Based on User Type
      // Validates: Requirements 5.1
      
      // Set up no user
      Object.defineProperty(mockAuthService, 'isBreeder', { value: false, writable: true, configurable: true });
      Object.defineProperty(mockAuthService, 'isPetSeeker', { value: false, writable: true, configurable: true });
      Object.defineProperty(mockAuthService, 'currentUser', { value: null, writable: true, configurable: true });

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const allText = compiled.textContent || '';

      // Should show loading message
      expect(allText.includes('Loading dashboard')).toBe(true);

      // Should NOT show either dashboard
      const breederDashboard = compiled.querySelector('.breeder-dashboard');
      const petSeekerDashboard = compiled.querySelector('.pet-seeker-dashboard');
      expect(breederDashboard).toBeFalsy();
      expect(petSeekerDashboard).toBeFalsy();
    });
  });
});
