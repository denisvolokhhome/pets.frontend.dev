import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Observable } from 'rxjs';

import { WaitlistService } from '../../services/waitlist.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { DEPOSIT_STATUS_LABELS, depositBadgeClass, IWaitlistEntry } from '../../models/waitlist';
import { offspringDisplayName } from '../../utils/format-utils';

/**
 * Waitlist card on the breeding detail page: the litter's pick order, with
 * reordering, adding from the general list, and matching to an offspring.
 *
 * Note flow: a reorder is applied immediately with no note; the moved row then
 * offers "Add a note", which re-sends reorder with the same position plus the note.
 */
@Component({
  standalone: false,
  selector: 'app-breeding-waitlist',
  templateUrl: './breeding-waitlist.component.html',
  styleUrls: ['./breeding-waitlist.component.css']
})
export class BreedingWaitlistComponent implements OnInit, OnChanges, OnDestroy {
  @Input() breedingId!: number | string;
  @Input() offspring: any[] = [];
  @Input() voided = false;
  /** Emitted after a match so the host page can refresh its offspring list. */
  @Output() changed = new EventEmitter<void>();

  private destroyed = false;
  entries: IWaitlistEntry[] = [];
  general: IWaitlistEntry[] = [];
  isLoading = true;
  loadFailed = false;
  busy = false;

  showPicker = false;
  matchChoice: Record<string, string> = {};
  withdrawPanelId: string | null = null;
  /** The row just moved, offering "Add a note". */
  lastMoved: { id: string } | null = null;
  noteOpen = false;
  noteText = '';

  readonly depositLabels = DEPOSIT_STATUS_LABELS;
  readonly depositClass = depositBadgeClass;

  constructor(
    private waitlistService: WaitlistService,
    private toastr: ToastService,
    private confirmService: ConfirmService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  private redraw(): void {
    if (!this.destroyed) this.cdr.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['breedingId'] && !changes['breedingId'].firstChange) this.load();
  }

  private get id(): number {
    return Number(this.breedingId);
  }

  get availableOffspring(): any[] {
    return (this.offspring || []).filter(o => o.status === 'Available');
  }

  get canMatch(): boolean {
    return !this.voided && this.availableOffspring.length > 0;
  }

  get canPass(): boolean {
    return !this.voided && (this.offspring || []).length > 0;
  }

  get hasOverride(): boolean {
    return this.entries.some(e => e.position_override != null);
  }

  offspringLabel(o: any): string {
    return `${offspringDisplayName(o.name)}${o.gender ? ' (' + o.gender + ')' : ''}`;
  }

  load(): void {
    if (this.voided) {
      this.isLoading = false;
      return;
    }
    this.waitlistService.getLitterWaitlist(this.id).subscribe({
      next: w => {
        if (this.destroyed) return;
        this.entries = w.entries;
        this.isLoading = false;
        this.loadFailed = false;
        this.pruneState();
        this.redraw();
      },
      error: () => {
        if (this.destroyed) return;
        this.isLoading = false;
        this.loadFailed = true;
        this.redraw();
      }
    });
    this.waitlistService.getBreederWaitlist().subscribe({
      next: w => { if (this.destroyed) return; this.general = w.general; this.redraw(); },
      error: () => { /* picker simply stays hidden */ }
    });
  }

  /** Drop UI state that points at things the fresh data no longer has. */
  private pruneState(): void {
    const available = new Set(this.availableOffspring.map(o => o.id));
    for (const id of Object.keys(this.matchChoice)) {
      if (!available.has(this.matchChoice[id])) delete this.matchChoice[id];
    }
    if (this.lastMoved && !this.entries.some(e => e.id === this.lastMoved!.id)) {
      this.lastMoved = null;
      this.noteOpen = false;
    }
  }

  /** Runs a mutation; always reloads afterwards (a 409 means another tab changed the list). */
  private act(request: Observable<unknown>, success: string, onSuccess?: () => void): void {
    if (this.busy) return;
    this.busy = true;
    request.subscribe({
      next: () => {
        this.busy = false;
        onSuccess?.();
        this.toastr.success(success, 'Waitlist');
        this.load();
      },
      error: err => {
        this.busy = false;
        const detail = err?.error?.detail;
        const message = typeof detail === 'string' ? detail : detail?.message;
        this.toastr.error(message || 'Could not save your change. The list was refreshed.', 'Error');
        this.load();
      }
    });
  }

  // ── Ordering ──

  drop(event: CdkDragDrop<IWaitlistEntry[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.moveTo(this.entries[event.previousIndex], event.currentIndex + 1);
  }

  moveBy(index: number, delta: -1 | 1): void {
    this.moveTo(this.entries[index], index + 1 + delta);
  }

  private moveTo(entry: IWaitlistEntry | undefined, position: number): void {
    if (!entry || position < 1 || position > this.entries.length) return;
    this.act(this.waitlistService.reorder(entry.id, position), 'Order updated', () => {
      this.lastMoved = { id: entry.id };
      this.noteOpen = false;
      this.noteText = '';
    });
  }

  openNote(): void {
    this.noteOpen = true;
  }

  saveNote(): void {
    const moved = this.lastMoved;
    const note = this.noteText.trim();
    if (!moved || !note) return;
    // Position is read now, not at move time: reloads may have reordered the list since.
    const position = this.entries.findIndex(e => e.id === moved.id) + 1;
    if (position < 1) {
      this.lastMoved = null;
      this.noteOpen = false;
      return;
    }
    this.act(this.waitlistService.reorder(moved.id, position, note), 'Note saved', () => {
      this.noteOpen = false;
      this.noteText = '';
      this.lastMoved = null;
    });
  }

  resetOrder(): void {
    this.act(this.waitlistService.resetOrder(this.id), 'Order reset to deposit order', () => (this.lastMoved = null));
  }

  // ── General list ──

  addFromGeneral(entry: IWaitlistEntry): void {
    this.act(this.waitlistService.move(entry.id, this.id), `${entry.display_name} added to this litter.`,
      () => (this.showPicker = false));
  }

  // ── Matching ──

  match(entry: IWaitlistEntry): void {
    const offspringId = this.matchChoice[entry.id];
    if (!offspringId) return;
    this.act(this.waitlistService.match(entry.id, offspringId), `${entry.display_name} matched.`, () => {
      delete this.matchChoice[entry.id];
      this.changed.emit();
    });
  }

  pass(entry: IWaitlistEntry): void {
    this.act(this.waitlistService.pass(entry.id), `${entry.display_name} passed on this pick.`);
  }

  async startWithdraw(entry: IWaitlistEntry): Promise<void> {
    if (entry.deposit_status === 'received') {
      this.withdrawPanelId = this.withdrawPanelId === entry.id ? null : entry.id;
      return;
    }
    const ok = await this.confirmService.confirm({
      title: 'Withdraw this person?',
      message: `${entry.display_name} will be removed from the waitlist.`,
      confirmText: 'Withdraw',
      danger: true
    });
    if (ok) this.withdraw(entry);
  }

  withdraw(entry: IWaitlistEntry, outcome?: 'refunded' | 'forfeited'): void {
    this.act(this.waitlistService.withdraw(entry.id, outcome), 'Entry withdrawn.', () => (this.withdrawPanelId = null));
  }
}
