import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { HeatCycleService, apiErrorMessage } from 'src/app/services/heat-cycle.service';
import { ToastService } from 'src/app/services/toast.service';
import { ConfirmService } from 'src/app/services/confirm.service';
import { IEventFormPet, IHeatCycle, IReminder, isFemale } from 'src/app/models/heat-cycle';
import { formatCalendarDate, parseCalendarDate, todayCalendarDate } from 'src/app/utils/calendar-date';

export type HeatEventKind = 'cycle' | 'reminder';

export interface HeatEventSaved {
  kind: HeatEventKind;
  record: IHeatCycle | IReminder;
}

let nextFormId = 0;

/**
 * Overlay form to add or edit a heat cycle or a reminder. Render it with *ngIf
 * when it should open; it reads its inputs once on init.
 */
@Component({
  selector: 'app-heat-event-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './heat-event-form.component.html',
  styleUrls: ['./heat-event-form.component.css'],
})
export class HeatEventFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() kind: HeatEventKind = 'cycle';
  /** Preselected dog. */
  @Input() petId: string | null = null;
  /** Lock the dog select (opened from a dog's own history). Edit mode is always locked. */
  @Input() lockPet = false;
  /** Preselected date: the start date for a cycle, the date for a reminder. */
  @Input() date: string | null = null;
  /** Dogs for the select. Cycles only offer female dogs. */
  @Input() pets: IEventFormPet[] = [];
  /** The record being edited. */
  @Input() cycle: IHeatCycle | null = null;
  @Input() reminder: IReminder | null = null;

  @Output() saved = new EventEmitter<HeatEventSaved>();
  @Output() deleted = new EventEmitter<HeatEventKind>();
  @Output() closed = new EventEmitter<void>();

  readonly uid = `hef-${++nextFormId}`;

  selectedPetId = '';
  startDate = '';
  endDate = '';
  notes = '';
  remindOn = '';
  note = '';

  errors: Record<string, string> = {};
  serverError = '';
  isSubmitting = false;
  isDeleting = false;
  private confirmOpen = false;

  constructor(
    private heatService: HeatCycleService,
    private toast: ToastService,
    private confirmService: ConfirmService,
    private zone: NgZone,
    private host: ElementRef<HTMLElement>,
  ) {}

  /**
   * Escape closes only this form. Listening in the capture phase lets us stop the
   * event before a hosting app-modal (which listens on document) closes too.
   * While our delete confirm is open, let it through so only the confirm closes.
   */
  private readonly escapeListener = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || this.confirmOpen || this.confirmService.isOpen) return;
    event.stopPropagation();
    event.preventDefault();
    this.zone.run(() => this.close());
  };

  /** Focus the first editable field (or the heading) when the form opens. */
  ngAfterViewInit(): void {
    setTimeout(() => {
      const root = this.host.nativeElement;
      const target = root.querySelector<HTMLElement>(
        '.hef-body select:not([disabled]), .hef-body input:not([readonly]):not([disabled]), .hef-body textarea'
      ) || root.querySelector<HTMLElement>('.hef-header h3');
      target?.focus();
    });
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.escapeListener, true);
  }

  ngOnInit(): void {
    document.addEventListener('keydown', this.escapeListener, true);
    const today = todayCalendarDate();
    if (this.mode === 'edit' && this.cycle) {
      this.kind = 'cycle';
      this.selectedPetId = this.cycle.pet_id;
      this.startDate = this.cycle.start_date;
      this.endDate = this.cycle.end_date || '';
      this.notes = this.cycle.notes || '';
    } else if (this.mode === 'edit' && this.reminder) {
      this.kind = 'reminder';
      this.selectedPetId = this.reminder.pet_id;
      this.remindOn = this.reminder.remind_on;
      this.note = this.reminder.note || '';
    } else {
      this.selectedPetId = this.petId || '';
      this.startDate = this.date || today;
      this.remindOn = this.date || today;
      this.ensurePetFitsKind();
      // Nothing preselected and only one choice: pick it.
      if (!this.selectedPetId && this.petOptions.length === 1) {
        this.selectedPetId = this.petOptions[0].id;
      }
    }
  }

  get isEdit(): boolean {
    return this.mode === 'edit';
  }

  get petLocked(): boolean {
    return this.isEdit || (this.lockPet && !!this.petId);
  }

  get title(): string {
    const noun = this.kind === 'cycle' ? 'heat cycle' : 'reminder';
    return `${this.isEdit ? 'Edit' : 'Add'} ${noun}`;
  }

  /** Dogs offered by the select for the current kind. */
  get petOptions(): IEventFormPet[] {
    return this.kind === 'cycle' ? this.pets.filter(isFemale) : this.pets;
  }

  /** The locked dog's name (it may not be in `pets`). */
  get lockedPetName(): string {
    const id = this.selectedPetId;
    return this.pets.find(p => p.id === id)?.name
      || this.cycle?.pet_name || this.reminder?.pet_name || '';
  }

  setKind(kind: HeatEventKind): void {
    if (this.isEdit || this.kind === kind) return;
    this.kind = kind;
    this.errors = {};
    this.serverError = '';
    this.ensurePetFitsKind();
  }

  private ensurePetFitsKind(): void {
    if (this.petLocked) return;
    if (this.selectedPetId && !this.petOptions.some(p => p.id === this.selectedPetId)) {
      this.selectedPetId = '';
    }
  }

  validate(): boolean {
    this.errors = {};
    if (!this.selectedPetId) this.errors['pet'] = 'Choose a dog.';
    if (this.kind === 'cycle') {
      if (!parseCalendarDate(this.startDate)) this.errors['start'] = 'Enter a start date.';
      if (this.endDate && !parseCalendarDate(this.endDate)) this.errors['end'] = 'Enter a valid end date.';
      // 'YYYY-MM-DD' strings compare correctly as text.
      if (!this.errors['start'] && !this.errors['end'] && this.endDate && this.endDate < this.startDate) {
        this.errors['end'] = 'End date must be on or after the start date.';
      }
    } else if (!parseCalendarDate(this.remindOn)) {
      this.errors['remindOn'] = 'Enter a date.';
    }
    return Object.keys(this.errors).length === 0;
  }

  save(): void {
    this.serverError = '';
    if (!this.validate() || this.isSubmitting) return;
    this.isSubmitting = true;

    let request: Observable<IHeatCycle | IReminder>;
    if (this.kind === 'cycle') {
      const body = { start_date: this.startDate, end_date: this.endDate || null, notes: this.notes.trim() || null };
      request = this.isEdit && this.cycle
        ? this.heatService.updateCycle(this.cycle.id, body)
        : this.heatService.createCycle(this.selectedPetId, body);
    } else {
      const body = { remind_on: this.remindOn, note: this.note.trim() || null };
      request = this.isEdit && this.reminder
        ? this.heatService.updateReminder(this.reminder.id, body)
        : this.heatService.createReminder(this.selectedPetId, body);
    }

    const kind = this.kind;
    request.subscribe({
      next: record => {
        this.isSubmitting = false;
        this.toast.success(kind === 'cycle'
          ? (this.isEdit ? 'Heat cycle updated.' : 'Heat cycle added.')
          : (this.isEdit ? 'Reminder updated.' : 'Reminder added.'));
        this.saved.emit({ kind, record });
      },
      error: err => {
        this.isSubmitting = false;
        this.serverError = apiErrorMessage(err, 'Could not save. Please try again.');
        this.toast.error(this.serverError);
      },
    });
  }

  async remove(): Promise<void> {
    if (!this.isEdit || this.isDeleting) return;
    const isCycle = this.kind === 'cycle';
    const what = isCycle
      ? `the heat cycle starting ${formatCalendarDate(this.cycle?.start_date)}`
      : `the reminder on ${formatCalendarDate(this.reminder?.remind_on)}`;
    this.confirmOpen = true;
    const ok = await this.confirmService.confirm({
      title: isCycle ? 'Delete heat cycle?' : 'Delete reminder?',
      message: `This permanently deletes ${what}${this.lockedPetName ? ' for ' + this.lockedPetName : ''}.`,
      confirmText: 'Delete',
      danger: true,
    });
    this.confirmOpen = false;
    if (!ok) return;

    this.isDeleting = true;
    const request = isCycle && this.cycle
      ? this.heatService.deleteCycle(this.cycle.id)
      : this.heatService.deleteReminder(this.reminder!.id);
    request.subscribe({
      next: () => {
        this.isDeleting = false;
        this.toast.success(isCycle ? 'Heat cycle deleted.' : 'Reminder deleted.');
        this.deleted.emit(this.kind);
      },
      error: err => {
        this.isDeleting = false;
        this.serverError = apiErrorMessage(err, 'Could not delete. Please try again.');
        this.toast.error(this.serverError);
      },
    });
  }

  /** A save or delete is in flight: closing now would drop the parent's refresh. */
  get isBusy(): boolean {
    return this.isSubmitting || this.isDeleting;
  }

  close(): void {
    if (this.isBusy) return;
    this.closed.emit();
  }
}
