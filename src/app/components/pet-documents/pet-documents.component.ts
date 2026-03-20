import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from 'src/app/services/data.service';
import { environment } from 'src/environments/environment';

export interface PetDocument {
  id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  created_at: string;
}

@Component({
  selector: 'app-pet-documents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pet-documents.component.html',
  styleUrls: ['./pet-documents.component.css']
})
export class PetDocumentsComponent implements OnInit, OnChanges {
  @Input() petId?: string;
  @Input() petName?: string;

  documents: PetDocument[] = [];
  isLoading = false;
  isUploading = false;
  apiHost = environment.API_HOST;

  constructor(private dataService: DataService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.petId) this.loadDocuments();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['petId'] && this.petId) {
      this.loadDocuments();
    }
  }

  loadDocuments(): void {
    if (!this.petId) return;
    this.isLoading = true;
    this.dataService.getPetDocuments(this.petId).subscribe({
      next: (docs) => { this.documents = docs; this.isLoading = false; this.cdr.detectChanges(); },
      error: () => { this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.petId) return;

    const file = input.files[0];
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      alert('Only PDF and image files are allowed.');
      input.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be under 10MB.');
      input.value = '';
      return;
    }

    this.isUploading = true;
    this.dataService.uploadPetDocument(this.petId, file).subscribe({
      next: (doc) => {
        this.documents.push(doc);
        this.isUploading = false;
        input.value = '';
        this.cdr.detectChanges();
      },
      error: () => {
        this.isUploading = false;
        input.value = '';
        this.cdr.detectChanges();
      }
    });
  }

  deleteDocument(doc: PetDocument): void {
    if (!this.petId || !confirm(`Delete "${doc.file_name}"?`)) return;
    this.dataService.deletePetDocument(this.petId, doc.id).subscribe({
      next: () => { this.documents = this.documents.filter(d => d.id !== doc.id); this.cdr.detectChanges(); },
      error: () => {}
    });
  }

  getDocUrl(doc: PetDocument): string {
    const path = doc.file_url.startsWith('/') ? doc.file_url.slice(1) : doc.file_url;
    return `${this.apiHost}/${path}`;
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  isPdf(doc: PetDocument): boolean {
    return doc.file_type === 'application/pdf';
  }

  isImage(doc: PetDocument): boolean {
    return doc.file_type.startsWith('image/');
  }
}
