import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { HeatCycleService, apiErrorMessage } from 'src/app/services/heat-cycle.service';
import { ToastService } from 'src/app/services/toast.service';
import {
  CALENDAR_EVENT_LABELS,
  ICalendarEvent,
  ICalendarHeatSpan,
  ICalendarPet,
  IHeatCycle,
  IReminder,
  isFemale,
} from 'src/app/models/heat-cycle';
import {
  CalendarMonth,
  MonthGridDay,
  addDays,
  buildMonthGrid,
  formatCalendarDate,
  formatCalendarDateLong,
  formatCalendarMonthKey,
  formatCalendarMonthLabel,
  monthOf,
  parseCalendarMonth,
  shiftMonth,
  todayCalendarDate,
  weekdayLabels,
} from 'src/app/utils/calendar-date';
import { PageHeaderComponent, PageHeaderConfig } from '../page-header/page-header.component';
import { HeatEventFormComponent, HeatEventKind } from '../heat-event-form/heat-event-form.component';

/** A dog's colour: `dot` marks the dog, `soft` tints its chips (text stays --ink). */
export interface DogColor {
  dot: string;
  soft: string;
}

/** Warm brand tokens, assigned in `pets` order. The dog's name is always shown next to it. */
export const DOG_PALETTE: DogColor[] = [
  { dot: 'var(--clay)', soft: 'var(--clay-softer)' },
  { dot: 'var(--pine)', soft: 'var(--pine-softer)' },
  { dot: 'var(--harbor)', soft: 'var(--mist-softer)' },
  { dot: 'var(--wheat)', soft: 'var(--warning-softer)' },
  { dot: 'var(--female-color-1)', soft: 'var(--error-softer)' },
  { dot: 'var(--success)', soft: 'var(--success-softer)' },
  { dot: 'var(--apricot)', soft: 'var(--apricot-softer)' },
  { dot: 'var(--n-600)', soft: 'var(--n-100)' },
];

const MAX_CHIPS = 3;
const MAX_DOTS = 3;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Breeder calendar: heat starts/ends and reminders by month. Route: /calendar (BreederGuard). */
@Component({
  selector: 'app-breeder-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PageHeaderComponent, HeatEventFormComponent],
  templateUrl: './breeder-calendar.component.html',
  styleUrls: ['./breeder-calendar.component.css'],
})
export class BreederCalendarComponent implements OnInit, OnDestroy {
  readonly headerConfig: PageHeaderConfig = { title: 'Calendar', icon: 'bi bi-calendar3' };
  readonly weekdays = weekdayLabels(0, 'short');
  readonly weekdaysNarrow = weekdayLabels(0, 'narrow');
  readonly eventLabels = CALENDAR_EVENT_LABELS;
  readonly maxChips = MAX_CHIPS;
  readonly maxDots = MAX_DOTS;
  readonly formatLong = formatCalendarDateLong;

  month: CalendarMonth;
  grid: MonthGridDay[] = [];
  today = todayCalendarDate();
  selectedDate = this.today;
  petFilter = '';

  pets: ICalendarPet[] = [];
  events: ICalendarEvent[] = [];
  /** Cycles overlapping the visible range (the backend applies the dog filter). */
  inHeat: ICalendarHeatSpan[] = [];
  private eventsByDate = new Map<string, ICalendarEvent[]>();
  private colorByPet = new Map<string, DogColor>();

  isLoading = false;
  hasLoaded = false;
  loadError = '';

  // Shared event form
  formOpen = false;
  formMode: 'create' | 'edit' = 'create';
  formKind: HeatEventKind = 'cycle';
  formPetId: string | null = null;
  formDate: string | null = null;
  formCycle: IHeatCycle | null = null;
  formReminder: IReminder | null = null;
  openingEventId: string | null = null;

  private loadSub?: Subscription;
  private openSub?: Subscription;

