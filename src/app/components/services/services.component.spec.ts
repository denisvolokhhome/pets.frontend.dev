import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ServicesComponent } from './services.component';
import { ServiceProviderService } from 'src/app/services/service-provider.service';
import { AuthService } from 'src/app/services/auth.service';
import { ToastService } from 'src/app/services/toast.service';
import { IService, IServiceListResponse } from 'src/app/models/service';
import { IServiceCategory } from 'src/app/models/service-category';
import { PageHeaderComponent } from '../page-header/page-header.component';

const MOCK_CATEGORIES: IServiceCategory[] = [
  { id: 1, name: 'Grooming', slug: 'grooming', is_active: true },
  { id: 2, name: 'Dog Walking', slug: 'dog-walking', is_active: true },
];

const MOCK_SERVICES: IService[] = [
  {
    id: 'svc-1',
    user_id: 'user-1',
    category_id: 1,
    category_name: 'Grooming',
    category_slug: 'grooming',
    title: 'Professional Dog Grooming',
    description: 'Full grooming service',
    price_from: 40,
    price_to: 80,
    price_unit: 'per_session',
    is_active: true,
    is_deleted: false,
    created_at: '2024-01-01T00:00:00Z',
    images: []
  },
  {
    id: 'svc-2',
    user_id: 'user-1',
    category_id: 2,
    category_name: 'Dog Walking',
    category_slug: 'dog-walking',
    title: 'Daily Dog Walk',
    description: 'One hour walk',
    price_from: 20,
    price_to: undefined,
    price_unit: 'per_visit',
    is_active: false,
    is_deleted: false,
    created_at: '2024-01-02T00:00:00Z',
    images: []
  }
];

const MOCK_LIST_RESPONSE: IServiceListResponse = {
  items: MOCK_SERVICES,
  total: 2,
  page: 1,
  page_size: 20
};

const MOCK_LOCATIONS = [
  { id: 1, name: 'Main Location', address: '123 Main St' },
  { id: 2, name: 'Branch', address: '456 Oak Ave' }
];

