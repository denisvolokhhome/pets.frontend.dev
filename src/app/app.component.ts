import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'pets.frontend.dev';
  location: any;
  logoURL: any;
  route: any;
  cookiesAccepted: boolean = !!localStorage.getItem('cookies_accepted');
  isAuthenticated: boolean = false;

  constructor(private router: Router, private loc: Location) {
    this.isAuthenticated = !!localStorage.getItem('id_token');
  }

  ngOnInit(): void {
    this.router.events.subscribe((res) => {
      const fullPath = this.loc.path();
      this.route = fullPath.split('?')[0];
      this.isAuthenticated = !!localStorage.getItem('id_token');
    });
  }

  acceptCookies(): void {
    localStorage.setItem('cookies_accepted', '1');
    this.cookiesAccepted = true;
  }

  /**
   * Check if current route is a public-facing page
   * Public pages should have a friendly design without sidebar
   */
  isPublicPage(): boolean {
    const publicRoutes = ['', '/', '/login', '/register', '/register/pet-seeker', '/register/from-message', '/reset-password', '/verify-email', '/auth/callback', '/search-pets', '/privacy-policy', '/terms-of-use', '/cookie-policy', '/acceptable-use-policy', '/breeder-agreement', '/refund-policy'];
    if (publicRoutes.includes(this.route)) return true;
    // Dynamic public routes
    if (this.route?.startsWith('/breeder/')) return true;
    if (this.route?.startsWith('/offspring/')) return true;
    return false;
  }
}
