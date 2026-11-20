import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { Coordinates } from 'src/app/models/search';
import { NearbyOffspring, OffspringService } from 'src/app/services/offspring.service';
import { environment } from 'src/environments/environment';

/**
 * A breeder's offspring shown over the map, plus "More near you": available
 * offspring from other breeders around the current search, so a seeker can
 * keep browsing without leaving the map.
 */
@Component({
  standalone: false,
  selector: 'app-breeder-offspring-modal',
  templateUrl: './breeder-offspring-modal.component.html',
  styleUrls: ['./breeder-offspring-modal.component.css']
})
export class BreederOffspringModalComponent implements OnInit, OnDestroy {
  @Input() breederId!: string;
  @Input() breederName = '';
  /** Current map search centre; suggestions are skipped without it */
  @Input() center: Coordinates | null = null;
  @Input() radius = 40;
  /** Preferred breeds for suggestions (listed first) */
  @Input() breedIds: number[] = [];
  /** Offer contacting the breeder when they have nothing listed */
  @Input() showContact = false;

  @Output() closed = new EventEmitter<void>();
  @Output() contact = new EventEmitter<void>();

  readonly NEARBY_LIMIT = 12;
  private readonly CLOSE_DURATION = 280;
  private readonly DISMISS_THRESHOLD = 120;

  nearby: NearbyOffspring[] = [];
  isClosing = false;
  dragOffsetY = 0;
  private dragStartY = 0;
  private isDragging = false;
  private previousBodyOverflow = '';
  private sub?: Subscription;

  constructor(private offspringService: OffspringService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.loadNearby();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    document.body.style.overflow = this.previousBodyOverflow;
  }

  private loadNearby(): void {
    if (!this.center) return;
    this.sub = this.offspringService.getNearbyOffsprings({
      latitude: this.center.latitude,
      longitude: this.center.longitude,
      radius: this.radius,
      excludeBreederId: this.breederId,
      breedIds: this.breedIds,
      limit: this.NEARBY_LIMIT,
    }).subscribe({
      next: items => { this.nearby = items; this.cdr.detectChanges(); },
      error: () => { this.nearby = []; }  // suggestions are optional
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.close();
  }

  close(): void {
    if (this.isClosing) return;
    this.isClosing = true;
    setTimeout(() => {
      document.body.style.overflow = this.previousBodyOverflow;
      this.closed.emit();
    }, this.CLOSE_DURATION);
  }

  onContact(): void {
    this.contact.emit();
  }

  imageUrl(o: NearbyOffspring): string | null {
    const img = o.primary_image ?? o.images?.[0];
    return img ? `${environment.API_HOST}${img.image_url}` : null;
  }

  price(o: NearbyOffspring): string | null {
    if (o.price === null || o.price === undefined || Number(o.price) <= 0) return null;
    return '$' + Number(o.price).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  trackById(_: number, o: NearbyOffspring): string {
    return o.id;
  }

  // Mobile drag-to-dismiss (bottom sheet)
  onDragStart(event: TouchEvent): void {
    if (window.innerWidth > 768) return;
    this.isDragging = true;
    this.dragStartY = event.touches[0].clientY;
    this.dragOffsetY = 0;
  }

  onDragMove(event: TouchEvent): void {
    if (!this.isDragging) return;
    this.dragOffsetY = Math.max(0, event.touches[0].clientY - this.dragStartY);
  }

  onDragEnd(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    const dismiss = this.dragOffsetY >= this.DISMISS_THRESHOLD;
    this.dragOffsetY = 0;
    if (dismiss) this.close();
  }
}
