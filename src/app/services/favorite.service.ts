import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface OffspringFavorite {
  id: string;
  offspring_id: string;
  user_id: string;
  created_at: string;
  offspring?: any;
}

export interface FavoriteListResponse {
  favorites: OffspringFavorite[];
  total: number;
  limit: number;
  offset: number;
}

export interface FavoriteStatusResponse {
  is_favorited: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private apiUrl = environment.API_URL;
  
  // Local cache for optimistic updates
  private favoritesCache = new BehaviorSubject<Set<string>>(new Set());
  public favoritesCache$ = this.favoritesCache.asObservable();

  constructor(private http: HttpClient) {
    this.loadFavoritesCache();
  }

  /**
   * Load favorites cache from server
   */
  private loadFavoritesCache(): void {
    const token = localStorage.getItem('id_token');
    if (!token) return;

    this.getFavorites(0, 1000).subscribe({
      next: (response) => {
        const favoriteIds = new Set(response.favorites.map(f => f.offspring_id));
        this.favoritesCache.next(favoriteIds);
      },
      error: () => {
        // Silently fail - cache will be empty
      }
    });
  }

  /**
   * Add an offspring to favorites
   */
  addFavorite(offspringId: string): Observable<OffspringFavorite> {
    const headers = this.getAuthHeaders();
    
    // Optimistic update
    const currentCache = this.favoritesCache.value;
    currentCache.add(offspringId);
    this.favoritesCache.next(currentCache);

    return this.http
      .post<OffspringFavorite>(`${this.apiUrl}/favorites/offsprings/${offspringId}`, {}, { headers })
      .pipe(
        catchError((error) => {
          // Rollback optimistic update on error
          const rollbackCache = this.favoritesCache.value;
          rollbackCache.delete(offspringId);
          this.favoritesCache.next(rollbackCache);
          return this.handleError(error);
        })
      );
  }

  /**
   * Remove an offspring from favorites
   */
  removeFavorite(offspringId: string): Observable<void> {
    const headers = this.getAuthHeaders();
    
    // Optimistic update
    const currentCache = this.favoritesCache.value;
    currentCache.delete(offspringId);
    this.favoritesCache.next(currentCache);

    return this.http
      .delete<void>(`${this.apiUrl}/favorites/offsprings/${offspringId}`, { headers })
      .pipe(
        catchError((error) => {
          // Rollback optimistic update on error
          const rollbackCache = this.favoritesCache.value;
          rollbackCache.add(offspringId);
          this.favoritesCache.next(rollbackCache);
          return this.handleError(error);
        })
      );
  }

  /**
   * Get all favorites for the authenticated user
   */
  getFavorites(offset: number = 0, limit: number = 50): Observable<FavoriteListResponse> {
    const headers = this.getAuthHeaders();
    const params = {
      offset: offset.toString(),
      limit: limit.toString()
    };

    return this.http
      .get<FavoriteListResponse>(`${this.apiUrl}/favorites/offsprings`, { headers, params })
      .pipe(
        tap((response) => {
          // Update cache with server data
          const favoriteIds = new Set(response.favorites.map(f => f.offspring_id));
          this.favoritesCache.next(favoriteIds);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Check if an offspring is favorited
   */
  checkFavoriteStatus(offspringId: string): Observable<FavoriteStatusResponse> {
    const headers = this.getAuthHeaders();

    return this.http
      .get<FavoriteStatusResponse>(`${this.apiUrl}/favorites/offsprings/check/${offspringId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  /**
   * Check if an offspring is favorited (from local cache)
   */
  isFavorited(offspringId: string): boolean {
    return this.favoritesCache.value.has(offspringId);
  }

  /**
   * Toggle favorite status (add if not favorited, remove if favorited)
   */
  toggleFavorite(offspringId: string): Observable<any> {
    if (this.isFavorited(offspringId)) {
      return this.removeFavorite(offspringId);
    } else {
      return this.addFavorite(offspringId);
    }
  }

  /**
   * Refresh favorites cache from server
   */
  refreshCache(): void {
    this.loadFavoritesCache();
  }

  /**
   * Get authorization headers with JWT token
   */
  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders().set(
      'Authorization',
      'Bearer ' + localStorage.getItem('id_token')
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.';
      } else if (error.status === 403) {
        errorMessage = 'Access forbidden.';
      } else if (error.status === 404) {
        errorMessage = 'Favorite not found.';
      } else if (error.status === 409) {
        errorMessage = error.error?.detail?.message || error.error?.detail || 'Already favorited.';
      } else if (error.status === 422) {
        errorMessage = error.error?.detail || 'Validation error.';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = error.error?.detail || `Error: ${error.status} - ${error.statusText}`;
      }
    }

    return throwError(() => ({
      ...error,
      message: errorMessage
    }));
  }
}
