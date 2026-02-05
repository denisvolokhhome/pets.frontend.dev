import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { IBreeding } from 'src/app/models/breeding';
import { IPet } from 'src/app/models/pet';
import { DataService } from 'src/app/services/data.service';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  standalone: false,
  selector: 'app-breeding-modal',
  templateUrl: './breeding-modal.component.html',
  styleUrls: ['./breeding-modal.component.css']
})
export class BreedingModalComponent implements OnInit, OnChanges {
  @Input() mode: 'create' | 'update' | 'view' = 'create';
  @Input() breeding: IBreeding | null = null;
  @Output() breedingSaved = new EventEmitter<IBreeding>();

  isOpen = false;
  formData = {
    description: ''
  };

  constructor(
    private dataService: DataService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('BreedingModalComponent ngOnInit');
    this.modalService.isVisible$.subscribe(isVisible => {
      console.log('Modal visibility changed:', isVisible);
      this.isOpen = isVisible;
      this.cdr.detectChanges();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['breeding'] && this.breeding) {
      this.populateForm();
    }
  }

  populateForm(): void {
    if (this.breeding) {
      this.formData.description = this.breeding.description || '';
    }
  }

  getTitle(): string {
    switch (this.mode) {
      case 'create':
        return 'Create New Breeding';
      case 'update':
        return 'Update Breeding';
      case 'view':
        return 'View Breeding Details';
      default:
        return 'Breeding';
    }
  }

  hasParentPets(): boolean {
    return !!(this.breeding?.parent_pets && this.breeding.parent_pets.length > 0);
  }

  onPetsAssigned(pets: IPet[]): void {
    // Reload breeding data after pets are assigned
    if (this.breeding?.id) {
      this.dataService.getLitter(this.breeding.id).subscribe({
        next: (updatedBreeding: any) => {
          this.breeding = updatedBreeding as IBreeding;
          this.breedingSaved.emit(updatedBreeding);
        },
        error: (error) => {
          console.error('Error reloading breeding:', error);
        }
      });
    }
  }

  onPuppiesAdded(puppies: IPet[]): void {
    // Reload breeding data after puppies are added
    if (this.breeding?.id) {
      this.dataService.getLitter(this.breeding.id).subscribe({
        next: (updatedBreeding: any) => {
          this.breeding = updatedBreeding as IBreeding;
          this.breedingSaved.emit(updatedBreeding);
        },
        error: (error) => {
          console.error('Error reloading breeding:', error);
        }
      });
    }
  }

  save(): void {
    if (this.mode === 'create') {
      // Create new breeding
      this.dataService.createLitter(this.formData.description || undefined).subscribe({
        next: (newBreeding: any) => {
          this.breedingSaved.emit(newBreeding);
          this.close();
        },
        error: (error) => {
          console.error('Error creating breeding:', error);
          alert('Failed to create breeding. Please try again.');
        }
      });
    } else if (this.mode === 'update' && this.breeding?.id) {
      // Update existing breeding
      this.dataService.updateLitter(this.breeding.id, { description: this.formData.description }).subscribe({
        next: (updatedBreeding: any) => {
          this.breedingSaved.emit(updatedBreeding);
          this.close();
        },
        error: (error) => {
          console.error('Error updating breeding:', error);
          alert('Failed to update breeding. Please try again.');
        }
      });
    }
  }

  close(): void {
    this.modalService.close();
    this.formData.description = '';
  }
}
