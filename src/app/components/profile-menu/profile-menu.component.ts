import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { IUser } from '../../models/user';
import { environment } from '../../../environments/environment';

@Component({
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
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    // Load user profile from data service to get profile image
    this.dataService.getCurrentUserProfile().subscribe({
      next: (user) => {
        this.user = user;
      },
      error: (err) => {
        console.error('Failed to load user profile', err);
      }
    });
  }

  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) return '';
    
    // Remove 'app/' prefix if present (backend returns 'app/filename.png')
    const cleanPath = imagePath.startsWith('app/') ? imagePath.substring(4) : imagePath;
    
    // Use /storage endpoint instead of /api
    return `${this.apihost}/storage/${cleanPath}`;
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
