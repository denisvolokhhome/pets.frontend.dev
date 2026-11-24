import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';

import { environment } from 'src/environments/environment';
import { LitterApplicationService } from '../../services/litter-application.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { GuestPromptModalComponent } from '../guest-prompt-modal/guest-prompt-modal.component';
import {
  ApplicationFormModalComponent,
  ApplicationFormSubmission,
} from '../application-form-modal/application-form-modal.component';
import { PublicLitter, PublicLitterPuppy, apiErrorMessage } from '../../models/litter-application';
import { formatPrice, offspringDisplayName, statusBadgeClass } from 'src/app/utils/format-utils';

const STAGE_LABELS: Record<string, string> = {
  Planned: 'Planned litter',
  Mated: 'Breeding done',
  Confirmed: 'Pregnancy confirmed',
  Missed: 'Missed',
  Whelped: 'Born',
};

/** Public litter page (/litter/:id): parents, published puppies and "Apply for this litter". */
@Component({
  selector: 'app-litter-public',
  standalone: true,
  imports: [CommonModule, RouterModule, GuestPromptModalComponent, ApplicationFormModalComponent],
  templateUrl: './litter-public.component.html',
  styleUrls: ['./litter-public.component.css']
})
export class LitterPublicComponent implements OnInit, OnDestroy {
  readonly apiHost = environment.API_HOST;

  litterId = '';
  litter: PublicLitter | null = null;
  isLoading = true;
  notFound = false;
  loadError = false;

  isLoggedIn = false;
  isBreeder = false;
  isOwnLitter = false;

  showGuestModal = false;
  showForm = false;
  submitted = false;

