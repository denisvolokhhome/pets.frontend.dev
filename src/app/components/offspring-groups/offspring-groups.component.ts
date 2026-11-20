import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { BreederOffspringGroup, BreederSearchResult, Coordinates } from 'src/app/models/search';
import { SearchService } from 'src/app/services/search.service';

/**
 * Map search "Offspring" view: available offspring near the search centre,
 * grouped by breeder (nearest first), a page of breeders at a time.
 */
@Component({
  standalone: false,
  selector: 'app-offspring-groups',
  templateUrl: './offspring-groups.component.html',
  styleUrls: ['./offspring-groups.component.css']
})
export class OffspringGroupsComponent implements OnChanges, OnDestroy {
  @Input() center: Coordinates | null = null;
  @Input() radius = 40;
  @Input() breedId: number | null = null;
  @Input() animalKind: string | null = null;
  /** Bumped by the search page on every search, so a repeat search reloads */
  @Input() searchVersion = 0;

  readonly PAGE_SIZE = 10;

  groups: BreederOffspringGroup[] = [];
  totalBreeders = 0;
  isLoading = false;
  isLoadingMore = false;
  error: string | null = null;
  private sub?: Subscription;

  constructor(private searchService: SearchService, private cdr: ChangeDetectorRef) {}

  ngOnChanges(_: SimpleChanges): void {
    this.reload();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get hasMore(): boolean {
    return this.groups.length < this.totalBreeders;
  }

  get totalOffspring(): number {
    return this.groups.reduce((n, g) => n + g.offsprings.length, 0);
  }

  reload(): void {
    this.sub?.unsubscribe();  // a newer search wins over a slower older one
    this.groups = [];
    this.totalBreeders = 0;
    this.error = null;
    if (!this.center) return;
    this.isLoading = true;
    this.fetch(0);
  }

  loadMore(): void {
    if (!this.hasMore || this.isLoadingMore || !this.center) return;
    this.isLoadingMore = true;
    this.fetch(this.groups.length);
  }

  private fetch(offset: number): void {
    this.sub = this.searchService.searchOffspringGroups({
      latitude: this.center!.latitude,
      longitude: this.center!.longitude,
      radius: this.radius,
      breedId: this.breedId,
      animalKind: this.animalKind,
      limit: this.PAGE_SIZE,
      offset,
    }).subscribe({
      next: res => {
        this.groups = offset === 0 ? res.groups : [...this.groups, ...res.groups];
        this.totalBreeders = res.total_breeders;
        this.isLoading = this.isLoadingMore = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Could not load offspring. Please try again.';
        this.isLoading = this.isLoadingMore = false;
        this.cdr.detectChanges();
      }
    });
  }

  /** Adapt a group to the breeder card used as its header. */
  asBreeder(g: BreederOffspringGroup): BreederSearchResult {
    const breeds = new Map<number, { breed_id: number; breed_name: string; breed_kind: string; pet_count: number }>();
    for (const o of g.offsprings) {
      if (!o.breed_id) continue;
      const b = breeds.get(o.breed_id) ?? {
        breed_id: o.breed_id, breed_name: o.breed?.name ?? '', breed_kind: (o.breed as any)?.kind ?? '', pet_count: 0,
      };
      b.pet_count++;
      breeds.set(o.breed_id, b);
    }
    return {
      location_id: 0,
      user_id: g.breeder_id,
      breeder_name: g.breeder_name,
      latitude: 0,
      longitude: 0,
      distance: g.distance,
      available_breeds: [...breeds.values()],
      thumbnail_url: g.thumbnail_url,
      location_description: null,
      rating: g.rating,
      review_count: g.review_count,
      available_offspring_count: g.available_count,
    };
  }

  trackByBreeder(_: number, g: BreederOffspringGroup): string {
    return g.breeder_id;
  }

  trackByOffspring(_: number, o: { id: string }): string {
    return o.id;
  }
}
