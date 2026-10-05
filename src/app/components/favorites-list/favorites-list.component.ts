import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FavoriteService, OffspringFavorite } from 'src/app/services/favorite.service';
import { OffspringRead } from 'src/app/services/offspring.service';
import { ToastService } from 'src/app/services/toast.service';
import { PageHeaderConfig } from '../page-header/page-header.component';
import { DataService } from 'src/app/services/data.service';

@Component({
  standalone: false,
  selector: 'app-favorites-list',
  templateUrl: './favorites-list.component.html',
  styleUrls: ['./favorites-list.component.css']
})
export class FavoritesListComponent implements OnInit {
  
  headerConfig: PageHeaderConfig = {
    title: 'My Favorites',
    icon: 'bi bi-heart-fill',
    iconColor: '#ec4899',
    showLayoutSwitcher: false,
    showSearch: true,
    searchPlaceholder: 'Search favorites...',
    showActionButton: false
  };
  
  searchTerm: string = '';
  favorites: OffspringFavorite[] = [];
  offsprings: OffspringRead[] = [];
  isLoading: boolean = true;
  
  // Pagination
  totalFavorites: number = 0;
  currentPage: number = 0;
  pageSize: number = 12;

  constructor(
    private router: Router,
    private favoriteService: FavoriteService,
    private toastr: ToastService,
    private cdr: ChangeDetectorRef,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.loadFavorites();
  }

  /**
   * Load favorites with pagination
   */
  loadFavorites(): void {
    this.isLoading = true;
    const offset = this.currentPage * this.pageSize;

    this.favoriteService.getFavorites(offset, this.pageSize).subscribe({
      next: (favorites) => {
        this.favorites = favorites;
        this.totalFavorites = favorites.length; // Note: This is just the current page count
        
        // Extract offspring data from favorites
        this.offsprings = this.favorites
          .filter(f => f.offspring)
          .map(f => {
            const offspring = f.offspring as OffspringRead;
            // Mark as favorited since it's in the favorites list
            offspring.is_favorited = true;
            return offspring;
          });
        this.loadBreederNames();
        
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading favorites:', error);
        this.toastr.error(error.message || 'Failed to load favorites', 'Error');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Handle favorite toggle (remove from favorites)
   */
  onFavoriteToggled(offspringId: string): void {
    // Remove from local list immediately for better UX
    this.offsprings = this.offsprings.filter(o => o.id !== offspringId);
    this.favorites = this.favorites.filter(f => f.offspring_id !== offspringId);
    this.totalFavorites--;
    
    this.toastr.success('Removed from favorites', 'Success');
    this.cdr.detectChanges();
  }

  /**
   * Navigate to breeder profile
   */
  viewBreederProfile(breederId: string): void {
    if (breederId) {
      this.router.navigate(['/breeder', breederId, 'offsprings']);
    }
  }

  /**
   * Handle page change
   */
  onPageChange(event: any): void {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.loadFavorites();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Navigate to search page
   */
  browseOffsprings(): void {
    this.router.navigate(['/search']);
  }

  /**
   * Check if there are favorites to display
   */
  hasFavorites(): boolean {
    return this.offsprings.length > 0;
  }

  /**
   * Get unique breeders from favorites
   */
  getUniqueBreeders(): Map<string, { id: string, name: string, count: number }> {
    const breederMap = new Map<string, { id: string, name: string, count: number }>();
    
    this.offsprings.forEach(offspring => {
      const breederId = offspring.user_id;
      if (breederId) {
        if (breederMap.has(breederId)) {
          const breeder = breederMap.get(breederId)!;
          breeder.count++;
        } else {
          breederMap.set(breederId, {
            id: breederId,
            name: this.breederNames.get(breederId) || 'Breeder',
            count: 1
          });
        }
      }
    });
    
    return breederMap;
  }
  
  onSearchTermChange(term: string): void {
    this.searchTerm = term;
  }

  /** Favorites filtered by the search box (name, breed, color, breedery). */
  get visibleOffsprings(): OffspringRead[] {
    const q = (this.searchTerm || '').trim().toLowerCase();
    if (!q) return this.offsprings;
    return this.offsprings.filter(o =>
      [o.name, o.breed?.name, o.color_markings, this.breederNames.get(o.user_id)]
        .some(v => (v || '').toLowerCase().includes(q))
    );
  }

  /** Breedery names for "Breeders You're Following" (looked up once per breeder). */
  breederNames = new Map<string, string>();

  private loadBreederNames(): void {
    const ids = [...new Set(this.offsprings.map(o => o.user_id).filter(Boolean))]
      .filter(id => !this.breederNames.has(id));
    for (const id of ids) {
      this.dataService.getPublicBreederProfile(id).subscribe({
        next: profile => {
          this.breederNames.set(id, profile.breedery_name || profile.name || 'Breeder');
          this.cdr.detectChanges();
        },
        error: () => {},
      });
    }
  }
}
