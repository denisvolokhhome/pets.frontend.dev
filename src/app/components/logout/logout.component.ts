import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css'],
})
export class LogoutComponent {
  constructor(private service: AuthService, private router: Router) {
    // Clear the user's data but keep the device-level cookie consent
    const cookieConsent = localStorage.getItem('cookies_accepted');
    localStorage.clear();
    if (cookieConsent) localStorage.setItem('cookies_accepted', cookieConsent);
    this.service.LogoutUser(); //specify user to logout!!! pass the token!!!
    this.router.navigate(['login']);
  }
}
