import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { BreedingPlannerComponent } from './breeding-planner.component';
import { BreedingPlannerService } from '../../services/breeding-planner.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { BreedingStage, IPlanner } from '../../models/breeding-planner';

function makePlanner(overrides: Partial<IPlanner> = {}): IPlanner {
  return {
    breeding_id: 7,
    stage: BreedingStage.Planned,
    status: 'Started',
    kind: 'dog',
    ovulation_date: null,
    anchor_date: null,
    anchored_on_ovulation: false,
    due_date: null,
    due_window_start: null,
    due_window_end: null,
    gestation_day: null,
    allowed_stage_targets: [],
    matings: [],
    progesterone_tests: [],
    milestones: [],
    ...overrides
  };
}

const MATED = makePlanner({
  stage: BreedingStage.Mated,
  anchor_date: '2026-09-01',
  due_date: '2026-11-03',
  due_window_start: '2026-10-29',
  due_window_end: '2026-11-08',
  gestation_day: 39,
  allowed_stage_targets: [BreedingStage.Confirmed, BreedingStage.Missed],
  matings: [{
    id: 'm1', mated_on: '2026-09-01', method: 'Natural',
    sire_id: null, sire_name: 'Rex', outside_sire_name: null, notes: null
  }],
  milestones: [{
    id: 'x1', key: 'xray', title: 'X-ray — count the litter', due_on: '2026-10-26',
    remind_on: '2026-10-24', completed_at: null, is_custom: false, is_overdue: false
  }]
});

describe('BreedingPlannerComponent', () => {
  let fixture: ComponentFixture<BreedingPlannerComponent>;
  let component: BreedingPlannerComponent;
  let service: jasmine.SpyObj<BreedingPlannerService>;

  function render(planner: IPlanner, voided = false): HTMLElement {
    service.getPlanner.and.returnValue(of(planner));
    fixture = TestBed.createComponent(BreedingPlannerComponent);
    component = fixture.componentInstance;
    component.breedingId = 7;
    component.voided = voided;
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function button(el: HTMLElement, text: string): HTMLButtonElement {
    const found = Array.from(el.querySelectorAll('button')).find(b => b.textContent?.includes(text));
    expect(found).withContext(`button "${text}"`).toBeTruthy();
    return found as HTMLButtonElement;
  }

  beforeEach(() => {
    service = jasmine.createSpyObj<BreedingPlannerService>('BreedingPlannerService', [
      'getPlanner', 'updatePlanner', 'addMating', 'updateMating', 'deleteMating',
      'addProgesteroneTest', 'deleteProgesteroneTest', 'addMilestone',
      'setMilestoneCompleted', 'deleteMilestone'
    ]);
    TestBed.configureTestingModule({
      declarations: [BreedingPlannerComponent],
      imports: [FormsModule],
      providers: [
        { provide: BreedingPlannerService, useValue: service },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) },
        { provide: ConfirmService, useValue: { confirm: () => Promise.resolve(true) } }
      ]
    });
  });

  it('shows the empty state before any mating is logged', () => {
    const el = render(makePlanner());
    expect(el.textContent).toContain('Log a mating to get a due date and reminders.');
  });

  it('shows the due date headline and stage actions for a mated breeding', () => {
    const el = render(MATED);
    expect(el.textContent).toContain('Due Nov 3, 2026');
    expect(el.textContent).toContain('day 39');
    expect(el.textContent).toContain('Rex');
    button(el, 'Confirm pregnancy');
    button(el, 'Mark missed');
  });

  it('confirms the pregnancy', () => {
    const el = render(MATED);
    service.updatePlanner.and.returnValue(of({ ...MATED, stage: BreedingStage.Confirmed }));
    button(el, 'Confirm pregnancy').click();
    expect(service.updatePlanner).toHaveBeenCalledWith(7, { stage: BreedingStage.Confirmed });
    expect(component.planner?.stage).toBe(BreedingStage.Confirmed);
  });

  it('completes a milestone from its checkbox', () => {
    const el = render(MATED);
    service.setMilestoneCompleted.and.returnValue(of(MATED));
    const checkbox = el.querySelector<HTMLInputElement>('input[type="checkbox"][data-milestone="x1"]')!;
    checkbox.click();
    expect(service.setMilestoneCompleted).toHaveBeenCalledWith(7, 'x1', true);
  });

  it('disables logging on a voided breeding', () => {
    const el = render(makePlanner(), true);
    expect(button(el, 'Log mating').disabled).toBeTrue();
  });
});
