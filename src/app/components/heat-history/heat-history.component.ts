import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';

import { HeatCycleService, apiErrorMessage } from 'src/app/services/heat-cycle.service';
import { ToastService } from 'src/app/services/toast.service';
import { ConfirmService } from 'src/app/services/confirm.service';
import { ModalService } from 'src/app/services/modal.service';
import { IEventFormPet, IHeatCycle, IReminder } from 'src/app/models/heat-cycle';
import {
  daysBetween,
  formatCalendarDate,
  formatCalendarRange,
  parseCalendarDate,
  todayCalendarDate,
} from 'src/app/utils/calendar-date';
import { HeatEventFormComponent, HeatEventKind } from '../heat-event-form/heat-event-form.component';

/** One female dog's heat cycles and reminders. Used in the Pets page modal. */
@Component({
  selector: 'app-heat-history',
  standalone: true,
  imports: [CommonModule, FormsModule, HeatEventFormComponent],
  templateUrl: './heat-history.component.html',
  styleUrls: ['./heat-history.component.css'],
})
export class HeatHistoryComponent implements OnInit, OnChanges, OnDestroy {
  @Input() petId: string | null = null;
  @Input() petName = '';
  /** The hosting app-modal: reloads when it opens, closes before "View in calendar" navigates. */
  @Input() modalId: string | null = null;

  cycles: IHeatCycle[] = [];
  reminders: IReminder[] = [];
  isLoading = false;
  loadError = '';

  // Inline "End cycle"
  showEndPicker = false;
  endDateValue = '';
  endError = '';
  isEnding = false;

  // Shared event form
  formOpen = false;
  formMode: 'create' | 'edit' = 'create';
  formKind: HeatEventKind = 'cycle';
  formCycle: IHeatCycle | null = null;
  formReminder: IReminder | null = null;

  private modalSub?: Subscription;
  private loadSub?: Subscription;

  readonly formatDate = formatCalendarDate;
  readonly formatRange = formatCalendarRange;

  constructor(
    private heatService: HeatCycleService,
    private toast: ToastService,
    private confirmService: ConfirmService,
    private modalService: ModalService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (this.modalId) {
      // The modal stays mounted while hidden; refresh every time it opens.
      this.modalSub = this.modalService.getModalState(this.modalId).subscribe(open => {
        if (open && this.petId) this.load();
        if (!open) this.resetTransientState();
      });
    } else if (this.petId) {
      this.load();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['petId'] && !changes['petId'].firstChange && this.petId) {
      this.resetTransientState();
      this.cycles = [];
      this.reminders = [];
      this.load();
    }
  }

  ngOnDestroy(): void {
    this.modalSub?.unsubscribe();
    this.loadSub?.unsubscribe();
  }

  private resetTransientState(): void {
    this.showEndPicker = false;
    this.endError = '';
    this.formOpen = false;
  }

  load(): void {
    if (!this.petId) return;
    this.loadSub?.unsubscribe();
    this.isLoading = true;
    this.loadError = '';
    this.loadSub = forkJoin({
      cycles: this.heatService.listCycles(this.petId),
      reminders: this.heatService.listReminders(this.petId),
    }).subscribe({
      next: ({ cycles, reminders }) => {
        this.cycles = cycles;
        this.reminders = reminders;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.isLoading = false;
        this.loadError = apiErrorMessage(err, 'Could not load heat history.');
        this.cdr.markForCheck();
      },
    });
  }

  get today(): string {
    return todayCalendarDate();
  }

  get openCycle(): IHeatCycle | null {
    return this.cycles.find(c => c.in_progress) || null;
  }

  /** Day 1 is the start date. */
  dayOfCycle(c: IHeatCycle): number {
    return Math.max(1, daysBetween(c.start_date, this.today) + 1);
  }

  /** Inclusive length of a finished cycle, or days so far for an open one. */
  cycleLength(c: IHeatCycle): number {
    return daysBetween(c.start_date, c.end_date || this.today) + 1;
  }

