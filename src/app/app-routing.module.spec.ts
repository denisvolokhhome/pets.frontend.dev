import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { AppRoutingModule } from './app-routing.module';
import { SettingsComponent } from './components/settings/settings.component';
import { GeneralSettingsComponent } from './components/settings/general-settings/general-settings.component';
import { BreedingLocationsComponent } from './components/settings/breeding-locations/breeding-locations.component';
import { AuthGuard } from './guard/auth.guard';
import { AuthService } from './services/auth.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ToastrModule } from 'ngx-toastr';

describe('AppRoutingModule - Settings Routes', () => {
  let router: Router;
  let location: Location;
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        SettingsComponent,
        GeneralSettingsComponent,
        BreedingLocationsComponent
      ],
      imports: [
        HttpClientTestingModule,
        ToastrModule.forRoot(),
        RouterTestingModule.withRoutes([
          {
            path: 'settings',
            component: SettingsComponent,
            canActivate: [AuthGuard],
            children: [
              { path: '', redirectTo: 'general', pathMatch: 'full' },
              { path: 'general', component: GeneralSettingsComponent },
              { path: 'locations', component: BreedingLocationsComponent }
            ]
          },
          { path: 'login', component: SettingsComponent } // Mock login route
        ])
      ],
      providers: [AuthGuard, AuthService]
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    authService = TestBed.inject(AuthService);
  });

  describe('Route Guards', () => {
    it('should protect settings route with AuthGuard', () => {
      const settingsRoute = router.config.find(route => route.path === 'settings');
      expect(settingsRoute?.canActivate).toContain(AuthGuard);
    });

    it('should allow navigation to settings when authenticated', async () => {
      spyOn(authService, 'IsLoggedIn').and.returnValue(of({ id: '123', email: 'test@test.com' }));
      
      const canActivate = await router.navigate(['/settings']);
      expect(canActivate).toBe(true);
      expect(location.path()).toBe('/settings/general');
    });

    it('should prevent navigation to settings when not authenticated', async () => {
      spyOn(authService, 'IsLoggedIn').and.returnValue(of(null));
      
      await router.navigate(['/settings']);
      
      // Should redirect to login
      expect(location.path()).toBe('/login');
    });
  });

  describe('Child Routes', () => {
    beforeEach(() => {
      spyOn(authService, 'IsLoggedIn').and.returnValue(of({ id: '123', email: 'test@test.com' }));
    });

    it('should have child routes for general and locations', () => {
      const settingsRoute = router.config.find(route => route.path === 'settings');
      expect(settingsRoute?.children).toBeDefined();
      expect(settingsRoute?.children?.length).toBeGreaterThan(0);
      
      const generalRoute = settingsRoute?.children?.find(child => child.path === 'general');
      const locationsRoute = settingsRoute?.children?.find(child => child.path === 'locations');
      
      expect(generalRoute).toBeDefined();
      expect(locationsRoute).toBeDefined();
    });

    it('should redirect empty path to general', () => {
      const settingsRoute = router.config.find(route => route.path === 'settings');
      const emptyRoute = settingsRoute?.children?.find(child => child.path === '');
      
      expect(emptyRoute?.redirectTo).toBe('general');
      expect(emptyRoute?.pathMatch).toBe('full');
    });

    it('should navigate to general settings by default', async () => {
      await router.navigate(['/settings']);
      expect(location.path()).toBe('/settings/general');
    });

    it('should navigate to general settings child route', async () => {
      await router.navigate(['/settings/general']);
      expect(location.path()).toBe('/settings/general');
    });

    it('should navigate to locations child route', async () => {
      await router.navigate(['/settings/locations']);
      expect(location.path()).toBe('/settings/locations');
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      spyOn(authService, 'IsLoggedIn').and.returnValue(of({ id: '123', email: 'test@test.com' }));
    });

    it('should navigate from general to locations', async () => {
      await router.navigate(['/settings/general']);
      expect(location.path()).toBe('/settings/general');
      
      await router.navigate(['/settings/locations']);
      expect(location.path()).toBe('/settings/locations');
    });

    it('should navigate from locations to general', async () => {
      await router.navigate(['/settings/locations']);
      expect(location.path()).toBe('/settings/locations');
      
      await router.navigate(['/settings/general']);
      expect(location.path()).toBe('/settings/general');
    });

    it('should maintain settings parent route when navigating between children', async () => {
      await router.navigate(['/settings/general']);
      expect(location.path()).toContain('/settings');
      
      await router.navigate(['/settings/locations']);
      expect(location.path()).toContain('/settings');
    });
  });
});
