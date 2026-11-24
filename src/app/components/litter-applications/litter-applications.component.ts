import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { LitterApplicationService } from '../../services/litter-application.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import {
  APPLICATION_STATUS_BADGE,
  APPLICATION_STATUS_LABELS,
  ApplicationStatus,
  LitterApplication,
  ManualApplicationStatus,
  OffspringBrief,
  apiErrorMessage,
} from '../../models/litter-application';
import { offspringDisplayName } from 'src/app/utils/format-utils';

type Filter = 'all' | ApplicationStatus;

/** Breeder's Applications section on the litter page. */
@Component({
  selector: 'app-litter-applications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './litter-applications.component.html',
  styleUrls: ['./litter-applications.component.css']
})
export class LitterApplicationsComponent implements OnInit, OnChanges {
  @Input() breedingId!: number | string;
  /** breeding.puppies (Offspring records with id, name, gender, status). */
  @Input() puppies: any[] | null = [];
  @Input() voided = false;
  /** Emitted after an assignment changes a puppy's status, so the page can refresh. */
  @Output() changed = new EventEmitter<void>();

  readonly statusLabels = APPLICATION_STATUS_LABELS;
  readonly statusBadge = APPLICATION_STATUS_BADGE;
  readonly filters: Filter[] = ['all', 'new', 'contacted', 'waitlisted', 'assigned', 'declined'];
  readonly manualStatuses: ManualApplicationStatus[] = ['new', 'contacted', 'waitlisted', 'declined'];

  applications: LitterApplication[] = [];
  isLoading = true;
  loadError: string | null = null;
  filter: Filter = 'all';
  busy: { [id: string]: boolean } = {};

  viewing: LitterApplication | null = null;
  assigning: LitterApplication | null = null;
  assignPick: string | null = null;
  assignError: string | null = null;
  isAssigning = false;
  /** The row button that opened View/Assign; focus goes back to it on close. */
  private returnFocusEl: HTMLElement | null = null;

