import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ProfileMenuComponent } from './profile-menu.component';
import { AuthService } from 'src/app/services/auth.service';
import { ToastrService } from 'ngx-toastr';

describe('ProfileMenuComponent', () => {
  let component: ProfileMenuComponent;
  let fixture: ComponentFixture<ProfileMenuComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    // Create mock services
    mockAuthService = jasmine.createSpyObj('AuthService', ['IsLoggedIn', 'LogoutUser']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    const toastrServiceSpy = jasmine.createSpyObj('ToastrService', ['success', 'error', 'info', 'warning']);

    await TestBed.configureTestingModule({
      declarations: [ ProfileMenuComponent ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ToastrService, useValue: toastrServiceSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileMenuComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Menu Toggle Functionality', () => {
    it('should toggle menu open state when toggleMenu is called', () => {
      expect(component.isOpen).toBe(false);
      
      component.toggleMenu();
      expect(component.isOpen).toBe(true);
      
      component.toggleMenu();
      expect(component.isOpen).toBe(false);
    });

    it('should close menu when clicking outside', () => {
      component.isOpen = true;
      
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: document.createElement('div'), enumerable: true });
      
      component.onDocumentClick(event);
      expect(component.isOpen).toBe(false);
    });

    it('should not close menu when clicking inside', () => {
      component.isOpen = true;
      
      const container = document.createElement('div');
      container.classList.add('profile-menu-container');
      const target = document.createElement('button');
      container.appendChild(target);
      
      const event = new MouseEvent('click');
      Object.defineProperty(event, 'target', { value: target, enumerable: true });
      
      spyOn(target, 'closest').and.returnValue(container);
      
      component.onDocumentClick(event);
      expect(component.isOpen).toBe(true);
    });
  });

  describe('Navigation to Settings', () => {
    it('should navigate to settings page when navigateToSettings is called', () => {
      component.navigateToSettings();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/settings']);
    });

    it('should close menu after navigating to settings', () => {
      component.isOpen = true;
      
      component.navigateToSettings();
      
      expect(component.isOpen).toBe(false);
    });
  });

  describe('Logout Functionality', () => {
    it('should call logout service and navigate to login on successful logout', () => {
      mockAuthService.LogoutUser.and.returnValue(of({}));
      
      component.logout();
      
      expect(mockAuthService.LogoutUser).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should navigate to login even if logout service fails', () => {
      mockAuthService.LogoutUser.and.returnValue(throwError(() => new Error('Logout failed')));
      
      component.logout();
      
      expect(mockAuthService.LogoutUser).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('User Profile Loading', () => {
    it('should load user profile on init', () => {
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };
      mockAuthService.IsLoggedIn.and.returnValue(of(mockUser));
      
      component.ngOnInit();
      
      expect(mockAuthService.IsLoggedIn).toHaveBeenCalled();
      expect(component.user).toEqual(mockUser);
    });

    it('should handle error when loading user profile fails', () => {
      mockAuthService.IsLoggedIn.and.returnValue(throwError(() => new Error('Failed to load')));
      spyOn(console, 'error');
      
      component.ngOnInit();
      
      expect(mockAuthService.IsLoggedIn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Failed to load user profile', jasmine.any(Error));
    });
  });
});
