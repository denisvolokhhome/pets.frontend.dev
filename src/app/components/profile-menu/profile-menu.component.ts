import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { IUser } from '../../models/user';
import { environment } from '../../../environments/environment';

@Component({
  standalone: false,
  selector: 'app-profile-menu',
  templateUrl: './profile-menu.component.html',
  styleUrls: ['./profile-menu.component.css']
})
export class ProfileMenuComponent implements OnInit {
  isOpen = false;
  user: IUser | null = null;
  apihost = environment.API_HOST;

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Only subscribe to auth state if there's a token
    // This prevents unnecessary API calls on public pages
    if (!this.authService.hasValidToken()) {
      return;
    }
    
    // Subscribe to auth state changes - only load profile when authenticated
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.loadUserProfile();
      } else {
        this.user = null;
        this.cdr.detectChanges();
      }
    });
    
    // Subscribe to profile updates (only when authenticated)
    this.dataService.profileUpdated$.subscribe(() => {
      if (this.authService.hasValidToken()) {
        this.loadUserProfile();
      }
    });
  }

  loadUserProfile(): void {
    // Double-check authentication before making API call
    if (!this.authService.hasValidToken()) {
      this.user = null;
      this.cdr.detectChanges();
      return;
    }
    
    // Load user profile from data service to get profile image
    this.dataService.getCurrentUserProfile().subscribe({
      next: (user) => {
        this.user = user;
        // Manually trigger change detection to avoid ExpressionChangedAfterItHasBeenCheckedError
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load user profile', err);
        this.user = null;
        this.cdr.detectChanges();
      }
    });
  }

  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) return '';
    
    // Backend returns 'app/filename.png', just prepend storage URL
    return `${this.apihost}/storage/${imagePath}`;
  }

  getProfileImageStyle(): string | null {
    if (this.user?.profile_image_path) {
      return `url(${this.getImageUrl(this.user.profile_image_path)})`;
    }
    return null;
  }

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
  }

  navigateToSettings(): void {
    this.router.navigate(['/settings']);
    this.isOpen = false;
  }

  logout(): void {
    this.authService.LogoutUser().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        // Even if logout fails on server, clear local state
        console.error('Logout error', err);
        this.router.navigate(['/login']);
      }
    });
  }

  // Close menu when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInside = target.closest('.profile-menu-container');
    if (!clickedInside && this.isOpen) {
      this.isOpen = false;
    }
  }
}
