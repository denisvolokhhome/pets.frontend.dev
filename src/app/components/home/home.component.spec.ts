import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomeComponent],
      imports: [RouterTestingModule, CommonModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  it('should default to the breeder flow', () => {
    expect(component.selectedFlow).toBe('breeder');
  });

  it('should have 4 feature cards', () => {
    expect(component.features.length).toBe(4);
  });

  it('should include a Pet Services feature card', () => {
    const titles = component.features.map(f => f.title);
    expect(titles).toContain('Pet Services');
  });

  // ── selectFlow ────────────────────────────────────────────────────────────

  it('selectFlow("petSeeker") switches to pet seeker flow', () => {
    component.selectFlow('petSeeker');
    expect(component.selectedFlow).toBe('petSeeker');
  });

  it('selectFlow("serviceProvider") switches to service provider flow', () => {
    component.selectFlow('serviceProvider');
    expect(component.selectedFlow).toBe('serviceProvider');
  });

  it('selectFlow("breeder") switches back to breeder flow', () => {
    component.selectFlow('serviceProvider');
    component.selectFlow('breeder');
    expect(component.selectedFlow).toBe('breeder');
  });

  // ── currentSteps ──────────────────────────────────────────────────────────

  it('currentSteps returns breederSteps when flow is breeder', () => {
    component.selectFlow('breeder');
    expect(component.currentSteps).toBe(component.breederSteps);
  });

  it('currentSteps returns petSeekerSteps when flow is petSeeker', () => {
    component.selectFlow('petSeeker');
    expect(component.currentSteps).toBe(component.petSeekerSteps);
  });

  it('currentSteps returns serviceProviderSteps when flow is serviceProvider', () => {
    component.selectFlow('serviceProvider');
    expect(component.currentSteps).toBe(component.serviceProviderSteps);
  });

  it('serviceProviderSteps has 4 steps', () => {
    expect(component.serviceProviderSteps.length).toBe(4);
  });

  it('serviceProviderSteps steps are numbered 1 through 4', () => {
    const numbers = component.serviceProviderSteps.map(s => s.number);
    expect(numbers).toEqual([1, 2, 3, 4]);
  });

  it('breederSteps has 4 steps', () => {
    expect(component.breederSteps.length).toBe(4);
  });

  it('petSeekerSteps has 4 steps', () => {
    expect(component.petSeekerSteps.length).toBe(4);
  });

  // ── Navigation ────────────────────────────────────────────────────────────

  it('navigateToBreederRegister navigates to /register', () => {
    const spy = spyOn(router, 'navigate');
    component.navigateToBreederRegister();
    expect(spy).toHaveBeenCalledWith(['/register']);
  });

  it('navigateToPetSeekerRegister navigates to /register/pet-seeker', () => {
    const spy = spyOn(router, 'navigate');
    component.navigateToPetSeekerRegister();
    expect(spy).toHaveBeenCalledWith(['/register/pet-seeker']);
  });

  it('navigateToServiceProviderRegister navigates to /register/service-provider', () => {
    const spy = spyOn(router, 'navigate');
    component.navigateToServiceProviderRegister();
    expect(spy).toHaveBeenCalledWith(['/register/service-provider']);
  });

  it('navigateToSearchPets navigates to /search-pets', () => {
    const spy = spyOn(router, 'navigate');
    component.navigateToSearchPets();
    expect(spy).toHaveBeenCalledWith(['/search-pets']);
  });
});
