/** Litter applications: the public litter page and the breeder's Applications list. */

export type ApplicationStatus = 'new' | 'contacted' | 'waitlisted' | 'assigned' | 'declined';
/** Statuses a breeder can set by hand ("assigned" comes from assigning a puppy). */
export type ManualApplicationStatus = Exclude<ApplicationStatus, 'assigned'>;
export type ApplicationSource = 'litter' | 'offspring';

export interface LitterFormField {
  id: string;
  type: 'text' | 'textarea';
  label: string;
  required: boolean;
}

export interface PublicLitterParent {
  id: string;
  name: string;
  gender: string | null;
  breed_name: string | null;
  image_url: string | null;
}

export interface PublicLitterPuppy {
  id: string;
  name: string | null;
  gender: string | null;
  status: string;
  price: number | null;
  image_url: string | null;
}

export interface PublicLitter {
  id: number;
  description: string | null;
  stage: 'Planned' | 'Mated' | 'Confirmed' | 'Missed' | 'Whelped' | string;
  date_of_litter: string | null;
  breeder: { id: string; name: string };
  parents: PublicLitterParent[];
  puppies: PublicLitterPuppy[];
  application_form: LitterFormField[] | null;
  accepting_applications: boolean;
}

export interface ApplicationSubmitInput {
  answers: Record<string, string>;
  offspring_id?: string | null;
}

export interface ApplicationSubmitted {
  id: string;
  breeding_id: number;
  status: ApplicationStatus;
  created_at: string;
}

export interface ApplicationAnswer {
  field_id: string;
  label: string;
  value: string;
}

export interface OffspringBrief {
  id: string;
  name: string | null;
  gender: string | null;
  status: string | null;
}

export interface LitterApplication {
  id: string;
  breeding_id: number;
  source: ApplicationSource;
  status: ApplicationStatus;
  applicant_id: string | null;
  applicant_name: string | null;
  applicant_email: string | null;
  answers: ApplicationAnswer[];
  requested_offspring: OffspringBrief | null;
  assigned_offspring: OffspringBrief | null;
  assigned_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Application form as returned by the breeder endpoints. */
export interface ApplicationFormRead {
  id: number;
  breeding_id: number;
  form_fields: LitterFormField[];
  accepting_litter_applications: boolean;
  created_at: string;
  updated_at: string | null;
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  waitlisted: 'Waitlisted',
  assigned: 'Assigned',
  declined: 'Declined',
};

export const APPLICATION_STATUS_BADGE: Record<ApplicationStatus, string> = {
  new: 'ui-badge ui-badge--info',
  contacted: 'ui-badge ui-badge--warning',
  waitlisted: 'ui-badge ui-badge--neutral',
  assigned: 'ui-badge ui-badge--success',
  declined: 'ui-badge ui-badge--danger',
};

/** Pull a readable message out of an API error ({detail} string or a 422 list). */
export function apiErrorMessage(err: any, fallback: string): string {
  const detail = err?.error?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length) {
    const msgs = detail.map((d: any) => (typeof d === 'string' ? d : d?.msg)).filter(Boolean);
    if (msgs.length) return msgs.join(' ');
  }
  return fallback;
}
