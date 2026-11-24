/**
 * Calendar-date helpers. Heat cycles, reminders and the breeder calendar work
 * with plain calendar dates ('YYYY-MM-DD'), not instants. `new Date('2026-03-03')`
 * is UTC midnight and shows as Mar 2 west of UTC, so everything here builds
 * dates with the local-time constructor `new Date(y, m - 1, d)`.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_MONTH = /^(\d{4})-(\d{2})$/;

/** A 'YYYY-MM-DD' string as a local-midnight Date, or null when invalid. */
export function parseCalendarDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = ISO_DATE.exec(value);
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  const date = new Date(y, mo - 1, d);
  // Reject rollovers such as 2026-02-30.
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

/** A Date's local calendar day as 'YYYY-MM-DD'. */
export function toCalendarDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today in the user's local time zone as 'YYYY-MM-DD'. */
export function todayCalendarDate(now: Date = new Date()): string {
  return toCalendarDate(now);
}

/** Shift a 'YYYY-MM-DD' by whole days (DST-safe: works on calendar fields). */
export function addDays(value: string, days: number): string {
  const date = parseCalendarDate(value);
  if (!date) return value;
  return toCalendarDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));
}

/** Whole days from `from` to `to` (to − from). DST-safe. */
export function daysBetween(from: string, to: string): number {
  const a = parseCalendarDate(from);
  const b = parseCalendarDate(to);
  if (!a || !b) return NaN;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86_400_000);
}

/** "Mar 3, 2026". Pass `withYear: false` for "Mar 3". */
export function formatCalendarDate(value: string | null | undefined, withYear = true, fallback = '—'): string {
  const date = parseCalendarDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString('en-US', withYear
    ? { month: 'short', day: 'numeric', year: 'numeric' }
    : { month: 'short', day: 'numeric' });
}

/** "Tuesday, March 3, 2026" — for headings and screen-reader labels. */
export function formatCalendarDateLong(value: string | null | undefined, fallback = '—'): string {
  const date = parseCalendarDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * A date range: "Mar 3 – Mar 21, 2026" in one year, "Dec 28, 2025 – Jan 9, 2026"
 * across years, "Mar 3, 2026 – In progress" when open.
 */
export function formatCalendarRange(start: string, end: string | null | undefined, openLabel = 'In progress'): string {
  if (!end) return `${formatCalendarDate(start)} – ${openLabel}`;
  const s = parseCalendarDate(start);
  const e = parseCalendarDate(end);
  if (s && e && s.getFullYear() === e.getFullYear()) {
    return `${formatCalendarDate(start, false)} – ${formatCalendarDate(end)}`;
  }
  return `${formatCalendarDate(start)} – ${formatCalendarDate(end)}`;
}

/** A month as { year, month } with month 1–12. */
export interface CalendarMonth {
  year: number;
  month: number;
}

/** 'YYYY-MM' → month, or null when invalid. */
export function parseCalendarMonth(value: string | null | undefined): CalendarMonth | null {
  if (!value) return null;
  const m = ISO_MONTH.exec(value);
  if (!m) return null;
  const year = +m[1], month = +m[2];
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function formatCalendarMonthKey(m: CalendarMonth): string {
  return `${m.year}-${String(m.month).padStart(2, '0')}`;
}

/** "March 2026". */
export function formatCalendarMonthLabel(m: CalendarMonth): string {
  return new Date(m.year, m.month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function monthOf(value: string): CalendarMonth | null {
  const d = parseCalendarDate(value);
  return d ? { year: d.getFullYear(), month: d.getMonth() + 1 } : null;
}

export function shiftMonth(m: CalendarMonth, delta: number): CalendarMonth {
  const d = new Date(m.year, m.month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export interface MonthGridDay {
  /** 'YYYY-MM-DD' */
  date: string;
  /** Day of the month, 1–31. */
  day: number;
  /** False for the leading/trailing days of the neighbouring months. */
  inMonth: boolean;
}

/**
 * The visible grid for a month: whole weeks from the week containing the 1st
 * to the week containing the last day (28–42 days). `weekStartsOn` 0 = Sunday.
 */
export function buildMonthGrid(m: CalendarMonth, weekStartsOn: 0 | 1 = 0): MonthGridDay[] {
  const first = new Date(m.year, m.month - 1, 1);
  const daysInMonth = new Date(m.year, m.month, 0).getDate();
  const lead = (first.getDay() - weekStartsOn + 7) % 7;
  const total = Math.ceil((lead + daysInMonth) / 7) * 7;
  const days: MonthGridDay[] = [];
  for (let i = 0; i < total; i++) {
    const d = new Date(m.year, m.month - 1, 1 - lead + i);
    days.push({ date: toCalendarDate(d), day: d.getDate(), inMonth: d.getMonth() === m.month - 1 });
  }
  return days;
}

/** Short weekday names in grid order, e.g. ['Sun', 'Mon', …]. */
export function weekdayLabels(weekStartsOn: 0 | 1 = 0, style: 'short' | 'narrow' = 'short'): string[] {
  // 2026-11-01 is a Sunday.
  return Array.from({ length: 7 }, (_, i) =>
    new Date(2026, 10, 1 + weekStartsOn + i).toLocaleDateString('en-US', { weekday: style }));
}
