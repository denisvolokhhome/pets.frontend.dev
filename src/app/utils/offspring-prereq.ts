import { IBreeding } from 'src/app/models/breeding';
import { IPet } from 'src/app/models/pet';

/** What a breeder needs before they can add offspring. */
export type OffspringPrereq = 'ready' | 'needs-breeding' | 'needs-pets';

/** Breedings offspring can be added to: anything not voided (a Done litter still counts). */
export function activeBreedings<T extends Pick<IBreeding, 'status'>>(breedings: T[]): T[] {
  return (breedings || []).filter(b => b.status !== 'Voided');
}

/**
 * Offspring belong to a breeding, and a breeding needs a male and a female
 * parent, so a breeder may need to step back one or two levels first.
 */
export function offspringPrereq(
  breedings: Pick<IBreeding, 'status'>[],
  pets: Pick<IPet, 'gender'>[]
): OffspringPrereq {
  if (activeBreedings(breedings).length > 0) return 'ready';
  const genders = new Set((pets || []).map(p => (p.gender || '').toLowerCase()));
  return genders.has('male') && genders.has('female') ? 'needs-breeding' : 'needs-pets';
}
