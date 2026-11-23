import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { environment } from 'src/environments/environment';

export interface SharedDocumentRef {
  id: number;
  file_name: string;
  file_type?: string;
  file_size?: number;
}

export interface DocumentsCard {
  offspring_name?: string;
  documents: SharedDocumentRef[];
}

/** The "documents shared" message a breeder sends; null for any other message. */
export function parseDocumentsCard(content: string): DocumentsCard | null {
  let data: any;
  try {
    data = JSON.parse(content);
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object' || data.__type !== 'documents') return null;
  const documents: SharedDocumentRef[] = (Array.isArray(data.documents) ? data.documents : [])
    .filter((d: any) => d && typeof d.id === 'number')
    .map((d: any) => ({ id: d.id, file_name: String(d.file_name ?? 'Document'), file_type: d.file_type, file_size: d.file_size }));
  return { offspring_name: data.offspring_name, documents };
}

/**
 * Card for documents a breeder shared in a chat. Download links come from the
 * backend (signed, short-lived); a file without a link was removed by the breeder.
 */
@Component({
  selector: 'app-shared-documents-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shared-documents-card.component.html',
  styleUrls: ['./shared-documents-card.component.css'],
})
export class SharedDocumentsCardComponent {
  @Input() card!: DocumentsCard;
  /** document id → host-relative signed URL; null while loading */
  @Input() links: Record<number, string> | null = null;

  url(id: number): string | null {
    const path = this.links?.[id];
    return path ? `${environment.API_HOST}${path}` : null;
  }

  icon(doc: SharedDocumentRef): string {
    return doc.file_type === 'application/pdf' ? 'bi-file-earmark-pdf' : 'bi-file-earmark-image';
  }

  size(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
