import { Location } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { Subscription, filter } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-top-menu',
  templateUrl: './top-menu.component.html',
  styleUrls: ['./top-menu.component.css'],
})
export class TopMenuComponent implements OnInit, OnDestroy {
  location: any;
  route: any;
  isLoggedIn: boolean = false;
  isMobileMenuOpen: boolean = false;
  private authSubscription?: Subscription;
  private routerSubscription?: Subscription;

  constructor(
    private service: AuthService,
    private router: Router,
    private loc: Location,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to route changes
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.route = this.loc.path();
      this.updateAuthState();
      // Close mobile menu on route change
      this.isMobileMenuOpen = false;
    });

    // Subscribe to auth state changes
    this.authSubscription = this.service.isLoggedIn$.subscribe((loggedIn) => {
      this.isLoggedIn = loggedIn;
      this.cdr.detectChanges();
    });

    // Initial auth state check
    this.updateAuthState();
  }

  updateAuthState(): void {
    this.isLoggedIn = this.service.hasValidToken();
    this.cdr.detectChanges();
  }

  get checkToken(): boolean {
    return this.isLoggedIn;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
