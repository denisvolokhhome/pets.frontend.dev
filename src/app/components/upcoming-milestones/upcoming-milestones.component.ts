import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { BreedingPlannerService } from '../../services/breeding-planner.service';
import { IUpcomingMilestone } from '../../models/breeding-planner';
import { formatDisplayDate } from 'src/app/utils/format-utils';

/** Dashboard card: pregnancy milestones in the next two weeks, plus overdue ones. Hidden when empty. */
@Component({
  standalone: false,
  selector: 'app-upcoming-milestones',
  templateUrl: './upcoming-milestones.component.html',
  styleUrls: ['./upcoming-milestones.component.css']
})
export class UpcomingMilestonesComponent implements OnInit {
  readonly days = 14;
  readonly formatDate = formatDisplayDate;
  items: IUpcomingMilestone[] = [];

  constructor(private plannerService: BreedingPlannerService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.plannerService.getUpcoming(this.days).subscribe({
      next: items => {
        this.items = items;
        this.cdr.detectChanges();
      },
      error: () => (this.items = [])
    });
  }
}
