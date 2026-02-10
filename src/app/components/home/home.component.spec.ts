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
    it('should navigate to /register when navigateToRegister is called', () => {
      component.navigateToRegister();
      expect(router.navigate).toHaveBeenCalledWith(['/register']);
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
});
