import { Location } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, interval, merge } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { MessageService } from 'src/app/services/message.service';
import { environment } from 'src/environments/environment';

@Component({
  standalone: false,
  selector: 'app-left-menu',
  templateUrl: './left-menu.component.html',
  styleUrls: ['./left-menu.component.css'],
})
export class LeftMenuComponent implements OnInit, OnDestroy {
  location: any;
  route: any;
  isCollapsed: boolean = false;
  unreadMessages = 0;
  private destroy$ = new Subject<void>();
  readonly waitlistEnabled = environment.enableWaitlist;
  
  constructor(
    private router: Router, 
    private loc: Location,
    private cdr: ChangeDetectorRef,
    public authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // Load collapsed state from localStorage
    const savedState = localStorage.getItem('leftMenuCollapsed');
    this.isCollapsed = savedState === 'true';
    
    this.router.events.subscribe((res) => {
      this.route = this.loc.path();
      this.cdr.detectChanges();
    });

    // Unread badge on the mobile Messages tab: refreshed on navigation, when a
    // conversation is read / gets new messages, and every minute for new arrivals.
    this.loadUnreadCount();
    merge(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)),
      this.messageService.unreadChanged$,
      interval(60000),
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadUnreadCount());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUnreadCount(): void {
    if (!this.isAuthenticated) {
      this.unreadMessages = 0;
      return;
    }
    this.messageService.getUnreadCount().subscribe({
      next: res => {
        this.unreadMessages = res.unread_count;
        this.cdr.detectChanges();
      },
      error: () => (this.unreadMessages = 0)
    });
  }
  
  toggleMenu(): void {
    this.isCollapsed = !this.isCollapsed;
    // Save state to localStorage
    localStorage.setItem('leftMenuCollapsed', this.isCollapsed.toString());
  }

  // Computed properties for user type checks
  get isBreeder(): boolean {
    return this.authService.isBreeder;
  }

  get isPetSeeker(): boolean {
    return this.authService.isPetSeeker;
  }

  get isServiceProvider(): boolean {
    return this.authService.isServiceProvider;
  }

  get isAuthenticated(): boolean {
    return this.authService.hasValidToken();
  }
}
