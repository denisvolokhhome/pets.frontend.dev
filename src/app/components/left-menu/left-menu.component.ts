import { Location } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

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
  
  constructor(
    private router: Router, 
    private loc: Location,
    private cdr: ChangeDetectorRef,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    // Load collapsed state from localStorage
    const savedState = localStorage.getItem('leftMenuCollapsed');
    this.isCollapsed = savedState === 'true';
    
    this.router.events.subscribe((res) => {
      this.route = this.loc.path();
      this.cdr.detectChanges();
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
