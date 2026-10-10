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
  // Breeding planner stage
  Planned: 'neutral',
  Mated: 'info',
  Confirmed: 'success',
  Missed: 'danger',
  Whelped: 'success',
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

/** "$2,500" (cents only when present). The API sends Decimal prices as strings, e.g. "2500.00". */
export function formatPrice(value: number | string | null | undefined): string {
  const amount = typeof value === 'string' ? parseFloat(value) : value;
  if (amount == null || isNaN(amount)) return '';
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

const POST_SIGNUP_KEY = 'post_signup_redirect';
const POST_SIGNUP_TTL_MS = 24 * 60 * 60 * 1000;

/** In-app path only (blocks //evil.com and absolute URLs). */
export function isSafeInAppPath(url: string | null | undefined): url is string {
  return !!url && url.startsWith('/') && !url.startsWith('//');
}

/**
 * Remember where a visitor was when they chose to sign up, so email verification
 * (usually opened in a new tab from the email) can bring them back there.
 */
export function rememberPostSignupRedirect(url: string): void {
  if (!isSafeInAppPath(url)) return;
  try {
    localStorage.setItem(POST_SIGNUP_KEY, JSON.stringify({ url, ts: Date.now() }));
  } catch { /* storage unavailable — fall back to the dashboard */ }
}

/** Read and clear the remembered page (if recent and safe). */
export function takePostSignupRedirect(): string | null {
  try {
    const raw = localStorage.getItem(POST_SIGNUP_KEY);
    localStorage.removeItem(POST_SIGNUP_KEY);
    if (!raw) return null;
    const { url, ts } = JSON.parse(raw);
    return isSafeInAppPath(url) && Date.now() - ts < POST_SIGNUP_TTL_MS ? url : null;
  } catch {
    return null;
  }
}
