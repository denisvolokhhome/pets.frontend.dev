import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { UpcomingMilestonesComponent } from './upcoming-milestones.component';
import { BreedingPlannerService } from '../../services/breeding-planner.service';
import { IUpcomingMilestone } from '../../models/breeding-planner';

describe('UpcomingMilestonesComponent', () => {
  let planner: jasmine.SpyObj<BreedingPlannerService>;
  let fixture: ComponentFixture<UpcomingMilestonesComponent>;

  function render(): HTMLElement {
    TestBed.configureTestingModule({
      declarations: [UpcomingMilestonesComponent],
      imports: [RouterTestingModule],
      providers: [{ provide: BreedingPlannerService, useValue: planner }]
    });
    fixture = TestBed.createComponent(UpcomingMilestonesComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    planner = jasmine.createSpyObj<BreedingPlannerService>('BreedingPlannerService', ['getUpcoming']);
  });

  it('lists upcoming and overdue milestones linking to their breeding', () => {
    const items: IUpcomingMilestone[] = [
      { id: 'a', breeding_id: 7, breeding_label: 'Honey', title: 'Ultrasound — confirm pregnancy', due_on: '2026-09-29', is_overdue: true },
      { id: 'b', breeding_id: 9, breeding_label: 'Luna', title: 'Due date', due_on: '2026-10-20', is_overdue: false }
    ];
    planner.getUpcoming.and.returnValue(of(items));
    const el = render();

    expect(planner.getUpcoming).toHaveBeenCalledWith(14);
    const rows = el.querySelectorAll('li');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Honey');
    expect(rows[0].classList).toContain('is-overdue');
    expect(rows[1].querySelector('a')?.getAttribute('href')).toBe('/breeding/9');
  });

  it('renders nothing when there is nothing upcoming', () => {
    planner.getUpcoming.and.returnValue(of([]));
    expect(render().querySelector('.upcoming-card')).toBeNull();
  });

  it('renders nothing when loading fails', () => {
    planner.getUpcoming.and.returnValue(throwError(() => new Error('boom')));
    expect(render().querySelector('.upcoming-card')).toBeNull();
  });
});