describe('ServicesComponent', () => {
  let component: ServicesComponent;
  let fixture: ComponentFixture<ServicesComponent>;
  let mockServiceProviderService: jasmine.SpyObj<ServiceProviderService>;
  let mockToastService: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    mockServiceProviderService = jasmine.createSpyObj('ServiceProviderService', [
      'getServices', 'getCategories', 'createService', 'updateService', 'deleteService'
    ]);
    mockServiceProviderService.getServices.and.returnValue(of(MOCK_LIST_RESPONSE));
    mockServiceProviderService.getCategories.and.returnValue(of(MOCK_CATEGORIES));

    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning', 'info']);

    await TestBed.configureTestingModule({
      declarations: [ServicesComponent],
      imports: [FormsModule, RouterTestingModule, HttpClientTestingModule, PageHeaderComponent],
      providers: [
        { provide: ServiceProviderService, useValue: mockServiceProviderService },
        { provide: ToastService, useValue: mockToastService },
        AuthService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load services on init', () => {
    expect(mockServiceProviderService.getServices).toHaveBeenCalledTimes(1);
    expect(component.services.length).toBe(2);
  });

  it('should load categories on init', () => {
    expect(mockServiceProviderService.getCategories).toHaveBeenCalledTimes(1);
    expect(component.categories.length).toBe(2);
  });

  it('should set isLoading to false after services load', () => {
    expect(component.isLoading).toBeFalse();
  });

  it('should show error toast when services fail to load', () => {
    mockServiceProviderService.getServices.and.returnValue(throwError(() => ({ message: 'Network error' })));
    component.loadServices();
    expect(mockToastService.error).toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
  });

  it('hasNoLocations returns true when locations array is empty', () => {
    component.locations = [];
    expect(component.hasNoLocations).toBeTrue();
  });

  it('hasNoLocations returns false when locations exist', () => {
    component.locations = MOCK_LOCATIONS;
    expect(component.hasNoLocations).toBeFalse();
  });

  it('filteredServices returns all services when no search term or filters', () => {
    component.services = MOCK_SERVICES;
    component.searchTerm = '';
    component.mobileFilters = { category: '', status: '' };
    expect(component.filteredServices.length).toBe(2);
  });

  it('filteredServices filters by title search term', () => {
    component.services = MOCK_SERVICES;
    component.searchTerm = 'grooming';
    expect(component.filteredServices.length).toBe(1);
    expect(component.filteredServices[0].id).toBe('svc-1');
  });

  it('filteredServices is case-insensitive', () => {
    component.services = MOCK_SERVICES;
    component.searchTerm = 'GROOMING';
    expect(component.filteredServices.length).toBe(1);
  });

  it('filteredServices filters by mobile status active', () => {
    component.services = MOCK_SERVICES;
    component.searchTerm = '';
    component.mobileFilters = { category: '', status: 'active' };
    expect(component.filteredServices.every(s => s.is_active)).toBeTrue();
  });

  it('filteredServices filters by mobile status inactive', () => {
    component.services = MOCK_SERVICES;
    component.searchTerm = '';
    component.mobileFilters = { category: '', status: 'inactive' };
    expect(component.filteredServices.every(s => !s.is_active)).toBeTrue();
  });

  it('toggleAddForm opens the add form', () => {
    component.showAddForm = false;
    component.toggleAddForm();
    expect(component.showAddForm).toBeTrue();
  });

  it('toggleAddForm clears editingService when opening', () => {
    component.editingService = MOCK_SERVICES[0];
    component.showAddForm = false;
    component.toggleAddForm();
    expect(component.editingService).toBeNull();
  });

  it('onEditService sets editingService', () => {
    component.onEditService(MOCK_SERVICES[0]);
    expect(component.editingService).toBe(MOCK_SERVICES[0]);
  });

  it('cancelEdit clears editingService', () => {
    component.editingService = MOCK_SERVICES[0];
    component.cancelEdit();
    expect(component.editingService).toBeNull();
  });

  it('onAddService shows error when category_id is 0', () => {
    component.newService.category_id = 0;
    component.newService.title = 'Test';
    component.newService.location_ids = [1];
    component.onAddService();
    expect(mockToastService.error).toHaveBeenCalled();
    expect(mockServiceProviderService.createService).not.toHaveBeenCalled();
  });

  it('onAddService shows error when no locations selected', () => {
    component.newService.category_id = 1;
    component.newService.title = 'Test Service';
    component.newService.location_ids = [];
    component.onAddService();
    expect(mockToastService.error).toHaveBeenCalled();
  });

  it('onAddService calls createService with valid data', () => {
    mockServiceProviderService.createService.and.returnValue(of(MOCK_SERVICES[0]));
    component.newService = { category_id: 1, title: 'New Service', description: '', location_ids: [1] };
    component.onAddService();
    expect(mockServiceProviderService.createService).toHaveBeenCalled();
  });

  it('onDeleteService calls deleteService after confirm', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    mockServiceProviderService.deleteService.and.returnValue(of(undefined));
    component.onDeleteService('svc-1');
    expect(mockServiceProviderService.deleteService).toHaveBeenCalledWith('svc-1');
  });

  it('onDeleteService does not call deleteService when confirm is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.onDeleteService('svc-1');
    expect(mockServiceProviderService.deleteService).not.toHaveBeenCalled();
  });

  it('isLocationSelected returns true when id is in array', () => {
    expect(component.isLocationSelected(1, [1, 2, 3])).toBeTrue();
  });

  it('isLocationSelected returns false when id is not in array', () => {
    expect(component.isLocationSelected(5, [1, 2, 3])).toBeFalse();
  });

  it('hasActiveFilters returns false when no filters set', () => {
    component.mobileFilters = { category: '', status: '' };
    expect(component.hasActiveFilters()).toBeFalse();
  });

  it('hasActiveFilters returns true when category filter is set', () => {
    component.mobileFilters = { category: 'grooming', status: '' };
    expect(component.hasActiveFilters()).toBeTrue();
  });

  it('clearMobileFilters resets all filters', () => {
    component.mobileFilters = { category: 'grooming', status: 'active' };
    component.isMobileFilterOpen = true;
    component.clearMobileFilters();
    expect(component.mobileFilters).toEqual({ category: '', status: '' });
    expect(component.isMobileFilterOpen).toBeFalse();
  });

  it('formatPrice returns "Price on request" when no prices set', () => {
    const svc: IService = { ...MOCK_SERVICES[0], price_from: undefined as any, price_to: undefined as any };
    expect(component.formatPrice(svc)).toBe('Price on request');
  });

  it('formatPrice returns range when both prices set', () => {
    const result = component.formatPrice(MOCK_SERVICES[0]);
    expect(result).toContain('40');
    expect(result).toContain('80');
  });

  it('formatPriceUnit maps per_session correctly', () => {
    expect(component.formatPriceUnit('per_session')).toBe('/ session');
  });

  it('formatPriceUnit returns empty string for undefined', () => {
    expect(component.formatPriceUnit(undefined)).toBe('');
  });
});
