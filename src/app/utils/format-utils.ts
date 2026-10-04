/**
 * Shared display formatting so dates and statuses read the same on every screen.
 */

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parse an API date value. Date-only strings ("2026-07-20") are built as
 * local dates — `new Date("2026-07-20")` would treat them as UTC midnight,
 * which shows as the previous day in US timezones.
 */
export function parseApiDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const m = DATE_ONLY.exec(value);
  const date = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

/** "Oct 3, 2026" — the one date format used across the app. */
export function formatDisplayDate(value: string | Date | null | undefined, fallback = '—'): string {
  const date = parseApiDate(value);
  return date
    ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : fallback;
}

export type BadgeTone = 'success' | 'warning' | 'info' | 'danger' | 'neutral';

const STATUS_TONES: Record<string, BadgeTone> = {
  // Offspring
  Available: 'success',
  Reserved: 'warning',
  Sold: 'info',
  Archived: 'neutral',
  // Breeding
  Started: 'info',
  InProcess: 'warning',
  Done: 'success',
  Voided: 'neutral',
};

/** CSS classes for a status pill, e.g. "ui-badge ui-badge--success". */
export function statusBadgeClass(status: string | null | undefined): string {
  return `ui-badge ui-badge--${STATUS_TONES[status ?? ''] ?? 'neutral'}`;
}

/** Human label for enum-style statuses: "InProcess" -> "In Process". */
export function statusLabel(status: string | null | undefined): string {
  return (status ?? '').replace(/([a-z])([A-Z])/g, '$1 $2');
}

/** The API names unnamed offspring "Offspring-1a2b3c4d"; show those as "Unnamed". */
export function isAutoNamedOffspring(name: string | null | undefined): boolean {
  return !name || /^Offspring-[0-9a-f]{8}$/.test(name);
}

export function offspringDisplayName(name: string | null | undefined): string {
  return isAutoNamedOffspring(name) ? 'Unnamed' : name!;
}