  constructor(
    private heatService: HeatCycleService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    private host: ElementRef<HTMLElement>,
    private cdr: ChangeDetectorRef,
  ) {
    this.month = monthOf(this.today)!;
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.petFilter = params.get('pet') || '';
    const month = parseCalendarMonth(params.get('month'));
    if (month) {
      this.month = month;
      this.selectedDate = this.defaultSelection(month);
    }
    this.rebuildGrid();
    // A malformed ?pet= would get a 422 on every load: fall back to all dogs.
    if (this.petFilter && !UUID_RE.test(this.petFilter)) {
      this.petFilter = '';
      this.syncUrl();
    }
    this.load();
  }

  ngOnDestroy(): void {
    this.loadSub?.unsubscribe();
    this.openSub?.unsubscribe();
  }

  // ── Data ──

  load(retried = false): void {
    this.loadSub?.unsubscribe();
    if (!this.grid.length) return;
    this.isLoading = true;
    this.loadError = '';
    const start = this.grid[0].date;
    const end = this.grid[this.grid.length - 1].date;
    this.loadSub = this.heatService.getCalendar(start, end, this.petFilter || null).subscribe({
      next: cal => {
        this.pets = cal.pets;
        this.events = cal.events;
        this.inHeat = cal.in_heat || [];
        this.indexEvents();
        // A ?pet= that is not one of this breeder's dogs: fall back to all dogs.
        if (this.petFilter && !this.pets.some(p => p.id === this.petFilter)) {
          this.petFilter = '';
          this.syncUrl();
          this.load();
          return;
        }
        this.isLoading = false;
        this.hasLoaded = true;
        this.cdr.markForCheck();
      },
      error: err => {
        // 422 = a bad filter value: clear it and retry once with all dogs.
        if (err?.status === 422 && this.petFilter && !retried) {
          this.petFilter = '';
          this.syncUrl();
          this.load(true);
          return;
        }
        this.isLoading = false;
        this.hasLoaded = true;
        this.loadError = apiErrorMessage(err, 'Could not load the calendar.');
        this.cdr.markForCheck();
      },
    });
  }

  private indexEvents(): void {
    this.colorByPet.clear();
    this.pets.forEach((p, i) => this.colorByPet.set(p.id, DOG_PALETTE[i % DOG_PALETTE.length]));
    this.eventsByDate.clear();
    for (const e of this.events) {
      const list = this.eventsByDate.get(e.date);
      if (list) list.push(e); else this.eventsByDate.set(e.date, [e]);
    }
  }

  private rebuildGrid(): void {
    this.today = todayCalendarDate();
    this.grid = buildMonthGrid(this.month, 0);
  }

  // ── Derived ──

  get monthLabel(): string {
    return formatCalendarMonthLabel(this.month);
  }

  get isCurrentMonth(): boolean {
    const m = monthOf(this.today)!;
    return m.year === this.month.year && m.month === this.month.month;
  }

  /** Events dated inside the visible month (not the neighbouring-month padding). */
  get monthEventCount(): number {
    const key = formatCalendarMonthKey(this.month);
    return this.events.filter(e => e.date.startsWith(key)).length;
  }

  get selectedEvents(): ICalendarEvent[] {
    return this.eventsFor(this.selectedDate);
  }

  get filteredPetName(): string {
    return this.pets.find(p => p.id === this.petFilter)?.name || '';
  }

  /** Dogs shown in the legend: the filtered one, or all. */
  get legendPets(): ICalendarPet[] {
    return this.petFilter ? this.pets.filter(p => p.id === this.petFilter) : this.pets;
  }

  /** "since Nov 28 (in progress)" or "Dec 2 – Dec 19". Years only when outside the visible month's year. */
  heatSpanLabel(s: ICalendarHeatSpan): string {
    const fmt = (d: string) => formatCalendarDate(d, !d.startsWith(`${this.month.year}-`));
    if (!s.end_date) return `since ${fmt(s.start_date)}${s.in_progress ? ' (in progress)' : ''}`;
    return `${fmt(s.start_date)} – ${fmt(s.end_date)}`;
  }

