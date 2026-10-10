import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BreedingPlannerService } from '../../services/breeding-planner.service';
import { ToastService } from '../../services/toast.service';

/**
 * Landing route for reminder links (`/milestones/:id`): notifications and emails
 * carry the milestone id, so resolve it to its breeding and go there.
 */
@Component({
  standalone: false,
  selector: 'app-milestone-redirect',
  template: '<p class="milestone-redirect">Opening…</p>',
  styles: ['.milestone-redirect { padding: 2rem; text-align: center; color: var(--ui-text-muted); }']
})
export class MilestoneRedirectComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private plannerService: BreedingPlannerService,
    private toastr: ToastService
  ) {}

  ngOnInit(): void {
    const milestoneId = this.route.snapshot.paramMap.get('id') ?? '';
    this.plannerService.locateMilestone(milestoneId).subscribe({
      next: location => this.router.navigate(['/breeding', location.breeding_id], { replaceUrl: true }),
      error: () => {
        this.toastr.error('That reminder is no longer available.');
        this.router.navigate(['/breedings'], { replaceUrl: true });
      }
    });
  }
}
