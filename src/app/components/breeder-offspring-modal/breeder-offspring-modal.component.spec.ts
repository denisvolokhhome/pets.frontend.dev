import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { BreederOffspringModalComponent } from './breeder-offspring-modal.component';
import { OffspringService, NearbyOffspring } from 'src/app/services/offspring.service';

describe('BreederOffspringModalComponent', () => {
  let fixture: ComponentFixture<BreederOffspringModalComponent>;
  let component: BreederOffspringModalComponent;
  let svc: jasmine.SpyObj<OffspringService>;

  const nearby = (id: string, extra: Partial<NearbyOffspring> = {}): NearbyOffspring => ({
    id, name: 'Pup ' + id, gender: 'Male', date_of_birth: '2026-09-01', status: 'Available',
    breeding_id: 1, user_id: 'other', breed_id: 3, created_at: '', age: '8 weeks',
    favorites_count: 0, breed: { id: 3, name: 'Poodle' }, images: [], price: 1200,
    breeder_name: 'Other Kennel', distance: 7, ...extra,
  } as any);

  function create(items: NearbyOffspring[]): void {
    svc.getNearbyOffsprings.and.returnValue(of(items));
    fixture = TestBed.createComponent(BreederOffspringModalComponent);
    component = fixture.componentInstance;
    component.breederId = 'b1';
    component.breederName = 'Happy Paws';
    component.center = { latitude: 30.2, longitude: -98.1 };
    component.radius = 40;
    component.breedIds = [3, 5];
    fixture.detectChanges();
  }

  beforeEach(async () => {
    svc = jasmine.createSpyObj('OffspringService', ['getNearbyOffsprings']);
    await TestBed.configureTestingModule({
      declarations: [BreederOffspringModalComponent],
      imports: [RouterTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [{ provide: OffspringService, useValue: svc }],
    }).compileComponents();
  });

  afterEach(() => { document.body.style.overflow = ''; });

  it('asks for nearby offspring around the search, excluding this breeder', () => {
    create([]);
    expect(svc.getNearbyOffsprings).toHaveBeenCalledWith({
      latitude: 30.2, longitude: -98.1, radius: 40, excludeBreederId: 'b1', breedIds: [3, 5], limit: 12,
    });
  });

  it('shows "More near you" with breeder name and distance', () => {
    create([nearby('o1'), nearby('o2', { breeder_name: 'Far Kennel', distance: 22 })]);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('More near you');
    const tiles = el.querySelectorAll('[data-testid="nearby-tile"]');
    expect(tiles.length).toBe(2);
    expect(tiles[1].textContent).toContain('Far Kennel');
    expect(tiles[1].textContent).toContain('22 mi');
    expect(tiles[0].getAttribute('href')).toContain('/offspring/o1');
  });

  it('hides the suggestions strip when there are none', () => {
    create([]);
    expect(fixture.nativeElement.querySelector('[data-testid="nearby-strip"]')).toBeNull();
  });

  it('skips suggestions when there is no search centre', () => {
    svc.getNearbyOffsprings.and.returnValue(of([]));
    fixture = TestBed.createComponent(BreederOffspringModalComponent);
    fixture.componentInstance.breederId = 'b1';
    fixture.componentInstance.center = null;
    fixture.detectChanges();
    expect(svc.getNearbyOffsprings).not.toHaveBeenCalled();
  });

  it('closes on Escape and restores page scroll', (done) => {
    create([]);
    expect(document.body.style.overflow).toBe('hidden');
    component.closed.subscribe(() => {
      expect(document.body.style.overflow).toBe('');
      done();
    });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  });
});
