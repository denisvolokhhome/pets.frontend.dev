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

  constructor(private router: Router, private loc: Location) {}

  ngOnInit(): void {
    this.router.events.subscribe((res) => {
      const fullPath = this.loc.path();
      this.route = fullPath.split('?')[0];
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
    const publicRoutes = ['', '/', '/login', '/register', '/register/pet-seeker', '/register/from-message', '/reset-password', '/search-pets'];
    return publicRoutes.includes(this.route);
  }
}