  /** Upcoming reminders first (soonest first), then past ones (most recent first). */
  get sortedReminders(): IReminder[] {
    const today = this.today;
    const upcoming = this.reminders.filter(r => r.remind_on >= today).sort((a, b) => a.remind_on.localeCompare(b.remind_on));
    const past = this.reminders.filter(r => r.remind_on < today).sort((a, b) => b.remind_on.localeCompare(a.remind_on));
    return [...upcoming, ...past];
  }

  isPast(r: IReminder): boolean {
    return r.remind_on < this.today;
  }

  get formPets(): IEventFormPet[] {
    return this.petId ? [{ id: this.petId, name: this.petName, gender: 'Female' }] : [];
  }

  // ── End cycle ──

  openEndPicker(): void {
    const open = this.openCycle;
    if (!open) return;
    const today = this.today;
    this.endDateValue = today < open.start_date ? open.start_date : today;
    this.endError = '';
    this.showEndPicker = true;
  }

  cancelEnd(): void {
    this.showEndPicker = false;
    this.endError = '';
  }

  confirmEnd(): void {
    const open = this.openCycle;
    if (!open || this.isEnding) return;
    if (!parseCalendarDate(this.endDateValue)) {
      this.endError = 'Enter an end date.';
      return;
    }
    if (this.endDateValue < open.start_date) {
      this.endError = 'End date must be on or after the start date.';
      return;
    }
    this.isEnding = true;
    this.heatService.updateCycle(open.id, {
      start_date: open.start_date,
      end_date: this.endDateValue,
      notes: open.notes,
    }).subscribe({
      next: () => {
        this.isEnding = false;
        this.showEndPicker = false;
        this.toast.success('Heat cycle ended.');
        this.load();
      },
      error: err => {
        this.isEnding = false;
        this.endError = apiErrorMessage(err, 'Could not end the cycle.');
        this.toast.error(this.endError);
      },
    });
  }

  // ── Add / edit / delete ──

  addCycle(): void {
    if (this.openCycle) return;
    this.openForm('create', 'cycle');
  }

  addReminder(): void {
    this.openForm('create', 'reminder');
  }

  editCycle(c: IHeatCycle): void {
    this.openForm('edit', 'cycle', c, null);
  }

  editReminder(r: IReminder): void {
    this.openForm('edit', 'reminder', null, r);
  }

  private openForm(mode: 'create' | 'edit', kind: HeatEventKind,
                   cycle: IHeatCycle | null = null, reminder: IReminder | null = null): void {
    this.formMode = mode;
    this.formKind = kind;
    this.formCycle = cycle;
    this.formReminder = reminder;
    this.formOpen = true;
  }

  onFormDone(): void {
    this.formOpen = false;
    this.load();
  }

  async deleteCycle(c: IHeatCycle): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: 'Delete heat cycle?',
      message: `This permanently deletes the heat cycle starting ${formatCalendarDate(c.start_date)} for ${this.petName}.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.heatService.deleteCycle(c.id).subscribe({
      next: () => { this.toast.success('Heat cycle deleted.'); this.load(); },
      error: err => this.toast.error(apiErrorMessage(err, 'Could not delete the cycle.')),
    });
  }

  async deleteReminder(r: IReminder): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: 'Delete reminder?',
      message: `This permanently deletes the reminder on ${formatCalendarDate(r.remind_on)} for ${this.petName}.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.heatService.deleteReminder(r.id).subscribe({
      next: () => { this.toast.success('Reminder deleted.'); this.load(); },
      error: err => this.toast.error(apiErrorMessage(err, 'Could not delete the reminder.')),
    });
  }

  viewInCalendar(): void {
    if (this.modalId) this.modalService.close(this.modalId);
    this.router.navigate(['/calendar'], { queryParams: { pet: this.petId } });
  }
}
