import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IPet } from 'src/app/models/pet';
import { DataService } from 'src/app/services/data.service';
import { environment } from 'src/environments/environment';


@Component({
  standalone: false,
  selector: '[app-pet-card]',
  templateUrl: './pet-card.component.html',
  styleUrls: ['./pet-card.component.css']
})
export class PetCardComponent {

  constructor(private dataService: DataService){}

  @Input() pet: IPet;
  @Output() deletingPet = new EventEmitter();
  @Output() editingPet = new EventEmitter();
  @Output() quickBreeding = new EventEmitter();
  @Output() openDocuments = new EventEmitter();


  apiurl = environment.API_URL;
  apihost = environment.API_HOST;

  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) return '';
    
    // Backend returns 'app/filename.png', just prepend storage URL
    return `${this.apihost}/storage/${imagePath}`;
  }

  getPetImageUrl(): string {
    // Prefer image_url from backend if available
    if (this.pet.image_url) {
      return `${this.apihost}${this.pet.image_url}`;
    }
    // Fall back to constructing from image_path
    if (this.pet.image_path) {
      return this.getImageUrl(this.pet.image_path);
    }
    return '';
  }


  deletePet(pet_id: any): void{
    this.deletingPet.emit(this.pet.id);
  }

  editPet(pet_id: any): void{
    // this.dataService.getPet(this.pet.pet_id).subscribe(

    // )
    this.editingPet.emit(this.pet);
  }

  openQuickBreeding(event: any): void{
    event.stopPropagation();
    this.quickBreeding.emit(this.pet);
  }
  onOpenDocuments(event: any): void {
    event.stopPropagation();
    this.openDocuments.emit(this.pet);
  }

  hasHealthRecords(): boolean {
    return !!(
      this.pet.has_vaccination ||
      this.pet.has_microchip ||
      this.pet.has_healthcertificate ||
      this.pet.has_dewormed ||
      this.pet.has_birthcertificate
    );
  }
}
