import { Location } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef, HostListener, ElementRef, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { Subscription, filter } from 'rxjs';
import { environment } from 'src/environments/environment';

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
  showGetStartedDropdown: boolean = false;
  readonly serviceProvidersEnabled = environment.enableServiceProviders;

  /** Sign-up pages (path may carry ?type=…) hide the Get Started menu. */
  get isOnRegister(): boolean {
    return (this.route || '').split('?')[0].startsWith('/register');
  }
  @ViewChild('getStartedDropdown') getStartedDropdown?: ElementRef<HTMLElement>;
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
      // Close mobile menu on route change
      this.isMobileMenuOpen = false;
    });

    // Subscribe to auth state changes - this is the source of truth
    this.authSubscription = this.service.isLoggedIn$.subscribe((loggedIn) => {
      this.isLoggedIn = loggedIn;
      this.cdr.detectChanges();
    });
  }

  updateAuthState(): void {
    // This method is no longer needed - we rely on isLoggedIn$ observable
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

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.showGetStartedDropdown = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (
      this.showGetStartedDropdown &&
      !this.getStartedDropdown?.nativeElement.contains(event.target as Node)
    ) {
      this.showGetStartedDropdown = false;
    }
  }
}
