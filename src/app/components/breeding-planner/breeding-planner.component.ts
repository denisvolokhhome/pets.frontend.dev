import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { BreedingPlannerService } from '../../services/breeding-planner.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import {
  BreedingStage,
  IMating,
  IMatingInput,
  IMilestone,
  IPlanner,
  MATING_METHOD_LABELS,
  MatingMethod
} from '../../models/breeding-planner';
import { formatDisplayDate, statusBadgeClass } from 'src/app/utils/format-utils';

const STAGE_ACTION_LABELS: Partial<Record<BreedingStage, string>> = {
  [BreedingStage.Confirmed]: 'Confirm pregnancy',
  [BreedingStage.Missed]: 'Mark missed',
  [BreedingStage.Mated]: 'Undo'
};

/** "YYYY-MM-DD" for today in the user's timezone (what date inputs expect). */
function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface MatingDraft {
  id: string | null;
  mated_on: string;
  method: MatingMethod;
  sire_id: string;          // '' = outside stud / none
  outside_sire_name: string;
  notes: string;
}

/** Pregnancy planner card on the breeding detail page: matings, due date, milestones. */
@Component({
  standalone: false,
  selector: 'app-breeding-planner',
  templateUrl: './breeding-planner.component.html',
  styleUrls: ['./breeding-planner.component.css']
})
export class BreedingPlannerComponent implements OnInit {
  @Input() breedingId!: number | string;
  @Input() parentPets: any[] = [];
  @Input() voided = false;

  planner: IPlanner | null = null;
  isLoading = true;
  loadFailed = false;
  isSaving = false;

  readonly today = todayIso();
  readonly methodOptions = Object.entries(MATING_METHOD_LABELS) as [MatingMethod, string][];
  readonly formatDate = formatDisplayDate;
  readonly badgeClass = statusBadgeClass;

  matingDraft: MatingDraft | null = null;
  ovulationDraft = '';
  testDraft = { tested_on: '', value_ng_ml: null as number | null };
  milestoneDraft = { title: '', due_on: '' };
  showMilestoneForm = false;

  constructor(
    private plannerService: BreedingPlannerService,
    private toastr: ToastService,
    private confirmService: ConfirmService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.loadFailed = false;
    this.plannerService.getPlanner(this.breedingId).subscribe({
      next: planner => this.apply(planner),
      error: () => {
        this.isLoading = false;
        this.loadFailed = true;
        this.cdr.detectChanges();
      }
    });
  }

  get maleParents(): any[] {
    return (this.parentPets || []).filter(p => p.gender === 'Male');
  }

  get hasMatings(): boolean {
    return !!this.planner && this.planner.matings.length > 0;
  }

  get showGestation(): boolean {
    return this.planner?.gestation_day != null;
  }

  stageActionLabel(stage: BreedingStage): string {
    return STAGE_ACTION_LABELS[stage] ?? stage;
  }

  methodLabel(method: MatingMethod): string {
    return MATING_METHOD_LABELS[method] ?? method;
  }

  // ── Stage & ovulation ──────────────────────────────────────────────────

  setStage(stage: BreedingStage): void {
    this.save(this.plannerService.updatePlanner(this.breedingId, { stage }), 'Stage updated');
  }

  saveOvulation(): void {
    if (!this.ovulationDraft) return;
    this.save(this.plannerService.updatePlanner(this.breedingId, { ovulation_date: this.ovulationDraft }),
      'Ovulation date saved');
  }

  clearOvulation(): void {
    this.save(this.plannerService.updatePlanner(this.breedingId, { ovulation_date: null }),
      'Ovulation date cleared');
  }

  // ── Matings ────────────────────────────────────────────────────────────

  openMatingForm(mating?: IMating): void {
    this.matingDraft = mating
      ? {
          id: mating.id,
          mated_on: mating.mated_on,
          method: mating.method,
          sire_id: mating.sire_id ?? '',
          outside_sire_name: mating.outside_sire_name ?? '',
          notes: mating.notes ?? ''
        }
      : {
          id: null,
          mated_on: this.today,
          method: 'Natural',
          sire_id: this.maleParents[0]?.id ?? '',
          outside_sire_name: '',
          notes: ''
        };
  }

  closeMatingForm(): void {
    this.matingDraft = null;
  }

  saveMating(): void {
    const draft = this.matingDraft;
    if (!draft || !draft.mated_on) return;
    const input: IMatingInput = {
      mated_on: draft.mated_on,
      method: draft.method,
      sire_id: draft.sire_id || null,
      outside_sire_name: draft.sire_id ? null : (draft.outside_sire_name.trim() || null),
      notes: draft.notes.trim() || null
    };
    const request = draft.id
      ? this.plannerService.updateMating(this.breedingId, draft.id, input)
      : this.plannerService.addMating(this.breedingId, input);
    this.save(request, draft.id ? 'Mating updated' : 'Mating logged', () => this.closeMatingForm());
  }

  async deleteMating(mating: IMating): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Delete mating?',
      message: `Remove the mating on ${formatDisplayDate(mating.mated_on)}? Due date and milestones will be recalculated.`,
      confirmText: 'Delete',
      danger: true
    });
    if (!confirmed) return;
    this.save(this.plannerService.deleteMating(this.breedingId, mating.id), 'Mating deleted');
  }

  // ── Progesterone ───────────────────────────────────────────────────────

  addTest(): void {
    const { tested_on, value_ng_ml } = this.testDraft;
    if (!tested_on || value_ng_ml == null || value_ng_ml <= 0) return;
    this.save(this.plannerService.addProgesteroneTest(this.breedingId, { tested_on, value_ng_ml }),
      'Test added', () => (this.testDraft = { tested_on: '', value_ng_ml: null }));
  }

  deleteTest(testId: string): void {
    this.save(this.plannerService.deleteProgesteroneTest(this.breedingId, testId), 'Test removed');
  }

  // ── Milestones ─────────────────────────────────────────────────────────

  toggleMilestone(milestone: IMilestone): void {
    this.save(this.plannerService.setMilestoneCompleted(this.breedingId, milestone.id, !milestone.completed_at));
  }

  addMilestone(): void {
    const { title, due_on } = this.milestoneDraft;
    if (!title.trim() || !due_on) return;
    this.save(this.plannerService.addMilestone(this.breedingId, { title: title.trim(), due_on }),
      'Milestone added', () => {
        this.milestoneDraft = { title: '', due_on: '' };
        this.showMilestoneForm = false;
      });
  }

  async deleteMilestone(milestone: IMilestone): Promise<void> {
    const confirmed = await this.confirmService.confirm({
      title: 'Delete milestone?',
      message: `Remove "${milestone.title}"?`,
      confirmText: 'Delete',
      danger: true
    });
    if (!confirmed) return;
    this.save(this.plannerService.deleteMilestone(this.breedingId, milestone.id), 'Milestone deleted');
  }

  // ── Plumbing ───────────────────────────────────────────────────────────

  private apply(planner: IPlanner): void {
    this.planner = planner;
    this.ovulationDraft = planner.ovulation_date ?? '';
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  private save(request: Observable<IPlanner>, successMessage?: string, onSuccess?: () => void): void {
    this.isSaving = true;
    request.subscribe({
      next: planner => {
        this.isSaving = false;
        onSuccess?.();
        this.apply(planner);
        if (successMessage) this.toastr.success(successMessage);
      },
      error: err => {
        this.isSaving = false;
        const detail = err?.error?.detail;
        const message = typeof detail === 'string' ? detail : detail?.message;
        this.toastr.error(message || 'Could not save your change. Please try again.');
        this.cdr.detectChanges();
      }
    });
  }
}
