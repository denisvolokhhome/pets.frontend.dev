import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { BreedingPlannerService } from './breeding-planner.service';
import { BreedingStage } from '../models/breeding-planner';
import { environment } from 'src/environments/environment';

describe('BreedingPlannerService', () => {
  const base = `${environment.API_URL}/breedings`;
  let service: BreedingPlannerService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(BreedingPlannerService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function expectCall(method: string, url: string, body?: unknown): void {
    const req = http.expectOne(url);
    expect(req.request.method).toBe(method);
    if (body !== undefined) {
      expect(req.request.body).toEqual(body);
    }
    req.flush({});
  }

  it('reads and updates the planner', () => {
    service.getPlanner(7).subscribe();
    expectCall('GET', `${base}/7/planner`);
    service.updatePlanner(7, { stage: BreedingStage.Confirmed }).subscribe();
    expectCall('PATCH', `${base}/7/planner`, { stage: 'Confirmed' });
  });

  it('manages matings', () => {
    const input = { mated_on: '2026-09-01', method: 'Natural' as const };
    service.addMating(7, input).subscribe();
    expectCall('POST', `${base}/7/matings`, input);
    service.updateMating(7, 'm1', input).subscribe();
    expectCall('PUT', `${base}/7/matings/m1`, input);
    service.deleteMating(7, 'm1').subscribe();
    expectCall('DELETE', `${base}/7/matings/m1`);
  });

  it('manages progesterone tests', () => {
    service.addProgesteroneTest(7, { tested_on: '2026-08-30', value_ng_ml: 5.2 }).subscribe();
    expectCall('POST', `${base}/7/progesterone-tests`, { tested_on: '2026-08-30', value_ng_ml: 5.2 });
    service.deleteProgesteroneTest(7, 't1').subscribe();
    expectCall('DELETE', `${base}/7/progesterone-tests/t1`);
  });

  it('manages milestones', () => {
    service.addMilestone(7, { title: 'Vet visit', due_on: '2026-10-12' }).subscribe();
    expectCall('POST', `${base}/7/milestones`, { title: 'Vet visit', due_on: '2026-10-12' });
    service.setMilestoneCompleted(7, 'x1', true).subscribe();
    expectCall('PATCH', `${base}/7/milestones/x1`, { completed: true });
    service.deleteMilestone(7, 'x1').subscribe();
    expectCall('DELETE', `${base}/7/milestones/x1`);
  });

  it('lists upcoming milestones and locates one', () => {
    service.getUpcoming().subscribe();
    expectCall('GET', `${base}/milestones/upcoming?days=14`);
    service.locateMilestone('x1').subscribe();
    expectCall('GET', `${base}/milestones/x1`);
  });
});
