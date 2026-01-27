import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { ILitter } from 'src/app/models/litter';
import { IPet } from 'src/app/models/pet';
import { DataService } from 'src/app/services/data.service';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  selector: 'app-litter-modal',
  templateUrl: './litter-modal.component.html',
  styleUrls: ['./litter-modal.component.css']
})
export class LitterModalComponent implements OnInit, OnChanges {
  @Input() mode: 'create' | 'update' | 'view' = 'create';
  @Input() litter: ILitter | null = null;
  @Output() litterSaved = new EventEmitter<ILitter>();

  isOpen = false;
  formData = {
    description: ''
  };

  constructor(
    private dataService: DataService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    console.log('LitterModalComponent ngOnInit');
    this.modalService.isVisible$.subscribe(isVisible => {
      console.log('Modal visibility changed:', isVisible);
      this.isOpen = isVisible;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['litter'] && this.litter) {
      this.populateForm();
    }
  }

  populateForm(): void {
    if (this.litter) {
      this.formData.description = this.litter.description || '';
    }
  }

  getTitle(): string {
    switch (this.mode) {
      case 'create':
        return 'Create New Litter';
      case 'update':
        return 'Update Litter';
      case 'view':
        return 'View Litter Details';
      default:
        return 'Litter';
    }
  }

  hasParentPets(): boolean {
    return !!(this.litter?.parent_pets && this.litter.parent_pets.length > 0);
  }

  onPetsAssigned(pets: IPet[]): void {
    // Reload litter data after pets are assigned
    if (this.litter?.id) {
      this.dataService.getLitter(this.litter.id).subscribe({
        next: (updatedLitter) => {
          this.litter = updatedLitter;
          this.litterSaved.emit(updatedLitter);
        },
        error: (error) => {
          console.error('Error reloading litter:', error);
        }
      });
    }
  }

  onPuppiesAdded(puppies: IPet[]): void {
    // Reload litter data after puppies are added
    if (this.litter?.id) {
      this.dataService.getLitter(this.litter.id).subscribe({
        next: (updatedLitter) => {
          this.litter = updatedLitter;
          this.litterSaved.emit(updatedLitter);
        },
        error: (error) => {
          console.error('Error reloading litter:', error);
        }
      });
    }
  }

  save(): void {
    if (this.mode === 'create') {
      // Create new litter
      this.dataService.createLitter(this.formData.description || undefined).subscribe({
        next: (newLitter) => {
          this.litterSaved.emit(newLitter);
          this.close();
        },
        error: (error) => {
          console.error('Error creating litter:', error);
          alert('Failed to create litter. Please try again.');
        }
      });
    } else if (this.mode === 'update' && this.litter?.id) {
      // Update existing litter
      this.dataService.updateLitter(this.litter.id, { description: this.formData.description }).subscribe({
        next: (updatedLitter) => {
          this.litterSaved.emit(updatedLitter);
          this.close();
        },
        error: (error) => {
          console.error('Error updating litter:', error);
          alert('Failed to update litter. Please try again.');
        }
      });
    }
  }

  close(): void {
    this.modalService.close();
    this.formData.description = '';
  }
}
