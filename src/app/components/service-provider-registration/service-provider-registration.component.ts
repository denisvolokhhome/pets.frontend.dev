import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IServiceCategory } from 'src/app/models/service-category';
import { ServiceProviderService } from 'src/app/services/service-provider.service';

@Component({
  standalone: false,
  selector: 'app-service-provider-registration',
  templateUrl: './service-provider-registration.component.html',
  styleUrls: ['./service-provider-registration.component.css'],
})
export class ServiceProviderRegistrationComponent implements OnInit {
  /** When true and no categories are selected, shows an inline validation error. */
  @Input() showError: boolean = false;

  /** Emits the current array of selected category IDs whenever the selection changes. */
  @Output() categoriesSelected = new EventEmitter<number[]>();

  categories: IServiceCategory[] = [];
  selectedIds: Set<number> = new Set();
  isLoading = false;
  loadError: string | null = null;

  constructor(private serviceProviderService: ServiceProviderService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.isLoading = true;
    this.loadError = null;

    this.serviceProviderService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.isLoading = false;
      },
      error: () => {
        this.loadError = 'Failed to load service categories. Please refresh the page.';
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
    this.categoriesSelected.emit(Array.from(this.selectedIds));
  }

  isSelected(id: number): boolean {
    return this.selectedIds.has(id);
  }

  get hasError(): boolean {
    return this.showError && this.selectedIds.size === 0;
  }
}
