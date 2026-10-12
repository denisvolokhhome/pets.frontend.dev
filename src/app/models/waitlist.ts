export type WaitlistStatus = 'pending' | 'active' | 'declined' | 'matched' | 'withdrawn';
export type DepositStatus = 'none' | 'requested' | 'received' | 'refunded' | 'forfeited' | 'applied';
export type SexPreference = 'Male' | 'Female' | 'Any';

export interface IWaitlistEntry {
  id: string;
  breeder_id: string;
  user_id: string | null;
  source: 'request' | 'manual';
  display_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  breeding_id: number | null;
  breeding_label: string | null;
  request_breeding_id: number | null;
  status: WaitlistStatus;
  sex_preference: SexPreference;
  preference_notes: string | null;
  application_answers: Record<string, string> | null;
  queue_date: string | null;
  position: number | null;
  position_override: number | null;
  override_note: string | null;
  deposit_status: DepositStatus;
  deposit_amount: string | null;
  deposit_received_on: string | null;
  deposit_method: string | null;
  offspring_id: string | null;
  possible_duplicate: boolean;
  created_at: string;
}

export interface ISeekerEntry {
  id: string;
  breeder_id: string;
  breedery_name: string | null;
  status: WaitlistStatus;
  list_label: string;
  position: number | null;
  sex_preference: SexPreference;
  deposit_status: DepositStatus;
  deposit_amount: string | null;
}

export interface IBreederWaitlist {
  pending: IWaitlistEntry[];
  general: IWaitlistEntry[];
  /** Withdrawn entries still holding a received deposit: record it refunded or kept. */
  deposits_to_settle: IWaitlistEntry[];
}

export interface ILitterWaitlist {
  breeding_id: number;
  entries: IWaitlistEntry[];
}

export interface IWaitlistInfo {
  breeder_id: string;
  breedery_name: string | null;
  deposit_amount: string | null;
  deposit_policy: string | null;
  application_form: {
    id: number;
    form_fields: { id: string; type: 'text' | 'textarea'; label: string; required: boolean }[];
  } | null;
  has_active_entry: boolean;
}

export interface IWaitlistSettings {
  deposit_amount: string | null;
  deposit_policy: string | null;
}

export interface IWaitlistEvent {
  id: string;
  type: string;
  actor_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export const DEPOSIT_STATUS_LABELS: Record<DepositStatus, string> = {
  none: 'No deposit',
  requested: 'Deposit requested',
  received: 'Deposit received',
  refunded: 'Refunded',
  forfeited: 'Forfeited',
  applied: 'Applied to purchase'
};

const DEPOSIT_TONES: Record<DepositStatus, string> = {
  none: 'neutral', requested: 'warning', received: 'success',
  refunded: 'neutral', forfeited: 'danger', applied: 'info'
};

/** CSS classes for a deposit status pill, e.g. "ui-badge ui-badge--success". */
export function depositBadgeClass(status: DepositStatus | null | undefined): string {
  return `ui-badge ui-badge--${DEPOSIT_TONES[status as DepositStatus] ?? 'neutral'}`;
}

/**
 * Whether to show "Join waitlist" to a viewer of a breeder's listing.
 * Logged-out visitors may click (they are sent to log in). With a token but no
 * hydrated user yet we hide it, so a breeder never sees it on their own page.
 */
export function canJoinWaitlist(
  flagOn: boolean,
  hasToken: boolean,
  user: { id: string } | null,
  isPetSeeker: boolean,
  breederId: string | null | undefined
): boolean {
  if (!flagOn || !breederId) return false;
  if (!hasToken) return true;
  if (!user) return false;
  return user.id !== breederId && isPetSeeker;
}
