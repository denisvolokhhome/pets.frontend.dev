import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { environment } from 'src/environments/environment';

/** Hides waitlist routes until launch. Role guards are composed separately in the routes. */
@Injectable({
  providedIn: 'root',
})
export class WaitlistGuard {
  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    return environment.enableWaitlist ? true : this.router.parseUrl('/dashboard');
  }
}
