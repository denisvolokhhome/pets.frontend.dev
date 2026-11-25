import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { MobileSigninPreview, MobileSigninService } from '../../services/mobile-signin.service';

type PageState = 'loading' | 'confirm' | 'signing-in' | 'error';

/**
 * Phone side of the instant mobile switch: /m#<code>.
 * Shows whose account the code is for, signs in only when Continue is tapped (so link
 * previews in messengers can't use the code), and never puts the session in a URL.
 */
@Component({
  selector: 'app-mobile-signin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mobile-signin.component.html',
  styleUrls: ['./mobile-signin.component.css'],
})
export class MobileSigninComponent implements OnInit {
  state: PageState = 'loading';
  preview: MobileSigninPreview | null = null;
  /** Name of the account this phone is currently signed in as, if different */
  currentName: string | null = null;
  errorMessage = '';

  private code = '';

  constructor(private service: MobileSigninService, private auth: AuthService,
              private router: Router, private cdr: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    this.code = decodeURIComponent((window.location.hash || '').replace(/^#/, '')).trim();
    // Don't leave the code in the address bar or browser history
    if (window.location.hash) {
      history.replaceState(history.state, '', window.location.pathname + window.location.search);
    }
    if (!this.code) {
      this.fail("This link is incomplete. Scan the code on your computer again.");
      return;
    }
    try {
      if (localStorage.getItem('id_token')) {
        const me = await firstValueFrom(this.auth.IsLoggedIn());
        this.currentName = me ? (me.is_breeder && me.breedery_name) || me.name || me.email : null;
      }
      const preview = await firstValueFrom(this.service.preview(this.code));
      if (preview.same_account) {
        // Already this account: nothing to do but open the page (code left unused)
        this.router.navigateByUrl(preview.target_path || '/dashboard', { replaceUrl: true });
        return;
      }
      this.preview = preview;
      this.state = 'confirm';
    } catch (err: any) {
      this.fail(this.message(err));
    }
    this.cdr.markForCheck();
  }

  async onContinue(): Promise<void> {
    if (this.state !== 'confirm') return;
    this.state = 'signing-in';
    try {
      const res = await firstValueFrom(this.service.redeem(this.code));
      // Same storage as a password sign-in, so the rest of the app just works
      localStorage.setItem('id_token', res.access_token);
      await firstValueFrom(this.auth.IsLoggedIn());
      this.router.navigateByUrl(res.target_path || '/dashboard', { replaceUrl: true });
    } catch (err: any) {
      this.fail(this.message(err));
      this.cdr.markForCheck();
    }
  }

  private message(err: any): string {
    const detail = err?.error?.detail;
    if (typeof detail === 'string' && detail) return detail;
    return 'Something went wrong. Generate a new code on your computer and try again.';
  }

  private fail(message: string): void {
    this.state = 'error';
    this.errorMessage = message;
  }
}
