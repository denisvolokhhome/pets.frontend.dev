import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of } from 'rxjs';

import { BreederCardComponent } from './breeder-card.component';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { ReviewService } from 'src/app/services/review.service';

describe('BreederCardComponent contact after sign-in', () => {
  let fixture: ComponentFixture<BreederCardComponent>;
  let component: BreederCardComponent;
  let user$: BehaviorSubject<any>;
  let router: Router;

  beforeEach(async () => {
    user$ = new BehaviorSubject<any>(null);
    const auth = { currentUser$: user$.asObservable(), get isBreeder() { return !!user$.value?.is_breeder; } };
    await TestBed.configureTestingModule({
      declarations: [BreederCardComponent],
      imports: [RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: DataService, useValue: {} },
        { provide: ReviewService, useValue: {} },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(BreederCardComponent);
    component = fixture.componentInstance;
    component.breeder = {
      location_id: 1, user_id: 'b1', breeder_name: 'Quiet Creek', latitude: 0, longitude: 0, distance: 3,
      available_breeds: [], thumbnail_url: null, location_description: null, rating: null, review_count: 0,
      available_offspring_count: 0,
    };
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    localStorage.removeItem('id_token');
    fixture.detectChanges();
  });

  it('opens the conversation once a pet seeker signs in from the prompt', () => {
    component.onContactBreeder(new Event('click'));
    expect(component.showGuestModal).toBeTrue();

    component.onGuestAuthSuccess();
    expect(router.navigate).not.toHaveBeenCalled();  // user not loaded yet

    user$.next({ is_breeder: false, account_type: 'pet_seeker' });
    expect(router.navigate).toHaveBeenCalledWith(['/messages/new'], {
      queryParams: { breederId: 'b1', breederName: 'Quiet Creek' },
    });
  });

  it('stays on the map when the account that signed in is a breeder', () => {
    component.onContactBreeder(new Event('click'));
    component.onGuestAuthSuccess();
    user$.next({ is_breeder: true, account_type: 'breeder' });
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
