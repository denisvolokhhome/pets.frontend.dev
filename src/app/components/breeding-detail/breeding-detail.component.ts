import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';

@Component({
  standalone: false,
  selector: 'app-breeding-detail',
  templateUrl: './breeding-detail.component.html',
  styleUrls: ['./breeding-detail.component.css']
})
export class BreedingDetailComponent implements OnInit {
  breedingId: string = '';
  breeding: any = null;
  isLoading: boolean = true;
  showOffspringModal: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private toastr: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.breedingId = params['id'];
      this.loadBreedingDetails();
    });
  }

  loadBreedingDetails(): void {
    this.isLoading = true;
    
    this.dataService.getBreeding(this.breedingId).subscribe({
      next: (data) => {
        this.breeding = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading breeding details:', error);
        this.toastr.error('Failed to load breeding details', 'Error');
        this.isLoading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/breedings']);
      }
    });
  }

  getBreedDisplay(): string {
    if (!this.breeding?.parent_pets || this.breeding.parent_pets.length === 0) {
      return 'Unknown';
    }

    const breeds = this.breeding.parent_pets
      .map((pet: any) => pet.breed_name)
      .filter((breed: string) => breed);

    if (breeds.length === 0) {
      return 'Unknown';
    }

    const uniqueBreeds = [...new Set<string>(breeds)];
    
    if (uniqueBreeds.length === 1) {
      return uniqueBreeds[0] as string;
    }

    return `Mixed (${uniqueBreeds.join(' + ')})`;
  }

  getBreedId(): number | null {
    if (!this.breeding?.parent_pets || this.breeding.parent_pets.length === 0) {
      return null;
    }

    const breedIds = this.breeding.parent_pets
      .map((pet: any) => pet.breed_id)
      .filter((id: number) => id);

    if (breedIds.length === 0) {
      return null;
    }

    const uniqueBreedIds = [...new Set<number>(breedIds)];
    
    // If all parents have the same breed, return that breed_id
    if (uniqueBreedIds.length === 1) {
      return uniqueBreedIds[0] as number;
    }
    if (uniqueBreedIds.length === 1) {
      return uniqueBreedIds[0];
    }

    // Mixed breed - return null to indicate mixed
    return null;
  }

  openOffspringModal(): void {
    this.showOffspringModal = true;
  }

  closeOffspringModal(): void {
    this.showOffspringModal = false;
  }

  onOffspringAdded(): void {
    this.showOffspringModal = false;
    this.loadBreedingDetails();
  }

  goBack(): void {
    this.router.navigate(['/breedings']);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'started':
        return 'status-started';
      case 'inprocess':
      case 'in_process':
        return 'status-inprocess';
      case 'done':
        return 'status-done';
      case 'voided':
        return 'status-voided';
      default:
        return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toLowerCase()) {
      case 'started':
        return 'Started';
      case 'inprocess':
      case 'in_process':
        return 'In Process';
      case 'done':
        return 'Done';
      case 'voided':
        return 'Voided';
      default:
        return status;
    }
  }
}
