import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ToastService } from 'src/app/services/toast.service';
import { ServiceProviderService } from 'src/app/services/service-provider.service';
import { IServiceCategory } from 'src/app/models/service-category';
import { environment } from 'src/environments/environment';

@Component({
  standalone: false,
  selector: 'app-service-categories-settings',
  templateUrl: './service-categories-settings.component.html',
  styleUrls: ['./service-categories-settings.component.css'],
})
export class ServiceCategoriesSettingsComponent implements OnInit {
  allCategories: IServiceCategory[] = [];
  selectedIds: Set<number> = new Set();
  isLoading = true;
  isSaving = false;
  loadError: string | null = null;

  private apiUrl = environment.API_URL;

  constructor(
    private serviceProviderService: ServiceProviderService,
    private http: HttpClient,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders().set('Authorization', 'Bearer ' + localStorage.getItem('id_token'));
  }

  private loadData(): void {
    this.isLoading = true;
    this.loadError = null;

    // Load all available categories and current user's categories in parallel
    this.serviceProviderService.getCategories().subscribe({
      next: (cats) => {
        this.allCategories = cats;
        this.loadCurrentCategories();
      },
      error: () => {
        this.loadError = 'Failed to load categories. Please refresh the page.';
        this.isLoading = false;
      },
    });
  }

  private loadCurrentCategories(): void {
    this.http.get<any>(this.apiUrl + '/auth/users/me', { headers: this.getAuthHeaders() }).subscribe({
      next: (user) => {
        // The user object has service_categories from the selectin relationship
        const userCats: any[] = user.service_categories || [];
        this.selectedIds = new Set(userCats.map((c: any) => c.id));
        this.isLoading = false;
      },
      error: () => {
        // If we can't load current categories, just show all unselected
        this.isLoading = false;
      },
    });
  }

  toggleCategory(id: number): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    // Trigger change detection
    this.selectedIds = new Set(this.selectedIds);
  }

  isSelected(id: number): boolean {
    return this.selectedIds.has(id);
  }

  getCategoryIcon(slug: string): string {
    const icons: Record<string, string> = {
      'grooming': 'bi-scissors',
      'dog-walking': 'bi-person-walking',
      'cat-sitting': 'bi-house-heart',
      'pet-sitting': 'bi-house-heart',
      'pet-training': 'bi-award',
      'pet-boarding': 'bi-building',
      'veterinary': 'bi-heart-pulse',
      'pet-photography': 'bi-camera',
      'pet-transport': 'bi-truck',
      'pet-daycare': 'bi-sun',
    };
    return icons[slug] || 'bi-tag';
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  saveCategories(): void {
    if (this.selectedIds.size === 0) {
      this.toast.error('Please select at least one service category.');
      return;
    }
    if (this.isSaving) return;
    this.isSaving = true;

    const payload = { category_ids: Array.from(this.selectedIds) };

    this.http.patch<any>(
      this.apiUrl + '/auth/users/me',
      payload,
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: () => {
        this.isSaving = false;
        this.toast.success('Service categories updated successfully.');
      },
      error: (err) => {
        this.isSaving = false;
        // PATCH /users/me may not support category_ids — use a dedicated endpoint
        this.updateCategoriesViaAuthEndpoint(payload.category_ids);
      },
    });
  }

  private updateCategoriesViaAuthEndpoint(categoryIds: number[]): void {
    // Use the dedicated service provider categories update endpoint
    this.http.put<any>(
      this.apiUrl + '/service-providers/me/categories',
      { category_ids: categoryIds },
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: () => {
        this.isSaving = false;
        this.toast.success('Service categories updated successfully.');
      },
      error: () => {
        this.isSaving = false;
        this.toast.error('Failed to save categories. Please try again.');
      },
    });
  }
}
