import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA, SimpleChange } from '@angular/core';
import { of, throwError } from 'rxjs';

import { OffspringGroupsComponent } from './offspring-groups.component';
import { SearchService } from 'src/app/services/search.service';

describe('OffspringGroupsComponent', () => {
  let fixture: ComponentFixture<OffspringGroupsComponent>;
  let cmp: OffspringGroupsComponent;
  let svc: jasmine.SpyObj<SearchService>;

  const pup = (id: string, breed = 'Poodle') => ({ id, breed_id: 3, breed: { id: 3, name: breed } } as any);
  const group = (id: string, distance: number, pups = [pup(id + '-p1')]) => ({
    breeder_id: id, breeder_name: 'Kennel ' + id, thumbnail_url: null as string | null, distance,
    rating: 4.5, review_count: 2, available_count: pups.length, offsprings: pups,
  });

  function load(): void {
    cmp.center = { latitude: 30.2, longitude: -98.1 };
    cmp.radius = 40;
    cmp.breedId = 3;
    cmp.animalKind = 'dog';
    cmp.ngOnChanges({ center: new SimpleChange(null, cmp.center, true) });
    fixture.detectChanges();
  }

  beforeEach(async () => {
    sessionStorage.removeItem('offspring_groups_state');
    svc = jasmine.createSpyObj('SearchService', ['searchOffspringGroups']);
    await TestBed.configureTestingModule({
      declarations: [OffspringGroupsComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [{ provide: SearchService, useValue: svc }],
    }).compileComponents();
    fixture = TestBed.createComponent(OffspringGroupsComponent);
    cmp = fixture.componentInstance;
  });

  it('asks for the first page with the current search', () => {
    svc.searchOffspringGroups.and.returnValue(of({ groups: [], total_breeders: 0, limit: 10, offset: 0 }));
    load();
    expect(svc.searchOffspringGroups).toHaveBeenCalledWith({
      latitude: 30.2, longitude: -98.1, radius: 40, breedId: 3, animalKind: 'dog', limit: 10, offset: 0,
    });
  });

  it('renders a section per breeder with distance on every card', () => {
    svc.searchOffspringGroups.and.returnValue(of({
      groups: [group('a', 2, [pup('a1'), pup('a2')]), group('b', 9)], total_breeders: 2, limit: 10, offset: 0,
    }));
    load();
    const sections = fixture.nativeElement.querySelectorAll('[data-testid="offspring-group"]');
    expect(sections.length).toBe(2);
    const cards = sections[0].querySelectorAll('app-offspring-card');
    expect(cards.length).toBe(2);
    expect(cmp.groups[0].distance).toBe(2);
    expect(cmp.asBreeder(cmp.groups[0])).toEqual(jasmine.objectContaining({
      user_id: 'a', breeder_name: 'Kennel a', distance: 2, available_offspring_count: 2,
      available_breeds: [jasmine.objectContaining({ breed_id: 3, breed_name: 'Poodle', pet_count: 2 })],
    }));
  });

  it('loads more breeders and appends them', () => {
    svc.searchOffspringGroups.and.returnValues(
      of({ groups: [group('a', 2)], total_breeders: 2, limit: 10, offset: 0 }),
      of({ groups: [group('b', 9)], total_breeders: 2, limit: 10, offset: 1 }),
    );
    load();
    expect(cmp.hasMore).toBeTrue();
    cmp.loadMore();
    expect(svc.searchOffspringGroups.calls.mostRecent().args[0].offset).toBe(1);
    expect(cmp.groups.map(g => g.breeder_id)).toEqual(['a', 'b']);
    expect(cmp.hasMore).toBeFalse();
  });

  it('shows an empty state when nothing is available', () => {
    svc.searchOffspringGroups.and.returnValue(of({ groups: [], total_breeders: 0, limit: 10, offset: 0 }));
    load();
    expect(fixture.nativeElement.querySelector('[data-testid="offspring-groups-empty"]')).not.toBeNull();
  });

  it('asks for a search first when there is no centre', () => {
    cmp.center = null;
    cmp.ngOnChanges({});
    fixture.detectChanges();
    expect(svc.searchOffspringGroups).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Enter your ZIP code');
  });

  it('shows an error with retry when loading fails', () => {
    svc.searchOffspringGroups.and.returnValue(throwError(() => new Error('down')));
    load();
    expect(cmp.error).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="offspring-groups-retry"]')).not.toBeNull();
  });

  it('restores loaded breeders for the same search instead of refetching (Back from a puppy)', () => {
    svc.searchOffspringGroups.and.returnValues(
      of({ groups: [group('a', 2)], total_breeders: 2, limit: 10, offset: 0 }),
      of({ groups: [group('b', 9)], total_breeders: 2, limit: 10, offset: 1 }),
    );
    load();
    cmp.loadMore();
    cmp.ngOnDestroy();

    const again = TestBed.createComponent(OffspringGroupsComponent).componentInstance;
    again.center = { latitude: 30.2, longitude: -98.1 };
    again.radius = 40; again.breedId = 3; again.animalKind = 'dog';
    again.ngOnChanges({});
    expect(svc.searchOffspringGroups).toHaveBeenCalledTimes(2);
    expect(again.groups.map(g => g.breeder_id)).toEqual(['a', 'b']);
  });

  it('fetches again for a new search', () => {
    svc.searchOffspringGroups.and.returnValue(of({ groups: [group('a', 2)], total_breeders: 1, limit: 10, offset: 0 }));
    load();
    cmp.searchVersion = 2;
    cmp.ngOnChanges({});
    expect(svc.searchOffspringGroups).toHaveBeenCalledTimes(2);
  });
});