  /** Open a cycle from the "In heat" line, the same way as its heat chip. */
  openHeatSpan(s: ICalendarHeatSpan): void {
    this.openEvent({
      id: `in-heat-${s.cycle_id}`,
      type: 'heat_start',
      date: s.start_date,
      pet_id: s.pet_id,
      pet_name: s.pet_name,
      cycle_id: s.cycle_id,
      reminder_id: null,
      in_progress: s.in_progress,
      note: null,
    });
  }

  eventsFor(date: string): ICalendarEvent[] {
    return this.eventsByDate.get(date) || [];
  }

  /** Distinct dogs with something on a day, for the compact dots. */
  dotsFor(date: string): DogColor[] {
    const seen = new Set<string>();
    const dots: DogColor[] = [];
    for (const e of this.eventsFor(date)) {
      if (seen.has(e.pet_id)) continue;
      seen.add(e.pet_id);
      dots.push(this.colorFor(e.pet_id));
    }
    return dots;
  }

  colorFor(petId: string): DogColor {
    return this.colorByPet.get(petId) || DOG_PALETTE[DOG_PALETTE.length - 1];
  }

  eventIcon(e: ICalendarEvent): string {
    switch (e.type) {
      case 'heat_start': return 'bi-droplet-fill';
      case 'heat_end': return 'bi-droplet-half';
      default: return 'bi-bell';
    }
  }

  eventAriaLabel(e: ICalendarEvent): string {
    const parts = [`${e.pet_name}: ${this.eventLabels[e.type]}`];
    if (e.type === 'heat_start' && e.in_progress) parts.push('in progress');
    if (e.note) parts.push(e.note);
    return `${parts.join(', ')}. Open to edit.`;
  }

  dayAriaLabel(day: MonthGridDay): string {
    const n = this.eventsFor(day.date).length;
    const count = n === 0 ? 'no events' : n === 1 ? '1 event' : `${n} events`;
    return `${formatCalendarDateLong(day.date)}, ${count}${day.date === this.today ? ', today' : ''}`;
  }

  trackDay = (_: number, d: MonthGridDay) => d.date;
  trackEvent = (_: number, e: ICalendarEvent) => e.id;
  trackPet = (_: number, p: ICalendarPet) => p.id;
  trackSpan = (_: number, s: ICalendarHeatSpan) => s.cycle_id;

  // ── Navigation ──

  prevMonth(): void { this.goToMonth(shiftMonth(this.month, -1)); }
  nextMonth(): void { this.goToMonth(shiftMonth(this.month, 1)); }

  goToday(): void {
    this.today = todayCalendarDate();
    this.selectedDate = this.today;
    this.goToMonth(monthOf(this.today)!, false);
  }

  private goToMonth(month: CalendarMonth, resetSelection = true): void {
    this.month = month;
    if (resetSelection) this.selectedDate = this.defaultSelection(month);
    this.rebuildGrid();
    this.syncUrl();
    this.load();
  }

  /** Today when it is in the month, else the 1st. */
  private defaultSelection(month: CalendarMonth): string {
    const m = monthOf(this.today)!;
    if (m.year === month.year && m.month === month.month) return this.today;
    return `${formatCalendarMonthKey(month)}-01`;
  }

  onPetFilterChange(): void {
    this.syncUrl();
    this.load();
  }

  private syncUrl(): void {
    const queryParams: Record<string, string | null> = {
      pet: this.petFilter || null,
      month: this.isCurrentMonth ? null : formatCalendarMonthKey(this.month),
    };
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge', replaceUrl: true });
  }

  selectDay(day: MonthGridDay): void {
    this.selectedDate = day.date;
    // Clicking a padding day from the neighbouring month moves to that month.
    if (!day.inMonth) {
      this.goToMonth(monthOf(day.date)!, false);
    }
  }

