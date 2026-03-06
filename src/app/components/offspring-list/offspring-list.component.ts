import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { OffspringService, OffspringRead } from 'src/app/services/offspring.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  standalone: false,
  selector: 'app-offspring-list',
  templateUrl: './offspring-list.component.html',
  styleUrls: ['./offspring-list.component.css']
})
export class OffspringListComponent implements OnInit {
  offsprings: OffspringRead[] = [];
  isLoading: boolean = false;
  isDeleting: { [key: string]: boolean } = {};
  isUpdatingStatus: { [key: string]: boolean } = {};

  // Pagination
  totalRecords: number = 0;
  rows: number = 50;
  first: number = 0;

  // Status options
  statusOptions = [
    { label: 'Available', value: 'Available' },
    { label: 'Reserved', value: 'Reserved' },
    { label: 'Sold', value: 'Sold' },
    { label: 'Archived', value: 'Archived' }
  ];

  constructor(
    private offspringService: OffspringService,
    private toastr: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOffsprings();
  }

  loadOffsprings(): void {
    console.log('Loading all offsprings');
    this.isLoading = true;
    // Load all offsprings at once (max limit is 100)
    this.offspringService.getOffsprings(undefined, undefined, 100, 0).subscribe({
      next: (response) => {
        console.log('Offsprings loaded:', response.offsprings.length);
        this.offsprings = response.offsprings;
        this.totalRecords = response.total;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading offsprings:', error);
        this.toastr.error(error.message || 'Failed to load offsprings', 'Error');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onPageChange(event: any): void {
    // Client-side pagination only - no need to reload data
    console.log('Page change event (client-side only):', event);
    this.first = event.first;
    this.rows = event.rows;
  }

  addOffspring(): void {
    this.router.navigate(['/offsprings/new']);
  }

  viewOffspring(offspring: OffspringRead): void {
    this.router.navigate(['/offsprings', offspring.id]);
  }

  editOffspring(offspring: OffspringRead): void {
    this.router.navigate(['/offsprings', offspring.id, 'edit']);
  }

  deleteOffspring(offspring: OffspringRead): void {
    if (confirm(`Are you sure you want to delete offspring "${offspring.name || 'Unnamed'}"? This action cannot be undone.`)) {
      this.isDeleting[offspring.id] = true;
      this.offspringService.deleteOffspring(offspring.id).subscribe({
        next: () => {
          this.toastr.success('Offspring deleted successfully', 'Success');
          this.isDeleting[offspring.id] = false;
          this.loadOffsprings();
        },
        error: (error) => {
          console.error('Error deleting offspring:', error);
          this.toastr.error(error.message || 'Failed to delete offspring', 'Error');
          this.isDeleting[offspring.id] = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  onStatusChange(offspring: OffspringRead, newStatus: string): void {
    this.isUpdatingStatus[offspring.id] = true;
    this.offspringService.updateOffspring(offspring.id, { status: newStatus as any }).subscribe({
      next: (updatedOffspring) => {
        offspring.status = updatedOffspring.status;
        this.toastr.success('Status updated successfully', 'Success');
        this.isUpdatingStatus[offspring.id] = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error updating status:', error);
        this.toastr.error(error.message || 'Failed to update status', 'Error');
        this.isUpdatingStatus[offspring.id] = false;
        this.cdr.detectChanges();
      }
    });
  }

  viewMessages(offspring: OffspringRead): void {
    // Navigate to messages view filtered by offspring
    this.router.navigate(['/messages'], { queryParams: { offspring_id: offspring.id } });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Available':
        return 'badge-available';
      case 'Reserved':
        return 'badge-reserved';
      case 'Sold':
        return 'badge-sold';
      case 'Archived':
        return 'badge-archived';
      default:
        return '';
    }
  }

  getThumbnailUrl(offspring: OffspringRead): string {
    if (offspring.primary_image) {
      return `http://breedly.com:8000${offspring.primary_image.image_url}`;
    }
    if (offspring.images && offspring.images.length > 0) {
      return `http://breedly.com:8000${offspring.images[0].image_url}`;
    }
    // Return a data URL for a simple gray placeholder instead of trying to load a file
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2UwZTBlMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
  }

  getBreedName(offspring: OffspringRead): string {
    return offspring.breed?.name || '-';
  }

  getBreedingReference(offspring: OffspringRead): string {
    return offspring.breeding?.id?.toString() || '-';
  }

  getFatherName(offspring: OffspringRead): string {
    return offspring.father?.name || '-';
  }

  getMotherName(offspring: OffspringRead): string {
    return offspring.mother?.name || '-';
  }

  navigateToBreeding(offspring: OffspringRead): void {
    if (offspring.breeding_id) {
      this.router.navigate(['/breeding', offspring.breeding_id]);
    }
  }

  navigateToPet(petId: string): void {
    if (petId) {
      this.router.navigate(['/pets', petId]);
    }
  }
}