  private wantsApply = false;
  private destroyed = false;
  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: LitterApplicationService,
    private authService: AuthService,
    private toastr: ToastService
  ) {}

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(params => {
      this.litterId = params.get('id') || '';
      this.wantsApply = this.route.snapshot.queryParamMap.get('apply') === '1';
      this.reset();
      this.load();
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.sub?.unsubscribe();
  }

  private reset(): void {
    this.litter = null;
    this.isLoading = true;
    this.notFound = false;
    this.loadError = false;
    this.showForm = false;
    this.showGuestModal = false;
    this.submitted = false;
  }

  load(): void {
    if (!/^\d+$/.test(this.litterId)) {
      this.isLoading = false;
      this.notFound = true;
      return;
    }
    this.isLoading = true;
    this.loadError = false;
    this.service.getPublicLitter(this.litterId).subscribe({
      next: async litter => {
        this.litter = litter;
        await this.resolveUser();
        this.isLoading = false;
        if (this.wantsApply) {
          this.wantsApply = false;
          if (this.canApply) this.apply();
        }
      },
      error: err => {
        this.isLoading = false;
        if (err?.status === 404 || err?.status === 422) this.notFound = true;
        else this.loadError = true;
      }
    });
  }

  /** Who is looking: guests can apply after signing in; breeders can't apply. */
  private async resolveUser(): Promise<void> {
    this.isLoggedIn = !!localStorage.getItem('id_token');
    if (!this.isLoggedIn) {
      this.isBreeder = false;
      this.isOwnLitter = false;
      return;
    }
    let user: any = this.authService.currentUser;
    if (!user) {
      try {
        user = await firstValueFrom(this.authService.IsLoggedIn());
      } catch {
        user = null;
      }
    }
    this.isLoggedIn = !!user || !!localStorage.getItem('id_token');
    this.isBreeder = !!user?.is_breeder;
    this.isOwnLitter = !!user && !!this.litter && String(user.id) === String(this.litter.breeder.id);
  }

  // ── Display helpers ──

  get hasForm(): boolean {
    return !!this.litter?.application_form?.length;
  }

  /** Families (and guests) can apply; breeder accounts can't. */
  get canApply(): boolean {
    return !!this.litter?.accepting_applications && this.hasForm && !this.isBreeder && !this.isOwnLitter;
  }

  get stageLabel(): string {
    const stage = this.litter?.stage || '';
    return STAGE_LABELS[stage] || stage;
  }

  get stageBadge(): string {
    return statusBadgeClass(this.litter?.stage);
  }

  get isBorn(): boolean {
    return this.litter?.stage === 'Whelped';
  }

  get title(): string {
    if (!this.litter) return 'Litter';
    const breeds = Array.from(new Set(this.litter.parents.map(p => p.breed_name).filter(Boolean)));
    const breed = breeds.length === 1 ? `${breeds[0]} ` : '';
    return this.isBorn ? `${breed}litter` : `Upcoming ${breed}litter`;
  }

  imageSrc(url: string | null | undefined): string | null {
    if (!url) return null;
    return /^https?:\/\//.test(url) ? url : `${this.apiHost}${url}`;
  }

  puppyName(p: PublicLitterPuppy): string {
    const name = offspringDisplayName(p.name);
    return name === 'Unnamed' ? `Unnamed${p.gender ? ' ' + p.gender.toLowerCase() : ''} puppy` : name;
  }

  puppyBadge(p: PublicLitterPuppy): string {
    return statusBadgeClass(p.status);
  }

  price(p: PublicLitterPuppy): string {
    return formatPrice(p.price);
  }

  genderIcon(gender: string | null | undefined): string {
    const g = (gender || '').toLowerCase();
    return g === 'male' ? 'bi-gender-male' : g === 'female' ? 'bi-gender-female' : 'bi-circle';
  }

  // ── Apply flow ──

  apply(): void {
    if (!this.canApply || this.submitted) return;
    if (!localStorage.getItem('id_token')) {
      // The guest modal would otherwise redirect to a stale puppy conversation.
      sessionStorage.removeItem('pendingOffspringContact');
      // Keep ?apply=1 so "Register here" (returnUrl = current URL) resumes the form.
      this.router.navigate([], { relativeTo: this.route, queryParams: { apply: 1 }, replaceUrl: true });
      this.showGuestModal = true;
      return;
    }
    this.openForm();
  }

  private openForm(): void {
    this.clearApplyParam();
    this.showForm = true;
  }

  async onAuthSuccess(): Promise<void> {
    this.showGuestModal = false;
    await this.resolveUser();
    if (this.isBreeder || this.isOwnLitter) {
      this.clearApplyParam();
      this.toastr.info('Breeder accounts can\'t apply for litters. Sign in with a family account to apply.', 'Signed in as a breeder');
      return;
    }
    if (this.canApply) this.openForm();
  }

  onGuestModalVisible(visible: boolean): void {
    this.showGuestModal = visible;
    // Dismissed without signing in: drop ?apply=1 so a reload doesn't reopen the prompt.
    // Deferred, and skipped while a navigation is in flight: "Register here" closes the
    // modal and then navigates to /register with returnUrl = this URL (keeping ?apply=1).
    if (!visible) {
      setTimeout(() => {
        if (this.destroyed || this.showGuestModal || this.router.currentNavigation()) return;
        this.clearApplyParam();
      });
    }
  }

  /** Passed to the form modal: it shows "Submitting…" and any server error inline. */
  submitApplication = async (submission: ApplicationFormSubmission): Promise<void> => {
    try {
      await firstValueFrom(this.service.submitApplication(this.litterId, { answers: submission.responses }));
    } catch (err: any) {
      if (err?.status === 409 && this.litter && /closed/i.test(err?.error?.detail || '')) {
        this.litter.accepting_applications = false;
      }
      throw new Error(apiErrorMessage(err, 'Could not send your application. Please try again.'));
    }
  };

  onSubmitted(): void {
    this.showForm = false;
    this.submitted = true;
    this.toastr.success(`${this.litter?.breeder.name || 'The breeder'} will be in touch.`, 'Application sent');
  }

  onFormCancelled(): void {
    this.showForm = false;
  }

  private clearApplyParam(): void {
    if (this.route.snapshot.queryParamMap.get('apply')) {
      this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }
  }
}
