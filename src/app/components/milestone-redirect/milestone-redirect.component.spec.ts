import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { MilestoneRedirectComponent } from './milestone-redirect.component';
import { BreedingPlannerService } from '../../services/breeding-planner.service';
import { ToastService } from '../../services/toast.service';

describe('MilestoneRedirectComponent', () => {
  let router: jasmine.SpyObj<Router>;
  let planner: jasmine.SpyObj<BreedingPlannerService>;
  let toast: jasmine.SpyObj<ToastService>;

  function create(): void {
    TestBed.configureTestingModule({
      declarations: [MilestoneRedirectComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: BreedingPlannerService, useValue: planner },
        { provide: ToastService, useValue: toast },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'x1' }) } } }
      ]
    });
    TestBed.createComponent(MilestoneRedirectComponent).detectChanges();
  }

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    planner = jasmine.createSpyObj<BreedingPlannerService>('BreedingPlannerService', ['locateMilestone']);
    toast = jasmine.createSpyObj<ToastService>('ToastService', ['error']);
  });

  it('opens the breeding that owns the milestone', () => {
    planner.locateMilestone.and.returnValue(of({ id: 'x1', breeding_id: 7 }));
    create();
    expect(planner.locateMilestone).toHaveBeenCalledWith('x1');
    expect(router.navigate).toHaveBeenCalledWith(['/breeding', 7], { replaceUrl: true });
  });

  it('falls back to the breedings list when the milestone is gone', () => {
    planner.locateMilestone.and.returnValue(throwError(() => ({ status: 404 })));
    create();
    expect(toast.error).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/breedings'], { replaceUrl: true });
  });
});
