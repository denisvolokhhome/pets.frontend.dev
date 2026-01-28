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


  apiurl = environment.API_URL;
  apihost = environment.API_HOST;

  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) return '';
    
    // Remove 'app/' prefix if present (backend returns 'app/filename.png')
    const cleanPath = imagePath.startsWith('app/') ? imagePath.substring(4) : imagePath;
    
    // Use /storage endpoint instead of /api
    return `${this.apihost}/storage/${cleanPath}`;
  }


  deletePet(pet_id: any): void{
    this.deletingPet.emit(this.pet.id);
  }

  editPet(pet_id: any): void{
    // this.dataService.getPet(this.pet.pet_id).subscribe(

    // )
    this.editingPet.emit(this.pet);
  }
}
