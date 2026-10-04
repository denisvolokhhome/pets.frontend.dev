import { Component, Input, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { ILocation } from 'src/app/models/location';
import { IBreed } from 'src/app/models/breed';
import { IPetType, PET_TYPES } from 'src/app/models/pet-type';
import { BreedingStatus } from 'src/app/models/breeding';

export interface FilterConfig {
  showLocation?: boolean;
  showGender?: boolean;
  showPetType?: boolean;
  showStatus?: boolean;
  showBreed?: boolean;
  showHealthRecords?: boolean;
  showSortOrder?: boolean;
  statusOptions?: { value: string; label: string }[];
}

export interface FilterValues {
  location?: string;
  gender?: string;
  petType?: string;
  status?: string;
  breed?: string;
  sortOrder?: string;
  healthFilters?: {
    vaccination?: boolean;
    microchip?: boolean;
    healthcertificate?: boolean;
    dewormed?: boolean;
    birthcertificate?: boolean;
  };
}

@Component({
  standalone: false,
  selector: 'app-filter-widget',
  templateUrl: './filter-widget.component.html',
  styleUrls: ['./filter-widget.component.css']
})
export class FilterWidgetComponent implements OnInit {
  @Input() config: FilterConfig = {};
  @Input() locations: ILocation[] = [];
  @Input() breeds: IBreed[] = [];
  @Input() totalCount: number = 0;
  @Input() filteredCount: number = 0;
  @Input() isLoading: boolean = false;

  /** Slide-in panel state on laptop widths, where the sidebar would squeeze the table. */
  @Input() open: boolean = false;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() filterChange = new EventEmitter<FilterValues>();
  @Output() clearFilters = new EventEmitter<void>();

  petTypes: IPetType[] = PET_TYPES;
  BreedingStatus = BreedingStatus;

  filterValues: FilterValues = {
    location: '',
    gender: '',
    petType: '',
    status: '',
    breed: '',
    sortOrder: '',
    healthFilters: {
      vaccination: false,
      microchip: false,
      healthcertificate: false,
      dewormed: false,
      birthcertificate: false
    }
  };

  ngOnInit(): void {
    // Initialize with default config if not provided
    if (!this.config || Object.keys(this.config).length === 0) {
      this.config = {
        showLocation: true,
        showGender: true,
        showPetType: true,
        showStatus: false,
        showBreed: false,
        showHealthRecords: false,
        showSortOrder: false
      };
    }
  }

  onLocationChange(location: string): void {
    this.filterValues.location = location;
    this.emitFilterChange();
  }

  onGenderChange(gender: string): void {
    this.filterValues.gender = gender;
    this.emitFilterChange();
  }

  onPetTypeChange(petType: string): void {
    this.filterValues.petType = this.filterValues.petType === petType ? '' : petType;
    this.emitFilterChange();
  }

  onStatusChange(status: string): void {
    this.filterValues.status = status;
    this.emitFilterChange();
  }

  onBreedChange(breed: string): void {
    this.filterValues.breed = breed;
    this.emitFilterChange();
  }

  onHealthFilterChange(): void {
    this.emitFilterChange();
  }

  onSortOrderChange(sortOrder: string): void {
    this.filterValues.sortOrder = sortOrder;
    this.emitFilterChange();
  }

  emitFilterChange(): void {
    this.filterChange.emit({ ...this.filterValues });
  }

  onClearFilters(): void {
    this.filterValues = {
      location: '',
      gender: '',
      petType: '',
      status: '',
      breed: '',
      sortOrder: '',
      healthFilters: {
        vaccination: false,
        microchip: false,
        healthcertificate: false,
        dewormed: false,
        birthcertificate: false
      }
    };
    this.clearFilters.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.close();
  }

  close(): void {
    this.open = false;
    this.openChange.emit(false);
  }

  /** Number of filters currently applied — shown on the page's "Filters" button. */
  get activeCount(): number {
    const v = this.filterValues;
    const simple = [v.location, v.gender, v.petType, v.status, v.breed].filter(Boolean).length;
    const health = v.healthFilters ? Object.values(v.healthFilters).filter(Boolean).length : 0;
    return simple + health;
  }

  hasActiveFilters(): boolean {
    return !!(
      this.filterValues.location ||
      this.filterValues.gender ||
      this.filterValues.petType ||
      this.filterValues.status ||
      this.filterValues.breed ||
      this.filterValues.sortOrder ||
      (this.filterValues.healthFilters && Object.values(this.filterValues.healthFilters).some(v => v))
    );
  }
}
