import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: Router;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [HomeComponent],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Navigation', () => {
    it('should navigate to /register when navigateToBreederRegister is called', () => {
      component.navigateToBreederRegister();
      expect(router.navigate).toHaveBeenCalledWith(['/register']);
    });

    it('should navigate to /register/pet-seeker when navigateToPetSeekerRegister is called', () => {
      component.navigateToPetSeekerRegister();
      expect(router.navigate).toHaveBeenCalledWith(['/register/pet-seeker']);
    });

    it('should navigate to /pets when navigateToPets is called', () => {
      component.navigateToPets();
      expect(router.navigate).toHaveBeenCalledWith(['/pets']);
    });

    it('should navigate to /search-pets when navigateToSearchPets is called', () => {
      component.navigateToSearchPets();
      expect(router.navigate).toHaveBeenCalledWith(['/search-pets']);
    });
  });

  describe('Flow Selection', () => {
    it('should default to breeder flow', () => {
      expect(component.selectedFlow).toBe('breeder');
    });

    it('should switch to petSeeker flow', () => {
      component.selectFlow('petSeeker');
      expect(component.selectedFlow).toBe('petSeeker');
    });

    it('should return breeder steps when breeder flow is selected', () => {
      component.selectFlow('breeder');
      expect(component.currentSteps).toBe(component.breederSteps);
    });

    it('should return pet seeker steps when petSeeker flow is selected', () => {
      component.selectFlow('petSeeker');
      expect(component.currentSteps).toBe(component.petSeekerSteps);
    });
  });

  describe('Account Type Selection - Requirements 2.1, 2.4, 2.5', () => {
    it('should display breeder registration button in hero section', () => {
      const compiled = fixture.nativeElement;
      const breederButton = compiled.querySelector('.cta-breeder');
      expect(breederButton).toBeTruthy();
      expect(breederButton.textContent).toContain('Register as Breeder');
    });

    it('should display pet seeker registration button in hero section', () => {
      const compiled = fixture.nativeElement;
      const petSeekerButton = compiled.querySelector('.cta-pet-seeker');
      expect(petSeekerButton).toBeTruthy();
      expect(petSeekerButton.textContent).toContain('Register as Pet Seeker');
    });

    it('should navigate to breeder registration when breeder button is clicked', () => {
      const compiled = fixture.nativeElement;
      const breederButton = compiled.querySelector('.cta-breeder');
      breederButton.click();
      expect(router.navigate).toHaveBeenCalledWith(['/register']);
    });

    it('should navigate to pet seeker registration when pet seeker button is clicked', () => {
      const compiled = fixture.nativeElement;
      const petSeekerButton = compiled.querySelector('.cta-pet-seeker');
      petSeekerButton.click();
      expect(router.navigate).toHaveBeenCalledWith(['/register/pet-seeker']);
    });

    it('should display both registration options in CTA footer section', () => {
      const compiled = fixture.nativeElement;
      const footerButtons = compiled.querySelectorAll('.cta-footer-button');
      expect(footerButtons.length).toBe(2);
      expect(footerButtons[0].textContent).toContain('Register as Breeder');
      expect(footerButtons[1].textContent).toContain('Register as Pet Seeker');
    });
  });
});
