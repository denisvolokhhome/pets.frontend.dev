import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Location } from '@angular/common';
import { TopMenuComponent } from './top-menu.component';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

describe('TopMenuComponent', () => {
  let component: TopMenuComponent;
  let fixture: ComponentFixture<TopMenuComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TopMenuComponent],
      imports: [RouterTestingModule],
      providers: [
        {
          provide: AuthService,
          useValue: {
            // Mock AuthService if needed
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

    it('should not show Logout link when not authenticated', () => {
      const logoutLink = compiled.querySelector('a[href="/logout"]');
      expect(logoutLink).toBeNull();
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

    it('should show Logout link when authenticated', () => {
      const logoutLink = compiled.querySelector('a[href="/logout"]');
      expect(logoutLink?.textContent).toContain('Logout');
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
});
