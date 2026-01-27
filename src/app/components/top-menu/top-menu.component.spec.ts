import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Location } from '@angular/common';
import { TopMenuComponent } from './top-menu.component';
import { ProfileMenuComponent } from '../profile-menu/profile-menu.component';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('TopMenuComponent', () => {
  let component: TopMenuComponent;
  let fixture: ComponentFixture<TopMenuComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TopMenuComponent, ProfileMenuComponent],
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [
        {
          provide: AuthService,
          useValue: {
            IsLoggedIn: () => of({ email: 'test@example.com', name: 'Test User' }),
            LogoutUser: () => of({})
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TopMenuComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Branding', () => {
    it('should display "Breedly" as the brand name', () => {
      const brandElement = compiled.querySelector('.navbar-brand');
      expect(brandElement?.textContent).toContain('Breedly');
    });

    it('should not display "Pet Finder" anywhere', () => {
      const htmlContent = compiled.innerHTML;
      expect(htmlContent).not.toContain('Pet Finder');
    });
  });

  describe('Authentication State - Unauthenticated', () => {
    beforeEach(() => {
      localStorage.removeItem('id_token');
      fixture.detectChanges();
    });

    it('should show "Sign In" link when not authenticated', () => {
      const signInLink = compiled.querySelector('a[href="/login"]');
      expect(signInLink?.textContent).toContain('Sign In');
    });

    it('should show "Get Started" link when not authenticated', () => {
      const getStartedLink = compiled.querySelector('a[href="/register"]');
      expect(getStartedLink?.textContent).toContain('Get Started');
    });

    it('should not show Dashboard link when not authenticated', () => {
      const dashboardLink = compiled.querySelector('a[href="/dashboard"]');
      expect(dashboardLink).toBeNull();
    });

    it('should not show profile menu when not authenticated', () => {
      const profileMenu = compiled.querySelector('app-profile-menu');
      expect(profileMenu).toBeNull();
    });
  });

  describe('Authentication State - Authenticated', () => {
    beforeEach(() => {
      localStorage.setItem('id_token', 'mock-token');
      fixture.detectChanges();
    });

    it('should show Dashboard link when authenticated', () => {
      const dashboardLink = compiled.querySelector('a[href="/dashboard"]');
      expect(dashboardLink?.textContent).toContain('Dashboard');
    });

    it('should show profile menu when authenticated', () => {
      const profileMenu = compiled.querySelector('app-profile-menu');
      expect(profileMenu).toBeTruthy();
    });

    it('should not show Sign In link when authenticated', () => {
      const signInLink = compiled.querySelector('a[href="/login"]');
      expect(signInLink).toBeNull();
    });

    it('should not show Get Started link when authenticated', () => {
      const getStartedLink = compiled.querySelector('a[href="/register"]');
      expect(getStartedLink).toBeNull();
    });
  });

  describe('Navigation Structure', () => {
    it('should have a mobile menu toggle button', () => {
      const toggleButton = compiled.querySelector('.navbar-toggler');
      expect(toggleButton).toBeTruthy();
      expect(toggleButton?.getAttribute('data-bs-toggle')).toBe('collapse');
      expect(toggleButton?.getAttribute('data-bs-target')).toBe('#navbarNav');
    });

    it('should have proper ARIA labels for accessibility', () => {
      const toggleButton = compiled.querySelector('.navbar-toggler');
      expect(toggleButton?.getAttribute('aria-label')).toBe('Toggle navigation menu');
      expect(toggleButton?.getAttribute('aria-controls')).toBe('navbarNav');
    });

    it('should have Home link', () => {
      const homeLink = compiled.querySelector('a.nav-link[href="/"]');
      expect(homeLink?.textContent?.trim()).toContain('Home');
    });

    it('should apply primary color class to navigation', () => {
      const nav = compiled.querySelector('nav');
      expect(nav?.classList.contains('top-menu')).toBe(true);
    });
  });

  describe('Active Route Highlighting', () => {
    it('should mark Home as active when on root route', () => {
      component.route = '/';
      fixture.detectChanges();
      const homeLink = compiled.querySelector('a.nav-link[href="/"]');
      expect(homeLink?.classList.contains('active')).toBe(true);
    });

    it('should mark Home as active when route is empty string', () => {
      component.route = '';
      fixture.detectChanges();
      const homeLink = compiled.querySelector('a.nav-link[href="/"]');
      expect(homeLink?.classList.contains('active')).toBe(true);
    });
  });

  // Feature: user-profile-settings, Property 9: Profile Menu Visibility
  // Validates: Requirements 1.1, 1.5
  describe('Property 9: Profile Menu Visibility', () => {
    it('should show profile menu if and only if valid authentication token exists', () => {
      // Test multiple authentication states
      const authStates = [
        { token: 'valid-token-123', shouldShow: true },
        { token: 'another-valid-token', shouldShow: true },
        { token: null, shouldShow: false },
        { token: undefined, shouldShow: false },
        { token: '', shouldShow: false },
        { token: 'token-after-logout', shouldShow: true },
        { token: null, shouldShow: false }
      ];

      authStates.forEach((state, index) => {
        // Set authentication state
        if (state.token) {
          localStorage.setItem('id_token', state.token);
        } else {
          localStorage.removeItem('id_token');
        }

        // Trigger change detection
        fixture.detectChanges();

        // Check profile menu visibility
        const profileMenu = compiled.querySelector('app-profile-menu');
        
        if (state.shouldShow) {
          expect(profileMenu).toBeTruthy(
            `Profile menu should be visible when token is "${state.token}" (test case ${index + 1})`
          );
        } else {
          expect(profileMenu).toBeNull(
            `Profile menu should be hidden when token is ${state.token === null ? 'null' : state.token === undefined ? 'undefined' : '""'} (test case ${index + 1})`
          );
        }
      });
    });

    it('should maintain profile menu visibility across component re-renders when authenticated', () => {
      // Set authenticated state
      localStorage.setItem('id_token', 'persistent-token');
      
      // Multiple re-renders
      for (let i = 0; i < 5; i++) {
        fixture.detectChanges();
        const profileMenu = compiled.querySelector('app-profile-menu');
        expect(profileMenu).toBeTruthy(
          `Profile menu should remain visible after render ${i + 1}`
        );
      }
    });

    it('should hide profile menu immediately when token is removed', () => {
      // Start authenticated
      localStorage.setItem('id_token', 'initial-token');
      fixture.detectChanges();
      let profileMenu = compiled.querySelector('app-profile-menu');
      expect(profileMenu).toBeTruthy('Profile menu should be visible initially');

      // Remove token
      localStorage.removeItem('id_token');
      fixture.detectChanges();
      profileMenu = compiled.querySelector('app-profile-menu');
      expect(profileMenu).toBeNull('Profile menu should be hidden after token removal');
    });

    it('should show profile menu immediately when token is added', () => {
      // Start unauthenticated
      localStorage.removeItem('id_token');
      fixture.detectChanges();
      let profileMenu = compiled.querySelector('app-profile-menu');
      expect(profileMenu).toBeNull('Profile menu should be hidden initially');

      // Add token
      localStorage.setItem('id_token', 'new-token');
      fixture.detectChanges();
      profileMenu = compiled.querySelector('app-profile-menu');
      expect(profileMenu).toBeTruthy('Profile menu should be visible after token is added');
    });
  });
});
