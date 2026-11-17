import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { environment } from 'src/environments/environment';

/** Hides billing/subscription routes while paid plans are off. Role guards are composed separately. */
@Injectable({
  providedIn: 'root',
})
export class BillingGuard {
  constructor(private router: Router) {}

  canActivate(): boolean | UrlTree {
    return environment.enableBilling ? true : this.router.parseUrl('/settings');
  }
}
