import { Component, OnInit } from '@angular/core';

import { WaitlistService } from '../../services/waitlist.service';
import { DataService } from '../../services/data.service';
import { ConfirmService } from '../../services/confirm.service';
import { ToastService } from '../../services/toast.service';
import { DEPOSIT_STATUS_LABELS, IWaitlistEntry, IWaitlistEvent } from '../../models/waitlist';
import { formatDisplayDate, statusBadgeClass } from '../../utils/format-utils';

type Section = 'requests' | 'general';
type PanelKind = 'move' | 'history' | 'withdraw';

interface BreedingOption { id: number; label: string; }

const SECTION_KEY = 'waitlist_section';

/** Breeder's waitlist: incoming requests to review, and the ordered general list. */
@Component({
  standalone: false,
  selector: 'app-waitlist',
  templateUrl: './waitlist.component.html',
  styleUrls: ['./waitlist.component.css']
})
export class WaitlistComponent implements OnInit {
  section: Section = 'requests';
  pending: IWaitlistEntry[] = [];
  general: IWaitlistEntry[] = [];
  isLoading = true;

  readonly depositLabels = DEPOSIT_STATUS_LABELS;
  readonly badgeClass = statusBadgeClass;
  readonly formatDate = formatDisplayDate;

  /** Which row action panel (move / history / withdraw) is open, and for which entry. */
  panel: { id: string; kind: PanelKind } | null = null;
  breedings: BreedingOption[] = [];
  moveBreedingId: number | null = null;
  events: IWaitlistEvent[] = [];
  expandedRequestId: string | null = null;

  depositEntry: IWaitlistEntry | null = null;
  showManual = false;

  constructor(
    private waitlistService: WaitlistService,
    private dataService: DataService,
    private confirmService: ConfirmService,
    private toastr: ToastService
  ) {}

  ngOnInit(): void {
    try {
      const stored = sessionStorage.getItem(SECTION_KEY);
      if (stored === 'requests' || stored === 'general') this.section = stored;
    } catch { /* storage unavailable */ }
    this.load();
  }

  setSection(section: Section): void {
    this.section = section;
    this.panel = null;
    try { sessionStorage.setItem(SECTION_KEY, section); } catch { /* storage unavailable */ }
  }

  load(): void {
    this.waitlistService.getBreederWaitlist().subscribe({
      next: w => {
        this.pending = w.pending;
        this.general = w.general;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('Could not load your waitlist.', 'Error');
      }
    });
  }

  contactLine(e: IWaitlistEntry): string {
    return [e.contact_email, e.contact_phone].filter(Boolean).join(' · ');
  }

  answerEntries(e: IWaitlistEntry): { question: string; answer: string }[] {
    return Object.entries(e.application_answers ?? {}).map(([question, answer]) => ({ question, answer }));
  }

  toggleRequest(e: IWaitlistEntry): void {
    this.expandedRequestId = this.expandedRequestId === e.id ? null : e.id;
  }

  // ── Requests ──

  approve(e: IWaitlistEntry): void {
    this.waitlistService.approve(e.id).subscribe({
      next: () => { this.toastr.success(`${e.display_name} added to the waitlist.`, 'Waitlist'); this.load(); },
      error: () => this.toastr.error('Could not approve this request.', 'Error')
    });
  }

  async decline(e: IWaitlistEntry): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: 'Decline request?',
      message: `${e.display_name} will be told their request was declined.`,
      confirmText: 'Decline',
      danger: true
    });
    if (!ok) return;
    this.waitlistService.decline(e.id).subscribe({
      next: () => { this.toastr.success('Request declined.', 'Waitlist'); this.load(); },
      error: () => this.toastr.error('Could not decline this request.', 'Error')
    });
  }

  // ── General list row actions ──

  isPanel(e: IWaitlistEntry, kind: PanelKind): boolean {
    return this.panel?.id === e.id && this.panel.kind === kind;
  }

  private togglePanel(e: IWaitlistEntry, kind: PanelKind): boolean {
    if (this.isPanel(e, kind)) {
      this.panel = null;
      return false;
    }
    this.panel = { id: e.id, kind };
    return true;
  }

  openMove(e: IWaitlistEntry): void {
    if (!this.togglePanel(e, 'move')) return;
    this.moveBreedingId = e.breeding_id;
    if (this.breedings.length) return;
    this.dataService.getBreedings().subscribe({
      next: list => {
        this.breedings = (list ?? [])
          .filter(b => b.status !== 'Voided')
          .map(b => ({ id: Number(b.id), label: b.description || `Breeding #${b.id}` }));
      },
      error: () => this.toastr.error('Could not load your breedings.', 'Error')
    });
  }

  confirmMove(e: IWaitlistEntry): void {
    this.waitlistService.move(e.id, this.moveBreedingId).subscribe({
      next: () => { this.panel = null; this.toastr.success('Entry moved.', 'Waitlist'); this.load(); },
      error: () => this.toastr.error('Could not move this entry.', 'Error')
    });
  }

  openHistory(e: IWaitlistEntry): void {
    if (!this.togglePanel(e, 'history')) return;
    this.events = [];
    this.waitlistService.getEvents(e.id).subscribe({
      next: events => (this.events = events),
      error: () => this.toastr.error('Could not load history.', 'Error')
    });
  }

  async startWithdraw(e: IWaitlistEntry): Promise<void> {
    if (e.deposit_status === 'received') {
      this.togglePanel(e, 'withdraw');
      return;
    }
    const ok = await this.confirmService.confirm({
      title: 'Withdraw this person?',
      message: `${e.display_name} will be removed from the waitlist.`,
      confirmText: 'Withdraw',
      danger: true
    });
    if (ok) this.withdraw(e);
  }

  withdraw(e: IWaitlistEntry, outcome?: 'refunded' | 'forfeited'): void {
    this.waitlistService.withdraw(e.id, outcome).subscribe({
      next: () => { this.panel = null; this.toastr.success('Entry withdrawn.', 'Waitlist'); this.load(); },
      error: () => this.toastr.error('Could not withdraw this entry.', 'Error')
    });
  }

  // ── Modals ──

  onDepositSaved(): void {
    this.depositEntry = null;
    this.load();
  }

  onManualAdded(): void {
    this.showManual = false;
    this.load();
  }

  eventLabel(type: string): string {
    const text = type.replace(/_/g, ' ');
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}
