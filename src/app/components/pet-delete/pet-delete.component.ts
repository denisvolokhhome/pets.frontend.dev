import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DataService } from 'src/app/services/data.service';
import { ModalService } from 'src/app/services/modal.service';
import { ToastService } from 'src/app/services/toast.service';

@Component({
  standalone: false,
  selector: 'app-pet-delete',
  templateUrl: './pet-delete.component.html',
  styleUrls: ['./pet-delete.component.css']
})
export class PetDeleteComponent implements OnInit{

  constructor(
    private dataService: DataService,
    public modalService: ModalService,
    private toastService: ToastService
  ){}

  /** True while the delete request is in flight; blocks repeat clicks on Remove. */
  isDeleting = false;

  @Input() pet_id: string = '';

  ngOnInit(): void {
  }

  form = new FormGroup({
    petId: new FormControl('')
  });

  submit() {
    if (this.isDeleting) return;
    this.isDeleting = true;

    this.dataService.deletePet(this.pet_id as string).subscribe({
      next: () => {
        this.modalService.close('deletePetModal');
        window.location.reload();
      },
      error: (error) => {
        this.isDeleting = false;
        console.error('Error deleting pet:', error);
        this.toastService.error(error?.message || 'Failed to remove pet. Please try again.', 'Could not remove pet');
      }
    });
  }

  modalClose() {
    this.modalService.close('deletePetModal');
  }
}
