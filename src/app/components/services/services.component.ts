import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { ServiceProviderService } from 'src/app/services/service-provider.service';
import { AuthService } from 'src/app/services/auth.service';
import { ToastService } from 'src/app/services/toast.service';
import { IService, IServiceCreate, IServiceUpdate } from 'src/app/models/service';
import { IServiceCategory } from 'src/app/models/service-category';
import { environment } from 'src/environments/environment';
import { PageHeaderConfig } from '../page-header/page-header.component';

@Component({
  standalone: false,
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent implements OnInit {

  headerConfig: PageHeaderConfig = {
    title: 'My Services',
    icon: 'bi bi-briefcase-fill',
    iconColor: '#4ecdc4',
    showLayoutSwitcher: false,
    showSearch: true,
    searchPlaceholder: 'Search services...',
    showActionButton: false
  };

  // Data
  services: IService[] = [];
  categories: IServiceCategory[] = [];
  locations: any[] = [];

  // UI state
  isLoading = true;
  searchTerm = '';
  showAddForm = false;
  editingService: IService | null = null;

  // Mobile filter drawer
  isMobileFilterOpen = false;
  mobileFilters: { category: string; status: string } = {
    category: '',
    status: ''
  };

  // New service form defaults
  newService: IServiceCreate = {
    category_id: 0,
    title: '',
    description: '',
    price_from: undefined,
    price_to: undefined,
    price_unit: undefined,
    location_ids: []
  };

  // Edit form state (copy of service being edited)
  editForm: IServiceUpdate = {};

  private apiUrl = environment.API_URL;

  constructor(
    private serviceProviderService: ServiceProviderService,
    private authService: AuthService,
    private router: Router,
    private toast: ToastService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadServices();
    this.loadCategories();
    this.loadLocations();
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  loadServices(): void {
    this.isLoading = true;
    this.serviceProviderService.getServices().subscribe({
      next: (response) => {
        this.services = response.items;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading services:', err);
        this.toast.error('Failed to load services. Please try again.');
        this.isLoading = false;
      }
    });
  }

  loadCategories(): void {
    this.serviceProviderService.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
      }
    });
  }

  loadLocations(): void {
    const headers = new HttpHeaders().set(
      'Authorization',
      'Bearer ' + localStorage.getItem('id_token')
    );
    this.http.get<any[]>(`${this.apiUrl}/locations/`, { headers }).subscribe({
      next: (locs) => {
        this.locations = locs;
      },
      error: (err) => {
        console.error('Error loading locations:', err);
      }
    });
  }

  // ── CRUD operations ───────────────────────────────────────────────────────

  onAddService(): void {
    if (!this.newService.category_id || !this.newService.title.trim()) {
      this.toast.error('Category and title are required.');
      return;
    }
    if (this.newService.location_ids.length === 0) {
      this.toast.error('Please select at least one location.');
      return;
    }

    this.serviceProviderService.createService(this.newService).subscribe({
      next: () => {
        this.toast.success('Service created successfully.');
        this.resetNewServiceForm();
        this.showAddForm = false;
        this.loadServices();
      },
      error: (err) => {
        console.error('Error creating service:', err);
        this.toast.error(err.message || 'Failed to create service.');
      }
    });
  }

  onEditService(service: IService): void {
    this.editingService = service;
    this.editForm = {
      category_id: service.category_id,
      title: service.title,
      description: service.description,
      price_from: service.price_from,
      price_to: service.price_to,
      price_unit: service.price_unit,
      location_ids: [],
      is_active: service.is_active
    };
    this.showAddForm = false;
  }

  onUpdateService(): void {
    if (!this.editingService) return;
    if (!this.editForm.title?.trim()) {
      this.toast.error('Title is required.');
      return;
    }

    this.serviceProviderService.updateService(this.editingService.id, this.editForm).subscribe({
      next: () => {
        this.toast.success('Service updated successfully.');
        this.editingService = null;
        this.editForm = {};
        this.loadServices();
      },
      error: (err) => {
        console.error('Error updating service:', err);
        this.toast.error(err.message || 'Failed to update service.');
      }
    });
  }

  onDeleteService(id: string): void {
    if (!confirm('Are you sure you want to delete this service?')) return;

    this.serviceProviderService.deleteService(id).subscribe({
      next: () => {
        this.toast.success('Service deleted successfully.');
        this.loadServices();
      },
      error: (err) => {
        console.error('Error deleting service:', err);
        this.toast.error(err.message || 'Failed to delete service.');
      }
    });
  }

  // ── Form helpers ──────────────────────────────────────────────────────────

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (this.showAddForm) {
      this.editingService = null;
      this.editForm = {};
    }
  }

  cancelEdit(): void {
    this.editingService = null;
    this.editForm = {};
  }

  private resetNewServiceForm(): void {
    this.newService = {
      category_id: 0,
      title: '',
      description: '',
      price_from: undefined,
      price_to: undefined,
      price_unit: undefined,
      location_ids: []
    };
  }

  // ── Location multi-select helpers ─────────────────────────────────────────

  isLocationSelected(locationId: number, ids: number[]): boolean {
    return ids.includes(locationId);
  }

  toggleLocationForNew(locationId: number): void {
    const idx = this.newService.location_ids.indexOf(locationId);
    if (idx === -1) {
      this.newService.location_ids = [...this.newService.location_ids, locationId];
    } else {
      this.newService.location_ids = this.newService.location_ids.filter(id => id !== locationId);
    }
  }

  toggleLocationForEdit(locationId: number): void {
    const current = this.editForm.location_ids ?? [];
    const idx = current.indexOf(locationId);
    if (idx === -1) {
      this.editForm.location_ids = [...current, locationId];
    } else {
      this.editForm.location_ids = current.filter(id => id !== locationId);
    }
  }

  // ── Computed properties ───────────────────────────────────────────────────

  get hasNoLocations(): boolean {
    return this.locations.length === 0;
  }

  get filteredServices(): IService[] {
    if (!this.searchTerm.trim() && !this.mobileFilters.category && !this.mobileFilters.status) {
      return this.services;
    }

    const term = this.searchTerm.toLowerCase().trim();

    return this.services.filter(s => {
      if (term) {
        const matchesTitle = s.title.toLowerCase().includes(term);
        const matchesCategory = s.category_name.toLowerCase().includes(term);
        if (!matchesTitle && !matchesCategory) return false;
      }

      if (this.mobileFilters.category && s.category_slug !== this.mobileFilters.category) {
        return false;
      }

      if (this.mobileFilters.status) {
        if (this.mobileFilters.status === 'active' && !s.is_active) return false;
        if (this.mobileFilters.status === 'inactive' && s.is_active) return false;
      }

      return true;
    });
  }

  // ── Mobile filter helpers ─────────────────────────────────────────────────

  hasActiveFilters(): boolean {
    return !!(this.mobileFilters.category || this.mobileFilters.status);
  }

  applyMobileFilters(): void {
    // Filters are applied reactively via filteredServices getter
  }

  clearMobileFilters(): void {
    this.mobileFilters = { category: '', status: '' };
    this.isMobileFilterOpen = false;
  }

  // ── Search ────────────────────────────────────────────────────────────────

  onSearchChange(term: string): void {
    this.searchTerm = term;
  }

  // ── Formatting helpers ────────────────────────────────────────────────────

  formatPriceUnit(unit: string | undefined): string {
    if (!unit) return '';
    const map: Record<string, string> = {
      per_session: '/ session',
      per_hour: '/ hour',
      per_day: '/ day',
      per_visit: '/ visit'
    };
    return map[unit] ?? unit;
  }

  formatPrice(service: IService): string {
    if (service.price_from == null && service.price_to == null) return 'Price on request';
    const unit = this.formatPriceUnit(service.price_unit);
    if (service.price_from != null && service.price_to != null) {
      return `$${service.price_from} – $${service.price_to} ${unit}`.trim();
    }
    if (service.price_from != null) return `From $${service.price_from} ${unit}`.trim();
    return `Up to $${service.price_to} ${unit}`.trim();
  }
}
