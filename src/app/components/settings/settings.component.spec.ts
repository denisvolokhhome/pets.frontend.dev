import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SettingsComponent } from './settings.component';
import { RouterTestingModule } from '@angular/router/testing';
import { GeneralSettingsComponent } from './general-settings/general-settings.component';
import { BreedingLocationsComponent } from './breeding-locations/breeding-locations.component';
import { Location } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsComponent, GeneralSettingsComponent, BreedingLocationsComponent ],
      imports: [
        HttpClientTestingModule,
        ReactiveFormsModule,
        ToastrModule.forRoot(),
        RouterTestingModule.withRoutes([
          {
            path: 'settings',
            component: SettingsComponent,
            children: [
              { path: '', redirectTo: 'general', pathMatch: 'full' },
              { path: 'general', component: GeneralSettingsComponent },
              { path: 'locations', component: BreedingLocationsComponent }
            ]
          }
        ])
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Navigation', () => {
    it('should navigate to general settings when navigateToSection is called with general', async () => {
      await component.navigateToSection('general');
      expect(location.path()).toBe('/settings/general');
    });

    it('should navigate to locations when navigateToSection is called with locations', async () => {
      await component.navigateToSection('locations');
      expect(location.path()).toBe('/settings/locations');
    });

    it('should return true for isActive when on general route', async () => {
      await router.navigate(['/settings/general']);
      expect(component.isActive('general')).toBe(true);
      expect(component.isActive('locations')).toBe(false);
    });

    it('should return true for isActive when on locations route', async () => {
      await router.navigate(['/settings/locations']);
      expect(component.isActive('locations')).toBe(true);
      expect(component.isActive('general')).toBe(false);
    });

    it('should have general nav item with active class when on general route', async () => {
      await router.navigate(['/settings/general']);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const navItems = compiled.querySelectorAll('.nav-item');
      expect(navItems[0].classList.contains('active')).toBe(true);
      expect(navItems[1].classList.contains('active')).toBe(false);
    });

    it('should have locations nav item with active class when on locations route', async () => {
      await router.navigate(['/settings/locations']);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const navItems = compiled.querySelectorAll('.nav-item');
      expect(navItems[0].classList.contains('active')).toBe(false);
      expect(navItems[1].classList.contains('active')).toBe(true);
    });

    it('should navigate when clicking general nav button', async () => {
      await router.navigate(['/settings/locations']);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const generalButton = compiled.querySelectorAll('.nav-item')[0];
      generalButton.click();
      await fixture.whenStable();
      
      expect(location.path()).toBe('/settings/general');
    });

    it('should navigate when clicking locations nav button', async () => {
      await router.navigate(['/settings/general']);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      const locationsButton = compiled.querySelectorAll('.nav-item')[1];
      locationsButton.click();
      await fixture.whenStable();
      
      expect(location.path()).toBe('/settings/locations');
    });
  });
});
