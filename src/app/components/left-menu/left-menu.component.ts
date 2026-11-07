import { Location } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';
import { MessageService } from 'src/app/services/message.service';
import { environment } from 'src/environments/environment';

@Component({
  standalone: false,
  selector: 'app-left-menu',
  templateUrl: './left-menu.component.html',
  styleUrls: ['./left-menu.component.css'],
})
export class LeftMenuComponent implements OnInit {
  location: any;
  route: any;
  isCollapsed: boolean = false;
  unreadMessages = 0;
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

    // Unread badge on the mobile Messages tab; refreshed on every navigation
    this.loadUnreadCount();
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.loadUnreadCount());
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
