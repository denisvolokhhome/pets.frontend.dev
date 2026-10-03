import { Component, OnInit } from '@angular/core';
import { ToastService } from 'src/app/services/toast.service';
import { ServiceProviderService } from 'src/app/services/service-provider.service';
import { DataService } from 'src/app/services/data.service';
import { IServiceCategory } from 'src/app/models/service-category';

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

  constructor(
    private serviceProviderService: ServiceProviderService,
    private dataService: DataService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading = true;
    this.loadError = null;

    // Load all available categories, then the current user's selected ones.
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
    this.dataService.getCurrentUserProfile().subscribe({
      next: (user) => {
        const userCats = user.service_categories || [];
        this.selectedIds = new Set(userCats.map((c) => c.id));
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

    this.serviceProviderService.updateMyCategories(Array.from(this.selectedIds)).subscribe({
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
