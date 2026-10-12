import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { WaitlistService } from '../../services/waitlist.service';
import { AuthService } from '../../services/auth.service';
import { environment } from 'src/environments/environment';

/** Dashboard card: number of waitlist requests awaiting approval. Hidden when 0, flag off or not a breeder. */
@Component({
  standalone: false,
  selector: 'app-waitlist-card',
  templateUrl: './waitlist-card.component.html',
  styleUrls: ['./waitlist-card.component.css']
})
export class WaitlistCardComponent implements OnInit {
  readonly waitlistEnabled = environment.enableWaitlist;
  pendingCount = 0;

  constructor(
    private waitlistService: WaitlistService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.waitlistEnabled || !this.authService.isBreeder) return;
    this.waitlistService.getBreederWaitlist().subscribe({
      next: w => {
        this.pendingCount = w.pending.length;
        this.cdr.detectChanges();
      },
      error: () => (this.pendingCount = 0)
    });
  }
}
