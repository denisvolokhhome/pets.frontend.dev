/** Biological stage of a breeding — separate from the record `status`. */
export enum BreedingStage {
  Planned = 'Planned',
  Mated = 'Mated',
  Confirmed = 'Confirmed',
  Missed = 'Missed',
  Whelped = 'Whelped'
}

/** Stages during which a due date is shown and reminders are sent. */
export function isActivePregnancy(stage: BreedingStage | string | null | undefined): boolean {
  return stage === BreedingStage.Mated || stage === BreedingStage.Confirmed;
}

export type MatingMethod = 'Natural' | 'AI_Fresh' | 'AI_Chilled' | 'AI_Frozen' | 'Surgical';

export const MATING_METHOD_LABELS: Record<MatingMethod, string> = {
  Natural: 'Natural',
  AI_Fresh: 'AI (fresh)',
  AI_Chilled: 'AI (chilled)',
  AI_Frozen: 'AI (frozen)',
  Surgical: 'Surgical AI'
};

export interface IMating {
  id: string;
  mated_on: string;
  method: MatingMethod;
  sire_id: string | null;
  sire_name: string | null;
  outside_sire_name: string | null;
  notes: string | null;
}

export interface IMatingInput {
  mated_on: string;
  method: MatingMethod;
  sire_id?: string | null;
  outside_sire_name?: string | null;
  notes?: string | null;
}

export interface IProgesteroneTest {
  id: string;
  tested_on: string;
  value_ng_ml: number;
}

export interface IMilestone {
  id: string;
  key: string | null;
  title: string;
  due_on: string;
  remind_on: string | null;
  completed_at: string | null;
  is_custom: boolean;
  is_overdue: boolean;
}

export interface IPlanner {
  breeding_id: number;
  stage: BreedingStage;
  status: string;
  kind: string;
  ovulation_date: string | null;
  anchor_date: string | null;
  anchored_on_ovulation: boolean;
  due_date: string | null;
  due_window_start: string | null;
  due_window_end: string | null;
  gestation_day: number | null;
  allowed_stage_targets: BreedingStage[];
  matings: IMating[];
  progesterone_tests: IProgesteroneTest[];
  milestones: IMilestone[];
}

export interface IPlannerUpdate {
  ovulation_date?: string | null;
  stage?: BreedingStage;
}

export interface IUpcomingMilestone {
  id: string;
  breeding_id: number;
  breeding_label: string;
  title: string;
  due_on: string;
  is_overdue: boolean;
}

export interface IMilestoneLocation {
  id: string;
  breeding_id: number;
}