  constructor(
    private service: LitterApplicationService,
    private toastr: ToastService,
    private confirmService: ConfirmService,
    private host: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['breedingId'] && !changes['breedingId'].firstChange) this.load();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.assigning && !this.isAssigning) this.closeAssign();
    else if (this.viewing) this.closeView();
  }

  // ── Dialog focus ──

  /** Remember the trigger, unless we're moving from one dialog to the other. */
  private rememberTrigger(): void {
    if (this.viewing || this.assigning) return;
    const active = document.activeElement as HTMLElement | null;
    this.returnFocusEl = active && active !== document.body ? active : null;
  }

  /** Focus a dialog element once it has rendered. */
  private focusInDialog(selector: string): void {
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus());
  }

  private restoreFocus(): void {
    const el = this.returnFocusEl;
    this.returnFocusEl = null;
    // The trigger may be gone (e.g. Assign disappears once the puppy is assigned).
    setTimeout(() => { if (el?.isConnected) el.focus(); });
  }

  load(): void {
    if (!this.breedingId) return;
    this.isLoading = true;
    this.loadError = null;
    this.service.listApplications(this.breedingId).subscribe({
      next: apps => {
        this.applications = apps || [];
        this.isLoading = false;
      },
      error: err => {
        this.isLoading = false;
        this.loadError = apiErrorMessage(err, 'Could not load applications.');
      }
    });
  }

  // ── Derived ──

  count(f: Filter): number {
    return f === 'all' ? this.applications.length : this.applications.filter(a => a.status === f).length;
  }

  filterLabel(f: Filter): string {
    return f === 'all' ? 'All' : this.statusLabels[f];
  }

  get visible(): LitterApplication[] {
    return this.filter === 'all' ? this.applications : this.applications.filter(a => a.status === this.filter);
  }

  get availablePuppies(): any[] {
    return (this.puppies || []).filter(p => p?.status === 'Available');
  }

  sourceLabel(app: LitterApplication): string {
    if (app.source === 'offspring') return `Puppy: ${this.puppyName(app.requested_offspring)}`;
    return 'Litter';
  }

  puppyName(p: OffspringBrief | any | null): string {
    if (!p) return '—';
    const name = offspringDisplayName(p.name);
    return name === 'Unnamed' ? `Unnamed${p.gender ? ' ' + p.gender.toLowerCase() : ''} puppy` : name;
  }

  canAssign(app: LitterApplication): boolean {
    return !this.voided
      && (app.status === 'new' || app.status === 'contacted' || app.status === 'waitlisted')
      && this.availablePuppies.length > 0;
  }

  trackById(_: number, app: LitterApplication): string {
    return app.id;
  }

  private replace(updated: LitterApplication): void {
    this.applications = this.applications.map(a => (a.id === updated.id ? updated : a));
    if (this.viewing?.id === updated.id) this.viewing = updated;
  }

  // ── Actions ──

  changeStatus(app: LitterApplication, status: ManualApplicationStatus, select?: HTMLSelectElement): void {
    if (status === app.status || this.busy[app.id]) return;
    this.busy[app.id] = true;
    this.service.setStatus(app.id, status).subscribe({
      next: updated => {
        this.busy[app.id] = false;
        this.replace(updated);
        this.toastr.success(`${updated.applicant_name || 'Applicant'} is now ${this.statusLabels[updated.status]}.`, 'Status updated');
      },
      error: err => {
        this.busy[app.id] = false;
        if (select) select.value = app.status;
        this.toastr.error(apiErrorMessage(err, 'Could not change the status.'), 'Error');
        if (err?.status === 409) this.load();
      }
    });
  }

  openView(app: LitterApplication): void {
    this.rememberTrigger();
    this.viewing = app;
    this.focusInDialog('#apps-view-title');
  }

  closeView(): void {
    this.viewing = null;
    this.restoreFocus();
  }

  openAssign(app: LitterApplication): void {
    this.rememberTrigger();
    this.viewing = null;
    this.assigning = app;
    this.assignError = null;
    const requested = app.requested_offspring?.id;
    this.assignPick = this.availablePuppies.some(p => p.id === requested)
      ? requested!
      : (this.availablePuppies.length === 1 ? this.availablePuppies[0].id : null);
    // The picked puppy's radio, else the first one, else the heading.
    setTimeout(() => {
      const root = this.host.nativeElement;
      (root.querySelector<HTMLElement>('input[name="assign-puppy"]:checked')
        || root.querySelector<HTMLElement>('input[name="assign-puppy"]')
        || root.querySelector<HTMLElement>('#apps-assign-title'))?.focus();
    });
  }

  closeAssign(): void {
    if (this.isAssigning) return;
    this.assigning = null;
    this.assignPick = null;
    this.assignError = null;
    this.restoreFocus();
  }

  confirmAssign(): void {
    const app = this.assigning;
    if (!app || !this.assignPick || this.isAssigning) return;
    this.isAssigning = true;
    this.assignError = null;
    this.service.assignPuppy(app.id, this.assignPick).subscribe({
      next: updated => {
        this.isAssigning = false;
        this.assigning = null;
        this.assignPick = null;
        this.restoreFocus();
        this.replace(updated);
        this.toastr.success(
          `${this.puppyName(updated.assigned_offspring)} is reserved for ${updated.applicant_name || 'this applicant'}.`,
          'Puppy assigned'
        );
        this.changed.emit();
        this.load();
      },
      error: err => {
        this.isAssigning = false;
        this.assignError = apiErrorMessage(err, 'Could not assign the puppy.');
        if (err?.status === 409) {
          this.load();
          this.changed.emit();
        }
      }
    });
  }

  async unassign(app: LitterApplication): Promise<void> {
    if (this.busy[app.id]) return;
    const ok = await this.confirmService.confirm({
      title: 'Undo assignment?',
      message: `${this.puppyName(app.assigned_offspring)} goes back to Available and ${app.applicant_name || 'the applicant'} back to Waitlisted.`,
      confirmText: 'Undo assignment',
      danger: true
    });
    if (!ok) return;
    this.busy[app.id] = true;
    this.service.unassignPuppy(app.id).subscribe({
      next: updated => {
        this.busy[app.id] = false;
        this.replace(updated);
        this.toastr.success('The puppy is available again.', 'Assignment undone');
        this.changed.emit();
        this.load();
      },
      error: err => {
        this.busy[app.id] = false;
        this.toastr.error(apiErrorMessage(err, 'Could not undo the assignment.'), 'Error');
        if (err?.status === 409) this.load();
      }
    });
  }
}