  /** Arrow keys / Home / End move between days, crossing months when needed. */
  onDayKeydown(event: KeyboardEvent, day: MonthGridDay): void {
    const deltas: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    let target: string | null = null;
    if (event.key in deltas) {
      target = addDays(day.date, deltas[event.key]);
    } else if (event.key === 'Home' || event.key === 'End') {
      const idx = this.grid.findIndex(d => d.date === day.date);
      const rowStart = idx - (idx % 7);
      target = this.grid[event.key === 'Home' ? rowStart : rowStart + 6].date;
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      const m = shiftMonth(this.month, event.key === 'PageUp' ? -1 : 1);
      const dayNum = Math.min(day.day, new Date(m.year, m.month, 0).getDate());
      target = `${formatCalendarMonthKey(m)}-${String(dayNum).padStart(2, '0')}`;
    }
    if (!target) return;
    event.preventDefault();
    this.selectedDate = target;
    const targetMonth = monthOf(target)!;
    if (targetMonth.year !== this.month.year || targetMonth.month !== this.month.month) {
      this.goToMonth(targetMonth, false);
    }
    this.focusDay(target, (event.currentTarget as HTMLElement)?.dataset['grid'] || 'full');
  }

  private focusDay(date: string, grid: string): void {
    setTimeout(() => {
      const el = this.host.nativeElement.querySelector<HTMLElement>(`[data-grid="${grid}"][data-date="${date}"]`);
      el?.focus();
    });
  }

  // ── Form ──

  addEvent(date?: string): void {
    const petId = this.petFilter || null;
    const pet = petId ? this.pets.find(p => p.id === petId) : null;
    this.formMode = 'create';
    this.formPetId = petId;
    this.formDate = date || this.selectedDate || this.today;
    // Heat cycles need a female dog; default to a reminder otherwise.
    this.formKind = (pet ? isFemale(pet) : this.pets.some(isFemale)) ? 'cycle' : 'reminder';
    this.formCycle = null;
    this.formReminder = null;
    this.formOpen = true;
  }

  /** Load the record behind an event, then open it for editing. */
  openEvent(e: ICalendarEvent, event?: Event): void {
    event?.stopPropagation();
    if (this.openingEventId) return;
    this.openingEventId = e.id;
    this.openSub?.unsubscribe();
    const fail = (err: unknown) => {
      this.openingEventId = null;
      this.toast.error(apiErrorMessage(err, 'Could not open this entry.'));
    };
    if (e.cycle_id) {
      this.openSub = this.heatService.listCycles(e.pet_id).subscribe({
        next: cycles => {
          const cycle = cycles.find(c => c.id === e.cycle_id);
          this.openingEventId = null;
          if (!cycle) { this.toast.error('This heat cycle no longer exists.'); this.load(); return; }
          this.openEdit(cycle, null);
        },
        error: fail,
      });
    } else if (e.reminder_id) {
      this.openSub = this.heatService.listReminders(e.pet_id).subscribe({
        next: reminders => {
          const reminder = reminders.find(r => r.id === e.reminder_id);
          this.openingEventId = null;
          if (!reminder) { this.toast.error('This reminder no longer exists.'); this.load(); return; }
          this.openEdit(null, reminder);
        },
        error: fail,
      });
    } else {
      this.openingEventId = null;
    }
  }

  private openEdit(cycle: IHeatCycle | null, reminder: IReminder | null): void {
    this.formMode = 'edit';
    this.formKind = cycle ? 'cycle' : 'reminder';
    this.formPetId = cycle?.pet_id || reminder?.pet_id || null;
    this.formDate = null;
    this.formCycle = cycle;
    this.formReminder = reminder;
    this.formOpen = true;
    this.cdr.markForCheck();
  }

  onFormDone(): void {
    this.formOpen = false;
    this.load();
  }
}
