import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from 'src/environments/environment';
import { parseDocumentsCard, SharedDocumentsCardComponent } from './shared-documents-card.component';

describe('parseDocumentsCard', () => {
  it('reads a documents card, including old ones that still carry file_url', () => {
    const card = parseDocumentsCard(JSON.stringify({
      __type: 'documents', offspring_name: 'Biscuit',
      documents: [
        { id: 1, file_name: 'health.pdf', file_type: 'application/pdf', file_size: 2048 },
        { id: 2, file_name: 'pedigree.jpg', file_type: 'image/jpeg', file_size: 10, file_url: '/storage/app/doc_x.jpg' },
      ],
    }));
    expect(card?.offspring_name).toBe('Biscuit');
    expect(card?.documents.map(d => d.id)).toEqual([1, 2]);
  });

  it('returns null for plain text, location cards and malformed JSON', () => {
    expect(parseDocumentsCard('Hello there')).toBeNull();
    expect(parseDocumentsCard(JSON.stringify({ __type: 'location', name: 'Farm' }))).toBeNull();
    expect(parseDocumentsCard('{"__type": "documents"')).toBeNull();
    expect(parseDocumentsCard(JSON.stringify({ __type: 'documents' }))?.documents).toEqual([]);
  });
});

describe('SharedDocumentsCardComponent', () => {
  let fixture: ComponentFixture<SharedDocumentsCardComponent>;
  const card = {
    offspring_name: 'Biscuit',
    documents: [
      { id: 1, file_name: 'health.pdf', file_type: 'application/pdf', file_size: 2048 },
      { id: 2, file_name: 'old.pdf', file_type: 'application/pdf', file_size: 10 },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SharedDocumentsCardComponent] }).compileComponents();
    fixture = TestBed.createComponent(SharedDocumentsCardComponent);
    fixture.componentInstance.card = card;
  });

  it('lists each file with a View link to its signed URL, never raw JSON', () => {
    fixture.componentInstance.links = { 1: '/api/documents/download/1?exp=9&sig=ab' };
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Documents shared');
    expect(el.textContent).toContain('Biscuit');
    expect(el.textContent).toContain('health.pdf');
    expect(el.textContent).not.toContain('__type');
    const link = el.querySelector('a[data-doc-id="1"]') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe(`${environment.API_HOST}/api/documents/download/1?exp=9&sig=ab`);
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('marks files the breeder removed as no longer available', () => {
    fixture.componentInstance.links = { 1: '/api/documents/download/1?exp=9&sig=ab' };
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('a[data-doc-id="2"]')).toBeNull();
    expect(el.textContent).toContain('No longer available');
  });

  it('shows a loading state until links arrive', () => {
    fixture.componentInstance.links = null;
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('a[data-doc-id]')).toBeNull();
    expect(el.textContent).toContain('Loading');
  });
});
